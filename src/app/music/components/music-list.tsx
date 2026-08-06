'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { useMusicIndex } from '@/hooks/use-music-index'
import { useConfigStore } from '@/app/(home)/stores/config-store'
import { useMusicStore } from '../stores/music-store'
import { usePublish } from '../hooks/use-publish'
import { INIT_DELAY } from '@/consts'

export function MusicList() {
	const { items, loading } = useMusicIndex()
	const { siteContent } = useConfigStore()
	const { isAuth, onChoosePrivateKey, onSetPrimary, onDelete } = usePublish()
	const { setMode } = useMusicStore()
	const router = useRouter()
	const keyInputRef = useRef<HTMLInputElement>(null)
	const [optimisticPrimary, setOptimisticPrimary] = useState<string | null>(null)

	const primarySlug = optimisticPrimary || siteContent.primaryMusicSlug || (items.length > 0 ? items[0].slug : '')

	const handleSetPrimary = (slug: string) => {
		if (!isAuth) {
			toast.info('请先导入密钥')
			return
		}
		setOptimisticPrimary(slug)
		onSetPrimary(slug)
	}

	const handleDelete = (slug: string, title: string) => {
		if (!isAuth) {
			toast.info('请先导入密钥')
			return
		}
		if (window.confirm(`确定删除《${title || slug}》吗？该操作不可恢复。`)) {
			onDelete(slug)
		}
	}

	const handleNew = () => {
		setMode('create')
		router.push('/music/new')
	}

	return (
		<>
			<input
				ref={keyInputRef}
				type='file'
				accept='.pem'
				hidden
				onChange={async e => {
					const file = e.target.files?.[0]
					if (file) {
						try {
							await onChoosePrivateKey(file)
							toast.success('密钥已导入')
						} catch (err: any) {
							toast.error(err?.message || '密钥导入失败')
						}
					}
					if (e.currentTarget) e.currentTarget.value = ''
				}}
			/>

			<motion.div
				initial={{ opacity: 0, scale: 0.8 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ delay: INIT_DELAY }}
				className='bg-card mx-auto mt-16 w-full max-w-[720px] rounded-[40px] border p-6 shadow'>
				<div className='mb-5 flex items-center justify-between'>
					<h1 className='text-lg font-semibold'>音乐管理</h1>
					<div className='flex items-center gap-2'>
						{!isAuth && (
							<button
								type='button'
								onClick={() => keyInputRef.current?.click()}
								className='rounded-xl border px-4 py-2 text-sm transition-colors hover:bg-black/5'>
								导入密钥
							</button>
						)}
						{isAuth && <span className='text-xs text-green-600'>已授权</span>}
						<button
							type='button'
							onClick={handleNew}
							className='brand-btn rounded-xl px-4 py-2 text-sm'>
							添加音乐
						</button>
					</div>
				</div>

				{loading && <div className='py-10 text-center text-sm text-secondary'>加载中...</div>}

				{!loading && items.length === 0 && (
					<div className='py-10 text-center text-sm text-secondary'>
						暂无音乐，点击右上角「添加音乐」开始
					</div>
				)}

				<ul className='divide-y'>
					{items.map((item, idx) => {
						const isPrimary = item.slug === primarySlug
						const isExternal = /^https?:\/\//.test(item.src)
						return (
							<li key={item.slug} className='flex items-center gap-3 py-3'>
								<span className='w-6 text-center text-xs text-secondary'>{idx + 1}</span>
								<div className='min-w-0 flex-1'>
									<div className='flex items-center gap-2'>
										<span className='truncate text-sm font-medium'>{item.title || item.slug}</span>
										{isPrimary && <span className='shrink-0 rounded bg-brand px-1.5 py-0.5 text-[10px] text-white'>主页播放</span>}
									</div>
									<div className='mt-0.5 flex items-center gap-2 text-xs text-secondary'>
										<span className='truncate'>{item.artist || '未知作者'}</span>
										<span className='shrink-0 rounded bg-black/5 px-1 py-0.5'>{isExternal ? '外链' : '上传'}</span>
										{item.duration !== undefined && <span>{Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, '0')}</span>}
									</div>
								</div>
								<div className='flex shrink-0 items-center gap-1.5'>
									{!isPrimary && (
										<button
											type='button'
											onClick={() => handleSetPrimary(item.slug)}
											className='rounded-lg border px-2 py-1 text-xs transition-colors hover:bg-black/5'>
											设为主页播放
										</button>
									)}
									<Link
										href={`/music/${item.slug}`}
										className='rounded-lg border px-2 py-1 text-xs transition-colors hover:bg-black/5'>
										编辑
									</Link>
									<button
										type='button'
										onClick={() => handleDelete(item.slug, item.title)}
										className='rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-600 transition-colors hover:bg-red-100'>
										删除
									</button>
								</div>
							</li>
						)
					})}
				</ul>
			</motion.div>
		</>
	)
}
