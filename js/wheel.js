// The big årshjul and the mini wheels (SVG strings).
import { html } from './html.js';
import { t, wheelMonth, className, classUpper, classShort } from './i18n.js';
import { M, HUES, dutyInfo, currentYearIdx, today } from './model.js';

const INK = '#14201A';
const MONTHS = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];
const GAP = 14, SEG = (360 - GAP) / 11;
const BG = "'Bricolage Grotesque', Figtree, sans-serif";
const f = n => +n.toFixed(2);
export const monthHue = i => 230 - i * 28;

function polar(C) { return (r, deg) => { const a = (deg - 90) * Math.PI / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; }; }
function segPath(pol, ro, ri, a0, a1) {
  const [x0, y0] = pol(ro, a0), [x1, y1] = pol(ro, a1), [x2, y2] = pol(ri, a1), [x3, y3] = pol(ri, a0);
  return `M${f(x0)} ${f(y0)}A${ro} ${ro} 0 0 1 ${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}A${ri} ${ri} 0 0 0 ${f(x3)} ${f(y3)}Z`;
}
function byMonthFor(yi) {
  const y = M.D.years[yi], out = {};
  M.D.duties.forEach(d => { if (M.D.assignments[y.id][d.id]) out[d.month] = dutyInfo(yi, d.id); });
  return out;
}
// Split a label onto two lines of similar length.
function lines(txt) {
  if (txt.length <= 10 || !txt.includes(' ')) return [txt];
  const w = txt.split(' '); let best = 1, bd = 1e9;
  for (let k = 1; k < w.length; k++) { const d = Math.abs(w.slice(0, k).join(' ').length - w.slice(k).join(' ').length); if (d < bd) { bd = d; best = k; } }
  return [w.slice(0, best).join(' '), w.slice(best).join(' ')];
}

export function buildWheel(yi, barn, my) {
  const y = M.D.years[yi], tt = today();
  const C = 220, R0 = 72, R1 = 106, R2 = 204, pol = polar(C);
  const byMonth = byMonthFor(yi);
  const isCurYear = yi === currentYearIdx();
  const cmi = MONTHS.indexOf(tt.getMonth() + 1), ROT = cmi < 0 ? 0 : -(GAP / 2 + (cmi + 0.5) * SEG);
  const segs = [], nodes = [];

  MONTHS.forEach((mn, i) => {
    const a0 = GAP / 2 + i * SEG + ROT, a1 = a0 + SEG, am = (a0 + a1) / 2, H = monthHue(i), amN = ((am % 360) + 360) % 360;
    const info = byMonth[mn], isCur = isCurYear && tt.getMonth() + 1 === mn;
    let outer = `oklch(0.975 0.02 ${H})`, txt = INK, tw = 700;
    if (info) {
      const mine = barn && info.groups.includes(my);
      if (barn) { outer = mine ? '#008A40' : '#F1ECDD'; txt = mine ? '#FFFFFF' : '#6B7570'; tw = mine ? 800 : 600; }
      else outer = `oklch(0.94 0.05 ${H})`;
    }
    segs.push(html`<path d="${segPath(pol, R2, R1, a0, a1)}" style="fill:${outer}; stroke:${INK}; stroke-width:2"/>`);
    segs.push(html`<path d="${segPath(pol, R1, R0, a0, a1)}" style="fill:${isCur ? INK : `oklch(0.66 0.15 ${H})`}; stroke:${INK}; stroke-width:2"/>`);
    const [mx, my2] = pol((R0 + R1) / 2, am), flip = amN > 90 && amN < 270;
    segs.push(html`<text x="${f(mx)}" y="${f(my2)}" dy="0.35em" transform="rotate(${f(flip ? am + 180 : am)} ${f(mx)} ${f(my2)})" style="font-family:${BG}; font-size:13px; font-weight:800; letter-spacing:0.04em; fill:${isCur ? '#FFD23F' : '#FFFFFF'}; text-anchor:middle; pointer-events:none">${wheelMonth(mn - 1)}</text>`);
    if (info) {
      const [tx, ty] = pol(150, am), [dx, dy] = pol(186, am), L = lines(info.short), g = info.groups;
      const badges = g.map((gc, k) => {
        const off = (k - (g.length - 1) / 2) * 22, ox = dx + off * Math.cos(am * Math.PI / 180), oy = dy + off * Math.sin(am * Math.PI / 180), mine = barn && gc === my;
        return html`<g style="pointer-events:none"><circle cx="${f(ox)}" cy="${f(oy)}" r="9.5" style="fill:${barn ? (mine ? '#FFFFFF' : '#C9C3B2') : HUES[gc]}; stroke:${INK}; stroke-width:1.8"/><text x="${f(ox)}" y="${f(oy)}" dy="0.35em" style="font-size:10.5px; font-weight:800; fill:${barn ? (mine ? '#008A40' : '#FFFFFF') : '#FFFFFF'}; text-anchor:middle">${gc.slice(1)}</text></g>`;
      });
      nodes.push(html`<g class="wheel-node" role="button" tabindex="0" aria-label="${info.title}: ${info.who}" data-act="sheet" data-yi="${yi}" data-did="${info.did}">
        <path d="${segPath(pol, R2, R1, a0, a1)}" style="fill:transparent"/>
        <text x="${f(tx)}" y="${f(ty - (L.length - 1) * 7)}" style="font-size:12.5px; font-weight:${tw}; fill:${txt}; text-anchor:middle; pointer-events:none">${L.map((l, k) => html`<tspan x="${f(tx)}" dy="${k ? 14 : '0.35em'}">${l}</tspan>`)}</text>
        ${badges}</g>`);
    }
  });

  // Today marker: a small waving kid standing on the rim.
  let kid = '';
  if (isCurYear) {
    const m = tt.getMonth() + 1; let ang = 0;
    if (m !== 7) { const i = MONTHS.indexOf(m); const dim = new Date(tt.getFullYear(), tt.getMonth() + 1, 0).getDate(); ang = GAP / 2 + (i + (tt.getDate() - 1) / dim) * SEG; }
    ang += ROT;
    const [fx, fy] = pol(R2 + 1, ang);
    const ln = (x1, y1, x2, y2, w) => html`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${INK}; stroke-width:${w}; stroke-linecap:round"/>`;
    const foot = cx => html`<ellipse cx="${cx}" cy="-3" rx="3.6" ry="2.3" style="fill:#FFFFFF; stroke:${INK}; stroke-width:1.4"/>`;
    kid = html`<g transform="translate(${f(fx)} ${f(fy)}) rotate(${f(ang)}) scale(1.25)" style="pointer-events:none"><title>${t('today')}</title>
      ${ln(-2.5, -13, -3.5, -4, 2.4)}${ln(2.5, -13, 3.5, -4, 2.4)}${foot(-4.5)}${foot(4.5)}
      ${ln(-5.5, -21, -8, -14, 2.2)}${ln(5.5, -21, 11, -27, 2.2)}
      <circle cx="11.6" cy="-28.4" r="2.2" style="fill:#FFFFFF; stroke:${INK}; stroke-width:1.3"/>
      <path d="M14.6 -31.5Q16.2 -30 15.8 -27.6M16.8 -33.2Q19 -30.4 18.2 -26.6" style="fill:none; stroke:${INK}; stroke-width:1; stroke-linecap:round"/>
      <rect x="-6" y="-23" width="12" height="11" rx="3" style="fill:#008A40; stroke:${INK}; stroke-width:1.6"/>
      <path d="M0 -22.5V-12.5" style="stroke:#FFFFFF; stroke-width:1"/>
      <circle cx="0" cy="-30" r="7.2" style="fill:#FFFFFF; stroke:${INK}; stroke-width:1.6"/>
      <path d="M-7 -30.5C-7.5 -35 -5 -38 -3.5 -37.2L-2.6 -40L-0.4 -37.6L1.6 -40.6L2.8 -37.2L5.4 -38.6L5.2 -35.4L7.6 -34.4C7.6 -32.6 7.4 -31.2 7 -30.5C5 -33 2 -33.6 0 -33.4C-3 -33.4 -5.4 -32.6 -7 -30.5Z" style="fill:${INK}"/>
      <circle cx="-2.4" cy="-29" r="1" style="fill:${INK}"/><circle cx="2.6" cy="-29" r="1" style="fill:${INK}"/>
      <path d="M-2.2 -26.6Q0.2 -24.2 2.6 -26.6" style="fill:none; stroke:${INK}; stroke-width:1.1; stroke-linecap:round"/></g>`;
  }
  const [sx, sy] = pol(R2 - 18, ROT);
  const cls = className(y.class);
  return html`<svg class="wheel" viewBox="-14 -14 468 468" role="group" aria-label="${t('wheelAria', cls, y.label)}">
    <circle cx="${C}" cy="${C + 6}" r="${R2 + 1}" style="fill:${INK}"/>
    <g id="wheel-ring" class="spin"><circle cx="${C}" cy="${C}" r="${R2}" style="fill:#FFF8E7; stroke:${INK}; stroke-width:2.5"/>${segs}</g>
    <g id="wheel-nodes" class="spin">${nodes}</g>
    <text x="${f(sx)}" y="${f(sy)}" dy="0.35em" style="font-size:10px; font-weight:700; fill:#6B7570; text-anchor:middle">JUL</text>
    <circle cx="${C}" cy="${C}" r="${R0}" style="fill:#FFFFFF; stroke:${INK}; stroke-width:2.5"/>
    <text x="${C}" y="${C - 22}" style="font-size:13px; font-weight:700; fill:#6B7570; text-anchor:middle; letter-spacing:0.06em">${classUpper(y.class)}</text>
    <text x="${C}" y="${C + 8}" style="font-family:${BG}; font-size:28px; font-weight:800; fill:${INK}; text-anchor:middle; letter-spacing:-0.03em">${t('wheel')}</text>
    <text x="${C}" y="${C + 30}" style="font-size:13px; font-weight:600; fill:#0F5A33; text-anchor:middle">${y.label}</text>
    ${kid}</svg>`;
}

export function buildMiniWheel(yi, barn, my) {
  const y = M.D.years[yi];
  const C = 100, RO = 92, RI = 58, pol = polar(C);
  const byMonth = byMonthFor(yi);
  const kids = MONTHS.map((mn, i) => {
    const a0 = GAP / 2 + i * SEG, a1 = a0 + SEG, am = (a0 + a1) / 2, info = byMonth[mn];
    let fill = `oklch(0.975 0.02 ${monthHue(i)})`, dot = null;
    if (info) {
      const g = info.groups;
      if (barn) { if (g.includes(my)) { fill = '#008A40'; dot = '#FFFFFF'; } else { fill = '#F1ECDD'; dot = '#B3AD9C'; } }
      else if (g.length) { fill = `oklch(0.86 0.09 ${monthHue(i)})`; dot = HUES[g[0]]; }
      else { fill = '#F1ECDD'; dot = '#B3AD9C'; }
    }
    const [cx, cy] = pol((RO + RI) / 2, am);
    return info
      ? html`<g data-act="sheet" data-yi="${yi}" data-did="${info.did}" style="cursor:pointer"><path d="${segPath(pol, RO, RI, a0, a1)}" style="fill:${fill}; stroke:${INK}; stroke-width:2"/><circle cx="${f(cx)}" cy="${f(cy)}" r="6" style="fill:${dot}; stroke:${INK}; stroke-width:1.5"/><title>${info.title}: ${info.who}</title></g>`
      : html`<g><path d="${segPath(pol, RO, RI, a0, a1)}" style="fill:${fill}; stroke:${INK}; stroke-width:2"/></g>`;
  });
  return html`<svg viewBox="0 0 200 200" aria-hidden="true" style="width:100%; height:auto; display:block">${kids}<text x="${C}" y="${C}" dy="0.35em" style="font-family:${BG}; font-size:36px; fill:${INK}; text-anchor:middle; font-weight:800; letter-spacing:-0.03em">${classShort(y.class)}</text></svg>`;
}
