/**
 * 內容存取層
 * ------------------------------------------------------------------
 * 頁面與元件「只能」透過這個檔案讀取文章與分類，不要直接呼叫
 * getCollection()。原因：
 *   1. 排序、篩選規則集中在一處，所有頁面行為一致。
 *   2. 跨檔案的內容規則（schema 檢查不到的部分）在這裡驗證，
 *      違反時丟出錯誤讓建置失敗。
 */
import type { MarkdownHeading } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';

export type Article = CollectionEntry<'articles'>;
export type Category = CollectionEntry<'categories'>;
export type Difficulty = Article['data']['difficulty'];

/* ──────────────────────────────────────────────────────────────
 * 文章段落規範
 * ────────────────────────────────────────────────────────────── */

/** 文章允許的 h2 段落，順序固定。Related Topics 由版型自動產生，不寫在 Markdown 裡。 */
export const ARTICLE_SECTIONS = [
  'Overview',
  'Intuition',
  'How It Works',
  'Implementation',
  'Complexity',
  'Common Mistakes',
] as const;

/** 每篇都必須有的段落；其餘（Implementation、Complexity）不適用時可省略 */
export const REQUIRED_SECTIONS: readonly string[] = [
  'Overview',
  'Intuition',
  'How It Works',
  'Common Mistakes',
];

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/* ──────────────────────────────────────────────────────────────
 * 讀取（結果會快取，整個建置只驗證一次）
 * ────────────────────────────────────────────────────────────── */

let cache: Promise<{ articles: Article[]; categories: Category[] }> | undefined;

function load() {
  cache ??= (async () => {
    const [articles, categories] = await Promise.all([
      getCollection('articles'),
      getCollection('categories'),
    ]);
    validate(articles, categories);
    articles.sort(
      (a, b) =>
        b.data.publishedAt.getTime() - a.data.publishedAt.getTime() ||
        a.data.title.localeCompare(b.data.title),
    );
    categories.sort((a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name));
    return { articles, categories };
  })();
  return cache;
}

/** 全部文章，依發布日期新到舊 */
export async function getArticles(): Promise<Article[]> {
  return (await load()).articles;
}

/** 全部分類，依 order 排序 */
export async function getCategories(): Promise<Category[]> {
  return (await load()).categories;
}

/** 某分類底下的文章，依標題字母排序（分類頁像目錄，用字母序比較好找） */
export async function getArticlesByCategory(categoryId: string): Promise<Article[]> {
  const articles = await getArticles();
  return articles
    .filter((article) => article.data.category.id === categoryId)
    .sort((a, b) => a.data.title.localeCompare(b.data.title));
}

export async function getCategory(categoryId: string): Promise<Category> {
  const category = (await getCategories()).find((c) => c.id === categoryId);
  if (!category) throw new Error(`[NEXUS] 找不到分類 "${categoryId}"`);
  return category;
}

/** 首頁精選：featured: true 的文章 */
export async function getFeaturedArticles(limit = 3): Promise<Article[]> {
  return (await getArticles()).filter((a) => a.data.featured).slice(0, limit);
}

/** 首頁最新：依 publishedAt 新到舊 */
export async function getRecentArticles(limit = 5): Promise<Article[]> {
  return (await getArticles()).slice(0, limit);
}

/** 依 frontmatter related 的順序取出相關文章 */
export async function getRelatedArticles(article: Article): Promise<Article[]> {
  const articles = await getArticles();
  return article.data.related.map(({ id }) => articles.find((a) => a.id === id)!);
}

/**
 * 網站顯示日期使用的時區。publishedAt 可以只寫日期（視為 UTC 午夜），
 * 也可以寫含時區的時間；固定用這個時區格式化，才不會因為建置機器
 * （GitHub Actions 是 UTC）不同而差一天。
 */
const SITE_TIME_ZONE = 'Asia/Taipei';
const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: SITE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** 日期一律顯示為 YYYY-MM-DD */
export function formatDate(date: Date): string {
  return dateFormatter.format(date);
}

/* ──────────────────────────────────────────────────────────────
 * 閱讀時間：中文以每分鐘 400 字、英文以每分鐘 200 字估算
 * ────────────────────────────────────────────────────────────── */

export function readingMinutes(article: Article): number {
  const text = (article.body ?? '').replace(/```[\s\S]*?```/g, ' ');
  const cjk = text.match(/[㐀-鿿]/g)?.length ?? 0;
  const words = text.replace(/[㐀-鿿]/g, ' ').match(/[A-Za-z0-9]+/g)?.length ?? 0;
  return Math.max(1, Math.round(cjk / 400 + words / 200));
}

/* ──────────────────────────────────────────────────────────────
 * 驗證
 * ────────────────────────────────────────────────────────────── */

/** 跨檔案規則：slug 格式、分類存在、相關文章存在且不重複 */
function validate(articles: Article[], categories: Category[]) {
  const errors: string[] = [];
  const articleIds = new Set(articles.map((a) => a.id));
  const categoryIds = new Set(categories.map((c) => c.id));

  for (const category of categories) {
    if (!SLUG_PATTERN.test(category.id)) {
      errors.push(`categories/${category.id}.yaml：檔名必須是小寫 kebab-case`);
    }
  }

  for (const article of articles) {
    const file = `articles/${article.id}.md`;
    if (!SLUG_PATTERN.test(article.id)) {
      errors.push(`${file}：檔名必須是小寫 kebab-case，例如 binary-search.md`);
    }
    const categoryId = article.data.category.id;
    if (!categoryIds.has(categoryId)) {
      errors.push(
        `${file}：category "${categoryId}" 不存在。可用分類：${[...categoryIds].join(', ')}`,
      );
    }
    const seen = new Set<string>();
    for (const { id } of article.data.related) {
      if (id === article.id) errors.push(`${file}：related 不可包含文章自己`);
      else if (!articleIds.has(id)) {
        errors.push(`${file}：related "${id}" 指向不存在的文章（只能連到已存在的頁面）`);
      }
      if (seen.has(id)) errors.push(`${file}：related "${id}" 重複`);
      seen.add(id);
    }
  }

  for (const article of articles) {
    const file = `articles/${article.id}.md`;
    for (const problem of findBrokenEmphasis(article.body ?? '')) {
      errors.push(`${file} ${problem}`);
    }
    // new:article 產生的骨架含有 TODO；殘留就代表內容還沒寫完，不可發布
    const { description, keywords } = article.data;
    if (/\bTODO\b/.test([description, ...keywords, article.body ?? ''].join('\n'))) {
      errors.push(`${file}：仍有 TODO，內容尚未完成（請填完內容並刪除不適用的段落）`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`[NEXUS] 內容驗證失敗：\n  - ${errors.join('\n  - ')}`);
  }
}

/**
 * 中文 Markdown 的粗體陷阱（CommonMark flanking rule）：
 *   結尾的 ** 前面是標點、後面緊接文字 → 不會被當成粗體結尾，例如「**索引（index）**存取」
 *   開頭的 ** 後面是標點、前面緊接文字 → 不會被當成粗體開頭，例如「的**（註）**」
 * 修正方式：把標點移到 ** 外面，例如「**索引**（index）存取」。
 */
function findBrokenEmphasis(body: string): string[] {
  const problems: string[] = [];
  const isPunct = (c: string) => /\p{P}/u.test(c);
  const isSpace = (c: string) => c === '' || /\s/.test(c);
  let inFence = false;

  body.split('\n').forEach((rawLine, i) => {
    if (/^\s*```/.test(rawLine)) inFence = !inFence;
    if (inFence) return;
    const line = rawLine.replace(/`[^`]*`/g, (m) => 'x'.repeat(m.length)); // 忽略 inline code
    let count = 0;
    for (let pos = line.indexOf('**'); pos !== -1; pos = line.indexOf('**', pos + 2)) {
      const before = line[pos - 1] ?? '';
      const after = line[pos + 2] ?? '';
      const opening = count % 2 === 0;
      count++;
      const broken = opening
        ? isPunct(after) && !isSpace(before) && !isPunct(before)
        : isPunct(before) && !isSpace(after) && !isPunct(after);
      if (broken) {
        const snippet = rawLine.slice(Math.max(0, pos - 8), pos + 10);
        problems.push(
          `第 ${i + 1} 行：粗體 ** 緊貼標點與文字，不會被渲染成粗體（「…${snippet}…」）。請把標點移到 ** 外面`,
        );
      }
    }
  });
  return problems;
}

/**
 * 段落規則：文章頁 render 之後呼叫。
 *   - 不可使用 h1（標題由 frontmatter 產生）
 *   - h2 只能是 ARTICLE_SECTIONS 中的名稱，且順序固定、不可重複
 *   - REQUIRED_SECTIONS 必須存在
 */
export function validateSections(article: Article, headings: MarkdownHeading[]) {
  const file = `articles/${article.id}.md`;
  const errors: string[] = [];
  const allowed: readonly string[] = ARTICLE_SECTIONS;

  if (headings.some((h) => h.depth === 1)) {
    errors.push('不可使用 h1（# 標題），文章標題由 frontmatter 的 title 產生');
  }

  const sections = headings.filter((h) => h.depth === 2).map((h) => h.text.trim());
  let lastIndex = -1;
  for (const section of sections) {
    const index = allowed.indexOf(section);
    if (section === 'Related Topics') {
      errors.push('不要手寫 "## Related Topics"，請改用 frontmatter 的 related 欄位');
    } else if (index === -1) {
      errors.push(`不允許的段落 "## ${section}"。允許：${ARTICLE_SECTIONS.join(' / ')}`);
    } else if (index <= lastIndex) {
      errors.push(`段落 "## ${section}" 順序錯誤或重複，順序必須是：${ARTICLE_SECTIONS.join(' → ')}`);
    } else {
      lastIndex = index;
    }
  }

  for (const required of REQUIRED_SECTIONS) {
    if (!sections.includes(required)) errors.push(`缺少必要段落 "## ${required}"`);
  }

  if (errors.length > 0) {
    throw new Error(`[NEXUS] ${file} 段落格式錯誤：\n  - ${errors.join('\n  - ')}`);
  }
}
