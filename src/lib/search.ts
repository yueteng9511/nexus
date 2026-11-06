/**
 * 搜尋索引
 * ------------------------------------------------------------------
 * 索引在「建置時」由 src/pages/search-index.json.ts 產生成靜態 JSON，
 * 瀏覽器端（components/search/SearchBox.astro）下載後在本機比對。
 * 不需要伺服器，也不需要外部搜尋 API。
 *
 * 要讓更多欄位可被搜尋：在 SearchEntry 加欄位 → buildSearchIndex 填值
 * → SearchBox 的 score() 加權重。三處要一起改。
 */
import { getArticles, getCategories } from './content';
import { articleUrl } from './url';

export interface SearchEntry {
  title: string;
  description: string;
  keywords: string[];
  categoryName: string;
  categoryCode: string;
  url: string;
}

export async function buildSearchIndex(): Promise<SearchEntry[]> {
  const [articles, categories] = await Promise.all([getArticles(), getCategories()]);
  return articles.map((article) => {
    const category = categories.find((c) => c.id === article.data.category.id)!;
    return {
      title: article.data.title,
      description: article.data.description,
      keywords: article.data.keywords,
      categoryName: category.data.name,
      categoryCode: category.data.code,
      url: articleUrl(article.id),
    };
  });
}
