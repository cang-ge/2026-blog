## 为什么这样做

想拥有一个自己的博客，但不想：买服务器、维护数据库、写后台管理。于是有了这个方案——**把 GitHub 当数据库，前端负责读写**，托管在 Vercel 上，全流程零费用。

## 整体架构

```
GitHub 仓库（内容即文件）
  ├── public/blogs/<slug>/index.md   文章正文
  ├── public/blogs/<slug>/config.json 标题/标签/日期/摘要
  ├── public/blogs/index.json        文章索引
  └── src/config/site-content.json   站点配置

访客读取：Next.js 直接渲染文件，无需鉴权
作者写入：/write 编辑器 → GitHub API 提交 → 文章落盘
```

- **技术栈**：Next.js 16 + React 19 + Tailwind CSS 4 + TypeScript
- **部署**：Vercel（免费额度，导入仓库一键部署）
- **写权限**：GitHub App（仓库 Write 权限）+ Private Key 签名 JWT，通过 GitHub API 提交内容

## 核心设计：内容即文件

每篇文章就是一个文件夹：

```text
public/blogs/my-post/
├── index.md      # Markdown 正文
├── config.json   # { title, tags, date, summary, cover }
└── 图片文件.jpg   # 文章内图片
```

标题、标签、摘要全在 `config.json`，正文纯 Markdown。所有内容版本都由 Git 管理——**改错了能回滚，丢了能找回**，这就是免费获得版本控制的方式。

## 写权限怎么做：GitHub App

浏览器里读写仓库需要认证。方案是创建一个 GitHub App：

1. 授予它对某个仓库的 **Contents: Read & Write** 权限
2. 生成 **Private Key**（.pem 文件）
3. 前端用私钥签名 JWT 换取访问令牌，调 GitHub API 提交

关键：**Private Key 绝不能上传到公开仓库**，它是写权限的唯一凭证。

## 一点经验

- 部署很简单（README 说 60 秒），真正麻烦的是 GitHub App 那几步，建议一步步照着官方文档来
- 文章的"草稿/隐藏"要自己想清楚：推上去就是公开的
- 换主题、传头像、加背景，站点内置了可视化配置，不用碰代码

## 想自己搭？

直接 fork 这个项目的代码（YYsuni/2025-blog-public），改掉站点信息，部署到 Vercel，再创建 GitHub App 即可。这就是本站的由来。
