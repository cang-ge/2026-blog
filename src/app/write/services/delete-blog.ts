import { toast } from 'sonner'
import { getAuthToken } from '@/lib/auth'
import { GITHUB_CONFIG } from '@/consts'
import {
	createBlob,
	createCommit,
	createTree,
	getRef,
	listRepoFilesRecursive,
	toBase64Utf8,
	TreeItem,
	updateRef
} from '@/lib/github-client'
import { removeBlogFromIndex } from '@/lib/blog-index'

const MAX_RETRIES = 3

async function deleteBlogOnce(token: string, slug: string): Promise<void> {
	// 1. 拉最新 main 提交 SHA
	const refData = await getRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`)
	let latestCommitSha = refData.sha

	const basePath = `public/blogs/${slug}`

	// 2. 列出文章目录下所有文件（含子目录如 cover 图）
	const files = await listRepoFilesRecursive(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, basePath, GITHUB_CONFIG.BRANCH)
	if (files.length === 0) {
		throw new Error('文章不存在或已删除')
	}

	// 3. 准备 treeItems：所有文件 sha=null（= 删除）
	const treeItems: TreeItem[] = files.map(path => ({
		path,
		mode: '100644',
		type: 'blob',
		sha: null
	}))

	// 4. 同时更新 public/blogs/index.json（在同一棵树里，避免 ref race）
	const indexJson = await removeBlogFromIndex(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, slug, GITHUB_CONFIG.BRANCH)
	const indexBlob = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, toBase64Utf8(indexJson), 'base64')
	treeItems.push({
		path: 'public/blogs/index.json',
		mode: '100644',
		type: 'blob',
		sha: indexBlob.sha
	})

	// 5. 创建 tree（基于 main 最新的 commit SHA，GitHub 会自动解到 tree）
	const treeData = await createTree(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, treeItems, latestCommitSha)

	// 6. 创建 commit
	const commitMessage = `chore: delete blog ${slug}`
	const commitData = await createCommit(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, commitMessage, treeData.sha, [latestCommitSha])

	// 7. fast-forward 更新 ref（不强制 force；如 ref 已变则上抛，由外层重试）
	await updateRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`, commitData.sha)
}

export async function deleteBlog(slug: string): Promise<void> {
	if (!slug) throw new Error('需要 slug')

	const token = await getAuthToken()
	const basePath = `public/blogs/${slug}`

	// 乐观并发：如果中途 main 被别人推了，重新拉 SHA 再来一遍
	let lastErr: unknown
	for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
		try {
			if (attempt === 1) toast.info(`正在删除文章 ${basePath}...`)
			else toast.info(`ref 已被推进，正在重试 (${attempt}/${MAX_RETRIES})...`)
			await deleteBlogOnce(token, slug)
			toast.success('删除成功！请等待页面部署后刷新')
			return
		} catch (err: any) {
			lastErr = err
			const msg: string = err?.message || ''
			// 仅对 "update ref failed"（422/409）重试，其他错误直接抛
			if (!/update ref failed|422|409/.test(msg) || attempt === MAX_RETRIES) {
				throw err
			}
		}
	}
	// 走到这说明重试耗尽
	if (lastErr instanceof Error) throw lastErr
	throw new Error('删除失败：未知错误')
}