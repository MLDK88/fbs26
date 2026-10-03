// String catalogue (Danish default, English optional) and date formatting.
export let lang = 'da';

export function initLang() {
  let l = 'da';
  try { l = new URLSearchParams(location.search).get('lang') || localStorage.getItem('aarshjul.lang') || 'da'; } catch (e) {}
  lang = l === 'en' ? 'en' : 'da';
  document.documentElement.lang = lang;
  return lang;
}

export function setLang(l) {
  lang = l;
  document.documentElement.lang = l;
  try { localStorage.setItem('aarshjul.lang', l); } catch (e) {}
  try { const u = new URL(location.href); if (u.searchParams.has('lang')) { u.searchParams.delete('lang'); history.replaceState(null, '', u.toString()); } } catch (e) {}
}

const DA = {
  brand: 'Årshjulet', wheel: 'Årshjul',
  subline: (c, l) => `Årgang 2026 · Frederik Barfods Skole · ${c} ${l}`,
  klassen: 'Klassen', heleKlassen: 'Hele klassen', mitBarn: 'Mit barn',
  openMenu: 'Åbn menu', view: 'Visning', pages: 'Sider', frontpage: 'Årshjulet, forsiden', menu: 'Menu', language: 'Sprog / Language',
  nav: { hjul: 'Årshjul', aar: 'De 10 år', grupper: 'Grupper', foedselsdage: 'Fødselsdage', kalender: 'Kalender' },
  prevYear: x => `Forrige år: ${x}`, nextYear: x => `Næste år: ${x}`,
  wheelLegend: n => `Grønt er Gruppe ${n}s opgaver`, dutiesThisYear: 'Opgaver i skoleåret',
  wheelAria: (c, l) => `Årshjul, ${c} ${l}`, today: 'I dag',
  nextEvent: 'Næste event', seeEvent: 'Se event', nextInClass: 'Næste i klassen', seeCalendar: 'Se hele kalenderen',
  feedOff: 'Kunne ikke hente fra SkoleIntra lige nu. Viser det, vi havde i går.',
  feedEmpty: 'Der er ikke hentet noget fra SkoleIntra endnu.',
  dateTbd: 'dato aftales', DateTbd: 'Dato aftales', week: n => `uge ${n}`, atTime: tm => ` kl. ${tm}`, kl: tm => `kl. ${tm}`,
  iconSchool: 'Skolen', iconHoliday: 'Ferie', iconBirthday: 'Fødselsdag', iconDuty: 'Opgave',
  status: { done: 'Klaret', now: 'Nu', upcoming: 'Kommer' },
  group: n => `Gruppe ${n}`, groupsTogether: ns => `Gruppe ${ns.join(' og ')} i fællesskab`,
  whoSchool: 'Skolen står for det', whoRepr: 'Forældrerepræsentanterne står for det', whoDimission: 'Aftales i klassen', whoNone: 'Ikke i år',
  schoolAnnounces: 'Skolen melder datoen ud', dateAgreedClass: 'Datoen aftales i klassen', dateAgreedGroup: 'Datoen aftales af gruppen',
  srcFeed: 'Fra SkoleIntra', srcWheel: 'Fra årshjulet', srcOverride: 'Aftalt af gruppen',
  dimissionTitle: 'Dimissionsfest', dimissionShort: 'Dimission',
  hasBirthday: n => `${n} har fødselsdag`,
  // De 10 år
  tenYears: 'De 10 år', mineHeadline: n => `${n} opgaver på 10 år`,
  mineIntro: n => `Gruppe ${n}, fra Bh. klasse til 9. klasse.`, mineNext: (title, m, y) => ` Næste: ${title}, ${m} ${y}.`,
  allHeadline: 'Fra Bh. klasse til 9. klasse',
  allIntro: 'Ni opgaver om året, seks grupper på skift. Tryk på et år for at se det stort, eller på en opgave for detaljer.',
  onlyMine: 'Vis kun vores opgaver',
  groupFilterNote: n => `Viser kun Gruppe ${n}s opgaver.`, showFullOverview: 'Vis hele oversigten', noDuties: 'Ingen opgaver',
  dutiesForGroups: n => `${n} opgaver til grupperne`, offThisYear: 'Fri i år', thisYear: 'I år', showYearAria: (c, l) => `${c} ${l}, vis årshjulet`,
  noGroupDuty: 'Skolen, forældrerepr. eller dimission',
  legend: 'Signaturforklaring',
  // Grupper
  groups: 'Grupper', findChild: 'Find et barn', typeName: 'Skriv et navn', pickAsChild: n => `Gruppe ${n} · vælg som dit barn`,
  noHits: 'Der er ingen i klassen, der hedder det.', yourGroup: 'Jeres gruppe', dutiesIn: (c, l) => `Opgaver i ${c} ${l}`,
  sharedSuffix: ' (delt)', groupOff: n => `Gruppe ${n} har fri i år.`, onAgain: (c, list) => ` I er på igen i ${c} med ${list}.`,
  dutyInMonth: (d, m) => `${d} i ${m}`, allTenYears: 'Alle 10 år', show: 'Vis', noDutiesThisYear: 'Ingen opgaver i år',
  dutySummary: (n, list) => `${n} ${n === 1 ? 'opgave' : 'opgaver'} i år: ${list}`,
  // Fødselsdage
  birthdays: 'Fødselsdage', nextBdClass: 'Næste fødselsdag i klassen', nextBdAmong: g => `Næste fødselsdag blandt ${g.toLowerCase()}`,
  noMoreBd: 'Ingen flere fødselsdage i dette skoleår.',
  bdIntro: 'Klassen er delt i fire fødselsdagsgrupper med seks børn i hver, efter hvornår på året de har fødselsdag.',
  bdSpan: (a, b) => `Fødselsdage fra ${a} til ${b}`,
  // Kalender
  calendar: 'Kalender', filters: 'Filtre',
  filter: { alt: 'Alt', skolen: 'Skolen', ferie: 'Ferie', foedselsdage: 'Fødselsdage', vores: 'Vores opgaver' },
  earlier: n => `Tidligere (${n})`, hideEarlier: 'Skjul tidligere', noCal: 'Ikke noget at vise med det filter.',
  addToCal: 'Tilføj til din kalender',
  phase2: 'Kommer senere: et kalenderabonnement med jeres gruppes opgaver for alle 10 år og klassens fødselsdagsgruppe, så I kan glemme alt om denne side.',
  allDay: 'Hele dagen', fromClassCal: 'Fra klassens SkoleIntra-kalender', spanTo: ' til ',
  // footer
  disclaimer: 'Lavet af forældre, til forældre. Ikke en officiel side fra Frederik Barfods Skole. Det officielle står altid på ForældreIntra.',
  stamp: s => `Sidst opdateret fra SkoleIntra: ${s}`, stampFailed: ' (kunne ikke hente SkoleIntra i dag)', stampNever: 'Ikke hentet fra SkoleIntra endnu',
  // sheet
  close: 'Luk', when: 'Hvornår', who: 'Hvem', what: 'Hvad', seeInCal: 'Se i kalenderen', seeGroup: 'Se gruppen',
  // picker
  pickerTitle: 'Hvem er dit barn?', pickerSub: 'Så viser vi det, der er vigtigt for jer. Du kan altid skifte.',
  pickerHint: 'Vincent og Esther: der er to i klassen. Vælg den rigtige.', pickerSkip: 'Vis hele klassen i stedet',
  // login
  loginTitle: 'Årshjulet', loginSub: 'For forældre i Bh. klasse på Frederik Barfods Skole, årgang 2026.',
  password: 'Adgangskode', unlock: 'Lås op', wrongPw: 'Forkert adgangskode. Prøv igen.', loading: 'Henter …',
  loginHelp: 'Adgangskoden står i klassens forældregruppe.', loadError: 'Siden kunne ikke hentes. Tjek din forbindelse og prøv igen.',
  noCrypto: 'Din browser kan ikke åbne siden. Brug adressen https://fbs26.dk i en opdateret browser.',
  logout: 'Log ud'
};

const EN = {
  brand: 'Year Wheel', wheel: 'Year wheel',
  subline: (c, l) => `Class of 2026 · Frederik Barfods Skole · ${c} ${l}`,
  klassen: 'Class', heleKlassen: 'Whole class', mitBarn: 'My child',
  openMenu: 'Open menu', view: 'View', pages: 'Pages', frontpage: 'Year Wheel, front page', menu: 'Menu', language: 'Sprog / Language',
  nav: { hjul: 'Year wheel', aar: 'The 10 years', grupper: 'Groups', foedselsdage: 'Birthdays', kalender: 'Calendar' },
  prevYear: x => `Previous year: ${x}`, nextYear: x => `Next year: ${x}`,
  wheelLegend: n => `Green is Group ${n}'s duties`, dutiesThisYear: 'Duties this school year',
  wheelAria: (c, l) => `Year wheel, ${c} ${l}`, today: 'Today',
  nextEvent: 'Next event', seeEvent: 'See event', nextInClass: 'Coming up in class', seeCalendar: 'See the full calendar',
  feedOff: "Couldn't fetch from SkoleIntra right now. Showing what we had yesterday.",
  feedEmpty: 'Nothing has been fetched from SkoleIntra yet.',
  dateTbd: 'date TBD', DateTbd: 'Date TBD', week: n => `week ${n}`, atTime: tm => `, ${tm}`, kl: tm => tm,
  iconSchool: 'School', iconHoliday: 'Holiday', iconBirthday: 'Birthday', iconDuty: 'Duty',
  status: { done: 'Done', now: 'Now', upcoming: 'Upcoming' },
  group: n => `Group ${n}`, groupsTogether: ns => `Groups ${ns.join(' and ')} together`,
  whoSchool: 'The school handles it', whoRepr: 'The parent reps handle it', whoDimission: 'Agreed in class', whoNone: 'Not this year',
  schoolAnnounces: 'The school announces the date', dateAgreedClass: 'Date agreed in class', dateAgreedGroup: 'The group sets the date',
  srcFeed: 'From SkoleIntra', srcWheel: 'From the year wheel', srcOverride: 'Agreed by the group',
  dimissionTitle: 'Graduation party', dimissionShort: 'Graduation',
  hasBirthday: n => `${n}'s birthday`,
  tenYears: 'The 10 years', mineHeadline: n => `${n} duties over 10 years`,
  mineIntro: n => `Group ${n}, from kindergarten class to grade 9.`, mineNext: (title, m, y) => ` Next: ${title}, ${m} ${y}.`,
  allHeadline: 'From kindergarten class to grade 9',
  allIntro: 'Nine duties a year, six groups taking turns. Tap a year to see it large, or a duty for details.',
  onlyMine: 'Show only our duties',
  groupFilterNote: n => `Showing only Group ${n}'s duties.`, showFullOverview: 'Show the full overview', noDuties: 'No duties',
  dutiesForGroups: n => `${n} duties for the groups`, offThisYear: 'Off this year', thisYear: 'This year', showYearAria: (c, l) => `${c} ${l}, show the year wheel`,
  noGroupDuty: 'School, parent reps or graduation',
  legend: 'Legend',
  groups: 'Groups', findChild: 'Find a child', typeName: 'Type a name', pickAsChild: n => `Group ${n} · choose as your child`,
  noHits: 'No one in the class has that name.', yourGroup: 'Your group', dutiesIn: (c, l) => `Duties in ${c} ${l}`,
  sharedSuffix: ' (shared)', groupOff: n => `Group ${n} is off this year.`, onAgain: (c, list) => ` You're on again in ${c} with ${list}.`,
  dutyInMonth: (d, m) => `${d} in ${m}`, allTenYears: 'All 10 years', show: 'Show', noDutiesThisYear: 'No duties this year',
  dutySummary: (n, list) => `${n} ${n === 1 ? 'duty' : 'duties'} this year: ${list}`,
  birthdays: 'Birthdays', nextBdClass: 'Next birthday in class', nextBdAmong: g => `Next birthday among the ${g.toLowerCase()}`,
  noMoreBd: 'No more birthdays this school year.',
  bdIntro: 'The class is split into four birthday groups of six children each, by when in the year their birthday falls.',
  bdSpan: (a, b) => `Birthdays from ${a} to ${b}`,
  calendar: 'Calendar', filters: 'Filters',
  filter: { alt: 'All', skolen: 'School', ferie: 'Holiday', foedselsdage: 'Birthdays', vores: 'Our duties' },
  earlier: n => `Earlier (${n})`, hideEarlier: 'Hide earlier', noCal: 'Nothing to show with that filter.',
  addToCal: 'Add to your calendar',
  phase2: "Coming later: a calendar subscription with your group's duties for all 10 years and your birthday group, so you can forget all about this page.",
  allDay: 'All day', fromClassCal: "From the class's SkoleIntra calendar", spanTo: ' to ',
  disclaimer: 'Made by parents, for parents. Not an official Frederik Barfods Skole page. Official information is always on ForældreIntra.',
  stamp: s => `Last updated from SkoleIntra: ${s}`, stampFailed: " (couldn't fetch SkoleIntra today)", stampNever: 'Not fetched from SkoleIntra yet',
  close: 'Close', when: 'When', who: 'Who', what: 'What', seeInCal: 'See in calendar', seeGroup: 'See the group',
  pickerTitle: 'Who is your child?', pickerSub: "Then we'll show what matters to you. You can always switch.",
  pickerHint: 'Vincent and Esther: there are two of each in the class. Pick the right one.', pickerSkip: 'Show the whole class instead',
  loginTitle: 'Year Wheel', loginSub: 'For parents in the kindergarten class at Frederik Barfods Skole, class of 2026.',
  password: 'Password', unlock: 'Unlock', wrongPw: 'Wrong password. Try again.', loading: 'Loading …',
  loginHelp: "The password is in the class's parent group.", loadError: "The page couldn't load. Check your connection and try again.",
  noCrypto: "Your browser can't open this page. Use the address https://fbs26.dk in an up-to-date browser.",
  logout: 'Log out'
};

export function t(key, ...args) {
  const v = (lang === 'en' ? EN : DA)[key];
  return typeof v === 'function' ? v(...args) : v;
}

// ---------- dates ----------
const MON_DA = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const MONL_DA = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december'];
const WD_DA = ['sø', 'ma', 'ti', 'on', 'to', 'fr', 'lø'];
const WDL_DA = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];
const MON_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONL_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WD_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WDL_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const en = () => lang === 'en';
export const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
export const monthName = i => (en() ? MONL_EN : MONL_DA)[i];
export const monthShort = i => (en() ? MON_EN : MON_DA)[i];
export const monthCap = i => cap(monthName(i));
export const wheelMonth = i => (en() ? MON_EN : MON_DA)[i].slice(0, 3).toUpperCase();
export const fmtDay = d => en() ? `${WD_EN[d.getDay()]} ${d.getDate()} ${MON_EN[d.getMonth()]}` : `${WD_DA[d.getDay()]} ${d.getDate()}. ${MON_DA[d.getMonth()]}`;
export const fmtDate = d => en() ? `${d.getDate()} ${MONL_EN[d.getMonth()]}` : `${d.getDate()}. ${MONL_DA[d.getMonth()]}`;
export const fmtLong = (d, withYear) => en()
  ? `${WDL_EN[d.getDay()]} ${d.getDate()} ${MONL_EN[d.getMonth()]}${withYear ? ' ' + d.getFullYear() : ''}`
  : `${WDL_DA[d.getDay()]} ${d.getDate()}. ${MONL_DA[d.getMonth()]}${withYear ? ' ' + d.getFullYear() : ''}`;
export function fmtSpan(s, e) {
  if (s.getMonth() === e.getMonth()) return en() ? `${s.getDate()}–${e.getDate()} ${MONL_EN[e.getMonth()]}` : `${s.getDate()}.–${e.getDate()}. ${MONL_DA[e.getMonth()]}`;
  return `${fmtDate(s)} – ${fmtDate(e)}`;
}
export function joinList(arr) {
  if (arr.length <= 1) return arr[0] || '';
  return arr.slice(0, -1).join(', ') + (en() ? ' and ' : ' og ') + arr[arr.length - 1];
}

// ---------- class names and SkoleIntra titles ----------
export function className(c) {
  if (!en()) return c;
  if (c === 'Bh. klasse') return 'Kindergarten class';
  const m = c.match(/^(\d)\. klasse$/); return m ? `Grade ${m[1]}` : c;
}
export function classUpper(c) {
  if (!en()) return c.toUpperCase();
  if (c === 'Bh. klasse') return 'KINDERGARTEN';
  const m = c.match(/^(\d)\. klasse$/); return m ? `GRADE ${m[1]}` : c.toUpperCase();
}
export function classShort(c) {
  if (c === 'Bh. klasse') return en() ? 'K' : 'Bh.';
  return en() ? c.replace('. klasse', '') : c.replace(' klasse', '');
}

const FEED_EN = {
  'Børnehaveklasse - forældremøde': 'Kindergarten class – parent meeting', 'Forældredag i skole og sfo': "Parents' day at school and after-school care",
  'Efterårsferie': 'Autumn break', 'Juleferie': 'Christmas holiday', 'Vinterferie': 'Winter break', 'Påskeferie': 'Easter break', 'Sommerferie': 'Summer holiday',
  'Kristi Himmelfartsferie': 'Ascension Day holiday', '2. Pinsedag': 'Whit Monday', 'Grundlovsdag': 'Constitution Day',
  'Julefest bh.kl': 'Christmas party, kindergarten class', 'Krybbespil i Frederiksberg Kirke': 'Nativity play in Frederiksberg Church',
  'Kontakt-forældremøde med skolens ledelse': 'Class rep meeting with school management',
  'Generalforsamling Frederik Barfods Skole': 'Frederik Barfods Skole annual general meeting', 'Loppemarked': 'Flea market',
  'Fastelavn': 'Shrovetide (Fastelavn)', 'Fotografering': 'School photos', 'Motionsdag': 'Sports day', 'Skoleudflugt': 'School trip',
  'Skole - hjemsamtaler': 'parent–teacher talks', 'Skole/hjem samtaler': 'Parent–teacher talks', 'Lejrskole': 'camp',
  'Skolens fødselsdag': "School's birthday", 'Fridag': 'Day off', 'Sidste skoledag': 'Last day of school', 'Sidste skoldag': 'Last day of school',
  'God sommer': 'Happy summer', 'Bogaflevering': 'Book return', 'Elevsamtaledage og fagtimer': 'Pupil talks and subject lessons'
};
export function feedTitle(s) {
  if (!en()) return s;
  let o = s;
  for (const k of Object.keys(FEED_EN).sort((a, b) => b.length - a.length)) if (o.includes(k)) o = o.split(k).join(FEED_EN[k]);
  // Free-text titles are left in Danish; only the "Bh. klasse (og n. klasse):" prefix is translated.
  return o.replace(/^Bh\. klasse og (\d)\. klasse:/, 'Kindergarten class and grade $1:').replace(/^Bh\. klasse:/, 'Kindergarten class:');
}
