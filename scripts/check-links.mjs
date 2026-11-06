/**
 * 建置後連結檢查（npm run build 的最後一步）
 * ------------------------------------------------------------------
 * 掃描 dist/ 內所有 HTML 的 href / src，確認：
 *   1. 站內連結都帶有 base（例如 /nexus/），否則部署到 GitHub Pages 會 404
 *   2. 連結指向的檔案真的存在
 *   3. #錨點 在目標頁面中真的存在
 * 外部連結（http/https/mailto）不檢查。
 *
 * 用法：node scripts/check-links.mjs   （需先 astro build）
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const DIST = 'dist';
const BASE = (process.env.BASE_PATH ?? '/nexus').replace(/\/+$/, '');

if (!existsSync(DIST)) {
  console.error('[check-links] 找不到 dist/，請先執行 astro build');
  process.exit(1);
}

/** 遞迴列出 dist/ 內所有 .html */
function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return path.endsWith('.html') ? [path] : [];
  });
}

/** dist 內檔案 → 它在網站上的路徑（例如 dist/articles/array/index.html → /nexus/articles/array/） */
function pagePath(file) {
  const rel = relative(DIST, file).split(sep).join('/');
  return `${BASE}/${rel.replace(/index\.html$/, '')}`;
}

/** 網站路徑 → dist 內的檔案；找不到回傳 null */
function resolveFile(pathname) {
  const inner = decodeURIComponent(pathname.slice(BASE.length)) || '/';
  const candidates = inner.endsWith('/')
    ? [join(DIST, inner, 'index.html')]
    : [join(DIST, inner), join(DIST, inner, 'index.html')];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
}

const idCache = new Map();
function idsIn(file) {
  if (!idCache.has(file)) {
    const html = readFileSync(file, 'utf8');
    idCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idCache.get(file);
}

const errors = [];
let checked = 0;

for (const file of htmlFiles(DIST)) {
  const html = readFileSync(file, 'utf8');
  const from = pagePath(file);
  const attrs = [...html.matchAll(/\s(?:href|src)="([^"]*)"/g)].map((m) => m[1]);

  for (const raw of attrs) {
    if (!raw || /^(https?:|mailto:|tel:|data:|javascript:)/i.test(raw)) continue;
    checked++;
    const target = new URL(raw.replaceAll('&amp;', '&'), `http://site${from}`);
    const where = `${relative(DIST, file)} → ${raw}`;

    if (!target.pathname.startsWith(`${BASE}/`)) {
      errors.push(`${where}\n      站內連結缺少 base "${BASE}"，請用 src/lib/url.ts 的 url() 產生`);
      continue;
    }
    const targetFile = resolveFile(target.pathname);
    if (!targetFile) {
      errors.push(`${where}\n      目標不存在`);
      continue;
    }
    const hash = decodeURIComponent(target.hash.slice(1));
    if (hash && targetFile.endsWith('.html') && !idsIn(targetFile).has(hash)) {
      errors.push(`${where}\n      錨點 #${hash} 不存在於目標頁面`);
    }
  }
}

if (errors.length > 0) {
  console.error(`[check-links] 發現 ${errors.length} 個問題：\n`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`[check-links] OK：檢查了 ${checked} 個站內連結，全部有效（base = ${BASE}/）`);
