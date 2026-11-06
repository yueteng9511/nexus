# AGENTS.md — NEXUS 開發規範

> 這份文件是給 AI（以及人類）在本專案工作時遵守的規範。開始任何修改前，先完整讀過一次。
> 文件中的每條規則都對應到實際程式碼；標示 **🔒 自動檢查** 的規則，違反時 `npm run build` 會失敗。
> 如果你發現本文件與程式碼不一致，**先回報，不要自行選邊修改**。

---

## 1. Project Overview

**NEXUS — Computer Science Atlas** 是一個電腦科學知識圖鑑：把資料結構、演算法、計算機結構、程式設計、數學等概念，整理成**格式一致、可以互相連結**的知識頁面。

核心設計理念：

1. **內容與 UI 分離**：知識內容只寫在 Markdown；頁面由共用版型自動產生。新增一篇文章 = 新增一個 `.md` 檔，不需要寫任何 HTML。
2. **規則可執行**：內容規範由 Zod schema 與建置時驗證強制執行，而不是只寫在文件裡。
3. **一致性優先**：每篇文章用相同的段落結構，所有頁面共用同一套 Design System。
4. **靜態、零後端**：整站是靜態檔案，部署在 GitHub Pages；搜尋在瀏覽器本機完成。

讀者定位：正在學電腦科學的大學生。內容要**解釋原理**，不是只給定義。

---

## 2. Technology Stack

| 技術 | 版本 | 用途 |
|---|---|---|
| Astro | 7.x | 靜態網站框架、Content Collections、路由 |
| TypeScript | 6.x（strict） | 型別檢查（`astro check`） |
| Zod | Astro 內建（v4，從 `astro/zod` 匯入） | 內容 schema |
| Shiki | Astro 內建 | 建置時程式碼高亮（`css-variables` 主題） |
| `@fontsource-variable/inter` | 5.x | 英文字體（本地打包，不用 CDN） |
| `@fontsource-variable/jetbrains-mono` | 5.x | 程式碼字體 |
| 純 CSS + CSS 變數 | — | Design System（**不使用** Tailwind 或 CSS-in-JS） |
| GitHub Actions + GitHub Pages | — | 部署 |

開發環境：Node.js ≥ 22（目前使用 v24）、npm。C++ 範例檢查需要 `g++`（PATH 上或 WSL 內皆可）。

**不要引入**：UI 框架（React/Vue/Svelte）、CSS 框架、資料庫、需要伺服器的功能、付費或外部 API。若某需求真的需要，先提出並說明理由，等確認後才做。

### 指令

| 指令 | 作用 |
|---|---|
| `npm run dev` | 開發伺服器，網址 `http://localhost:4321/nexus/`（注意有 base） |
| `npm run build` | **型別檢查 → 建置 → 連結檢查**，三關都要過 |
| `npm run preview` | 預覽建置結果 |
| `npm run check:cpp` | 編譯並執行所有文章中的 C++ 完整程式，比對預期輸出 |
| `npm run check:cpp -- <slug>` | 只檢查某一篇 |
| `npm run new:article -- <slug> <category> "<Title>"` | 產生符合規範的文章骨架 |

需要在背景啟動開發伺服器時，可用 `npx astro dev --background`，並以 `astro dev stop` / `status` / `logs` 管理。

---

## 3. Project Structure

```
nexus/
├── AGENTS.md                  # 本文件：開發規範
├── README.md                  # 給人看的專案說明、安裝與部署步驟
├── astro.config.mjs           # site / base / trailingSlash / Shiki 設定
├── package.json               # 指令與相依套件
├── tsconfig.json              # 繼承 astro/tsconfigs/strict
├── .github/workflows/deploy.yml   # GitHub Pages 部署流程
├── public/
│   └── favicon.svg            # 網站圖示（與 components/ui/Logo.astro 同圖形）
├── scripts/                   # Node 工具腳本（不會進到網站）
│   ├── check-links.mjs        # 建置後檢查 dist/ 內所有站內連結與錨點 🔒
│   ├── check-cpp.mjs          # 編譯、執行文章中的 C++ 程式並比對輸出
│   └── new-article.mjs        # 產生文章骨架
└── src/
    ├── content.config.ts      # 內容 schema（frontmatter 規則）🔒
    ├── content/               # ★ 所有知識內容都在這裡
    │   ├── categories/<id>.yaml   # 一個分類一個檔案
    │   └── articles/<slug>.md     # 一篇文章一個檔案（不分子資料夾）
    ├── lib/                   # 非 UI 的邏輯
    │   ├── content.ts         # 讀取文章/分類的唯一入口 + 跨檔案驗證 🔒
    │   ├── url.ts             # 產生帶 base 的站內網址
    │   └── search.ts          # 建立搜尋索引
    ├── layouts/
    │   ├── BaseLayout.astro   # 所有頁面的外框：<head>、Header、Footer
    │   └── ArticleLayout.astro# 文章頁版型：標題區、目錄、內文、相關文章
    ├── components/
    │   ├── layout/            # SiteHeader、SiteFooter（只由 BaseLayout 使用）
    │   ├── ui/                # 通用 UI：ArticleCard、CategoryCard、CategoryCode、
    │   │                      #   DifficultyBadge、Logo、PageHeader、SectionHeader
    │   ├── article/           # 文章專用：ArticleHeader、TableOfContents、RelatedTopics
    │   └── search/            # SearchBox（含瀏覽器端搜尋邏輯）
    ├── pages/                 # 路由（檔案路徑 = 網址）
    │   ├── index.astro                    # /
    │   ├── categories/index.astro         # /categories/
    │   ├── categories/[category].astro    # /categories/<id>/（自動產生）
    │   ├── articles/[slug].astro          # /articles/<slug>/（自動產生）
    │   ├── search.astro                   # /search/?q=
    │   ├── search-index.json.ts           # /search-index.json（建置時產生）
    │   └── 404.astro
    └── styles/
        ├── tokens.css         # ★ Design Tokens：全站唯一的視覺數值來源
        ├── global.css         # reset、元素預設、工具 class（.container、.eyebrow…）
        └── prose.css          # Markdown 內文樣式（只用於 .prose）
```

自動產生、不要手動修改也不要提交的資料夾：`dist/`（建置輸出）、`.astro/`（型別）、`.cache/`（C++ 檢查暫存）、`node_modules/`。

### 資料流

```
content/*.md, *.yaml
   │  content.config.ts（schema 驗證）
   ▼
lib/content.ts（排序、篩選、跨檔案驗證）──► lib/search.ts ──► search-index.json
   │
   ▼
pages/*（路由，呼叫 lib）──► layouts/* ──► components/*（呈現）──► styles/*（tokens）
```

**頁面與元件只能透過 `lib/content.ts` 取得內容**，不要直接呼叫 `getCollection()`。

---

## 4. Design System

風格定位：**Modern Technical Editorial + Minimalist Dark Theme**。像高品質的技術文件，而不是行銷頁。

### 4.1 原則

- 深色、低對比的表面層次，**以細邊框區分區塊，不用陰影**（陰影只用於浮層 `--shadow-overlay`）。
- **只有一個強調色**（`--color-accent`，藍綠色）。用於連結、目前位置、分類代號、段落編號。不要新增第二個裝飾用顏色。
- 難度三色（`--color-beginner` 等）只用於難度標示，是語意色而不是裝飾色。
- **禁止**：漸層背景、發光（glow）、大面積色塊、彈跳或捲動觸發的動畫、emoji 當圖示、置中的大段文字。
- 動態只用 `--duration-fast` 的顏色或邊框過渡。
- 等寬字（`--font-mono`）用於：品牌字、eyebrow 標籤、分類代號、日期、數字 metadata、程式碼。

### 4.2 Tokens（定義於 `src/styles/tokens.css`）

| 類別 | Token | 用途 |
|---|---|---|
| 表面 | `--color-bg` / `--color-surface` / `--color-surface-raised` | 頁面底 / 卡片 / hover、程式碼、輸入框 |
| 邊框 | `--color-border` / `--color-border-strong` | 預設 / hover、強調 |
| 文字 | `--color-text` / `--color-text-secondary` / `--color-text-muted` | 標題 / 內文 / 輔助資訊 |
| 強調 | `--color-accent` / `-hover` / `-subtle` / `-border` | 唯一強調色及其變體 |
| 字體 | `--font-sans` / `--font-mono` | Inter + 系統中文字體 / JetBrains Mono |
| 字級 | `--text-xs` … `--text-3xl`、`--text-display` | 12px → 品牌大字 |
| 行高 | `--leading-tight` / `-snug` / `-normal` / `-relaxed` | 標題 / 緊湊 / UI / 中文內文 |
| 間距 | `--space-1` … `--space-24` | 4px 基準（1 = 4px、4 = 16px、16 = 64px） |
| 圓角 | `--radius-sm` / `-md` / `-lg` / `-full` | 標籤 / 按鈕與程式碼 / 卡片 / 膠囊 |
| 版面 | `--width-content` / `--width-prose` / `--width-toc` / `--gutter` / `--header-height` | |
| 程式碼 | `--astro-code-*` | Shiki 語法顏色 |

**斷點**（CSS 變數不能用在 `@media`，固定使用這三個值，mobile-first 寫 `min-width`）：

| 名稱 | 寬度 | 主要變化 |
|---|---|---|
| sm | `640px` | 兩欄卡片、gutter 加大 |
| md | `960px` | 文章右側目錄出現、首頁 Featured / Recent 並排 |
| lg | `1200px` | gutter 加大 |

### 4.3 使用規則

- 🧱 元件樣式中的顏色、字級、間距、圓角**一律使用 token**。允許的例外：`0`、`1px` 邊框寬度、`100%`、百分比、`em` 微調、`fr`、icon 的固定像素尺寸、tokens.css 以外的 `rgb()` 只限 SiteHeader 的半透明背景。
- 需要新的數值時，**先找最接近的既有 token**；真的不夠才在 `tokens.css` 新增，並更新本節表格。
- 樣式寫在元件自己的 `<style>`（Astro 自動限定範圍）。由 script 動態產生的元素要用 `:global()`（範例：`SearchBox.astro` 的 `.results :global(.result)`）。
- 全域工具 class 只有：`.container`、`.visually-hidden`、`.eyebrow`。不要新增其他全域 class，除非同時更新本文件。
- 互動元素必須有可見的 `:focus-visible` 樣式（global.css 已提供預設）。

### 4.4 元件目錄（新增 UI 前先看這裡）

| 元件 | 用途 | 主要 props |
|---|---|---|
| `ui/ArticleCard` | 全站唯一的文章預覽 | `article`, `category?`, `variant: 'card' \| 'row'`, `showDate?` |
| `ui/CategoryCard` | 分類卡片 | `category`, `count` |
| `ui/CategoryCode` | 分類代號標籤 `[DS]` | `code`, `href?` |
| `ui/DifficultyBadge` | 難度圓點標籤 | `level` |
| `ui/PageHeader` | 一般頁面標題區 | `eyebrow?`, `title`, `description?`；slot：預設、`meta` |
| `ui/SectionHeader` | 頁內區塊標題 | `eyebrow?`, `title`, `link?`, `level?`, `id?` |
| `ui/Logo` | 品牌圖形 | `size?` |
| `article/ArticleHeader` | 文章麵包屑、標題、metadata | `article`, `category` |
| `article/TableOfContents` | 文章目錄（含捲動高亮） | `headings`, `hasRelated?` |
| `article/RelatedTopics` | 文章底部相關知識 | `articles` |
| `search/SearchBox` | 搜尋框 + 結果 | `variant: 'hero' \| 'page'`, `suggestions?` |
| `layout/SiteHeader`、`layout/SiteFooter` | 只由 BaseLayout 使用 | — |

---

## 5. Content Guidelines

### 5.1 文章檔案

- 位置：`src/content/articles/<slug>.md`，**不分子資料夾**（分類寫在 frontmatter，避免同一資訊存兩處）。
- 網址：`/articles/<slug>/`，自動產生。
- 建議用 `npm run new:article -- <slug> <category> "<Title>"` 產生骨架。

### 5.2 Frontmatter 🔒（schema：`src/content.config.ts`）

```yaml
---
title: Binary Search                # 必填。概念的英文正式名稱
description: 在已排序的資料中，每一步排除一半範圍的搜尋演算法。  # 必填。繁中一句話，10–120 字
category: algorithms                # 必填。必須是 content/categories/ 中存在的檔名
keywords: [二分搜尋, lower_bound, upper_bound, O(log n)]  # 必填，至少 1 個
difficulty: beginner                # 必填。beginner | intermediate | advanced
related: [array, binary-search-tree]  # 選填。必須是已存在的文章 slug
featured: false                     # 選填。true 會出現在首頁 Featured（前 3 篇）
publishedAt: 2026-11-05T22:50:00+08:00  # 必填。首次發布時間；也可只寫 2026-11-05
updatedAt: 2026-12-01               # 選填。大幅修訂時才填
---
```

- `keywords`：放**搜尋時可能輸入的詞**，包括中文名稱、別名、英文縮寫、相關 STL 名稱、代表性的複雜度。不要重複 title。
- `related` 🔒：只能連到**已存在**的文章，不可包含自己、不可重複。想連的文章還沒寫時就先不要列，等寫好再補。注意：Astro 的 `reference()` 本身**不會**檢查目標是否存在，這條規則由 `lib/content.ts` 的 `validate()` 負責。
- `related` 建議 2–5 篇，雙向思考：新增 B 並在 B 的 related 加了 A 時，也評估 A 是否該加回 B。
- `publishedAt` 決定首頁「Recently Added」的順序。建議寫**含時區的時間**（`new:article` 會自動產生），同一天新增多篇時才排得出先後；只寫日期時，同日文章改依標題字母排序。網站一律以台灣時區（`lib/content.ts` 的 `SITE_TIME_ZONE`）顯示日期。
- 🔒 **不可殘留 `TODO`**：description、keywords、內文中出現 `TODO` 時建置會失敗，避免把未完成的骨架發布出去。

### 5.3 段落結構 🔒（驗證：`lib/content.ts` 的 `validateSections()`）

文章內文只能使用以下 `##` 段落，**順序固定**：

| # | 段落 | 必要？ | 內容 |
|---|---|---|---|
| 1 | `## Overview` | 必要 | 是什麼、解決什麼問題、最重要的特性與取捨（2–4 段） |
| 2 | `## Intuition` | 必要 | 生活化比喻，把抽象概念對應到具體經驗 |
| 3 | `## How It Works` | 必要 | 運作原理；用 `###` 分小節；必要時用表格或逐步追蹤 |
| 4 | `## Implementation` | 選用 | C++ 程式碼；不適用（純理論概念）時整段省略 |
| 5 | `## Complexity` | 選用 | 操作 × 時間複雜度表格 + 空間複雜度說明 |
| 6 | `## Common Mistakes` | 必要 | 常見錯誤與容易混淆的觀念，每點用粗體標題開頭 |

- **不要寫** `# H1`（標題由 `title` 產生）。
- **不要寫** `## Related Topics`，它由 `related` 欄位自動產生在文章底部。
- 不適用的段落直接省略，**不要為了填滿模板寫無意義內容**。
- 小節用 `###`、`####`，不限名稱。

### 5.4 寫作風格

- 語言：**繁體中文正文**，專有名詞第一次出現時附英文，例如「隨機存取（random access）」。之後可擇一使用。
- 讀者：大學資工系學生。**解釋為什麼**，不只是是什麼。
- 句子要短，一段一個重點。重要結論用 `**粗體**`；關鍵提示可用 `>` 引言（會顯示成強調框）。
- 中英文之間不強制加空格，但同一篇要一致。
- 每篇至少要有：一個生活化比喻、一個具體例子（數字或逐步追蹤）、一張複雜度表（若適用）、3–6 個常見錯誤。
- 🔒 **粗體與全形標點**：CommonMark 規定 `**` 緊貼標點、另一側緊貼文字時不會變成粗體。
  - ❌ `**索引（index）**存取`
  - ✅ `**索引**（index）存取`
  - 違反時建置會失敗並指出行號（`lib/content.ts` 的 `findBrokenEmphasis()`）。

### 5.5 程式碼

- 語言以 **C++17** 為主，fenced code block 標 `cpp`。
- 完整程式（含 `int main`）必須能用 `g++ -std=c++17 -Wall -Wextra -Werror` **無警告**編譯並正常結束。
- 完整程式的**下一個** code block 若是 ```` ```text ````，代表預期輸出，`npm run check:cpp` 會逐字比對。所有完整程式都應該附預期輸出。
- 輸出必須是**確定的**（不要印記憶體位址、時間、亂數）。實作相關的輸出（例如 vector 容量成長）要在文中註明是哪個編譯器。
- 不含 `main` 的片段不會被編譯，用於展示錯誤寫法或局部概念。
- 註解用繁體中文，說明「為什麼」而不是重述程式碼。
- 可以用 `using namespace std;`（教學可讀性優先），但要保持一致。

### 5.6 文章內連結

- 文章之間的關聯**優先用 `related`**。
- 內文需要連結其他文章時，用**相對路徑**：`[Stack](../stack/)`。不要寫 `/articles/stack/`（缺少 base，部署後會 404）。🔒 `check-links.mjs` 會抓出缺 base 或指向不存在頁面的連結。

### 5.7 分類檔案 🔒

`src/content/categories/<id>.yaml`：

```yaml
name: Data Structures       # 顯示名稱
code: DS                    # 2–4 個大寫英文字母
description: 一句話描述（≤160 字）
order: 1                    # 排序，小的在前
```

---

## 6. Page Guidelines

| 頁面類型 | 使用的版型與元件 |
|---|---|
| 知識文章 | **不要建立頁面**。新增 `.md` 即可，由 `pages/articles/[slug].astro` + `ArticleLayout` 產生 |
| 分類頁 | **不要建立頁面**。新增 `.yaml` 即可，由 `pages/categories/[category].astro` 產生 |
| 一般頁面（關於、清單、索引…） | `BaseLayout` + `PageHeader` + `.container` 內容區 |
| 頁內多區塊 | 每個區塊用 `SectionHeader` 開頭 |
| 列出文章 | 一律用 `ArticleCard`（`card` 或 `row`） |

一般頁面範本：

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import PageHeader from '../components/ui/PageHeader.astro';
---

<BaseLayout title="頁面標題" description="一句話描述">
  <PageHeader eyebrow="Eyebrow" title="頁面標題" description="說明" />
  <div class="container">
    <!-- 內容 -->
  </div>
</BaseLayout>
```

規則：

- 每個頁面都必須使用 `BaseLayout`（直接或透過 `ArticleLayout`），不要自己寫 `<html>`、`<head>`、header 或 footer。
- 🔒 **所有站內連結**都用 `src/lib/url.ts` 產生：`url('/search/')`、`articleUrl(slug)`、`categoryUrl(id)`。不要手寫 `href="/..."`。
- 每頁只有一個 `<h1>`（由 `PageHeader` 或 `ArticleHeader` 輸出）。
- 互動行為用 Astro 元件內的 `<script>`（原生 TypeScript），不要引入框架。
- 新頁面若要出現在主導覽，修改 `SiteHeader.astro` 的 `NAV_ITEMS`。

---

## 7. File Naming

| 對象 | 規則 | 範例 |
|---|---|---|
| 文章 | `src/content/articles/<slug>.md`，slug 為小寫 kebab-case 英文 🔒 | `binary-search-tree.md` |
| 分類 | `src/content/categories/<id>.yaml`，小寫 kebab-case 🔒 | `computer-architecture.yaml` |
| 元件、版型 | PascalCase `.astro` | `ArticleCard.astro` |
| lib、scripts | kebab-case / 小寫 `.ts`、`.mjs` | `content.ts`、`check-links.mjs` |
| 樣式 | 小寫 `.css` | `tokens.css` |
| 動態路由 | `[param].astro` | `[slug].astro` |

- slug 用概念的英文正式名稱，例如 `hash-table`，不要用 `ht`、`hashtable`、`hash_table`。
- slug 決定網址，**發布後不要改名**，否則外部連結會失效。
- 元件依用途放在 `components/` 的子資料夾：通用 → `ui/`；只用於文章 → `article/`；全站外框 → `layout/`；某功能專用 → 以功能命名的資料夾，例如 `search/`。

---

## 8. Development Rules

1. **優先重用既有元件**。新增 UI 前先查第 4.4 節的元件目錄；需要變化時優先替現有元件加 `variant` 或 prop。
2. **不要重複建立相同功能的元件**。例如：文章預覽一律用 `ArticleCard`，不要另建 `ArticleListItem`。
3. **不要任意改變視覺風格**。不新增顏色、字體、陰影、漸層或動畫；需要時先提出。
4. **內容必須遵守資料格式**（第 5 節）。修改 schema = 修改規範，必須同時更新 `content.config.ts`、`scripts/new-article.mjs` 的骨架、本文件。
5. **新增或修改文章時檢查連結**：`related` 目標存在；考慮反向連結；內文連結使用相對路徑。
6. **修改共用元件前，先找出所有使用處**（例如在 `src/` 搜尋元件名稱），確認每個使用頁面都不受影響。修改 `ArticleLayout`、`prose.css`、`tokens.css` 會影響全站。
7. **不要在未經確認的情況下大幅改變專案架構**：新增框架或套件、改資料夾結構、改路由或網址格式、改 schema 必填欄位，都要先提出。
8. **讀內容一律透過 `lib/content.ts`**，網址一律透過 `lib/url.ts`。
9. **完成修改後必須執行**：
   - `npm run build`（必須全部通過：型別檢查 0 error、建置成功、連結檢查 OK）
   - 有改 C++ 程式碼時：`npm run check:cpp`
   - 有改 UI 時：在 `npm run dev` 下用桌面與手機寬度（375px）實際看過，確認沒有整頁水平捲動
10. **誠實回報**：建置失敗就說失敗，貼出錯誤；沒有驗證過的事情不要說「已完成」。
11. **不要為了讓檢查通過而削弱檢查**（例如刪掉驗證規則、加 `@ts-ignore`、把錯誤改成警告）。檢查本身有誤時，先說明再修。

---

## 9. Extension Guidelines

### 9.1 新增一篇知識文章（最常見）

1. 確認 slug 還沒被使用：查看 `src/content/articles/`。
2. 產生骨架：`npm run new:article -- hash-table data-structures "Hash Table"`。
3. 依第 5 節填寫 frontmatter 與段落；刪掉不適用的選用段落與所有 `TODO`（🔒 殘留會建置失敗）。
4. 在 `related` 列出**已存在**的相關文章；回頭評估那些文章是否也要加入新文章。
5. `npm run check:cpp -- hash-table`：程式必須編譯、執行、輸出比對全部通過。
6. `npm run build`：必須全部通過。
7. `npm run dev` 打開 `/nexus/articles/hash-table/` 確認顯示正常，並用搜尋找得到。

**不需要**修改任何 `.astro`、`.ts` 或 `.css` 檔。如果你覺得需要，代表需求超出「新增文章」，請先提出。

### 9.2 新增一個知識分類

1. 新增 `src/content/categories/<id>.yaml`（欄位見 5.7）；`order` 決定在首頁與總覽的位置。
2. `npm run build`。分類頁 `/categories/<id>/`、首頁分類卡片、分類總覽會自動出現。
3. 分類沒有文章時會顯示空狀態，這是正常的。
4. 需要時更新 `src/pages/search.astro` 的建議關鍵字。

### 9.3 新增一個網站功能

1. 先確認現有元件、`lib/` 函式能否支援；能重用就不要新建。
2. 依性質放置程式碼：
   - 資料處理 → `src/lib/<feature>.ts`（不含 UI）
   - UI → `src/components/<feature>/` 或 `ui/`
   - 新路由 → `src/pages/`
   - 建置時產生的資料檔 → `src/pages/<name>.json.ts`（參考 `search-index.json.ts`）
3. 瀏覽器端行為寫在元件的 `<script>`；不能依賴伺服器。
4. 樣式只用 tokens；需要新 token 時更新第 4 節。
5. 更新本文件：Project Structure、元件目錄，必要時新增規則。
6. `npm run build` + 桌面與手機實測。

範例：之後要做「全文搜尋」，可評估 Pagefind（建置後產生索引）。它會新增相依套件與建置步驟，屬於第 8 節第 7 點的架構變更，要先提出。

### 9.4 新增一種內容頁面模板

例如「演算法題解」這種和知識文章結構不同的內容：

1. **先確認真的需要新模板**：若只是段落不同，優先考慮能不能用現有文章格式表達。
2. 在 `src/content.config.ts` 新增 collection（例如 `problems`），定義獨立 schema。
3. 在 `src/lib/content.ts` 新增對應的讀取函式與驗證（仿照 `getArticles` / `validate` / `validateSections`）。
4. 新增版型 `src/layouts/<Name>Layout.astro`，外層使用 `BaseLayout`，內文使用 `prose.css`，盡量重用 `ArticleHeader`、`TableOfContents`、`RelatedTopics` 等元件。
5. 新增路由 `src/pages/<collection>/[slug].astro`。
6. 搜尋要包含新內容時，擴充 `src/lib/search.ts`。
7. 新增 `scripts/new-<type>.mjs` 骨架腳本（仿照 `new-article.mjs`）。
8. 在本文件新增對應的 Content Guidelines 小節。
9. 以上屬於架構變更，**動手前先提出計畫並取得確認**。

---

## 10. Deployment

- `astro.config.mjs` 從環境變數讀 `SITE_URL`、`BASE_PATH`；本機預設 `base = /nexus`，與線上一致。
- `.github/workflows/deploy.yml` 在 push 到 `main` 時自動建置並部署，並自動帶入 `https://<owner>.github.io` 與 `/<repo>`。
- repo 改名時不需要修改程式碼，但已發布的網址會改變。
- 詳細步驟見 `README.md`。

## 11. 參考文件

- Astro：https://docs.astro.build
- Content Collections：https://docs.astro.build/en/guides/content-collections/
- Routing：https://docs.astro.build/en/guides/routing/
- Styling：https://docs.astro.build/en/guides/styling/
