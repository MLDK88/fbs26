"""Fetch the class calendar from SkoleIntra and write data/calendar.enc.json.

Env:
  CLASS_CALENDAR_ICS  the SkoleIntra iCal feed URL (secret: contains a personal token)
  SITE_PASSWORD       the site password (the output is encrypted with it)

Only SUMMARY, start, end and time are kept. DESCRIPTION (contains adults' names) is dropped.
Birthday events are dropped too: the site builds birthdays from private/class.json.
If the feed cannot be fetched, the last good events are kept and "ok" is set to false,
so the site shows "Kunne ikke hente fra SkoleIntra lige nu".
"""
import json
import os
import re
import sys
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from sitecrypt import decrypt, encrypt, password_from_env_or_prompt  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "calendar.enc.json"


# ---------- Europe/Copenhagen without tz database ----------
def _last_sunday(y, m):
    d = date(y, m + 1, 1) - timedelta(days=1) if m < 12 else date(y, 12, 31)
    return d - timedelta(days=(d.weekday() + 1) % 7)


def to_cph(dt_utc: datetime) -> datetime:
    y = dt_utc.year
    start = datetime.combine(_last_sunday(y, 3), datetime.min.time()).replace(hour=1, tzinfo=timezone.utc)
    end = datetime.combine(_last_sunday(y, 10), datetime.min.time()).replace(hour=1, tzinfo=timezone.utc)
    off = 2 if start <= dt_utc < end else 1
    return (dt_utc + timedelta(hours=off)).replace(tzinfo=None)


# ---------- ICS ----------
def unfold(text: str):
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    return re.sub(r"\n[ \t]", "", text).split("\n")


def unescape(v: str) -> str:
    return v.replace("\\n", " ").replace("\\N", " ").replace("\\,", ",").replace("\\;", ";").replace("\\\\", "\\").strip()


def parse_dt(params: str, value: str):
    """Return (datetime_local, all_day)."""
    value = value.strip()
    if "VALUE=DATE" in params.upper() or re.fullmatch(r"\d{8}", value):
        return datetime.strptime(value[:8], "%Y%m%d"), True
    dt = datetime.strptime(value[:15], "%Y%m%dT%H%M%S")
    if value.endswith("Z"):
        dt = to_cph(dt.replace(tzinfo=timezone.utc))
    return dt, False


def parse_ics(text: str):
    events, cur = [], None
    for line in unfold(text):
        if line == "BEGIN:VEVENT":
            cur = {}
        elif line == "END:VEVENT":
            if cur is not None:
                events.append(cur)
            cur = None
        elif cur is not None and ":" in line:
            head, value = line.split(":", 1)
            name, _, params = head.partition(";")
            name = name.upper()
            if name in ("SUMMARY", "DTSTART", "DTEND", "UID"):
                cur[name] = (params, value)
    return events


def merge_runs(items):
    """SkoleIntra repeats multi-day events once per day. Merge consecutive days with the same title into one span."""
    d = lambda s: datetime.strptime(s, "%Y-%m-%d").date()
    key = lambda it: re.sub(r"[^a-zæøå0-9]", "", it["t"].lower())
    out = []
    for it in items:
        prev = next((p for p in reversed(out) if key(p) == key(it) and p.get("k") == it.get("k")), None)
        if prev and d(it["s"]) - d(prev.get("e") or prev["s"]) == timedelta(days=1):
            prev["e"] = it.get("e") or it["s"]
            if prev.get("time") != it.get("time"):
                prev.pop("time", None)
            continue
        out.append(dict(it))
    return out


def normalise(raw):
    out = []
    for ev in raw:
        if "SUMMARY" not in ev or "DTSTART" not in ev:
            continue
        title = unescape(ev["SUMMARY"][1])
        if "har fødselsdag" in title:
            continue
        kind = None
        m = re.match(r"^\W*Ferie:\s*(.+)$", title)
        if m:
            title, kind = m.group(1).strip(), "ferie"
        title = re.sub(r"^[^\w(]+", "", title).strip()  # leading emoji
        s, all_day = parse_dt(*ev["DTSTART"])
        e = None
        if "DTEND" in ev:
            e, _ = parse_dt(*ev["DTEND"])
            if all_day:
                e = e - timedelta(days=1)  # DTEND is exclusive for all-day events
        item = {"s": s.strftime("%Y-%m-%d"), "t": title}
        if e and e.date() > s.date():
            item["e"] = e.strftime("%Y-%m-%d")
        if not all_day:
            item["time"] = s.strftime("%H.%M") + (("–" + e.strftime("%H.%M")) if e and e.date() == s.date() and e > s else "")
        if kind:
            item["k"] = kind
        out.append(item)
    # de-duplicate on normalised title + date
    seen, uniq = set(), []
    for it in sorted(out, key=lambda x: (x["s"], x["t"])):
        key = (it["s"], re.sub(r"[^a-zæøå0-9]", "", it["t"].lower()))
        if key in seen:
            continue
        seen.add(key)
        uniq.append(it)
    uniq = merge_runs(uniq)
    # keep from the start of last school year
    today = date.today()
    sy = today.year if today.month >= 8 else today.year - 1
    cutoff = f"{sy - 1}-08-01"
    return [it for it in uniq if (it.get("e") or it["s"]) >= cutoff]


def main():
    pw = password_from_env_or_prompt()
    url = os.environ.get("CLASS_CALENDAR_ICS")
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    previous = None
    if OUT.exists():
        try:
            previous = decrypt(json.loads(OUT.read_text(encoding="utf-8")), pw)
        except Exception as e:  # noqa: BLE001
            print(f"Kunne ikke læse den gamle fil: {e}", file=sys.stderr)
    try:
        if not url:
            raise RuntimeError("CLASS_CALENDAR_ICS mangler")
        req = urllib.request.Request(url, headers={"User-Agent": "aarshjulet/1.0"})
        with urllib.request.urlopen(req, timeout=60) as r:
            text = r.read().decode("utf-8", errors="replace")
        events = normalise(parse_ics(text))
        if not events:
            raise RuntimeError("feedet var tomt")
        result = {"ok": True, "fetchedAt": now, "events": events}
        print(f"Hentede {len(events)} begivenheder")
    except Exception as e:  # noqa: BLE001
        print(f"Kunne ikke hente SkoleIntra: {e}", file=sys.stderr)
        result = dict(previous or {"events": [], "fetchedAt": None})
        result["ok"] = False
        result["lastAttempt"] = now
    if previous and {k: v for k, v in previous.items() if k not in ("fetchedAt", "lastAttempt")} == \
            {k: v for k, v in result.items() if k not in ("fetchedAt", "lastAttempt")} and result.get("ok"):
        # Same content: still refresh the timestamp, but only every ~12 h to keep git history small.
        last = previous.get("fetchedAt")
        if last and datetime.now(timezone.utc) - datetime.strptime(last, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc) < timedelta(hours=12):
            print("Ingen ændringer")
            return
    OUT.write_text(json.dumps(encrypt(result, pw)) + "\n", encoding="utf-8")
    print(f"Skrev {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
