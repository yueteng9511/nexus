# NEXUS — Computer Science Atlas

一份持續擴充的電腦科學知識圖鑑。每個概念都用相同的結構解釋：Overview → Intuition → How It Works → Implementation → Complexity → Common Mistakes，並連結到相關的知識頁面。

**線上網站：https://yueteng9511.github.io/nexus/**

- **靜態網站**：Astro 7 + TypeScript，部署在 GitHub Pages，不需要後端。
- **內容與 UI 分離**：知識內容寫在 Markdown，新增一篇文章只需要新增一個 `.md` 檔。
- **規則可執行**：內容格式、段落結構、站內連結、C++ 範例都有自動檢查。

> 開發規範（給 AI 與協作者）：見 [AGENTS.md](AGENTS.md)。

## 本機執行

需求：Node.js 22 以上（建議 24）。C++ 範例檢查另外需要 `g++`（Linux/macOS 直接安裝；Windows 可用 WSL 內的 g++）。

```bash
npm install        # 安裝相依套件（只需第一次）
npm run dev        # 開發伺服器
```

開啟 http://localhost:4321/nexus/。網址包含 `/nexus/`，是因為本機設定和 GitHub Pages 上的路徑一致。

## 常用指令

| 指令 | 作用 |
|---|---|
| `npm run dev` | 開發伺服器，存檔後自動重新整理 |
| `npm run build` | 型別檢查 → 建置到 `dist/` → 檢查所有站內連結 |
| `npm run preview` | 預覽 `dist/` 的建置結果 |
| `npm run check:cpp` | 編譯、執行文章中的 C++ 程式並比對預期輸出 |
| `npm run new:article -- <slug> <category> "<Title>"` | 產生符合規範的文章骨架 |

## 新增一篇文章

```bash
npm run new:article -- hash-table data-structures "Hash Table"
```

接著編輯 `src/content/articles/hash-table.md`，再執行 `npm run check:cpp -- hash-table` 和 `npm run build`。格式規範見 [AGENTS.md 第 5 節](AGENTS.md#5-content-guidelines)。

## 專案結構（摘要）

```
src/
├── content/          知識內容（articles/*.md、categories/*.yaml）
├── content.config.ts 內容 schema
├── lib/              讀取內容、網址、搜尋索引
├── layouts/          BaseLayout、ArticleLayout
├── components/       UI 元件
├── pages/            路由
└── styles/           tokens.css（Design System）、global.css、prose.css
scripts/              連結檢查、C++ 檢查、文章骨架
```

完整說明見 [AGENTS.md 第 3 節](AGENTS.md#3-project-structure)。

## 部署到 GitHub Pages

部署由 `.github/workflows/deploy.yml` 自動完成：每次 push 到 `main`，GitHub Actions 會檢查 C++ 範例、建置、檢查連結，然後發布。

### 第一次設定

1. 在 GitHub 建立新的 repository（例如 `nexus`）。建議設為 Public，因為免費帳號的 GitHub Pages 需要公開 repo。**不要**勾選「Add a README」等初始化選項。
2. 在本機專案資料夾執行：

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<你的帳號>/<repo>.git
   git push -u origin main
   ```

3. 到 repo 的 **Settings → Pages → Build and deployment → Source**，選 **GitHub Actions**。
4. 到 **Actions** 分頁確認「Deploy to GitHub Pages」執行成功。如果第一次因為 Pages 還沒啟用而失敗，完成步驟 3 後按 **Re-run jobs**。
5. 網站網址：`https://<你的帳號>.github.io/<repo>/`

網址中的帳號與 repo 名稱由 workflow 自動帶入（`SITE_URL`、`BASE_PATH`），**不需要修改程式碼**。

### 之後更新

```bash
git add .
git commit -m "Add hash table article"
git push
```

## 技術

Astro 7 · TypeScript · Markdown · Zod · Shiki · 純 CSS（Design Tokens）· GitHub Actions · GitHub Pages
