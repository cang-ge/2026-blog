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
	type TreeItem,
	updateRef
} from '@/lib/github-client'
import { removeMusicFromIndex } from '@/lib/music-index'

const MAX_RETRIES = 3

async function deleteMusicOnce(token: string, slug: string): Promise<void> {
	// 1. 拉最新 main 提交 SHA
	const refData = await getRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`)
	const latestCommitSha = refData.sha

	const basePath = `public/music/${slug}`

	// 2. 列出歌曲目录下所有文件（含上传的音频）
	const files = await listRepoFilesRecursive(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, basePath, GITHUB_CONFIG.BRANCH)

	// 3. 准备 treeItems：所有文件 sha=null（= 删除）
	const treeItems: TreeItem[] = files.map(path => ({
		path,
		mode: '100644',
		type: 'blob',
		sha: null
	}))

	// 4. 同时更新 public/music/index.json（同一棵树，避免 ref race）
	const indexJson = await removeMusicFromIndex(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, slug, GITHUB_CONFIG.BRANCH)
	const indexBlob = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, toBase64Utf8(indexJson), 'base64')
	treeItems.push({
		path: 'public/music/index.json',
		mode: '100644',
		type: 'blob',
		sha: indexBlob.sha
	})

	// 5. 创建 tree
	const treeData = await createTree(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, treeItems, latestCommitSha)

	// 6. 创建 commit
	const commitData = await createCommit(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `删除音乐: ${slug}`, treeData.sha, [latestCommitSha])

	// 7. fast-forward 更新 ref
	await updateRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`, commitData.sha)
}

export async function deleteMusic(slug: string): Promise<void> {
	if (!slug) throw new Error('需要 slug')

	const token = await getAuthToken()

	// 乐观并发：ref 被推进时重新拉 SHA 再来一遍
	let lastErr: unknown
	for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
		try {
			if (attempt === 1) toast.info(`正在删除音乐 ${slug}...`)
			else toast.info(`ref 已被推进，正在重试 (${attempt}/${MAX_RETRIES})...`)
			await deleteMusicOnce(token, slug)
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
	if (lastErr instanceof Error) throw lastErr
	throw new Error('删除失败：未知错误')
}
