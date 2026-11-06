/**
 * NEXUS 內容 Schema
 * ------------------------------------------------------------------
 * 這個檔案是「內容規範」的執行者：AGENTS.md 的 Content Guidelines 規定的
 * frontmatter 欄位，全部在這裡用 Zod 定義。欄位缺少或型別錯誤時，
 * `npm run build` 會直接失敗並指出是哪個檔案、哪個欄位。
 *
 * 修改這裡＝修改內容規範，必須同步更新 AGENTS.md 與 scripts/new-article.mjs 的骨架。
 */
import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** 分類：src/content/categories/<id>.yaml，檔名即分類 id */
const categories = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/categories' }),
  schema: z.object({
    /** 顯示名稱，例如 "Data Structures" */
    name: z.string().min(1),
    /** 2–4 個大寫英文字母的代號，顯示在分類卡片上，例如 "DS" */
    code: z.string().regex(/^[A-Z]{2,4}$/, '分類代號必須是 2–4 個大寫英文字母'),
    /** 一句話描述這個分類涵蓋什麼 */
    description: z.string().min(1).max(160),
    /** 排序用，數字小的在前 */
    order: z.number().int(),
  }),
});

/** 文章：src/content/articles/<slug>.md，檔名即網址 slug */
const articles = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/articles' }),
  schema: z.object({
    /** 概念的英文名稱，例如 "Binary Search" */
    title: z.string().min(1),
    /** 一句話摘要（繁中），用於卡片、搜尋結果與 meta description */
    description: z.string().min(10).max(120),
    /** 所屬分類 id（必須是 categories/ 裡存在的檔名） */
    category: reference('categories'),
    /** 搜尋關鍵字：中文名稱、別名、相關 STL / 術語 */
    keywords: z.array(z.string().min(1)).min(1),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    /** 相關文章 slug（必須是已存在的文章，不可包含自己） */
    related: z.array(reference('articles')).default([]),
    /** 是否出現在首頁「Featured」 */
    featured: z.boolean().default(false),
    /** 首次發布時間，決定「Recently Added」排序。可寫 2026-11-05 或 2026-11-05T22:50:00+08:00 */
    publishedAt: z.coerce.date(),
    /** 最後大幅修訂日期（選填） */
    updatedAt: z.coerce.date().optional(),
  }),
});

export const collections = { categories, articles };
