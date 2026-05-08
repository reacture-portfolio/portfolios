/**
 * Reacture Portfolio Deploy Endpoint
 * POST /api/deploy
 *
 * Body: { uid, username, appCode, mainCode }
 * Response: { url } — the live GitHub Pages URL
 *
 * Uses REACTURE_GITHUB_TOKEN env var (set in Vercel dashboard).
 * Pushes to REACTURE_GITHUB_REPO env var, e.g. "reacture-app/portfolios".
 * Each user gets their own folder: users/{uid}/index.html
 */

const https = require('https');

const GITHUB_TOKEN = process.env.REACTURE_GITHUB_TOKEN;
const GITHUB_REPO  = process.env.REACTURE_GITHUB_REPO || 'reacture-app/portfolios';
const [OWNER, REPO] = GITHUB_REPO.split('/');

// ── GitHub API helper ──────────────────────────────────────────────────────

function githubRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Reacture-Deploy/1.0',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : {} });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ── Push a single file to GitHub ──────────────────────────────────────────

async function pushFile(filePath, content, message) {
  const apiPath = `/repos/${OWNER}/${REPO}/contents/${filePath}`;

  // Get existing SHA (needed to update an existing file)
  let sha;
  const getRes = await githubRequest('GET', apiPath, null);
  if (getRes.status === 200 && getRes.body.sha) {
    sha = getRes.body.sha;
  }

  const putRes = await githubRequest('PUT', apiPath, {
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
    ...(sha ? { sha } : {}),
  });

  if (putRes.status !== 200 && putRes.status !== 201) {
    throw new Error(
      `GitHub push failed (${putRes.status}): ${
        typeof putRes.body === 'object'
          ? putRes.body.message
          : putRes.body
      }`
    );
  }
}

// ── Enable GitHub Pages (idempotent) ──────────────────────────────────────

async function ensurePages() {
  await githubRequest('POST', `/repos/${OWNER}/${REPO}/pages`, {
    source: { branch: 'main', path: '/' },
  });
  // 409 = already enabled — that's fine, ignore it
}

// ── Build the portfolio HTML ───────────────────────────────────────────────

function buildHtml(username, appCode, mainCode) {
  // Strip export default / import lines so the code runs inline
  const cleanApp = appCode
    .replace(/^\s*export\s+default\s+/gm, '')
    .replace(/^\s*export\s+\{[^}]*\}\s*;?\s*$/gm, '')
    .trim();

  const cleanMain = mainCode
    .replace(/^\s*import\s+.*?;\s*$/gm, '')
    .replace(/^\s*export\s+.*?;\s*$/gm, '')
    .trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${username}'s React Portfolio · Reacture</title>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;background:#0D1117;color:#f0f6fc;min-height:100vh}
    #splash{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;
      justify-content:center;background:#0D1117;gap:16px;z-index:9999;transition:opacity .4s}
    #splash.hidden{opacity:0;pointer-events:none}
    #splash-title{font-family:monospace;font-size:22px;color:#67e8f9;letter-spacing:.08em}
    #splash-sub{font-family:monospace;font-size:12px;color:#8b949e}
    .spinner{width:36px;height:36px;border:3px solid rgba(103,232,249,.2);
      border-top-color:#67e8f9;border-radius:50%;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    #root{min-height:100vh}
    #badge{position:fixed;bottom:16px;right:16px;background:rgba(9,14,20,.9);
      border:1px solid #1B2D3C;border-radius:10px;padding:8px 12px;
      font-family:monospace;font-size:11px;color:#3E5A6E;
      display:flex;align-items:center;gap:6px;z-index:100;text-decoration:none}
    #badge:hover{color:#00D4FF;border-color:rgba(0,212,255,.3)}
    #badge span{color:#00D4FF;font-weight:700}
    #error-overlay{display:none;position:fixed;inset:0;background:#0D1117;
      align-items:center;justify-content:center;flex-direction:column;
      gap:12px;padding:32px;text-align:center;z-index:99999}
    #error-overlay.visible{display:flex}
    #error-title{font-family:monospace;font-size:18px;color:#f85149}
    #error-message{font-family:monospace;font-size:12px;color:#8b949e;max-width:480px;
      white-space:pre-wrap;word-break:break-word;background:#161b22;padding:16px;
      border-radius:8px;border:1px solid #30363d;text-align:left}
  </style>
</head>
<body>
  <div id="splash">
    <div class="spinner"></div>
    <div id="splash-title">Reacture</div>
    <div id="splash-sub">Loading ${username}'s portfolio...</div>
  </div>
  <div id="error-overlay">
    <div id="error-title">&#x26A0;&#xFE0F; Runtime Error</div>
    <pre id="error-message"></pre>
  </div>
  <div id="root"></div>
  <a id="badge" href="https://reacture.app" target="_blank" rel="noopener">
    Built with <span>Reacture</span>
  </a>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script type="text/babel">
${cleanApp}
${cleanMain}
  </script>
  <script>
    (function(){
      function hideSplash(){
        var root=document.getElementById('root');
        var splash=document.getElementById('splash');
        if(root&&root.children.length>0){
          splash.classList.add('hidden');
          setTimeout(function(){if(splash.parentNode)splash.parentNode.removeChild(splash);},500);
        } else { setTimeout(hideSplash,100); }
      }
      window.addEventListener('error',function(e){
        document.getElementById('splash').classList.add('hidden');
        var ov=document.getElementById('error-overlay');
        ov.classList.add('visible');
        document.getElementById('error-message').textContent=
          (e.error&&e.error.message)||String(e.message||e);
      });
      window.addEventListener('load',function(){setTimeout(hideSplash,300);});
    })();
  </script>
</body>
</html>`;
}

// ── Main handler ───────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!GITHUB_TOKEN) {
    return res.status(500).json({ error: 'Server not configured (missing REACTURE_GITHUB_TOKEN)' });
  }

  const { uid, username, appCode, mainCode } = req.body || {};

  if (!uid || !appCode) {
    return res.status(400).json({ error: 'Missing required fields: uid, appCode' });
  }

  const safeUsername = (username || 'Reacture User').replace(/[<>"'&]/g, '');
  const userFolder   = `users/${uid}`;
  const commitMsg    = `Deploy portfolio for ${safeUsername} 🚀`;

  try {
    const html = buildHtml(safeUsername, appCode, mainCode || '');

    // Push index.html
    await pushFile(`${userFolder}/index.html`, html, commitMsg);

    // Push source files for transparency
    await pushFile(`${userFolder}/App.jsx`, appCode, commitMsg);
    if (mainCode) {
      await pushFile(`${userFolder}/main.jsx`, mainCode, commitMsg);
    }

    // Ensure GitHub Pages is enabled (safe to call repeatedly)
    await ensurePages();

    const liveUrl = `https://${OWNER}.github.io/${REPO}/${userFolder}/`;

    return res.status(200).json({ url: liveUrl });
  } catch (err) {
    console.error('[deploy]', err);
    return res.status(500).json({ error: err.message || 'Deploy failed' });
  }
};
