// All screens. Each returns an html`` fragment from the current state S.
import { html, raw } from './html.js';
import { t, lang, cap, monthName, monthShort, monthCap, fmtDay, fmtDate, fmtLong, joinList, className } from './i18n.js';
import {
  M, HUES, TINTS, ROUTES, today, isoWeek, feedHas, feedStale, currentYearIdx, childById, groupOfChild, groupsOf, gNum,
  dutyInfo, nextDutyFor, calendarItems, dutyName, bdLabel
} from './model.js';
import { buildWheel, buildMiniWheel } from './wheel.js';

const INK = '#14201A';
const MENU_DOTS = { hjul: '#FFD23F', aar: '#BFE3FF', grupper: '#C8E86B', foedselsdage: '#FFC2DE', kalender: '#D9CCFF' };

// ---------- icons ----------
const ICON = {
  school: () => html`<svg viewBox="0 0 24 24" width="20" height="20" aria-label="${t('iconSchool')}" style="fill:none; stroke:#0F5A33; stroke-width:1.8; stroke-linejoin:round"><path d="M4 11 12 5l8 6"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/></svg>`,
  holiday: () => html`<svg viewBox="0 0 24 24" width="20" height="20" aria-label="${t('iconHoliday')}" style="fill:none; stroke:#B5603A; stroke-width:1.8; stroke-linecap:round"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/></svg>`,
  cake: c => html`<svg viewBox="0 0 24 24" width="20" height="20" aria-label="${t('iconBirthday')}" style="fill:none; stroke:${c}; stroke-width:1.8; stroke-linejoin:round; stroke-linecap:round"><rect x="4" y="10" width="16" height="10" rx="1.5"/><path d="M4 14h16M12 10v10"/><path d="M12 10c-3 0-5-1.5-5-3a2 2 0 0 1 4 0c0 1.5 1 3 1 3s1-1.5 1-3a2 2 0 0 1 4 0c0 1.5-2 3-5 3z"/></svg>`,
  duty: c => html`<svg viewBox="0 0 24 24" width="20" height="20" aria-label="${t('iconDuty')}" style="fill:none; stroke:${c}; stroke-width:1.8; stroke-linejoin:round; stroke-linecap:round"><path d="M9 4h6l1 2h3v14H5V6h3z"/><path d="M9 13l2 2 4-4"/></svg>`,
  flagDa: raw('<svg viewBox="0 0 37 28" width="24" height="18" aria-hidden="true" class="flag"><rect width="37" height="28" fill="#C8102E"/><rect x="12" width="4" height="28" fill="#FFFFFF"/><rect y="12" width="37" height="4" fill="#FFFFFF"/></svg>'),
  flagEn: raw('<svg viewBox="0 0 60 30" width="24" height="18" preserveAspectRatio="none" aria-hidden="true" class="flag"><rect width="60" height="30" fill="#012169"/><path d="M0 0 60 30M60 0 0 30" stroke="#FFFFFF" stroke-width="6"/><path d="M0 0 60 30M60 0 0 30" stroke="#C8102E" stroke-width="2"/><path d="M30 0v30M0 15h60" stroke="#FFFFFF" stroke-width="10"/><path d="M30 0v30M0 15h60" stroke="#C8102E" stroke-width="6"/></svg>')
};
const avatar = (sex, hue, body, size) => sex === 'f'
  ? html`<svg viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true"><circle cx="7" cy="14" r="3.2" fill="${hue}"/><circle cx="25" cy="14" r="3.2" fill="${hue}"/><circle cx="16" cy="12" r="7.5" fill="${hue}"/><path d="M4 31a12 11 0 0 1 24 0z" fill="${body}"/><circle cx="16" cy="14.5" r="5" fill="#F7E3D3"/></svg>`
  : html`<svg viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true"><path d="M4 31a12 11 0 0 1 24 0z" fill="${body}"/><circle cx="16" cy="13" r="6.5" fill="#F7E3D3"/><path d="M9.5 12.5a6.5 6.5 0 0 1 13 0q-3 -2.5 -6.5 -2.5t-6.5 2.5z" fill="${hue}"/></svg>`;

const chip = status => status === 'done' ? 'st-done' : status === 'now' ? 'st-now' : 'st-up';
const gdot = (n, bg, cls = 'gdot') => html`<span class="${cls}" style="background:${bg}">${n}</span>`;
const logoImg = cls => html`<span class="${cls}"><img src="assets/fbs-logo.png" alt=""></span>`;

// ---------- context derived from state ----------
export function ctx(S) {
  const child = childById(S.barn);
  const barn = S.mode === 'barn' && !!child;
  const my = child ? groupOfChild(child.id) : null;
  return { child, barn, my, isM: S.isMobile, cy: currentYearIdx(), yi: S.yearIdx == null ? currentYearIdx() : S.yearIdx };
}
const groupColor = (g, c) => c.barn ? (g === c.my ? '#008A40' : '#B6BDB8') : HUES[g];

// ---------- header ----------
function langSwitch(extraClass) {
  const isEn = lang === 'en';
  return html`<div role="group" aria-label="${t('language')}" class="lang ${extraClass}">
    <button data-act="lang" data-l="da" aria-pressed="${!isEn}" class="${isEn ? '' : 'on'}">${ICON.flagDa}Dansk</button>
    <button data-act="lang" data-l="en" aria-pressed="${isEn}" class="${isEn ? 'on' : ''}">${ICON.flagEn}English</button></div>`;
}
function modeSwitch(c, mobile) {
  return html`<div role="group" aria-label="${t('view')}" class="seg ${mobile ? 'seg-m' : ''}">
    <button data-act="alle" aria-pressed="${!c.barn}" class="${c.barn ? '' : 'on-ink'}">${mobile ? t('klassen') : t('heleKlassen')}</button>
    <button data-act="barn" aria-pressed="${c.barn}" class="${c.barn ? 'on-green' : ''}">${c.child ? c.child.name : t('mitBarn')}</button></div>`;
}
export function header(S, c) {
  const CY = M.D.years[c.cy];
  if (c.isM) {
    return html`<div class="hdr-m"><div class="hdr-row">
        <button class="burger" data-act="menu" aria-label="${t('openMenu')}" aria-expanded="${S.menuOpen}"><span></span><span></span><span></span></button>
        <div class="hdr-mid">${modeSwitch(c, true)}</div>
        <a href="#/" aria-label="${t('frontpage')}" class="logo-link">${logoImg('logo-tile')}</a>
      </div>
      <h1 class="disp page-title">${t('nav')[S.route]}</h1></div>`;
  }
  return html`<div class="hdr-d wrap">
    <a href="#/" class="brand">${logoImg('logo-tile logo-lg')}<span class="brand-txt"><span class="disp brand-name">${t('brand')}</span><span class="brand-sub">${t('subline', className(CY.class), CY.label)}</span></span></a>
    <nav aria-label="${t('pages')}" class="topnav">${ROUTES.map(r => html`<a href="${r.hash}" aria-current="${r.id === S.route ? 'page' : 'false'}" class="${r.id === S.route ? 'on' : ''}">${t('nav')[r.id]}</a>`)}</nav>
    ${modeSwitch(c, false)}</div>`;
}

// ---------- Årshjul ----------
function viewHjul(S, c) {
  const D = M.D, tt = today(), yi = c.yi, Y = D.years[yi];
  const prev = D.years[yi - 1], next = D.years[yi + 1];
  const prevLabel = prev ? className(prev.class) : `${Y.start - 1}/${String(Y.start).slice(2)}`;
  const nextLabel = next ? className(next.class) : `${Y.start + 1}/${String(Y.start + 2).slice(2)}`;
  const wheelList = D.duties.filter(d => D.assignments[Y.id][d.id]).map(d => { const i = dutyInfo(yi, d.id); return `${i.title}, ${i.monthText}: ${i.who}`; });

  const nd = nextDutyFor(null);
  const ndMine = !!(nd && c.barn && nd.info.groups.includes(c.my));
  let card = '';
  if (nd) {
    const i = nd.info;
    const when = (nd.laterYear ? `${className(i.y.class)} · ` : '') + (i.ev ? i.when : `${i.monthText} · ${t('dateTbd')}`);
    card = html`<div class="card next-card" style="background:${ndMine ? '#CDEFD6' : '#FFFFFF'}">
      <div class="row-between"><span class="disp next-title">${i.title}</span><span class="chip ${chip(i.status)}">${t('status')[i.status]}</span></div>
      <p class="tnum">${when}</p>
      <p class="muted pretty" style="font-size:15px">${i.names ? `${i.who}: ${i.names}` : i.who}</p>
      <div style="margin-top:8px"><button class="btn-yellow" data-act="sheet" data-yi="${i.yi}" data-did="${i.did}">${t('seeEvent')}</button></div></div>`;
  }

  const cal = calendarItems();
  const undated = e => e.kind === 'opgave' && !e.info.ev, sk = e => undated(e) ? e.info.first : e.date;
  const items = cal.filter(e => (undated(e) ? e.info.last : (e.end || e.date)) >= tt).sort((x, y) => sk(x) - sk(y)).slice(0, 5);
  const feedMsg = feedHas() ? (feedStale() ? t('feedOff') : '') : t('feedEmpty');

  return html`<section class="hjul-grid">
    <div class="hjul-left">
      <div class="wheel-wrap">${buildWheel(yi, c.barn, c.my)}</div>
      <div class="year-switch tnum">
        <button class="ybtn" data-act="prevYear" ${prev ? '' : raw('disabled')} aria-label="${t('prevYear', prevLabel)}" style="justify-self:start; color:${prev ? '#0F5A33' : '#B0B7B2'}"><span class="ybtn-arrow">‹</span><span class="ybtn-label">${prevLabel}</span></button>
        <div class="ycenter"><span class="disp yclass">${className(Y.class)}</span><span class="ylabel">${Y.label}</span></div>
        <button class="ybtn" data-act="nextYear" ${next ? '' : raw('disabled')} aria-label="${t('nextYear', nextLabel)}" style="justify-self:end; color:${next ? '#0F5A33' : '#B0B7B2'}"><span class="ybtn-arrow">›</span><span class="ybtn-label">${nextLabel}</span></button>
      </div>
      ${c.barn && !c.isM ? html`<p class="legend-line"><span class="ldot" style="background:#008A40"></span>${t('wheelLegend', gNum(c.my))}</p>` : ''}
      <ul aria-label="${t('dutiesThisYear')}" class="sr-only">${wheelList.map(x => html`<li>${x}</li>`)}</ul>
    </div>
    <div class="hjul-right">
      <div class="stack-12"><h2 class="disp h2">${t('nextEvent')}</h2>${card}</div>
      <div class="stack-8">
        <h2 class="disp h2">${t('nextInClass')}</h2>
        ${feedMsg ? html`<p class="muted" style="font-size:14px; padding:8px 0">${feedMsg}</p>` : ''}
        <ul class="next-list">${items.map(e => html`<li class="next-item">
          <span class="muted tnum nowrap">${undated(e) ? monthCap(e.date.getMonth()) : fmtDay(e.date)}</span>
          <span class="icon-cell">${e.kind === 'opgave' ? gdot(e.groups[0] ? gNum(e.groups[0]) : '·', e.groups[0] ? groupColor(e.groups[0], c) : '#6B7570')
            : e.kind === 'skole' ? ICON.school() : e.kind === 'ferie' ? ICON.holiday() : ICON.cake(M.D.bdGroups[e.child.bg].color)}</span>
          <span class="ellipsis">${e.title}${e.kind === 'ferie' ? html`<span class="muted"> · ${t('week', isoWeek(e.date))}</span>` : undated(e) ? html`<span class="muted"> · ${t('dateTbd')}</span>` : ''}</span>
        </li>`)}</ul>
        <div><a href="#/kalender" class="strong-link">${t('seeCalendar')}</a></div>
      </div>
    </div></section>`;
}

// ---------- De 10 år ----------
function viewAar(S, c) {
  const D = M.D, tg = S.matrixGroup, my = c.my, cy = c.cy;
  const onlyMine = c.barn && tg === my;
  let headline, intro;
  if (c.barn) {
    const n = D.years.reduce((acc, y) => acc + D.duties.filter(d => groupsOf(D.assignments[y.id][d.id]).includes(my)).length, 0);
    const ndm = nextDutyFor(my);
    headline = t('mineHeadline', n);
    intro = t('mineIntro', gNum(my)) + (ndm ? t('mineNext', ndm.info.title, ndm.info.monthLower, ndm.info.date.getFullYear()) : '');
  } else { headline = t('allHeadline'); intro = t('allIntro'); }

  let body;
  if (tg) {
    body = html`<ol class="timeline">${D.years.map((y, i) => {
      const items = D.duties.filter(d => groupsOf(D.assignments[y.id][d.id]).includes(tg)).map(d => dutyInfo(i, d.id));
      return html`<li class="tl-row" style="background:${i === cy ? '#E3F2E7' : 'transparent'}">
        <div style="font-weight:600" class="tnum">${className(y.class)}<span class="sub-label">${y.label}</span></div>
        <div class="stack-8">${items.map(inf => html`<button data-act="sheet" data-yi="${i}" data-did="${inf.did}" class="tl-item">
            <span style="font-weight:600">${inf.title}</span><span class="muted tnum" style="font-size:14px">${inf.ev ? inf.when : inf.monthText}</span>
            <span class="chip chip-sm ${chip(inf.status)}">${t('status')[inf.status]}</span></button>`)}
          ${items.length ? '' : html`<span class="muted">${t('noDuties')}</span>`}</div></li>`;
    })}</ol>`;
  } else {
    body = html`<ol class="year-cards">${D.years.map((y, i) => {
      const infos = D.duties.filter(d => D.assignments[y.id][d.id]).map(d => dutyInfo(i, d.id));
      const mine = c.barn ? infos.filter(x => x.groups.includes(my)) : [];
      const chips = c.barn
        ? mine.map(x => html`<li class="ychip" style="background:#008A40; color:#FFFFFF">${x.short} · ${monthShort(x.duty.month - 1)}</li>`)
        : [html`<li class="ychip" style="background:#EEF0EE; color:#1B2420">${t('dutiesForGroups', infos.filter(x => x.groups.length).length)}</li>`];
      const note = c.barn && mine.length === 0 ? t('offThisYear') : (i === cy ? t('thisYear') : '');
      return html`<li style="min-width:0"><div role="button" tabindex="0" class="ycard lift" data-act="openYear" data-yi="${i}" aria-label="${t('showYearAria', className(y.class), y.label)}" style="background:${i === cy ? '#F3FAF5' : '#FFFFFF'}; opacity:${i < cy ? 0.7 : 1}">
        <div style="width:100%; max-width:140px">${buildMiniWheel(i, c.barn, my)}</div>
        <div class="ycard-txt"><span class="disp ycard-class">${className(y.class)}</span><span class="muted tnum" style="font-size:13px">${y.label}</span></div>
        <ul class="ychips">${chips}</ul>
        ${note ? html`<span class="muted" style="font-size:13px">${note}</span>` : ''}</div></li>`;
    })}</ol>`;
  }

  // Matches the dots in the mini wheels: group colour, or grey when no parent group has the duty.
  const legend = [...['G1', 'G2', 'G3', 'G4', 'G5', 'G6'].map(g => html`<li><span class="ldot" style="background:${groupColor(g, c)}"></span><span>${t('group', gNum(g))}</span></li>`),
    html`<li><span class="ldot" style="background:#B3AD9C"></span><span>${t('noGroupDuty')}</span></li>`];
  const toolbar = [
    c.barn ? html`<button data-act="onlyMine" aria-pressed="${onlyMine}" class="toggle"><span class="track" style="background:${onlyMine ? '#008A40' : '#C9CFCA'}"><span class="knob" style="left:${onlyMine ? '19px' : '3px'}"></span></span>${t('onlyMine')}</button>` : '',
    tg && !onlyMine ? html`<p class="muted" style="font-size:15px">${t('groupFilterNote', gNum(tg))} <button data-act="clearMatrixGroup" class="ulink">${t('showFullOverview')}</button></p>` : ''
  ].filter(Boolean);

  return html`<section class="stack-20">
    <div class="stack-4">
      <p class="muted" style="font-size:15px">${t('tenYears')}</p>
      <h1 class="disp h1-big" style="max-width:24ch">${headline}</h1>
      <p class="muted pretty" style="max-width:62ch; margin-top:4px">${intro}</p>
    </div>
    ${toolbar.length ? html`<div class="toolbar">${toolbar}</div>` : ''}
    ${body}
    <ul aria-label="${t('legend')}" class="legend">${legend}</ul></section>`;
}

// ---------- Grupper ----------
function viewGrupper(S, c) {
  const D = M.D, cy = c.cy, CY = D.years[cy];
  const q = S.search.trim().toLowerCase();
  const hits = q ? D.children.filter(k => k.name.toLowerCase().startsWith(q) || k.name.toLowerCase().includes(' ' + q)) : [];
  const hitGroups = new Set(hits.map(k => groupOfChild(k.id)));
  let codes = Object.keys(D.groups);
  if (c.barn) codes = [c.my, ...codes.filter(g => g !== c.my)];
  if (hits.length) codes = codes.filter(g => hitGroups.has(g));

  const cards = codes.map(g => {
    const isMine = c.barn && g === c.my;
    const duties = D.duties.filter(d => groupsOf(D.assignments[CY.id][d.id]).includes(g)).map(d => dutyInfo(cy, d.id));
    let emptyText = t('groupOff', gNum(g));
    for (let i = cy + 1; i < D.years.length; i++) {
      const nx = D.duties.filter(d => groupsOf(D.assignments[D.years[i].id][d.id]).includes(g));
      if (nx.length) { emptyText += t('onAgain', className(D.years[i].class), joinList(nx.map(d => t('dutyInMonth', dutyName(d), monthName(d.month - 1))))); break; }
    }
    const expanded = !c.barn || isMine || !!S.expanded[g] || hits.length > 0;
    const dname = inf => inf.title + (inf.groups.length > 1 ? t('sharedSuffix') : '');
    const summary = duties.length === 0 ? t('noDutiesThisYear') : t('dutySummary', duties.length, joinList(duties.map(dname)));
    return html`<article aria-label="${t('group', gNum(g))}" class="card" style="background:${isMine ? '#E3F2E7' : '#FFFFFF'}; grid-column:${isMine && !hits.length ? '1 / -1' : 'auto'}">
      <div class="row-wrap"><span class="gdot gdot-lg" style="background:${c.barn && !isMine ? '#B6BDB8' : HUES[g]}">${gNum(g)}</span>
        <h2 class="disp h2-card">${t('group', gNum(g))}</h2>${isMine ? html`<span class="mine-badge">${t('yourGroup')}</span>` : ''}</div>
      <p class="pretty">${joinList(D.groups[g].map(id => childById(id).name))}</p>
      ${expanded ? html`
        ${duties.length ? html`<div class="muted" style="font-size:13px; margin-top:4px">${t('dutiesIn', className(CY.class), CY.label)}</div>
          <ul class="stack-0">${duties.map(inf => html`<li style="border-top:1px solid #EADFC4"><button data-act="sheet" data-yi="${cy}" data-did="${inf.did}" class="gduty">
            <span><span style="font-weight:600">${dname(inf)}</span><span class="sub-label tnum">${inf.ev ? inf.when : `${inf.monthText} · ${t('dateTbd')}`}</span></span>
            <span class="chip chip-sm ${chip(inf.status)}">${t('status')[inf.status]}</span></button></li>`)}</ul>`
          : html`<p class="muted pretty" style="font-size:15px; margin-top:4px">${emptyText}</p>`}
        <div><button data-act="groupAll" data-g="${g}" class="ulink" style="font-size:15px">${t('allTenYears')}</button></div>`
      : html`<button data-act="expand" data-g="${g}" class="collapsed-row"><span>${summary}</span><span style="color:#0F5A33; font-weight:600">${t('show')}</span></button>`}
    </article>`;
  });

  return html`<section class="stack-20">
    <div class="row-between-end"><h1 class="disp h1-mid">${t('groups')}</h1>
      <label class="search-label">${t('findChild')}<input id="search" type="search" value="${S.search}" placeholder="${t('typeName')}" autocomplete="off"></label></div>
    ${hits.length ? html`<ul class="row-wrap" style="gap:8px">${hits.map(k => { const g = groupOfChild(k.id); return html`<li><button data-act="pick" data-id="${k.id}" class="hit"><span class="ldot" style="width:10px; height:10px; background:${HUES[g]}"></span><span style="font-weight:600">${k.name}</span><span class="muted">${t('pickAsChild', gNum(g))}</span></button></li>`; })}</ul>` : ''}
    ${q && !hits.length ? html`<p class="muted">${t('noHits')}</p>` : ''}
    <div class="group-grid">${cards}</div></section>`;
}

// ---------- Fødselsdage ----------
function viewFoedselsdage(S, c) {
  const D = M.D, tt = today();
  const bd = calendarItems().filter(e => e.kind === 'foedselsdag');
  const myBg = c.child ? c.child.bg : null;
  const nb = bd.filter(e => e.date >= tt && (!c.barn || e.child.bg === myBg))[0];
  const nextText = nb ? `${c.barn ? t('nextBdAmong', bdLabel(myBg)) : t('nextBdClass')}: ${nb.child.name}, ${fmtLong(nb.date, false)}` : t('noMoreBd');
  const cards = Object.keys(D.bdGroups).map(key => {
    const isMine = c.barn && myBg === key;
    const kids = bd.filter(e => e.child.bg === key).sort((a, b) => a.date.getMonth() - b.date.getMonth() || a.date.getDate() - b.date.getDate());
    const sel = e => c.child && e.child.id === c.child.id;
    const span = kids.length ? t('bdSpan', fmtDate(kids[0].date), fmtDate(kids[kids.length - 1].date)) : '';
    return html`<article aria-label="${bdLabel(key)}" class="card" style="background:${isMine ? '#F3FAF5' : '#FFFFFF'}">
      <div class="row-wrap"><span class="ldot" style="width:14px; height:14px; background:${D.bdGroups[key].color}"></span><h2 class="disp h2-card">${bdLabel(key)}</h2>${isMine ? html`<span class="mine-badge">${t('yourGroup')}</span>` : ''}</div>
      <p class="muted" style="font-size:13px">${span}</p>
      <ul class="stack-0">${kids.map(e => html`<li class="bd-kid" style="background:${sel(e) ? '#E3F2E7' : 'transparent'}"><span style="font-weight:${sel(e) ? 700 : 500}">${e.child.name}</span><span class="muted tnum nowrap" style="margin-left:auto; font-size:14px">${fmtDate(e.date)}</span></li>`)}</ul>
    </article>`;
  });
  return html`<section class="stack-20">
    <h1 class="disp h1-mid">${t('birthdays')}</h1>
    <div class="stack-6" style="max-width:62ch"><p class="pretty" style="font-size:19px; font-weight:500">${nextText}</p><p class="muted pretty" style="font-size:15px">${t('bdIntro')}</p></div>
    <div class="row-wrap muted" style="gap:20px; font-size:14px">${Object.keys(D.bdGroups).map(k => html`<span class="row-wrap" style="gap:7px"><span class="ldot" style="background:${D.bdGroups[k].color}"></span>${bdLabel(k)}</span>`)}</div>
    <div class="bd-grid">${cards}</div></section>`;
}

// ---------- Kalender ----------
function viewKalender(S, c) {
  const D = M.D, tt = today(), CY = D.years[c.cy], my = c.my;
  const filters = ['alt', 'skolen', 'ferie', 'foedselsdage'].concat(c.barn ? ['vores'] : []);
  const f = S.calFilter;
  const ok = e => f === 'alt' || (f === 'skolen' && e.kind === 'skole') || (f === 'ferie' && e.kind === 'ferie') || (f === 'foedselsdage' && e.kind === 'foedselsdag') || (f === 'vores' && e.kind === 'opgave' && e.groups.includes(my));
  const filtered = calendarItems().filter(ok);
  const isPast = e => (e.end || e.date) < tt;
  const pastCount = filtered.filter(isPast).length;
  const visible = filtered.filter(e => S.showPast || !isPast(e));
  const months = [];
  visible.forEach(e => {
    const key = `${e.date.getFullYear()}-${e.date.getMonth()}`;
    let m = months[months.length - 1];
    if (!m || m.key !== key) { m = { key, label: `${monthCap(e.date.getMonth())} ${e.date.getFullYear()}`, items: [], lastWeek: null }; months.push(m); }
    const wk = isoWeek(e.date), open = S.openEvent === e.id;
    let detail = '';
    if (e.kind === 'skole') detail = `${e.time ? t('kl', e.time) : t('allDay')} · ${t('fromClassCal')}`;
    else if (e.kind === 'ferie') detail = `${e.end ? fmtLong(e.date, false) + t('spanTo') + fmtLong(e.end, false) : fmtLong(e.date, false)} · ${t('fromClassCal')}`;
    else if (e.kind === 'foedselsdag') detail = `${bdLabel(e.child.bg)} · ${t('group', gNum(groupOfChild(e.child.id)))}`;
    const iconColor = e.kind === 'opgave' ? (c.barn ? (e.groups.includes(my) ? '#008A40' : '#9AA29D') : (e.groups[0] ? HUES[e.groups[0]] : '#6B7570')) : '';
    const act = e.kind === 'opgave' ? html`data-act="sheet" data-yi="${e.info.yi}" data-did="${e.info.did}"` : html`data-act="openEvent" data-id="${e.id}"`;
    m.items.push(html`<li style="border-top:1px solid #EADFC4"><button ${act} aria-expanded="${open}" class="cal-item" style="opacity:${isPast(e) ? 0.65 : 1}">
      <span class="stack-0" style="font-size:15px"><span class="muted tnum nowrap">${e.kind === 'opgave' && !e.info.ev ? cap(monthShort(e.date.getMonth())) : fmtDay(e.date)}</span>${wk !== m.lastWeek ? html`<span style="font-size:12px; color:#9AA29D">${t('week', wk)}</span>` : ''}</span>
      <span class="icon-cell" style="width:24px; height:24px">${e.kind === 'opgave' ? ICON.duty(iconColor) : e.kind === 'skole' ? ICON.school() : e.kind === 'ferie' ? ICON.holiday() : ICON.cake(D.bdGroups[e.child.bg].color)}</span>
      <span class="stack-2" style="min-width:0"><span class="pretty" style="font-weight:${e.kind === 'opgave' ? 600 : 500}; color:${c.barn && e.kind === 'opgave' && !e.groups.includes(my) ? '#6B7570' : '#1B2420'}">${e.title}</span>
        <span class="muted" style="font-size:13px">${[e.sub, e.source].filter(Boolean).join(' · ')}</span>
        ${open ? html`<span style="font-size:14px; color:#1B2420; padding-top:4px">${detail}</span>` : ''}</span>
      <span class="dots">${e.kind === 'opgave' ? e.groups.map(g => gdot(gNum(g), groupColor(g, c))) : ''}${e.kind === 'foedselsdag' ? html`<span class="ldot" style="width:10px; height:10px; background:${D.bdGroups[e.child.bg].color}"></span>` : ''}</span>
    </button></li>`);
    m.lastWeek = wk;
  });
  const feedMsg = feedHas() && feedStale() ? t('feedOff') : '';
  return html`<section class="stack-20">
    <div class="row-between-base"><h1 class="disp h1-mid">${t('calendar')}</h1><span class="muted tnum" style="font-size:15px">${className(CY.class)} · ${CY.label}</span></div>
    <div role="group" aria-label="${t('filters')}" class="row-wrap" style="gap:8px">${filters.map(id => html`<button data-act="calFilter" data-f="${id}" aria-pressed="${id === f}" class="fchip ${id === f ? 'on' : ''}">${t('filter')[id]}</button>`)}</div>
    ${feedMsg ? html`<p class="muted" style="font-size:14px">${feedMsg}</p>` : ''}
    ${pastCount ? html`<div><button data-act="togglePast" aria-expanded="${S.showPast}" class="ulink" style="font-size:14px">${S.showPast ? t('hideEarlier') : t('earlier', pastCount)}</button></div>` : ''}
    <div class="stack-28">${months.map(m => html`<section aria-label="${m.label}"><h2 class="disp h2-month">${m.label}</h2><ul style="border-bottom:1px solid #EADFC4">${m.items}</ul></section>`)}</div>
    ${visible.length ? '' : html`<p class="muted">${t('noCal')}</p>`}
    <div class="phase2"><button data-act="phase2" class="btn-yellow btn-big">${t('addToCal')}</button>
      ${S.phase2 ? html`<p class="muted pretty" style="font-size:14px; max-width:60ch">${t('phase2')}</p>` : ''}</div></section>`;
}

export function main(S, c) {
  return ({ hjul: viewHjul, aar: viewAar, grupper: viewGrupper, foedselsdage: viewFoedselsdage, kalender: viewKalender })[S.route](S, c);
}

// ---------- footer ----------
export function footer(S, c) {
  let stamp = t('stampNever');
  if (M.meta && M.meta.fetchedAt) {
    const d = new Date(M.meta.fetchedAt), hh = String(d.getHours()).padStart(2, '0'), mm = String(d.getMinutes()).padStart(2, '0');
    stamp = t('stamp', `${fmtDate(d)} ${d.getFullYear()} ${lang === 'en' ? hh + ':' + mm : 'kl. ' + hh + '.' + mm}`) + (feedStale() ? t('stampFailed') : '');
  }
  return html`<div class="wrap foot-in">
    <p class="pretty">${t('disclaimer')}</p>
    <p class="tnum">${stamp} · <button data-act="logout" class="foot-link">${t('logout')}</button></p>
    ${c.isM ? '' : langSwitch('lang-foot')}</div>`;
}

// ---------- overlays ----------
export function overlays(S, c) {
  const out = [];
  if (S.menuOpen && c.isM) {
    out.push(html`<div class="scrim" data-act="closeMenu"></div>
      <nav aria-label="${t('pages')}" class="drawer"><span class="disp drawer-title">${t('menu')}</span>
        <ul class="stack-10">${ROUTES.map(r => { const a = r.id === S.route; return html`<li><a href="${r.hash}" data-act="closeMenu" aria-current="${a ? 'page' : 'false'}" class="menu-item" style="color:${a ? '#FFFFFF' : INK}; background:${a ? '#008A40' : '#FFFFFF'}"><span class="ldot" style="background:${a ? '#FFFFFF' : MENU_DOTS[r.id]}"></span>${t('nav')[r.id]}</a></li>`; })}</ul>
        ${langSwitch('lang-drawer')}</nav>`);
  }
  if (S.sheet) {
    const i = dutyInfo(S.sheet.yi, S.sheet.did);
    out.push(html`<div class="scrim scrim-green" data-act="closeSheet"></div>
      <aside role="dialog" aria-modal="true" aria-label="${i.title}" class="sheet ${c.isM ? 'sheet-m' : 'sheet-d'}">
        <div class="row-between" style="align-items:center"><span class="chip ${chip(i.status)}">${t('status')[i.status]}</span><button data-act="closeSheet" class="close-btn">${t('close')}</button></div>
        <div class="stack-6"><h2 class="disp sheet-title">${i.title}</h2><p class="muted" style="font-size:14px">${className(i.y.class)} · ${i.y.label}</p>
          ${i.ev ? html`<p class="row-wrap" style="font-size:15px; gap:8px">${i.feedTitle || ''}<span class="src-tag">${i.sourceTag}</span></p>` : ''}</div>
        <dl class="sheet-dl">
          <dt>${t('when')}</dt><dd class="tnum">${i.when}${i.whenSub ? html`<span class="sub-block muted">${i.whenSub}</span>` : ''}</dd>
          <dt>${t('who')}</dt><dd>${i.who}${i.names ? html`<span class="sub-block muted pretty">${i.names}</span>` : ''}</dd>
          <dt>${t('what')}</dt><dd class="pretty">${i.what}</dd></dl>
        <div class="row-wrap" style="gap:18px; font-size:15px; font-weight:600"><a href="#/kalender" data-act="closeSheet">${t('seeInCal')}</a>${i.groups.length ? html`<button data-act="seeGroup" data-g="${i.groups[0]}" style="color:#0F5A33">${t('seeGroup')}</button>` : ''}</div>
      </aside>`);
  }
  if (S.pickerOpen) {
    const kids = [...M.D.children].sort((a, b) => a.name.localeCompare(b.name, 'da'));
    out.push(html`<div role="dialog" aria-modal="true" aria-labelledby="picker-title" class="picker ${c.isM ? 'picker-m' : 'picker-d'}" data-act="closePickerBg">
      <div class="picker-box">
        <div class="row-between"><div class="stack-6"><h1 id="picker-title" class="disp h1-mid">${t('pickerTitle')}</h1><p class="muted pretty">${t('pickerSub')}</p></div>
          <button data-act="closePicker" class="close-btn shrink0">${t('close')}</button></div>
        <div class="kid-grid">${kids.map(k => { const g = groupOfChild(k.id), sel = S.barn === k.id; return html`<button data-act="pick" data-id="${k.id}" aria-pressed="${sel}" class="kid lift-sm" style="background:${sel ? '#E3F2E7' : '#FFFFFF'}">
            <span class="kid-av" style="background:${TINTS[g]}">${avatar(k.sex, HUES[g], '#FFFFFF', 30)}</span>
            <span class="stack-0" style="line-height:1.3"><span style="font-weight:600; font-size:16px">${k.name}</span><span class="muted" style="font-size:12px">${t('group', gNum(g))}</span></span></button>`; })}</div>
        <p class="muted" style="font-size:14px">${t('pickerHint')}</p>
        <div><button data-act="skipPicker" class="ulink" style="font-size:15px">${t('pickerSkip')}</button></div>
      </div></div>`);
  }
  return html`${out}`;
}

// ---------- login ----------
export function login(L) {
  return html`<div class="login">
    <form class="login-card card" data-form="login" novalidate>
      ${logoImg('logo-tile logo-login')}
      <h1 class="disp login-title">${t('loginTitle')}</h1>
      <p class="muted pretty" style="text-align:center">${t('loginSub')}</p>
      <label class="login-label" for="pw">${t('password')}</label>
      <input id="pw" type="password" autocomplete="current-password" required ${L.busy ? raw('disabled') : ''} aria-invalid="${!!L.error}" aria-describedby="pw-msg">
      <p id="pw-msg" class="login-err" role="alert">${L.error ? t(L.error) : ''}</p>
      <button type="submit" class="btn-yellow btn-big login-btn" ${L.busy ? raw('disabled') : ''}>${L.busy ? t('loading') : t('unlock')}</button>
      <p class="muted pretty" style="font-size:13px; text-align:center">${t('loginHelp')}</p>
    </form>
    ${langSwitch('lang-login')}
  </div>`;
}
