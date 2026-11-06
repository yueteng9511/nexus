/**
 * 建立新文章骨架
 * ------------------------------------------------------------------
 * 用法：npm run new:article -- <slug> <category-id> "<Title>"
 * 例如：npm run new:article -- hash-table data-structures "Hash Table"
 *
 * 會產生 src/content/articles/<slug>.md，frontmatter 與段落都符合規範，
 * 只需要把內容填進去。已存在的檔案不會被覆蓋。
 * 骨架必須與 src/content.config.ts 的 schema、AGENTS.md 的 Content Guidelines 一致。
 */
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [slug, category, title] = process.argv.slice(2);
const usage = '用法：npm run new:article -- <slug> <category-id> "<Title>"';

if (!slug || !category || !title) {
  console.error(usage);
  process.exit(1);
}
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error(`slug "${slug}" 必須是小寫 kebab-case，例如 binary-search`);
  process.exit(1);
}

const categories = readdirSync('src/content/categories')
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => f.replace(/\.yaml$/, ''));
if (!categories.includes(category)) {
  console.error(`分類 "${category}" 不存在。可用分類：${categories.join(', ')}`);
  process.exit(1);
}

const file = join('src/content/articles', `${slug}.md`);
if (existsSync(file)) {
  console.error(`${file} 已存在，不會覆蓋`);
  process.exit(1);
}

// 發布時間：本機時間 + 時區，例如 2026-11-05T22:50:00+08:00（同一天多篇時用來排序）
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const offset = -now.getTimezoneOffset();
const sign = offset >= 0 ? '+' : '-';
const publishedAt =
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
  `T${pad(now.getHours())}:${pad(now.getMinutes())}:00` +
  `${sign}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`;
const template = `---
title: ${title}
description: TODO 一句話摘要（10–120 字）
category: ${category}
keywords: [TODO]
difficulty: beginner
related: []
featured: false
publishedAt: ${publishedAt}
---

## Overview

TODO

## Intuition

TODO

## How It Works

TODO

## Implementation

TODO（不適用時刪除整個段落）

## Complexity

TODO（不適用時刪除整個段落）

## Common Mistakes

TODO
`;

writeFileSync(file, template);
console.log(`已建立 ${file}`);
console.log('下一步：填寫內容 → npm run check:cpp -- ' + slug + ' → npm run build');
