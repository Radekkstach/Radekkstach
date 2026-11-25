// Builds all profile SVGs in STCH Studio style. usage: node build.js <outDir>
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');
const OUT = process.argv[2];
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

// ---------- fonts ----------
const FONTS = {
  U: { family: 'Unbounded', weight: 700, file: 'Unbounded_wght_700.ttf' },
  I: { family: 'Inter', weight: 400, file: 'Inter_wght_400.ttf' },
  S: { family: 'Inter', weight: 600, file: 'Inter_wght_600.ttf' },
  C: { family: 'Caveat', weight: 600, file: 'Caveat_wght_600.ttf' },
};
for (const f of Object.values(FONTS)) f.ot = opentype.loadSync(path.join(__dirname, 'fonts', f.file));
const measure = (k, s, size, ls = 0) => FONTS[k].ot.getAdvanceWidth(s, size) + ls * Math.max(0, s.length - 1);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function fontFace(k, text) {
  const f = FONTS[k];
  const chars = [...new Set(text + ' ')].join('');
  const url = `https://fonts.googleapis.com/css2?family=${f.family}:wght@${f.weight}&text=${encodeURIComponent(chars)}`;
  const css = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
  const m = css.match(/src:\s*url\(([^)]+)\)/);
  if (!m) throw new Error('font ' + k + ' ' + css.slice(0, 120));
  const b = Buffer.from(await (await fetch(m[1], { headers: { 'User-Agent': UA } })).arrayBuffer());
  return `@font-face{font-family:'${f.family}${k}';src:url(data:font/woff2;base64,${b.toString('base64')}) format('woff2');}`;
}

// ---------- svg builder ----------
class Svg {
  constructor(w, h) { this.w = w; this.h = h; this.parts = []; this.used = {}; this.css = ''; this.defs = ''; }
  add(s) { this.parts.push(s); return this; }
  text(k, s, x, y, size, opt = {}) {
    this.used[k] = (this.used[k] || '') + s;
    const a = [`x="${x}" y="${y}"`, `font-family="${FONTS[k].family}${k}"`, `font-size="${size}"`];
    if (opt.fill) a.push(`fill="${opt.fill}"`);
    if (opt.ls) a.push(`letter-spacing="${opt.ls}"`);
    if (opt.anchor) a.push(`text-anchor="${opt.anchor}"`);
    if (opt.cls) a.push(`class="${opt.cls}"`);
    if (opt.extra) a.push(opt.extra);
    return this.add(`<text ${a.join(' ')}>${esc(s)}</text>`);
  }
  // wrapped paragraph, returns y after last line
  para(k, s, x, y, size, maxW, lh, fill) {
    const words = s.split(' '); let line = ''; const lines = [];
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (measure(k, t, size) > maxW && line) { lines.push(line); line = w; } else line = t;
    }
    if (line) lines.push(line);
    lines.forEach((l, i) => this.text(k, l, x, y + i * lh, size, { fill }));
    return y + (lines.length - 1) * lh;
  }
  async render() {
    let faces = '';
    for (const [k, t] of Object.entries(this.used)) faces += await fontFace(k, t);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.w}" height="${this.h}" viewBox="0 0 ${this.w} ${this.h}">
<defs><style>${faces}${this.css}@media (prefers-reduced-motion:reduce){*{animation:none!important}}</style>${COMMON_DEFS}${this.defs}</defs>
${this.parts.join('\n')}
</svg>`;
  }
}

const BRAND = ['#60a5fa', '#a855f7', '#ec4899', '#f59e0b'];
const COMMON_DEFS = `
<linearGradient id="brand" x1="0" y1="0" x2="1" y2="0.1"><stop offset="0" stop-color="${BRAND[0]}"/><stop offset=".4" stop-color="${BRAND[1]}"/><stop offset=".75" stop-color="${BRAND[2]}"/><stop offset="1" stop-color="${BRAND[3]}"/></linearGradient>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .05 0"/></filter>
<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#fff" stroke-opacity=".03"/></pattern>`;
const radial = (id, color, op) => `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${op}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
const card = (x, y, w, h, r = 24) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="#0b0b10"/><rect x="${x + .5}" y="${y + .5}" width="${w - 1}" height="${h - 1}" rx="${r - .5}" fill="none" stroke="#fff" stroke-opacity=".08"/>`;
const WHITE = '#fbf8ff', GRAY = '#9ca3af', DIM = '#6b7280';
const DRIFT = `.d1{animation:drift 14s ease-in-out infinite alternate}.d2{animation:drift 18s ease-in-out infinite alternate-reverse}@keyframes drift{from{transform:translate(0,0)}to{transform:translate(50px,-20px)}}`;

// ---------- header ----------
function header() {
  const s = new Svg(1200, 420);
  s.css = DRIFT;
  s.defs = radial('g1', '#7c3aed', .55) + radial('g2', '#ec4899', .35) + radial('g3', '#60a5fa', .3) + `<clipPath id="c"><rect width="1200" height="420" rx="28"/></clipPath>`;
  s.add(`<g clip-path="url(#c)"><rect width="1200" height="420" fill="#050507"/><rect width="1200" height="420" fill="url(#grid)"/>
<ellipse class="d1" cx="930" cy="120" rx="420" ry="260" fill="url(#g1)"/><ellipse class="d2" cx="1120" cy="380" rx="320" ry="200" fill="url(#g2)"/><ellipse class="d2" cx="700" cy="-40" rx="300" ry="160" fill="url(#g3)"/>
<rect width="1200" height="420" filter="url(#grain)"/>`);
  s.text('S', 'SOFTWARE ENGINEER  ·  FOUNDER OF STCH STUDIO', 72, 96, 15, { fill: GRAY, ls: 3 });
  s.text('U', 'Radek Stach', 68, 196, 76, { fill: WHITE, ls: -2 });
  s.text('U', 'Websites, apps & AI automation.', 72, 268, 30, { fill: WHITE, ls: -.5 });
  s.text('U', 'Built fast. Built properly.', 72, 314, 30, { fill: 'url(#brand)', ls: -.5 });
  s.add(`<rect x="72" y="352" width="56" height="4" rx="2" fill="url(#brand)"/>`);
  s.add(`<g transform="translate(740 132) rotate(-4)">`);
  s.text('C', 'trained engineer, AI-powered workflow', 0, 0, 30, { fill: '#c084fc' });
  s.add(`<path d="M150 14 C 140 48, 90 60, 20 52" fill="none" stroke="#c084fc" stroke-width="2.5" stroke-linecap="round"/><path d="M32 42 L18 52 L33 60" fill="none" stroke="#c084fc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></g>
<rect x=".5" y=".5" width="1199" height="419" rx="27.5" fill="none" stroke="#fff" stroke-opacity=".08"/></g>`);
  return s;
}

// ---------- about ----------
function about() {
  const s = new Svg(1200, 360);
  s.defs = radial('ga', '#a855f7', .22);
  s.add(card(0, 0, 1200, 360, 28));
  s.add(`<ellipse cx="1050" cy="60" rx="380" ry="200" fill="url(#ga)"/>`);
  s.text('S', 'HOW I WORK', 64, 74, 15, { fill: GRAY, ls: 3 });
  s.text('U', 'AI does the typing.', 62, 140, 44, { fill: WHITE, ls: -1 });
  s.text('U', 'I do the thinking.', 62, 196, 44, { fill: 'url(#brand)', ls: -1 });
  s.para('I', 'I learned software the classic way: algorithms, OOP, databases, C#. That foundation is what lets me steer AI instead of following it. Architecture, code review and production quality stay human, and the result is a small studio that ships like a whole team.', 64, 252, 20, 800, 30, GRAY);
  s.add(`<g transform="translate(905 196) rotate(-5)">`);
  s.text('C', 'fundamentals first,', 0, 0, 30, { fill: '#c084fc' });
  s.text('C', 'always', 40, 32, 30, { fill: '#c084fc' });
  s.add(`</g>`);
  return s;
}

// ---------- services ----------
const ICONS = {
  web: c => `<rect x="0" y="0" width="52" height="40" rx="8" fill="none" stroke="${c}" stroke-width="2.5"/><path d="M0 12H52" stroke="${c}" stroke-width="2.5"/><circle cx="8" cy="6" r="2" fill="${c}"/><circle cx="15" cy="6" r="2" fill="${c}"/><rect x="9" y="20" width="20" height="4" rx="2" fill="${c}" opacity=".7"/><rect x="9" y="28" width="32" height="4" rx="2" fill="${c}" opacity=".4"/>`,
  app: c => `<rect x="0" y="0" width="22" height="22" rx="6" fill="none" stroke="${c}" stroke-width="2.5"/><rect x="30" y="0" width="22" height="22" rx="6" fill="${c}" opacity=".5"/><rect x="0" y="30" width="22" height="22" rx="6" fill="${c}" opacity=".5"/><rect x="30" y="30" width="22" height="22" rx="6" fill="none" stroke="${c}" stroke-width="2.5"/>`,
  ai: c => `<path d="M26 0 C28 16 36 24 52 26 C36 28 28 36 26 52 C24 36 16 28 0 26 C16 24 24 16 26 0Z" fill="none" stroke="${c}" stroke-width="2.5" stroke-linejoin="round"/><path d="M46 2 C46.6 6 48 7.4 52 8 C48 8.6 46.6 10 46 14 C45.4 10 44 8.6 40 8 C44 7.4 45.4 6 46 2Z" fill="${c}"/>`,
};
function services() {
  const s = new Svg(1200, 380);
  const items = [
    ['01', 'web', BRAND[0], ['Websites you', 'run yourself'], 'Every site ships with our own admin, mySTCH. One password, no monthly fees, edits in a few clicks without calling a developer.'],
    ['02', 'app', BRAND[1], ['Custom apps', ''], 'Systems built around how a company actually works, replacing the usual mix of Excel, WhatsApp and paper folders.'],
    ['03', 'ai', BRAND[2], ['AI on the', 'routine work'], 'Assistants that read invoices, sort email, pull what matters out of an enquiry and draft the reply for you to approve.'],
  ];
  const W = 376, G = 36;
  s.css = `.ic{animation:float 5s ease-in-out infinite}@keyframes float{50%{transform:translateY(-4px)}}`;
  items.forEach(([n, icon, c, title, desc], i) => {
    const x = i * (W + G);
    s.defs += radial('gs' + i, c, .18);
    s.add(card(x, 0, W, 380));
    s.add(`<ellipse cx="${x + W - 40}" cy="30" rx="200" ry="140" fill="url(#gs${i})"/>`);
    s.add(`<rect x="${x + 36}" y="0" width="64" height="3" rx="1.5" fill="${c}"/>`);
    s.add(`<g transform="translate(${x + 36} 46)"><g class="ic" style="animation-delay:${i * .6}s">${ICONS[icon](c)}</g></g>`);
    s.text('S', n, x + W - 36, 70, 16, { fill: DIM, anchor: 'end', ls: 2 });
    s.text('U', title[0], x + 36, 150, 27, { fill: WHITE, ls: -.5 });
    if (title[1]) s.text('U', title[1], x + 36, 186, 27, { fill: WHITE, ls: -.5 });
    s.para('I', desc, x + 36, 240, 19, W - 72, 29, GRAY);
  });
  return s;
}

// ---------- AI flow ----------
function flow() {
  const s = new Svg(1200, 400);
  s.defs = radial('gf', '#a855f7', .35);
  s.css = `.dash{stroke-dasharray:6 8;animation:dash 1.2s linear infinite}@keyframes dash{to{stroke-dashoffset:-14}}
.pulse{animation:pulse 2.4s ease-in-out infinite;transform-origin:600px 215px}@keyframes pulse{50%{transform:scale(1.06);opacity:.75}}
.ok{animation:ok 3s ease-in-out infinite}@keyframes ok{0%,40%{opacity:.25}60%,100%{opacity:1}}`;
  s.add(card(0, 0, 1200, 400, 28));
  s.text('S', 'AI AUTOMATION, THE WAY I BUILD IT', 64, 74, 15, { fill: GRAY, ls: 3 });
  // inputs
  const ins = [['Enquiry', '40 welded frames by Nov 30'], ['Invoice', '€1,944 · due Oct 30'], ['Website chat', 'do you also do installation?']];
  ins.forEach(([t, sub], i) => {
    const y = 120 + i * 82;
    s.add(`<rect x="64" y="${y}" width="330" height="68" rx="14" fill="#111118" stroke="#fff" stroke-opacity=".08"/>`);
    s.add(`<circle cx="92" cy="${y + 34}" r="6" fill="${BRAND[i]}"/>`);
    s.text('S', t, 112, y + 30, 20, { fill: WHITE });
    s.text('I', sub, 112, y + 53, 16, { fill: GRAY });
    s.add(`<path id="p${i}" d="M394 ${y + 34} C 450 ${y + 32}, 440 215, 505 215" fill="none" stroke="${BRAND[i]}" stroke-opacity=".6" stroke-width="2" class="dash"/>`);
    s.add(`<circle r="4" fill="${BRAND[i]}"><animateMotion dur="2.4s" begin="${i * .8}s" repeatCount="indefinite"><mpath href="#p${i}"/></animateMotion></circle>`);
  });
  // AI node
  s.add(`<ellipse cx="600" cy="215" rx="200" ry="140" fill="url(#gf)"/>`);
  s.add(`<g class="pulse"><rect x="505" y="145" width="190" height="140" rx="22" fill="#15101f" stroke="url(#brand)" stroke-width="2"/></g>`);
  s.add(`<g transform="translate(578 165) scale(.85)">${ICONS.ai('#c084fc')}</g>`);
  s.text('U', 'AI', 600, 245, 22, { fill: WHITE, anchor: 'middle' });
  s.text('I', 'reads · extracts · drafts', 600, 272, 16, { fill: GRAY, anchor: 'middle' });
  // to human
  s.add(`<path id="po" d="M695 215 L 835 215" fill="none" stroke="#a855f7" stroke-opacity=".7" stroke-width="2" class="dash"/>`);
  s.add(`<circle r="4" fill="#c084fc"><animateMotion dur="1.6s" repeatCount="indefinite"><mpath href="#po"/></animateMotion></circle>`);
  // human node
  s.add(`<rect x="835" y="130" width="310" height="170" rx="18" fill="#111118" stroke="#fff" stroke-opacity=".1"/>`);
  s.text('S', 'Ready for you', 863, 174, 20, { fill: WHITE });
  const rows = ['Order created in the system', 'Costing task for tomorrow', 'Reply drafted'];
  rows.forEach((r, i) => {
    const y = 212 + i * 28;
    s.add(`<g class="ok" style="animation-delay:${i * .4}s"><circle cx="871" cy="${y - 5}" r="8" fill="#34d399" opacity=".18"/><path d="M867 ${y - 5} l3 3 l6 -6" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></g>`);
    s.text('I', r, 888, y, 17, { fill: GRAY });
  });
  s.add(`<rect x="863" y="${280}" width="0" height="0"/>`);
  // caption
  s.add(`<g transform="translate(820 360) rotate(-3)">`);
  s.text('C', 'AI prepares, a human approves.', 0, 0, 30, { fill: '#c084fc' });
  s.add(`</g>`);
  s.text('I', 'What used to take 15 minutes by hand is ready before your coffee.', 64, 372, 17, { fill: DIM });
  return s;
}

// ---------- project cards ----------
function projectCard(s, { name, meta, desc, tags, color, color2 }, ox, oy, id) {
  const W = 582, H = 400;
  s.defs += radial('gp' + id, color, .35) + radial('gq' + id, color2, .22) + `<clipPath id="cp${id}"><rect width="${W}" height="${H}" rx="24"/></clipPath>`;
  s.add(`<g transform="translate(${ox} ${oy})">`);
  s.add(`<g clip-path="url(#cp${id})">${card(0, 0, W, H)}<ellipse class="d1" cx="${W - 40}" cy="20" rx="260" ry="170" fill="url(#gp${id})"/><ellipse class="d2" cx="${W + 20}" cy="${H}" rx="200" ry="120" fill="url(#gq${id})"/><rect width="${W}" height="${H}" filter="url(#grain)"/></g>`);
  s.add(`<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="23.5" fill="none" stroke="#fff" stroke-opacity=".08"/>`);
  s.add(`<rect x="40" y="0" width="64" height="3" rx="1.5" fill="${color}"/>`);
  s.text('S', meta, 40, 62, 14, { fill: GRAY, ls: 2.5 });
  s.text('U', name, 38, 124, 40, { fill: WHITE, ls: -1 });
  s.para('I', desc, 40, 178, 19, W - 80, 29, '#c4c7cf');
  let x = 40; const y = H - 76;
  tags.forEach(t => {
    const w = measure('S', t, 15) + 30;
    s.add(`<rect x="${x}" y="${y}" width="${w}" height="36" rx="18" fill="${color}" fill-opacity=".1" stroke="${color}" stroke-opacity=".45"/>`);
    s.text('S', t, x + 15, y + 23, 15, { fill: WHITE });
    x += w + 10;
  });
  s.add(`</g>`);
}
function projectsRow(a, b, title) {
  const top = title ? 110 : 0;
  const s = new Svg(1200, top + 400);
  s.css = DRIFT;
  if (title) {
    s.text('S', 'SELECTED WORK', 4, 40, 15, { fill: GRAY, ls: 3 });
    s.text('U', 'Things I’ve shipped', 2, 88, 36, { fill: WHITE, ls: -1 });
    s.add(`<g transform="translate(780 80) rotate(-3)">`);
    s.text('C', 'client code stays private, results don’t', 0, 0, 28, { fill: '#c084fc' });
    s.add(`</g>`);
  }
  projectCard(s, a, 0, top, 'a');
  projectCard(s, b, 618, top, 'b');
  return s;
}
const PROJECTS = {
  werkum: { name: 'WERKUM', meta: 'OWN PRODUCT · WEB APP', color: '#f59e0b', color2: '#ec4899', desc: 'Replaces Excel, WhatsApp and the folder in the van for installation crews across Germany and Austria. Snap a document and AI fills in the data. Comes with WERKUM Find, a job board for freelancers.', tags: ['AI document scan', '3 languages', 'Job board'] },
  sidechips: { name: 'Sidechips', meta: 'WEBSITE + ADMIN · 2 MONTHS', color: '#ec4899', color2: '#f59e0b', desc: 'Website for a snack brand launched by a YouTuber with 1.5M+ subscribers. A live store map the brand runs itself: shops apply through a form and go live after one click.', tags: ['Live store map', 'Own admin', 'Instagram feed'] },
  runclub: { name: 'Run Club Znaim', meta: 'WEBSITE + ADMIN · 2 WEEKS', color: '#60a5fa', color2: '#a855f7', desc: 'A running club that used to live in Instagram stories now runs everything itself: schedule, sign-ups with calendar invites, newsletter and one-click Instagram posters.', tags: ['Sign-ups', 'Newsletter', 'Poster generator'] },
  mares: { name: 'Štěpán Mareš', meta: 'WEBSITE + ONGOING · 1 WEEK', color: '#34d399', color2: '#60a5fa', desc: 'Portfolio for a cartoonist with 1,422 weekly comic strips behind him. Launch was just the start: every new cartoon now gets an animation that draws itself stroke by stroke.', tags: ['Comic archive', 'Stroke animations', 'Long-term'] },
};

// ---------- toolbox ----------
function toolbox() {
  const s = new Svg(1200, 210);
  s.add(card(0, 0, 1200, 210, 28));
  s.text('S', 'TOOLBOX', 64, 64, 15, { fill: GRAY, ls: 3 });
  const tools = [['TypeScript', BRAND[0]], ['React', BRAND[0]], ['Astro', BRAND[1]], ['Node.js', BRAND[1]], ['Tailwind', BRAND[0]], ['C# / .NET', BRAND[1]], ['Claude Code', BRAND[3]], ['AI agents', BRAND[2]], ['LLM APIs', BRAND[2]], ['Vercel', '#9ca3af']];
  let x = 64, y = 96;
  tools.forEach(([t, c]) => {
    const w = measure('S', t, 17) + 52;
    if (x + w > 1136) { x = 64; y += 56; }
    s.add(`<rect x="${x}" y="${y}" width="${w}" height="42" rx="21" fill="#111118" stroke="#fff" stroke-opacity=".1"/><circle cx="${x + 22}" cy="${y + 21}" r="5" fill="${c}"/>`);
    s.text('S', t, x + 36, y + 27, 17, { fill: WHITE });
    x += w + 12;
  });
  return s;
}

// ---------- contact ----------
function contact() {
  const s = new Svg(1200, 300);
  s.defs = radial('gc1', '#7c3aed', .5) + radial('gc2', '#ec4899', .3) + `<clipPath id="cc"><rect width="1200" height="300" rx="28"/></clipPath>`;
  s.css = DRIFT + `.arrow{animation:nudge 1.6s ease-in-out infinite}@keyframes nudge{50%{transform:translateX(6px)}}`;
  s.add(`<g clip-path="url(#cc)"><rect width="1200" height="300" fill="#050507"/><rect width="1200" height="300" fill="url(#grid)"/><ellipse class="d1" cx="300" cy="300" rx="420" ry="220" fill="url(#gc1)"/><ellipse class="d2" cx="1000" cy="0" rx="360" ry="200" fill="url(#gc2)"/><rect width="1200" height="300" filter="url(#grain)"/></g><rect x=".5" y=".5" width="1199" height="299" rx="27.5" fill="none" stroke="#fff" stroke-opacity=".08"/>`);
  s.text('S', 'GOT SOMETHING THAT SHOULD RUN ITSELF?', 600, 88, 15, { fill: GRAY, ls: 3, anchor: 'middle' });
  s.text('U', 'Let’s build it.', 600, 160, 56, { fill: 'url(#brand)', ls: -1.5, anchor: 'middle' });
  const label = 'stchstudio.cz';
  const w = measure('S', label, 18) + 84;
  s.add(`<rect x="${600 - w / 2}" y="196" width="${w}" height="52" rx="26" fill="${WHITE}"/>`);
  s.text('S', label, 600 - w / 2 + 28, 228, 18, { fill: '#050507' });
  s.add(`<g class="arrow"><path d="M${600 + w / 2 - 44} 222 h16 m-6 -6 l6 6 l-6 6" fill="none" stroke="#050507" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></g>`);
  s.add(`<g transform="translate(860 238) rotate(-5)">`);
  s.text('C', 'reply within 24 hours', 0, 0, 28, { fill: '#c084fc' });
  s.add(`</g>`);
  return s;
}

// ---------- footer ----------
function footer() {
  const s = new Svg(1200, 110);
  s.add(`<rect x="420" y="20" width="360" height="3" rx="1.5" fill="url(#brand)" opacity=".7"/>`);
  s.add(`<g transform="rotate(-1.5 600 80)">`);
  s.text('C', 'thanks for scrolling all the way down here', 600, 80, 30, { fill: '#a855f7', anchor: 'middle' });
  s.add(`</g>`);
  return s;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const all = { header: header(), about: about(), services: services(), flow: flow(), toolbox: toolbox(), contact: contact(), footer: footer() };
  all['projects-1'] = projectsRow(PROJECTS.werkum, PROJECTS.sidechips, true);
  all['projects-2'] = projectsRow(PROJECTS.runclub, PROJECTS.mares, false);
  for (const [name, s] of Object.entries(all)) {
    const svg = await s.render();
    fs.writeFileSync(path.join(OUT, name + '.svg'), svg);
    console.log(name, Math.round(svg.length / 1024) + 'KB');
  }
})().catch(e => { console.error(e); process.exit(1); });
