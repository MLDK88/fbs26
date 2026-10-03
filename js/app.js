// Entry point: password gate, state, rendering and event handling.
import { initLang, setLang, t } from './i18n.js';
import { decryptJson, fetchJson } from './crypto.js';
import { initModel, childById, ROUTES } from './model.js';
import { ctx, header, main, footer, overlays, login } from './views.js';

const PW_KEY = 'aarshjul.pw';
const store = {
  get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} }
};
const $ = s => document.querySelector(s);
const mq = window.matchMedia('(max-width: 760px)');

const S = {
  route: 'hjul', mode: 'alle', barn: null, isMobile: mq.matches,
  menuOpen: false, sheet: null, pickerOpen: false, yearIdx: null,
  matrixGroup: null, matrixView: 'hjul', expanded: {}, search: '',
  calFilter: 'alt', showPast: false, openEvent: null, phase2: false
};
const L = { busy: false, error: '' };
let unlocked = false, lastYear = null;

function routeFromHash() {
  const h = (location.hash || '#/').replace(/\/$/, '') || '#';
  const r = ROUTES.find(r => r.hash.replace(/\/$/, '') === h);
  return r ? r.id : 'hjul';
}

// ---------- rendering ----------
const last = {};
function put(id, frag) {
  const s = String(frag);
  if (last[id] === s) return;
  last[id] = s;
  $('#' + id).innerHTML = s;
}

function focusKey(el) {
  if (!el || el === document.body) return null;
  if (el.id) return '#' + el.id;
  if (el.dataset && el.dataset.act) return Object.entries(el.dataset).map(([k, v]) => `[data-${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}="${CSS.escape(v)}"]`).join('');
  return null;
}

function render() {
  document.body.classList.toggle('locked', !unlocked);
  if (!unlocked) {
    $('#login').hidden = false; $('#app').hidden = true;
    put('login', login(L));
    return;
  }
  $('#login').hidden = true; $('#app').hidden = false;
  const active = document.activeElement, key = focusKey(active);
  const sel = active && active.id === 'search' ? [active.selectionStart, active.selectionEnd] : null;

  const c = ctx(S);
  put('hdr', header(S, c));
  put('main', main(S, c));
  put('ftr', footer(S, c));
  put('ovl', overlays(S, c));
  document.body.style.overflow = (S.menuOpen && c.isM) || S.sheet || S.pickerOpen ? 'hidden' : '';

  if (key && document.activeElement !== active) {
    const el = document.querySelector(key);
    if (el) { el.focus({ preventScroll: true }); if (sel && el.setSelectionRange) el.setSelectionRange(sel[0], sel[1]); }
  }
  if (S.route === 'hjul' && lastYear != null && lastYear !== c.yi) animateWheel(c.yi > lastYear ? 1 : -1);
  lastYear = S.route === 'hjul' ? c.yi : null;
  if (S.sheet) { const b = $('.sheet .close-btn'); if (b && !$('.sheet').contains(document.activeElement)) b.focus({ preventScroll: true }); }
}

function animateWheel(dir) {
  const ring = $('#wheel-ring'), nodes = $('#wheel-nodes');
  if (!ring || !ring.animate) return;
  const opts = { duration: 380, easing: 'cubic-bezier(.2,.7,.2,1)' };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    ring.animate([{ opacity: 0.35 }, { opacity: 1 }], opts);
    nodes && nodes.animate([{ opacity: 0 }, { opacity: 1 }], opts);
    return;
  }
  ring.animate([{ transform: `rotate(${dir * 31.45}deg)`, opacity: 0.55 }, { transform: 'rotate(0deg)', opacity: 1 }], opts);
  nodes && nodes.animate([{ opacity: 0, transform: `rotate(${dir * 12}deg)` }, { opacity: 1, transform: 'rotate(0deg)' }], opts);
}

function set(patch) { Object.assign(S, patch); render(); }

// ---------- child selection ----------
function syncUrl(barn) {
  try { const u = new URL(location.href); barn ? u.searchParams.set('barn', barn) : u.searchParams.delete('barn'); history.replaceState(null, '', u.toString()); } catch (e) {}
}
function selectChild(id) {
  if (!childById(id)) return;
  store.set('aarshjul.barn', id); store.set('aarshjul.mode', 'barn'); syncUrl(id);
  set({ barn: id, mode: 'barn', matrixGroup: null, pickerOpen: false, search: '' });
}
function setMode(m) {
  store.set('aarshjul.mode', m);
  set({ mode: m, matrixGroup: null, calFilter: m === 'alle' && S.calFilter === 'vores' ? 'alt' : S.calFilter });
}
function go(route) {
  const r = ROUTES.find(r => r.id === route);
  if (r && location.hash !== r.hash) location.hash = r.hash; // hashchange renders
  else set({ route, sheet: null });
}

// ---------- actions ----------
const A = {
  menu: () => set({ menuOpen: true }),
  closeMenu: () => set({ menuOpen: false }),
  alle: () => setMode('alle'),
  barn: () => { if (!childById(S.barn) || S.mode === 'barn') set({ pickerOpen: true }); else setMode('barn'); },
  lang: d => { setLang(d.l); for (const k in last) delete last[k]; render(); },
  prevYear: () => { const yi = S.yearIdx == null ? ctx(S).yi : S.yearIdx; if (yi > 0) set({ yearIdx: yi - 1 }); },
  nextYear: () => { const yi = S.yearIdx == null ? ctx(S).yi : S.yearIdx; set({ yearIdx: Math.min(yi + 1, 9) }); },
  sheet: d => set({ sheet: { yi: +d.yi, did: d.did } }),
  closeSheet: () => set({ sheet: null }),
  seeGroup: d => { S.sheet = null; S.expanded = { ...S.expanded, [d.g]: true }; go('grupper'); },
  openYear: d => { S.yearIdx = +d.yi; go('hjul'); window.scrollTo(0, 0); },
  view: d => set({ matrixView: d.v }),
  onlyMine: () => { const c = ctx(S); set({ matrixGroup: S.matrixGroup === c.my ? null : c.my }); },
  clearMatrixGroup: () => set({ matrixGroup: null }),
  groupAll: d => { S.matrixGroup = d.g; go('aar'); window.scrollTo(0, 0); },
  expand: d => set({ expanded: { ...S.expanded, [d.g]: true } }),
  pick: d => selectChild(d.id),
  closePicker: () => set({ pickerOpen: false }),
  closePickerBg: (d, ev, el) => { if (ev.target === el) set({ pickerOpen: false }); },
  skipPicker: () => { S.pickerOpen = false; setMode('alle'); },
  calFilter: d => set({ calFilter: d.f }),
  togglePast: () => set({ showPast: !S.showPast }),
  openEvent: d => set({ openEvent: S.openEvent === d.id ? null : d.id }),
  phase2: () => set({ phase2: !S.phase2 }),
  logout: () => { store.set(PW_KEY, null); unlocked = false; L.error = ''; render(); setTimeout(() => { const p = $('#pw'); p && p.focus(); }, 0); }
};

document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = A[el.dataset.act];
  if (fn) fn(el.dataset, ev, el);
});
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape') { if (S.menuOpen || S.sheet || S.pickerOpen) set({ menuOpen: false, sheet: null, pickerOpen: false }); return; }
  const el = ev.target;
  if ((ev.key === 'Enter' || ev.key === ' ') && el.dataset && el.dataset.act && el.getAttribute('role') === 'button' && !/^(BUTTON|A)$/.test(el.tagName)) {
    ev.preventDefault();
    A[el.dataset.act] && A[el.dataset.act](el.dataset, ev, el);
  }
});
document.addEventListener('input', ev => { if (ev.target.id === 'search') set({ search: ev.target.value }); });
document.addEventListener('submit', ev => {
  if (ev.target.dataset.form !== 'login') return;
  ev.preventDefault();
  const pw = $('#pw').value.trim();
  if (pw) unlock(pw, true);
});
window.addEventListener('hashchange', () => { set({ route: routeFromHash(), sheet: null, menuOpen: false }); window.scrollTo(0, 0); });
mq.addEventListener('change', () => set({ isMobile: mq.matches }));

// ---------- unlock ----------
async function unlock(pw, interactive) {
  L.busy = true; L.error = ''; if (interactive) render();
  try {
    const env = await fetchJson('data/class.enc.json');
    let D;
    try { D = await decryptJson(env, pw); } catch (e) { throw Object.assign(new Error('pw'), { wrong: true }); }
    const [cal, ovr] = await Promise.all([
      fetchJson('data/calendar.enc.json').then(x => decryptJson(x, pw)).catch(() => null),
      fetchJson('data/overrides.json').catch(() => ({}))
    ]);
    initModel(D, cal, ovr);
    store.set(PW_KEY, pw);
    start();
  } catch (e) {
    L.busy = false;
    if (e.wrong) store.set(PW_KEY, null);
    L.error = e.wrong ? (interactive ? 'wrongPw' : '') : 'loadError';
    render();
    const p = $('#pw'); if (p) { p.focus(); if (e.wrong) p.select(); }
  }
}

function start() {
  let barn = store.get('aarshjul.barn'), mode = store.get('aarshjul.mode') || 'alle';
  let fromUrl = null; try { fromUrl = new URLSearchParams(location.search).get('barn'); } catch (e) {}
  if (fromUrl && childById(fromUrl)) { barn = fromUrl; mode = 'barn'; }
  if (barn && !childById(barn)) barn = null;
  if (!barn && mode === 'barn') mode = 'alle';
  Object.assign(S, { barn, mode, route: routeFromHash() });
  unlocked = true; L.busy = false;
  render();
}

initLang();
const saved = store.get(PW_KEY);
if (saved) unlock(saved, false); else { render(); const p = $('#pw'); p && p.focus(); }
