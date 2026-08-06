import { toast } from 'sonner'
import { getAuthToken } from '@/lib/auth'
import { GITHUB_CONFIG } from '@/consts'
import {
	createBlob,
	createCommit,
	createTree,
	getRef,
	readTextFileFromRepo,
	toBase64Utf8,
	type TreeItem,
	updateRef
} from '@/lib/github-client'

export async function setPrimaryMusic(slug: string): Promise<void> {
	if (!slug) throw new Error('需要 slug')

	const token = await getAuthToken()
	const { OWNER, REPO, BRANCH } = GITHUB_CONFIG

	toast.info('正在读取站点配置...')
	const refData = await getRef(token, OWNER, REPO, `heads/${BRANCH}`)
	const latestCommitSha = refData.sha

	const configPath = 'src/config/site-content.json'
	const txt = await readTextFileFromRepo(token, OWNER, REPO, configPath, BRANCH)
	if (!txt) throw new Error('读取 site-content.json 失败')

	const config = JSON.parse(txt)
	config.primaryMusicSlug = slug
	const newContent = JSON.stringify(config, null, 2)

	const blob = await createBlob(token, OWNER, REPO, toBase64Utf8(newContent), 'base64')
	const treeItems: TreeItem[] = [
		{
			path: configPath,
			mode: '100644',
			type: 'blob',
			sha: blob.sha
		}
	]

	const treeData = await createTree(token, OWNER, REPO, treeItems, latestCommitSha)
	const commitData = await createCommit(token, OWNER, REPO, `设置主页播放音乐: ${slug}`, treeData.sha, [latestCommitSha])
	await updateRef(token, OWNER, REPO, `heads/${BRANCH}`, commitData.sha)

	toast.success('已设置为主页播放音乐！请等待部署后生效')
}
