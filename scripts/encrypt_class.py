"""Encrypt private/class.json -> data/class.enc.json.

Run after editing private/class.json (groups, children, duties, assignments):
    python scripts/encrypt_class.py
The password is read from $SITE_PASSWORD or asked for.

Also: python scripts/encrypt_class.py --decrypt   (recreate private/class.json from the encrypted file)
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from sitecrypt import decrypt, encrypt, password_from_env_or_prompt  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
PLAIN = ROOT / "private" / "class.json"
ENC = ROOT / "data" / "class.enc.json"


def main():
    pw = password_from_env_or_prompt()
    if "--decrypt" in sys.argv:
        obj = decrypt(json.loads(ENC.read_text(encoding="utf-8")), pw)
        PLAIN.parent.mkdir(exist_ok=True)
        PLAIN.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Skrev {PLAIN.relative_to(ROOT)}")
        return
    obj = json.loads(PLAIN.read_text(encoding="utf-8"))
    ENC.write_text(json.dumps(encrypt(obj, pw)) + "\n", encoding="utf-8")
    print(f"Skrev {ENC.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
