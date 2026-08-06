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
4. `/rss.xml` → 链接应为 `https://cangge.me/...`（不是 localhost / yysuni）
5. 打开 `/write` → **上传 `cangge-blog.*.pem`**（页面会用它 + ENCRYPT_KEY 加密存浏览器）
6. 新建一篇文章 → 保存 → 确认 GitHub `cang-ge/2026-blog` 出现新 commit → 前台可见
7. `www.cangge.me` → 能访问或重定向到主域名

**达成以上即部署成功。**

---

## 上线后待办（不影响部署）

1. **点赞功能依赖原作者第三方 Worker**（`blog-liker.yysuni1001.workers.dev`）：
   - 现状：点赞数走原作者免费 Worker，首页点赞按钮默认 slug=`yysuni`，可能与其站点数据混在一起；Worker 挂了点赞静默失败（不报错）
   - 选项：① 保留（零成本）② 自己部署一个点赞 Worker（需要新代码）③ 隐藏/删除点赞按钮
   - 建议：先保留，上线观察；稳定后二选一
2. **头像/主题色/背景**：站内配置对话框可视化设置，无需代码
3. **大陆访问**：Cloudflare 免费版走海外节点，比 Vercel 直连稳定得多，但仍有 ~200-400ms 延迟、偶发被干扰。若日后要**大陆真正流畅**：走 ICP 备案 + 国内 CDN（阿里云/腾讯云）挂在 Cloudflare 前面
4. **图片图床**：站内图片目前放仓库 `public/`，量大后建议换图床（见原 README）

## 常见问题

- **Vercel 验证域名失败**：确认 Cloudflare 那两条记录此时是**灰云**；验证通过后再开橙云
- **HTTPS 报错**：Cloudflare SSL/TLS 必须是 **Full (strict)**，不是 Flexible
- **改了 env 没生效**：`NEXT_PUBLIC_*` 构建期注入 → 改完必须 **Redeploy**
- **/write 发布报 401**：检查 GitHub App 是否已 Install 到 `cang-ge/2026-blog`、Contents 是否为 write、APP_ID 是否填对
