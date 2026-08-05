# cangge 个人博客 —— 设计文档

- 日期：2026-08-06
- 仓库：`cang-ge/2026-blog`（fork 自 `YYsuni/2025-blog-public`）
- 目标平台：Vercel
- 状态：已获用户确认

## 1. 目标与用途

用户（昵称 **cangge**）需要一个三合一个人站点：

1. **求职作品集** —— 面向 Agent 开发工程师 / AI 产品开发 / AI 产品经理 岗位
2. **技术笔记沉淀** —— 记录学习与踩坑
3. **个人主页 / 名片** —— 简介 + GitHub + 邮箱

成功标准：
- 零代码、免费、无需自建服务器
- 网站能在线写文章、文章落库到 GitHub
- 首页展示的内容是「cangge 本人」的（无原作者示例内容）

## 2. 方案（已选定）

**Fork 即用（零代码定制）**：fork 原项目 → 本地预置品牌与内容 → Vercel 部署 → 创建 GitHub App 获得网页编辑能力。

不写新代码、不新增模块、不删模块。**保留首页全部卡片模块**（时钟 / Live2D / 音乐 / 日历 / 分享等），仅替换品牌、文案与内容数据。

## 3. 架构与数据流

- **仓库即数据库**：所有内容（文章、图片、分类、About、项目等）都是仓库里的文件。
  - 文章：`public/blogs/<slug>/index.md` + `config.json`（title / tags / date / summary / cover）
  - 分类：`public/blogs/categories.json`
  - 站点配置：`src/config/site-content.json`、`src/config/card-styles.json`
  - About：`src/app/about/list.json`
  - 列表：`src/app/{projects,bloggers,pictures,snippets,share}/list.json`
- **访客读**：Next.js 直接渲染仓库静态文件，无鉴权、无后端。
- **作者写**：`/write` 编辑器 → jsrsasign 用 GitHub App 私钥签名 JWT → GitHub API 创建 commit → 内容 push 回仓库 → 站点更新。
- **部署**：Vercel Import `cang-ge/2026-blog`，配置环境变量。

## 4. 预置内容清单（部署前本地完成）

| 项 | 位置 | 内容 |
|---|---|---|
| 站点名/简介/用户名 | `src/config/site-content.json` → `meta` | title `cangge`；username `cangge`；description 「cangge 的个人博客 · Agent / AI 应用 / Python，记录学习与实践」 |
| 社交链接 | `src/config/site-content.json` → `socialButtons[]` | `[{type:"github", value:"https://github.com/cang-ge"}, {type:"email", value:"1662579816@qq.com"}]` |
| 首页定位文案 | `src/app/(home)/hi-card.tsx`（含对应的 index/page 文案） | 「AI 应用开发者 · Agent 方向 · 求职中」一类一句话定位 |
| 关于我 | `src/app/about/list.json` | 个人简介 + 技术方向（Agent 开发 / Python / AI 工具产品）+ GitHub + 邮箱 `1662579816@qq.com` |
| 分类 | `public/blogs/categories.json` | `["Agent 开发","AI 应用","Python","求职记录","随笔"]` |
| 首批文章 | `public/blogs/<slug>/` × 3 | ① 我的 AI 求职路线图 ② Agent 开发入门笔记 ③ 零成本开源博客搭建记 |
| 删除示例内容 | `public/blogs/*`（原作者约 30 篇）+ 各 `list.json` 中的示例条目 | 全部删除 / 置空，改为用户自己的 |
| 常量 | `src/consts.ts` | `OWNER='cang-ge'`、`REPO='2026-blog'`；更换默认 `ENCRYPT_KEY` |
| 头像/背景 | 上线后站内配置对话框 | 由用户可视化设置（无需代码） |

## 5. 需要用户本人操作（逐步引导）

1. **Vercel 部署**：登录 Vercel → Import `cang-ge/2026-blog` → 直接部署。
2. **创建 GitHub App**：Developer Settings → New GitHub App → 仓库 Write 权限 → 下载 Private Key → 记下 App ID。
3. **环境变量**：在 Vercel 项目设置中配置 `NEXT_PUBLIC_GITHUB_OWNER/REPO/BRANCH/APP_ID` 等。
4. **上线微调**：头像、背景、主题色等用站内可视化配置。

## 6. 安全

- GitHub App **Private Key 绝不入库**、不传公开网络；README 有专门提醒。
- 更换 `src/consts.ts` 中公开的默认 `ENCRYPT_KEY`。
- `hideEditButton` 等开关保持默认。

## 7. 验证标准

- 本地 `pnpm install && pnpm build` 通过。
- 本地 `pnpm dev` 可访问，首页卡片正常、About 展示用户信息、文章列表只含用户文章。
- Vercel 部署后域名可访问。
- 用 GitHub App 私钥成功发布第一篇文章。
