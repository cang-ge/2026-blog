'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { useMusicStore } from '../../stores/music-store'
import { getAudioExt } from '@/lib/utils'
import { hashFileSHA256 } from '@/lib/file-utils'
import { motion } from 'motion/react'
import { ANIMATION_DELAY, INIT_DELAY } from '@/consts'

export function AudioSection() {
	const { audioSource, setAudioSource, setAudioDuration } = useMusicStore()
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [urlInput, setUrlInput] = useState('')

	const sourceUrl = audioSource ? (audioSource.type === 'file' ? audioSource.previewUrl : audioSource.url) : ''

	const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		const ext = getAudioExt(file.name)
		if (!ext) {
			toast.error('不支持的音频格式（支持 mp3/m4a/aac/ogg/wav/flac/webm）')
			return
		}
		if (file.size > 10 * 1024 * 1024) {
			toast.warning('音频较大（>10MB），写入仓库会较慢，建议改用外链')
		}
		const previewUrl = URL.createObjectURL(file)
		const hash = await hashFileSHA256(file)
		setAudioSource({ type: 'file', file, previewUrl, filename: file.name, hash })
		if (e.currentTarget) e.currentTarget.value = ''
	}

	const handleUrl = () => {
		const url = urlInput.trim()
		if (!url) return
		if (!/^https?:\/\/.+/.test(url)) {
			toast.error('请输入完整的 http(s) 外链地址')
			return
		}
		setAudioSource({ type: 'url', url })
		setUrlInput('')
	}

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ delay: INIT_DELAY + ANIMATION_DELAY * 0 }}
			className='rounded-xl border p-4'>
			<div className='mb-3 text-sm font-medium'>音频</div>

			{/* 当前来源 */}
			<div className='mb-3 flex items-center gap-2 text-xs'>
				<span className='text-secondary'>当前：</span>
				{audioSource === null ? (
					<span className='text-red-400'>未选择音频</span>
				) : audioSource.type === 'file' ? (
					<span className='truncate'>本地文件 · {audioSource.filename}</span>
				) : (
					<span className='truncate'>外链 · {audioSource.url}</span>
				)}
			</div>

			{/* 播放预览 */}
			{sourceUrl && (
				<audio
					controls
					src={sourceUrl}
					preload='metadata'
					className='mb-3 w-full'
					onLoadedMetadata={e => {
						const d = e.currentTarget.duration
						if (Number.isFinite(d)) setAudioDuration(Math.round(d))
					}}
				/>
			)}

			{/* 上传 or 外链 */}
			<div className='flex flex-col gap-2'>
				<div className='flex items-center gap-2'>
					<button
						type='button'
						onClick={() => fileInputRef.current?.click()}
						className='rounded-lg border bg-blue-50 px-3 py-1.5 text-sm text-blue-700 transition-colors hover:bg-blue-100'>
						上传音频文件
					</button>
					<input ref={fileInputRef} type='file' accept='audio/*,.mp3,.m4a,.aac,.ogg,.wav,.flac,.webm' hidden onChange={handleFile} />
					<span className='text-xs text-secondary'>支持 mp3/m4a/aac/ogg/wav/flac/webm</span>
				</div>
				<div className='flex items-center gap-2'>
					<input
						type='text'
						placeholder='或粘贴外链 URL（https://...）'
						className='bg-card flex-1 rounded-lg border px-3 py-1.5 text-sm'
						value={urlInput}
						onChange={e => setUrlInput(e.target.value)}
						onKeyDown={e => {
							if (e.key === 'Enter') handleUrl()
						}}
					/>
					<button
						type='button'
						onClick={handleUrl}
						className='rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-black/5'>
						使用外链
					</button>
				</div>
			</div>
		</motion.div>
	)
}
