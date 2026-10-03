// Decrypts data files written by scripts/sitecrypt.py (PBKDF2-SHA256 -> AES-GCM).
const b64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

export async function decryptJson(env, password) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: b64(env.salt), iterations: env.iter },
    base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(env.iv) }, key, b64(env.ct));
  return JSON.parse(new TextDecoder().decode(pt));
}

export async function fetchJson(url) {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(url + ': ' + r.status);
  return r.json();
}
