# cangge.me 部署手册（Vercel + Cloudflare CDN 反代）

- 日期：2026-08-06
- 仓库：`cang-ge/2026-blog`
- 架构：**Vercel 托管应用 + Cloudflare 免费 CDN/DNS 反代到 `cangge.me`**（靠 Cloudflare 边缘节点改善大陆访问，域名注册仍在国内服务商）
- 备案：不需要（托管在海外，Cloudflare 海外节点回源 Vercel）

> 环境变量注意：`NEXT_PUBLIC_*` 在**构建时**打进客户端。所有 env 必须先配好再点 Redeploy；之后每次改 env 都要重新部署。

---

## Phase A — Cloudflare：加域名，拿到 2 个 NS

1. 注册/登录 https://dash.cloudflare.com （免费）
2. **Add site** → 输入 `cangge.me` → 套餐选 **Free** → 继续
3. Cloudflare 会分配 **2 个 Nameserver**（形如 `ada.ns.cloudflare.com` / `ben.ns.cloudflare.com`）——**抄下来，下一步要用**
4. 此时站点状态是 "Pending"，先放着

## Phase B — 国内注册商：把域名 NS 改到 Cloudflare

1. 登录域名注册商控制台（阿里云/腾讯云）→ 域名 `cangge.me` → **修改 DNS 服务器**
2. 删掉默认 NS，填入 Phase A 抄下的 **2 个 Cloudflare NS** → 保存
   - ⚠️ 若注册商提示 .me 未完成实名认证，先按提示完成实名
3. 等待生效：一般 5~30 分钟，最长 24 小时
4. 回到 Cloudflare 面板，站点状态变 **Active** 即成功

## Phase C — Vercel：导入仓库并部署

1. 登录 https://vercel.com （用 GitHub 账号 OAuth 登录最快）
2. **Add New → Project** → Import `cang-ge/2026-blog`
3. Framework 自动识别 **Next.js** → **Deploy**（约 60 秒）
4. 得到一个临时域名，如 `2026-blog-xxxx.vercel.app` ——先记住

## Phase D — 绑定 cangge.me（先用灰云让 Vercel 验证，再开橙云）

> 顺序很关键：Cloudflare **先灰云（DNS only）**，等 Vercel 验证通过，再开橙云（Proxied）。否则 Vercel 看到的是 Cloudflare IP 会验证失败。

1. **Vercel** → 项目 → **Settings → Domains** → 添加 `cangge.me` 和 `www.cangge.me`
   - Vercel 会提示需要加的记录（见下一步），保持页面别关
2. **Cloudflare** → 你的站点 → **DNS → Records**，先加两条 **灰云（关闭代理）**：
   | 类型 | 名称 | 内容 | 代理 |
   |---|---|---|---|
   | A | `@` | `76.76.21.21` | 灰（DNS only） |
   | CNAME | `www` | `cangge.me` | 灰（DNS only） |
3. 回到 Vercel Domains 页 → 点 **Refresh/Verify** → 两个域名状态变 **Valid Configuration / Active**
4. **Cloudflare → DNS**：把上面两条记录改成 **橙云（Proxied）**
5. **Cloudflare → SSL/TLS → Overview**：加密模式选 **Full (strict)**（Vercel 有合法证书，必须 strict）

## Phase E — 创建 GitHub App（浏览器操作，约 5 分钟）

1. GitHub → **Settings → Developer settings → GitHub Apps → New GitHub App**
2. 填写：
   - GitHub App name：`cangge-blog`
   - Homepage URL：`https://cangge.me`
   - Description：随便写
   - **Webhook：取消勾选（Active 关掉）**
3. **Permissions → Repository permissions**：
   - **Contents：Read and write**（核心权限）
   - 其余默认即可（Metadata 只读）
4. 点 **Create GitHub App**
5. 创建后点 **Generate a private key** → 浏览器下载 `cangge-blog.*.pem` —— **只下载这一次，务必妥善保存，绝不传公开网络/不上传仓库**
6. 页面上方 **App ID** —— 抄下来
7. 左侧 **Install App** → 只选仓库 `cang-ge/2026-blog` → Install

## Phase F — Vercel 环境变量 + 重新部署

Vercel → 项目 → **Settings → Environment Variables**（Production）添加：

| 变量名 | 值 | 说明 |
|---|---|---|
| `NEXT_PUBLIC_GITHUB_OWNER` | `cang-ge` | |
| `NEXT_PUBLIC_GITHUB_REPO` | `2026-blog` | |
| `NEXT_PUBLIC_GITHUB_BRANCH` | `main` | |
| `NEXT_PUBLIC_GITHUB_APP_ID` | Phase E 抄的 App ID | |
| `NEXT_PUBLIC_GITHUB_ENCRYPT_KEY` | `457d3c3683e233aa02a7de33d5905ab2` | **必须与仓库 `src/consts.ts` 默认值一致** |
| `SITE_URL` | `https://cangge.me` | sitemap 用 |
| `NEXT_PUBLIC_SITE_URL` | `https://cangge.me` | RSS 用 |

保存后 → **Redeploy**（Deployments → 最新一条 → ⋯ → Redeploy）。

## Phase G — 发布第一篇文章（端到端验证）

1. 打开 `https://cangge.me` → 首页应显示 cangge 品牌、GitHub+邮箱按钮
2. `/blog` → 应只显示 3 篇自己的文章（ai-job-roadmap / agent-dev-notes / zero-cost-blog）
3. `/blog/agent-dev-notes` → 正文渲染正常
4. `/rss.xml` → 链接应全部是 `https://cangge.me/...`（不应残留 localhost 或其它外部域名）
5. 打开 `/write` → **上传 `cangge-blog.*.pem`**（页面会用它 + ENCRYPT_KEY 加密存浏览器）
6. 新建一篇文章 → 保存 → 确认 GitHub `cang-ge/2026-blog` 出现新 commit → 前台可见
7. `www.cangge.me` → 能访问或重定向到主域名

**达成以上即部署成功。**

---

## Phase H — 音乐编辑器（在线管理音乐）

首页音乐卡片可点击进入 `/music` 音乐管理页，功能镜像 `/write` 文章编辑器：列表展示、设主页播放、增删音乐（上传音频或粘贴外链）。

### 入口
- 首页音乐卡片**点击卡片** → `/music`（或直接访问 `https://www.cangge.me/music`）

### 页面结构
| 路由 | 作用 |
|---|---|
| `/music` | 列表 + 管理：设主页播放 / 编辑 / 删除 / 添加 |
| `/music/new` | 新建歌曲 |
| `/music/<slug>` | 编辑已有歌曲 |

### 首次使用
1. 打开 `/music` → 右上角「导入密钥」→ 上传 GitHub App 的 `cangge-blog.*.pem`（与 `/write` 同一个私钥）
2. 已授权后即可增删改

### 添加歌曲
1. `/music` → 「添加音乐」
2. 填写：标题、歌手、slug（英文小写，**创建后不可改**）、排序
3. 音频来源二选一：
   - **上传**：本地 mp3/m4a/aac/ogg/wav/flac/webm；>10MB 会提示建议改外链（避免仓库膨胀）
   - **外链**：粘贴 https 直链（不占仓库体积，适合大文件）
4. 播放预览确认 → 「保存」（未授权会先引导导入密钥）
5. 保存后 GitHub 出现 commit → **Vercel Redeploy** → 前台生效

### 设置主页播放
- `/music` 列表 → 目标歌曲 → 「设为主页播放」
- 写回 `src/config/site-content.json` 的 `primaryMusicSlug` → **Vercel Redeploy + 刷新**后，首页音乐卡自动播放该曲
- 未设置时默认播放列表第一首

### 编辑 / 删除
- **编辑**：列表 →「编辑」→ 改元数据或换音频 → 保存（不改音频则不会重复上传）
- **删除**：列表 →「删除」→ 确认后，GitHub 中该歌曲目录 + index 条目一并清除

### 说明
- 每首歌一个目录 `public/music/<slug>/config.json`（元数据）+ `audio.<ext>`（上传的音频）；外链歌只存 config.json，`src` 直接是外链 URL
- 歌曲按 `order` 升序排列；勾选「前台隐藏」后未登录访客不可见（与文章 `hidden` 一致）
- 增删改、设主页播放都走 GitHub App 鉴权 + Git Trees API，与 `/write` 同一套

---

## 上线后待办（不影响部署）

1. **点赞功能依赖一个第三方免费 Worker**（默认 `blog-liker.yysuni1001.workers.dev`，已可通过 env `NEXT_PUBLIC_LIKE_ENDPOINT` 指向你自己的服务）：
   - 现状：点赞计数走该第三方服务；服务不可用时点赞静默失败（不报错），不影响其它功能
   - 选项：① 保留默认（零成本）② 自建一个点赞 Worker 并通过 env 指向 ③ 隐藏/删除点赞按钮
   - 建议：先保留，上线观察；稳定后再决定是否自建
2. **头像/主题色/背景**：站内配置对话框可视化设置，无需代码
3. **大陆访问**：Cloudflare 免费版走海外节点，比 Vercel 直连稳定得多，但仍有 ~200-400ms 延迟、偶发被干扰。若日后要**大陆真正流畅**：见**附录 B**（备案方案，含"国内 CDN 回源海外 Vercel 不稳"的陷阱说明）
4. **图片图床**：站内图片目前放仓库 `public/`，量大后建议换图床（方案待定，后续单独整理文档）

## 常见问题

- **Vercel 验证域名失败**：确认 Cloudflare 那两条记录此时是**灰云**；验证通过后再开橙云
- **HTTPS 报错**：Cloudflare SSL/TLS 必须是 **Full (strict)**，不是 Flexible
- **改了 env 没生效**：`NEXT_PUBLIC_*` 构建期注入 → 改完必须 **Redeploy**
- **/write 发布报 401**：检查 GitHub App 是否已 Install 到 `cang-ge/2026-blog`、Contents 是否为 write、APP_ID 是否填对

---

## 附录 A — 平台对比：Vercel + Cloudflare 反代 vs Cloudflare Workers

> 两者**共用同一个前置**：域名 NS 都必须改到 Cloudflare（否则无法用 CF 的 CDN/绑定）。区别只在应用代码跑在哪——Vercel 服务器（由 CF 反代）还是 CF 边缘节点的 Worker。

| 维度 | **Vercel + CF CDN 反代**（当前） | **Cloudflare Workers** |
|---|---|---|
| 架构 | 浏览器 → CF 边缘 → Vercel 服务器 → 回 | 浏览器 → CF 边缘（Worker 即服务端） |
| 大陆访问 | 静态被 CF 缓存走边缘，比 Vercel 直连强很多；动态页每请求多一跳 CF→Vercel | 动态页直接在边缘执行，少一跳；但同样走海外边缘，都 ~200-400ms |
| 成本 | **$0**（Vercel Hobby + CF 免费） | 免费额度 CPU 仅 10ms/请求，本博客 SSR（shiki+katex+markdown）易超限，生产基本要 **Workers Paid $5/月** |
| 上线风险 | **低**：Next.js 在 Vercel 上是被广泛验证的路径 | **中高**：Next.js 16 + OpenNext on Workers 尚未在生产大规模验证，`node:fs`/`path`（RSS 读 public）、流式渲染有边缘兼容坑 |
| 配置/维护 | 一次性灰云→橙云；两个面板（Vercel+CF） | `build:cf` + `wrangler deploy` + Worker Secrets；一个面板（全 CF） |
| 调试 | Vercel 实时日志 + 预览部署，最顺手 | `wrangler tail`，可用但不如 Vercel 直观 |

**结论：保持 Vercel + CF 反代。** 决定性因素：① 上线风险——`/write`、`/blog/[id]` 是服务端渲染，Workers 上跑 Next 16 是未验证组合；② 成本——Workers 可能 $5/月；③ 大陆访问两者**打平**（最终由 CF 边缘决定，与 app 跑在哪无关）。Workers 的唯一优势（少一跳）在免费海外边缘下不值一提。

⚠️ 免费方案无论选哪个，大陆都到不了"流畅"（200-400ms、偶发被干扰）。要大陆秒开 → 见附录 B。

---

## 附录 B — ICP 备案决策：备案对实现目标的影响

> 核心：**备案不改变代码、内容数据、GitHub App 在线写作机制**（与托管平台无关，搬家只是把同一仓库部署到别处 + 重新填 env）。备案改变的是"平台选择空间"。

### 备案解锁了什么
1. 使用**国内 CDN**（阿里云 CDN）→ 大陆从"200-400ms 海外"变"秒开"——唯一能实质解决大陆访问问题的路径
2. 使用**国内托管**（阿里云函数计算 / ECS / OSS）→ 完全国内方案

### 备案带来的约束
- **绑定接入商**：阿里云备案 → 用阿里云 CDN/托管（换接入商麻烦）
- **时间与资料**：实名（身份证/手机/主体）+ 管局审核约 **1-2 周**；审核期不能绑国内服务器，但**可继续用海外（Vercel/CF）对外访问**，不影响上线
- **内容合规**：网站内容受国内规定约束，个人求职博客一般无风险，但注意有抽查/注销机制
- **`.me` 可行性**：国内注册商一般支持 .me 备案（需实名认证，注册时通常已做），具体以阿里云备案系统里该域名状态为准

### 关键陷阱：备案 ≠ 大陆流畅
备案只是让域名"能接国内 CDN"；但**国内 CDN 回源到海外 Vercel 可能不通/很慢**（Vercel 国内连通性不稳）。想吃备案红利 → 应用 origin 也要搬回国内。

### 三条路线
| 路线 | 大陆体验 | 费用 | 复杂度 |
|---|---|---|---|
| **A 现状**：Vercel+CF，不备案 | 200-400ms，能打开 | $0 | 最低 |
| **B 备案 + 迁阿里云**：函数计算跑 Next.js（Serverless Devs/应用中心一键部署）+ OSS 存图片 + 阿里云 CDN | **秒开** | 低（FC 按量/低套餐，个人博客几乎免费到几十元/月） | 中 |
| **C 备案但 origin 留海外**：阿里云 CDN + Vercel 回源 | 依赖回源连通性，**不稳** | 低 | 中（**不推荐**） |

### 对实现目标逐条
- 作品集大陆可访问：只有 **B** 真正达标（秒开）；A 是"能打开"；C 不稳
- 免费：A 免费；B 可能少量费用（低配 FC 基本可忽略）
- 零代码 / 无自建服务器：都保持（B 用**函数计算**，仍 serverless）
- 在线写作落库 GitHub：**完全不变**
- 维护：A 两个面板（Vercel+CF）；B 一个（阿里云），多一个备案系统

### 建议
**先按现状（A）上线**，实测大陆访问到底行不行；确认不行再走 B。搬家是一次性成本（同一仓库重部署 + 重新填 7 个 env），备案要等 1-2 周，不必卡住现在就能上线的部署。
