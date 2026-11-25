// usage: node preview.js <README.md> <out.html>
const fs = require('fs');
const [, , src, out] = process.argv;
let md = fs.readFileSync(src, 'utf8');
// snake doesn't exist yet -> demo image for the preview only
md = md.replace(/https:\/\/raw\.githubusercontent\.com\/Radekkstach\/Radekkstach\/output\/github-snake(-dark)?\.svg/g,
  'https://raw.githubusercontent.com/Platane/Platane/output/github-contribution-grid-snake-dark.svg');

(async () => {
  const r = await fetch('https://api.github.com/markdown', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/vnd.github+json', 'User-Agent': 'readme-preview' },
    body: JSON.stringify({ text: md, mode: 'gfm' }),
  });
  if (!r.ok) { console.error(r.status, await r.text()); process.exit(1); }
  const body = await r.text();
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Profile Preview</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.1/github-markdown-dark.min.css">
<style>
 body{margin:0;background:#0d1117;color:#e6edf3;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif}
 .wrap{max-width:1280px;margin:0 auto;padding:32px 24px;display:flex;gap:24px}
 aside{width:296px;flex-shrink:0}
 aside img{width:100%;border-radius:50%;border:1px solid #30363d}
 aside h1{margin:16px 0 0;font-size:24px}
 aside .login{color:#8b949e;font-size:20px;font-weight:300}
 aside .meta{color:#8b949e;font-size:14px;margin-top:16px;line-height:1.9}
 aside a{color:#e6edf3}
 main{flex:1;min-width:0}
 .box{border:1px solid #30363d;border-radius:6px;padding:24px}
 .file{font-size:12px;color:#8b949e;margin-bottom:16px}
 .markdown-body{background:transparent}
 @media(max-width:800px){.wrap{flex-direction:column;padding:16px}aside{width:100%}aside img{width:120px}}
</style></head><body><div class="wrap">
<aside><img src="https://avatars.githubusercontent.com/u/97514874?v=4">
<h1>Radek Stach</h1><div class="login">Radekkstach</div>
<div class="meta">📍 Třebíč<br>🔗 <a href="https://stchstudio.cz/">stchstudio.cz</a><br>👥 6 followers · 6 following</div></aside>
<main><div class="box"><div class="file">Radekkstach / README.md</div>
<article class="markdown-body">${body}</article></div></main></div></body></html>`;
  fs.writeFileSync(out, html);
  console.log('ok', out);
})();
