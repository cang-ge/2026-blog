# cangge 个人博客 —— 实施计划

- 日期：2026-08-06
- 依据设计文档：`docs/superpowers/specs/2026-08-06-cangge-blog-design.md`
- 工作目录：`C:\Users\Administrator\2026-blog`
- 目标：预置品牌与内容 → 本地验证 → push → 引导部署（Vercel + GitHub App）

## 概览

四步走：**① 品牌与配置 → ② 内容数据 → ③ 本地验证 → ④ 部署引导（用户操作）**。
原则：不写新代码、不增删模块；仅改配置与内容数据 + 一处极小的首页文案代码改动。

---

## Phase 1 — 品牌与配置（代码侧）

### 1.1 `src/config/site-content.json`
- `meta`：
  - `title`: `"cangge"`
  - `username`: `"cangge"`
  - `description`: `"cangge 的个人博客 · Agent / AI 应用 / Python，记录学习与实践，正在求职中"`
- `socialButtons`：替换为
  ```json
  [
    { "id": "github", "type": "github", "value": "https://github.com/cang-ge", "label": "Github", "order": 1 },
    { "id": "email",  "type": "email",  "value": "1662579816@qq.com",       "label": "", "order": 2 }
  ]
  ```
- 其余（theme / artImages / 背景 / 开关）**保持不变**——主题色等视觉项留给上线后站内可视化配置。

### 1.2 `src/consts.ts`
- `OWNER` → `'cang-ge'`
- `REPO` → `'2026-blog'`
- `ENCRYPT_KEY` 默认值 → 换一个新随机值（原值 `wudishiduomejimo` 是公开默认，不安全）

### 1.3 首页一句话定位（唯一的代码改动）
- `src/app/(home)/hi-card.tsx`：在问候语下方加一行副标题：
  `AI 应用开发者 · Agent 方向 · 求职中`
- 视 `card-styles.json` 中 hiCard 的 width/height 空间，必要时微调高度；改完必须在 dev 下确认布局不溢出。
- 备选：若溢出风险大，则改为只放在 About 页 + 站点 description，不加代码。

---

## Phase 2 — 内容数据

### 2.1 删除原作者示例文章
- `git rm -r` 全部 `public/blogs/<slug>/`（约 30 篇作者的 index.md + config.json + 图片）。
- 保留 `public/blogs/categories.json`、`public/blogs/index.json`（内容替换，见 2.3/2.4）。
- git 历史保留，可随时找回。

### 2.2 分类
- `public/blogs/categories.json` → `["Agent 开发","AI 应用","Python","求职记录","随笔"]`

### 2.3 首批 3 篇文章（每篇 = 目录 + `index.md` + `config.json`）

| slug | 标题 | tags | date | 分类 |
|---|---|---|---|---|
| `ai-job-roadmap` | 我的 AI 求职路线图 | [求职, AI, Agent] | 2026-08-06 | 求职记录 |
| `agent-dev-notes` | Agent 开发入门笔记 | [Agent, LLM, 学习笔记] | 2026-08-06 | Agent 开发 |
| `zero-cost-blog` | 零成本开源博客搭建记 | [博客, 开源, Next.js] | 2026-08-06 | AI 应用 |

- `config.json` 结构：`{ "title", "tags", "date", "summary", "cover" }`；cover 先留空字符串，dev 验证渲染正常后再决定是否补图。

### 2.4 博客索引
- `public/blogs/index.json`：替换为上面 3 篇的条目（字段按 `src/app/blog/types.ts` 的 `BlogIndexItem`，含 slug/title/date/summary 等）。保留原有 `public/blogs/index.json` 文件位置。

### 2.5 头像 / favicon（替换作者本人头像）
- `public/images/avatar.png`：生成一个「cangge」首字母占位头像（简单圆形 + 字母，先不依赖作者真容）；上线后用户可用站内上传换成自己照片。
- `public/favicon.png`：同上占位。
- 生成方式：优先 Python PIL；不可用则用 Node 脚本 / 纯 stdlib 写 PNG。

### 2.6 各 list.json 清空作者示例
- `src/app/about/list.json` → 用户本人介绍（title/description/content，content 为 markdown：简介 + 技术方向 A/C/D + GitHub + 邮箱）
- `src/app/projects/list.json` → `[]`（用户后续通过站内 UI 添加，页面空数组渲染需验证）
- `src/app/bloggers/list.json` → `[]`
- `src/app/pictures/list.json` → `[]`
- `src/app/snippets/list.json` → `[]`
- `src/app/share/list.json` → `[]`
- `src/app/music/list.ts` → 清空数组（保留文件与结构）

---

## Phase 3 — 本地验证

1. `pnpm install`（安装依赖，遵守纪律 1：只装已有 lockfile 的依赖，不新增任何包）
2. `pnpm build` 必须通过（TypeScript + Next 构建）
3. `pnpm dev` 启动，逐页验证：
   - `/` 首页卡片正常、无溢出；问候语显示 cangge；社交按钮含 GitHub+邮箱
   - `/blog` 文章列表只显示 3 篇自己的文章，分类正确
   - `/blog/<slug>` 文章正文渲染正常
   - `/about` 显示本人介绍
   - 各模块页（/projects /snippets /share /pictures /bloggers /music /clock /image-toolbox）空数组不报错、页面可打开
   - `/rss.xml`、`/sitemap.xml` 可访问
4. 发现报错 → 修复 → 重跑；全部通过才算完成
5. `git commit` + `git push origin main`

---

## Phase 4 — 部署与发布（用户操作，我给精确步骤）

1. **Vercel 部署**：登录 vercel.com → Import `cang-ge/2026-blog` → Framework 默认 Next.js → 直接 Deploy（约 60 秒），得到一个 `.vercel.app` 域名。
2. **创建 GitHub App**：GitHub → Settings → Developer settings → GitHub Apps → New GitHub App：
   - Homepage URL：填 Vercel 域名
   - Permissions → Repository → **Contents: Read & write**（核心权限）
   - 创建后 **Generate a private key** 下载 `.pem`，并记下 **App ID**
   - Install 该 App 到 `cang-ge/2026-blog` 仓库（授予该仓库权限）
3. **Vercel 环境变量**（项目 → Settings → Environment Variables）：
   - `NEXT_PUBLIC_GITHUB_OWNER=cang-ge`
   - `NEXT_PUBLIC_GITHUB_REPO=2026-blog`
   - `NEXT_PUBLIC_GITHUB_BRANCH=main`
   - `NEXT_PUBLIC_GITHUB_APP_ID=<App ID>`
   - `NEXT_PUBLIC_GITHUB_ENCRYPT_KEY=<与 consts.ts 一致的新随机值>`
   - 重新 Deploy
4. **站内配置**：打开博客 → 配置对话框 → 上传头像、换主题色/背景。
5. **发布验证**：`/write` 新建一篇文章 → 保存 → 确认 push 到 GitHub 成功 → 前台可见 → **验证标准达成**。

---

## 风险与注意

- **ENCRYPT_KEY 与部署端不一致**会导致私钥加密缓存异常 → 部署端 env 与 consts 默认值必须一致（以 consts.ts 为准）。
- 空数组的 list.json 若某页渲染报错 → 改为保留一个最小占位条目，或调整页面逻辑（不新增功能）。
- hi-card 加副标题若布局溢出 → 回退为仅 About 承载定位文案。
- 删除作者文章不可逆于 git 之外，确认已 `git commit` 再 push。
