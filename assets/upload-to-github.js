const fs = require('fs');
const path = require('path');
const https = require('https');
const TOKEN = 'YOUR_GITHUB_TOKEN_HERE';
const OWNER = 'andrespazponce';
const REPO  = 'marfa-website';
const FILES = ['img_aerial.jpg','img_facilities.jpg','img_hero_poster.jpg','img_lagoon_jungle.jpg','img_lagoon_palms.jpg','img_lagoon_wide.jpg','img_land.jpg','img_lifestyle.jpg','img_paths.jpg','img_peninsula.jpg','hero.mp4'];
const SCRIPT_DIR = __dirname;
function apiRequest(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname: 'api.github.com', path: urlPath, method, headers: { 'Authorization': `token ${TOKEN}`, 'Content-Type': 'application/json', 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'MARFA-uploader/1.0' } }, (res) => {
      let data = ''; res.on('data', c => data += c); res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(data) }); } catch(e) { resolve({ status: res.statusCode, body: data }); } });
    }); req.on('error', reject); if (body) req.write(JSON.stringify(body)); req.end();
  });
}
async function getSha(p) { const r = await apiRequest('GET', `/repos/${OWNER}/${REPO}/contents/${p}`); return r.status === 200 ? r.body.sha : null; }
async function uploadFile(localPath, repoPath) {
  console.log(`  Uploading ${repoPath}...`);
  const content = fs.readFileSync(localPath).toString('base64');
  const sha = await getSha(repoPath);
  const body = { message: `Add ${repoPath}`, content }; if (sha) body.sha = sha;
  const res = await apiRequest('PUT', `/repos/${OWNER}/${REPO}/contents/${repoPath}`, body);
  if (res.status === 200 || res.status === 201) { console.log(`  ✓ ${repoPath}`); return true; }
  else { console.error(`  ✗ ${repoPath}: ${res.body.message || res.status}`); return false; }
}
async function main() {
  console.log('\nMARFA Asset Uploader'); let ok = 0, fail = 0;
  for (const fname of FILES) {
    const localPath = path.join(SCRIPT_DIR, fname);
    if (!fs.existsSync(localPath)) { console.log(`  ⚠ Skipping ${fname} (not found)`); continue; }
    const success = await uploadFile(localPath, `public/assets/${fname}`);
    if (success) ok++; else fail++;
    await new Promise(r => setTimeout(r, 300));
  }
  console.log(`\nDone — ${ok} uploaded, ${fail} failed.`);
}
main().catch(console.error);
