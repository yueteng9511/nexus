// @ts-check
import { defineConfig } from 'astro/config';

/**
 * 部署設定
 * ------------------------------------------------------------------
 * GitHub Pages 的專案網站網址是 https://<帳號>.github.io/<repo>/，
 * 所以 site 是帳號網域、base 是 repo 名稱。
 *
 * GitHub Actions（.github/workflows/deploy.yml）會自動帶入 SITE_URL 與 BASE_PATH，
 * 不需要手動修改這裡。本機開發預設使用 /nexus，讓本機網址結構跟線上一致，
 * 這樣「忘記加 base」的連結錯誤在本機就看得出來。
 */
const site = process.env.SITE_URL ?? 'https://example.github.io';
const base = process.env.BASE_PATH ?? '/nexus';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  markdown: {
    shikiConfig: {
      // 程式碼顏色由 src/styles/tokens.css 的 --astro-code-* 控制
      theme: 'css-variables',
    },
  },
});
