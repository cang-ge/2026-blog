import {
	toBase64Utf8,
	getRef,
	createTree,
	createCommit,
	updateRef,
	createBlob,
	type TreeItem
} from '@/lib/github-client'
import { fileToBase64NoPrefix } from '@/lib/file-utils'
import { prepareMusicIndex } from '@/lib/music-index'
import { getAuthToken } from '@/lib/auth'
import { GITHUB_CONFIG } from '@/consts'
import { getAudioExt } from '@/lib/utils'
import { toast } from 'sonner'
import type { AudioSource, MusicTrackItem } from '../types'

export type PushMusicParams = {
	slug: string
	title: string
	artist: string
	order: number
	hidden: boolean
	duration?: number
	audioSource: AudioSource | null
	mode?: 'create' | 'edit'
	originalSlug?: string | null
}

export async function pushMusic(params: PushMusicParams): Promise<void> {
	const { slug, title, artist, order, hidden, duration, audioSource, mode = 'create', originalSlug } = params

	if (!slug) throw new Error('需要 slug')
	if (!title) throw new Error('需要标题')
	if (!audioSource) throw new Error('需要选择音频文件或填写外链地址')

	if (mode === 'edit' && originalSlug && originalSlug !== slug) {
		throw new Error('编辑模式下不支持修改 slug，请保持原 slug 不变')
	}

	// 获取认证 token
	const token = await getAuthToken()

	toast.info('正在获取分支信息...')
	const refData = await getRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`)
	const latestCommitSha = refData.sha

	const basePath = `public/music/${slug}`
	const commitMessage = mode === 'edit' ? `更新音乐: ${slug}` : `新增音乐: ${slug}`

	const treeItems: TreeItem[] = []

	// 上传音频文件（外链则跳过，直接使用 URL）
	let audioSrc = ''
	if (audioSource.type === 'file') {
		const ext = getAudioExt(audioSource.file.name)
		if (!ext) throw new Error('不支持的音频格式（支持 mp3/m4a/aac/ogg/wav/flac/webm）')
		if (audioSource.file.size > 10 * 1024 * 1024) {
			toast.warning('音频较大（>10MB），写入仓库会较慢，建议改用外链')
		}
		toast.info('正在上传音频文件...')
		const contentBase64 = await fileToBase64NoPrefix(audioSource.file)
		const blobData = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, contentBase64, 'base64')
		audioSrc = `/music/${slug}/audio${ext}`
		treeItems.push({
			path: `${basePath}/audio${ext}`,
			mode: '100644',
			type: 'blob',
			sha: blobData.sha
		})
	} else {
		audioSrc = audioSource.url
	}

	toast.info('正在创建文件...')

	// create blob config.json
	const config = {
		title,
		artist,
		audioSrc,
		order,
		hidden,
		duration
	}
	const configBlob = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, toBase64Utf8(JSON.stringify(config, null, 2)), 'base64')
	treeItems.push({
		path: `${basePath}/config.json`,
		mode: '100644',
		type: 'blob',
		sha: configBlob.sha
	})

	// prepare + create blob index.json
	const item: MusicTrackItem = {
		slug,
		title,
		artist,
		src: audioSrc,
		order,
		hidden,
		duration,
		addedAt: new Date().toISOString()
	}
	const indexJson = await prepareMusicIndex(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, item, GITHUB_CONFIG.BRANCH)
	const indexBlob = await createBlob(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, toBase64Utf8(indexJson), 'base64')
	treeItems.push({
		path: 'public/music/index.json',
		mode: '100644',
		type: 'blob',
		sha: indexBlob.sha
	})

	toast.info('正在创建文件树...')
	const treeData = await createTree(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, treeItems, latestCommitSha)

	// create commit
	toast.info('正在创建提交...')
	const commitData = await createCommit(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, commitMessage, treeData.sha, [latestCommitSha])

	// update branch reference
	toast.info('正在更新分支...')
	await updateRef(token, GITHUB_CONFIG.OWNER, GITHUB_CONFIG.REPO, `heads/${GITHUB_CONFIG.BRANCH}`, commitData.sha)

	toast.success(mode === 'edit' ? '更新成功！' : '添加成功！')
}
