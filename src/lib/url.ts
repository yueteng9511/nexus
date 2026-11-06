/**
 * 網址工具
 * ------------------------------------------------------------------
 * 網站部署在 GitHub Pages 的子路徑（例如 /nexus/），所以站內連結
 * 一律要經過這裡加上 base。不要在元件裡手寫 href="/articles/..."，
 * 部署後會變成 404（scripts/check-links.mjs 會抓出這種錯誤）。
 */

const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

/**
 * 把站內路徑轉成帶 base 的網址。
 * 頁面路徑會自動補上結尾斜線（astro.config 設定 trailingSlash: 'always'），
 * 檔案路徑（有副檔名）則維持原樣。
 *
 * url('/')                  → '/nexus/'
 * url('/articles/array')    → '/nexus/articles/array/'
 * url('/search-index.json') → '/nexus/search-index.json'
 */
export function url(path = '/'): string {
  const [pathname, suffix = ''] = splitSuffix(path.startsWith('/') ? path : `/${path}`);
  const isFile = /\.[a-z0-9]+$/i.test(pathname);
  const normalized = isFile || pathname.endsWith('/') ? pathname : `${pathname}/`;
  return `${BASE}${normalized}${suffix}`;
}

export const articleUrl = (slug: string) => url(`/articles/${slug}/`);
export const categoryUrl = (id: string) => url(`/categories/${id}/`);

/** 把 '?q=1#top' 這類尾巴拆出來，避免被加上斜線 */
function splitSuffix(path: string): [string, string] {
  const index = path.search(/[?#]/);
  return index === -1 ? [path, ''] : [path.slice(0, index), path.slice(index)];
}
