// Business rules: school year, duty info, feed matching, calendar merging.
import { t, lang, cap, monthName, monthCap, fmtLong, fmtSpan, joinList, feedTitle } from './i18n.js';

export const HUES = { G1: '#3A7BD5', G2: '#E8553D', G3: '#B07800', G4: '#C2408A', G5: '#6A4FC9', G6: '#13857E' };
export const TINTS = { G1: '#D3E4FF', G2: '#FFD8CC', G3: '#FFE9A8', G4: '#FFD3EA', G5: '#E1D8FF', G6: '#C6EFEA' };
export const ROUTES = [
  { id: 'hjul', hash: '#/' }, { id: 'aar', hash: '#/de-10-aar' }, { id: 'grupper', hash: '#/grupper' },
  { id: 'foedselsdage', hash: '#/foedselsdage' }, { id: 'kalender', hash: '#/kalender' }
];

export const M = { D: null, feed: [], meta: null, overrides: {} };

export function initModel(D, cal, overrides) {
  M.D = D; M.meta = cal || null; M.feed = (cal && cal.events) || []; M.overrides = overrides || {};
}

// ?dato=YYYY-MM-DD simulates another day (for testing).
export function today() {
  let p = null; try { p = new URLSearchParams(location.search).get('dato'); } catch (e) {}
  if (p && /^\d{4}-\d{2}-\d{2}$/.test(p)) return parseD(p);
  const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 12);
}
export function parseD(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); }
export function isoWeek(d) {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = x.getUTCDay() || 7; x.setUTCDate(x.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  return Math.ceil(((x - y0) / 864e5 + 1) / 7);
}

// ---------- feed state ----------
export const feedHas = () => M.feed.length > 0;
export function feedStale() {
  if (!M.meta) return false;
  if (M.meta.ok === false) return true;
  const f = Date.parse(M.meta.fetchedAt || '');
  return !f || Date.now() - f > 30 * 3600e3;
}

// ---------- lookups ----------
export function currentYearIdx() {
  const tt = today(), s = tt.getMonth() >= 7 ? tt.getFullYear() : tt.getFullYear() - 1;
  const i = M.D.years.findIndex(y => y.start === s);
  return i < 0 ? (s < M.D.years[0].start ? 0 : M.D.years.length - 1) : i;
}
export const childById = id => M.D.children.find(c => c.id === id) || null;
export const groupOfChild = id => Object.keys(M.D.groups).find(g => M.D.groups[g].includes(id)) || null;
export const dutyById = id => M.D.duties.find(d => d.id === id);
export const groupsOf = code => code && code[0] === 'G' ? code.split('+') : [];
export const gNum = g => g.slice(1);
export const namesIn = groups => groups.flatMap(g => M.D.groups[g].map(id => childById(id).name));
export const dutyName = d => lang === 'en' ? d.name_en || d.name : d.name;
export const dutyShort = d => lang === 'en' ? d.short_en || d.short : d.short;
export const dutyMonthLabel = d => lang === 'en' ? d.monthLabel_en || d.monthLabel : d.monthLabel;
export const dutyDesc = d => lang === 'en' ? d.desc_en || d.desc : d.desc;
export const bdLabel = key => { const g = M.D.bdGroups[key]; return lang === 'en' ? g.label_en || g.label : g.label; };

export function whoText(code) {
  const g = groupsOf(code);
  if (g.length > 1) return t('groupsTogether', g.map(gNum));
  if (g.length === 1) return t('group', gNum(g[0]));
  if (code === 'SKOLE') return t('whoSchool');
  if (code === 'REPR') return t('whoRepr');
  if (code === 'DIMISSION') return t('whoDimission');
  return t('whoNone');
}

// ---------- feed matching (brief 9.3) ----------
function yearWindow(y) { return [new Date(y.start, 7, 1), new Date(y.start + 1, 7, 1)]; }

function matchFeed(yi, did) {
  const duty = dutyById(did);
  if (!duty.feedMatch) return null;
  const [lo, hi] = yearWindow(M.D.years[yi]);
  let c = M.feed.filter(e => { const d = parseD(e.s); return d >= lo && d < hi && e.t.toLowerCase().includes(duty.feedMatch); });
  if (did === 'referent1' || did === 'referent2') {
    c = c.filter(e => !e.t.toLowerCase().includes('kontakt')).filter(e => { const m = parseD(e.s).getMonth(); return did === 'referent1' ? m >= 7 : m < 7; });
  }
  c.sort((a, b) => parseD(a.s) - parseD(b.s));
  return c[0] || null;
}

// overrides.json: { "2026-27.halloween": "2026-10-30T16:00" } — a date the group agreed on.
function overrideFor(y, did) {
  const v = M.overrides[`${y.id}.${did}`];
  if (!v || !/^\d{4}-\d{2}-\d{2}/.test(v)) return null;
  const tm = v.length >= 16 ? v.slice(11, 16).replace(':', '.') : null;
  return { s: v.slice(0, 10), time: tm, t: null, override: true };
}

export function statusOf(date) {
  const tt = today();
  return date < tt ? 'done' : (date.getFullYear() === tt.getFullYear() && date.getMonth() === tt.getMonth()) ? 'now' : 'upcoming';
}

export function dutyInfo(yi, did) {
  const y = M.D.years[yi], duty = dutyById(did), code = M.D.assignments[y.id][did];
  const calYear = duty.month >= 8 ? y.start : y.start + 1;
  const ev = overrideFor(y, did) || matchFeed(yi, did);
  const first = new Date(calYear, duty.month - 1, 1, 12), last = new Date(calYear, duty.month, 0, 12);
  const date = ev ? parseD(ev.s) : last;
  const monthText = `${monthCap(duty.month - 1)} ${calYear}`;
  const groups = groupsOf(code);
  return {
    yi, did, y, duty, code, groups, date, first, last, ev, status: statusOf(date), monthText,
    monthLower: monthName(duty.month - 1),
    title: code === 'DIMISSION' ? t('dimissionTitle') : dutyName(duty),
    short: code === 'DIMISSION' ? t('dimissionShort') : dutyShort(duty),
    when: ev ? fmtLong(date, true) + (ev.time ? t('atTime', ev.time) : '') : monthText,
    whenSub: ev ? null : (code === 'SKOLE' ? t('schoolAnnounces') : code === 'DIMISSION' ? t('dateAgreedClass') : t('dateAgreedGroup')),
    who: whoText(code),
    names: groups.length ? joinList(namesIn(groups)) : null,
    feedTitle: ev && ev.t ? feedTitle(ev.t) : null,
    sourceTag: ev ? (ev.override ? t('srcOverride') : t('srcFeed')) : t('srcWheel'),
    what: dutyDesc(duty)
  };
}

export function nextDutyFor(g) {
  const tt = today(), cy = currentYearIdx();
  for (let yi = cy; yi < M.D.years.length; yi++) {
    const c = M.D.duties.map(d => dutyInfo(yi, d.id))
      .filter(i => g ? i.groups.includes(g) : !!i.code)
      .filter(i => i.date >= tt).sort((a, b) => a.date - b.date);
    if (c.length) return { info: c[0], laterYear: yi !== cy };
  }
  return null;
}

export function calendarItems() {
  const cy = currentYearIdx(), y = M.D.years[cy], items = [], matched = new Set();
  const [lo, hi] = yearWindow(y);
  M.D.duties.forEach(d => {
    const i = dutyInfo(cy, d.id); if (!i.code) return;
    if (i.ev && !i.ev.override) matched.add(i.ev.s + '|' + i.ev.t);
    const sub = i.ev ? [i.feedTitle, i.ev.time ? t('kl', i.ev.time) : null].filter(Boolean).join(' · ') : t('DateTbd');
    items.push({ id: 'duty-' + d.id, date: i.ev ? i.date : i.first, kind: 'opgave', title: i.title, sub, source: i.sourceTag, groups: i.groups, info: i });
  });
  M.feed.forEach(e => {
    if (matched.has(e.s + '|' + e.t)) return;
    const d = parseD(e.s); if (d < lo || d >= hi) return;
    const end = e.e ? parseD(e.e) : null;
    items.push({ id: 'feed-' + e.s + e.t, date: d, end, kind: e.k || 'skole', title: feedTitle(e.t), sub: end ? fmtSpan(d, end) : (e.time ? t('kl', e.time) : null), source: t('srcFeed'), time: e.time });
  });
  M.D.children.forEach(c => {
    const [m, dd] = c.birthday.split('-').map(Number);
    const d = new Date(m >= 8 ? y.start : y.start + 1, m - 1, dd, 12);
    items.push({ id: 'bd-' + c.id, date: d, kind: 'foedselsdag', title: t('hasBirthday', c.name), sub: null, source: feedHas() ? t('srcFeed') : t('srcWheel'), child: c });
  });
  const order = { ferie: 0, skole: 1, opgave: 2, foedselsdag: 3 };
  items.sort((a, b) => a.date - b.date || order[a.kind] - order[b.kind]);
  return items;
}

export { cap };
