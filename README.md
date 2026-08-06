# cangge Blog

> cangge 的个人博客仓库管理，该项目fork于开源项目，并且在其之上拓展了一些功能。
>
> 在线地址：**https://cangge.me**  （Vercel 部署 + Cloudflare CDN 反代）

一个**仓库即数据库**的个人博客系统：所有内容（文章、音乐、站点配置、图片）都以文件形式存放在 GitHub 仓库里，访问端静态读取，作者端通过 GitHub App 鉴权在线写入。无需自建服务器、无数据库，内容永远属于你自己。

---

## ✨ 功能特性

| 模块 | 说明 |
|---|---|
| **首页卡片式布局** | 时钟 / 艺术插画 / 音乐 / 日历 / 分享 / 收藏等卡片，可拖拽调整位置与尺寸 |
| **文章系统** | `/blog` 列表 + `/blog/<slug>` 正文（Markdown / LaTeX / 代码高亮），分类、标签、隐藏、封面 |
| **在线写作** | `/write` 浏览器内直接写文章并落库到 GitHub（GitHub App 私钥鉴权） |
| **音乐编辑器** | `/music` 管理音乐：列表、设主页播放、增删（上传音频或粘贴外链） |
| **站点配置** | 首页可视化配置：主题色、头像、背景、社交按钮，改完写回仓库 |
| **RSS / Sitemap** | `/rss.xml`、`/sitemap.xml` 自动生成 |
| **大陆访问优化** | Cloudflare 免费 CDN 反代，比直连 Vercel 更稳 |

---

## 🧱 技术栈

- **框架**：Next.js 16（App Router） · React 19 · TypeScript
- **样式**：Tailwind CSS 4 + framer-motion（motion/react）动画
- **状态与数据**：Zustand（全局状态） · SWR（服务端数据拉取）
- **渲染**：Shiki（代码高亮） · KaTeX（数学公式） · marked（Markdown）
- **鉴权**：jsrsasign（GitHub App JWT 签名）
- **部署**：Vercel（应用） + Cloudflare（CDN/DNS）

---

## 🏗️ 架构：仓库即数据库

```
┌─────────────┐        ┌──────────────┐        ┌────────────────────────┐
│   访客浏览器   │ ─────▶ │  Cloudflare  │ ─────▶ │        Vercel          │
│             │  CDN   │  边缘节点/CDN  │  回源  │   Next.js 应用（静态）   │
└─────────────┘        └──────────────┘        └───────────┬────────────┘
                                                            │ 读取（静态 /public）
                                                            ▼
                                               ┌────────────────────────┐
                                               │   GitHub 仓库（唯一数据源）│
                                               │  cang-ge/2026-blog     │
                                               └───────────┬────────────┘
                                                            ▲ 写入（GitHub App）
                    ┌────────────┐  JWT + 安装令牌   ┌──────┴──────────┐
                    │ 作者浏览器   │ ───────────────▶ │  Git Trees API  │
                    │  /write     │                  │  /music         │
                    └────────────┘                  └─────────────────┘
```

- **访客读**：内容全部是仓库里的文件（`public/` 静态目录），Next.js 直接读取渲染，零数据库、零后端。
- **作者写**：浏览器用 GitHub App 的 **Private Key** 签名 JWT → 换取仓库安装令牌 → 通过 **Git Trees API** 一次提交新文件/删除旧文件。任何能 git push 的操作，在浏览器里都能做。

### 内容存放约定

```
public/blogs/<slug>/        # 文章：index.md + config.json（元数据）
public/blogs/index.json     # 文章索引（列表页读取）
public/music/<slug>/        # 音乐：config.json + audio.<ext>（上传的音频）
public/music/index.json     # 音乐索引（首页卡片/列表页读取）
src/config/site-content.json  # 站点配置（品牌/主题/社交按钮/主页音乐）
src/config/card-styles.json   # 卡片布局（位置/尺寸/开关）
```

---

## 📁 项目结构

```
src/
├── app/
│   ├── (home)/            # 首页（卡片、配置对话框、布局编辑）
│   ├── about/             # 关于页
│   ├── blog/              # 文章列表 + 详情
│   ├── music/             # 音乐管理（/music、/music/new、/music/[slug]）
│   ├── write/             # 在线写作（/write、/write/[slug]）
│   ├── rss.xml/           # RSS 生成
│   └── sitemap.ts         # Sitemap 生成
├── components/            # 全局组件（含首页音乐卡片 music-card）
├── config/                # site-content.json / card-styles.json
├── hooks/                 # SWR hooks（use-blog-index、use-music-index）
├── lib/                   # github-client（Git API）、auth、blog-index、music-index
└── consts.ts              # GitHub 仓库配置默认值
```

---

## 🚀 本地开发

```bash
pnpm install      # 安装依赖
pnpm dev          # 启动开发服务器 → http://localhost:2025
pnpm build        # 生产构建（TypeScript + Next.js）
pnpm start        # 本地预览生产构建
```

> 内容在线写入需要配置 GitHub App 私钥；仅本地预览页面无需任何配置。

---

## 🌐 部署

完整部署手册见 **[`docs/deployment-runbook.md`](docs/deployment-runbook.md)**，涵盖：

- **Phase A–D**：Cloudflare 建站 + 改 NS + Vercel 部署 + 绑定 `cangge.me`（灰云→橙云 + SSL Full strict）
- **Phase E**：创建 GitHub App（Contents write + 私钥 + App ID + 安装到仓库）
- **Phase F**：Vercel 环境变量 + Redeploy
- **Phase G/H**：发布第一篇文章、音乐编辑器在线管理

架构选型与备案决策的对比分析见该文档**附录 A/B**。

---

## 🔐 环境变量

| 变量名 | 说明 |
|---|---|
| `NEXT_PUBLIC_GITHUB_OWNER` | GitHub 用户名（默认 `cang-ge`） |
| `NEXT_PUBLIC_GITHUB_REPO` | 内容仓库名（默认 `2026-blog`） |
| `NEXT_PUBLIC_GITHUB_BRANCH` | 分支（默认 `main`） |
| `NEXT_PUBLIC_GITHUB_APP_ID` | GitHub App ID |
| `NEXT_PUBLIC_GITHUB_ENCRYPT_KEY` | 私钥加密密钥（与 `src/consts.ts` 默认值一致） |
| `SITE_URL` | 正式域名，sitemap 用（如 `https://cangge.me`） |
| `NEXT_PUBLIC_SITE_URL` | 正式域名，RSS 用 |
| `NEXT_PUBLIC_LIKE_ENDPOINT` | 点赞后端地址（可选，默认第三方免费 Worker） |

---

## ✍️ 在线写作原理

1. 打开 `/write`，上传 GitHub App 的 `*.pem` **私钥**（仅存浏览器 sessionStorage，用 `ENCRYPT_KEY` 加密，不传服务器）。
2. 发布时用私钥签 JWT → 换取仓库**安装令牌**。
3. 文章/图片/索引全部以**一个 commit** 写回仓库（Git Trees API），保证原子性。
4. GitHub 出现新 commit → **Vercel 手动 Redeploy 一次** → 前台可见。

> ⚠️ 因内容由 GitHub App 直接 push（非 GitHub 网页 push），**Vercel 不会自动触发重新构建**——每次改完内容需手动 Redeploy 一次（Deployments → ⋯ → Redeploy）。

---

## 📜 License

[MIT](LICENSE)

> 本项目基于 MIT 许可证开源，版权声明见 `LICENSE` 文件。
