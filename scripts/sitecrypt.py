"""Encrypt/decrypt the site's data files with the shared site password.

Format (read by js/crypto.js in the browser via WebCrypto):
  { "v": 1, "iter": <PBKDF2 iterations>, "salt": b64, "iv": b64, "ct": b64 }
Key = PBKDF2-HMAC-SHA256(password, salt, iter) -> 256-bit AES-GCM key.
"""
import base64
import json
import os

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

ITER = 200_000


def _key(password: str, salt: bytes, iterations: int) -> bytes:
    kdf = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=iterations)
    return kdf.derive(password.encode("utf-8"))


def encrypt(obj, password: str) -> dict:
    salt, iv = os.urandom(16), os.urandom(12)
    data = json.dumps(obj, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    ct = AESGCM(_key(password, salt, ITER)).encrypt(iv, data, None)
    b64 = lambda b: base64.b64encode(b).decode("ascii")
    return {"v": 1, "iter": ITER, "salt": b64(salt), "iv": b64(iv), "ct": b64(ct)}


def decrypt(env: dict, password: str):
    d = lambda k: base64.b64decode(env[k])
    pt = AESGCM(_key(password, d("salt"), env["iter"])).decrypt(d("iv"), d("ct"), None)
    return json.loads(pt.decode("utf-8"))


def password_from_env_or_prompt() -> str:
    pw = os.environ.get("SITE_PASSWORD")
    if pw:
        return pw
    import getpass
    return getpass.getpass("Site-adgangskode: ")
