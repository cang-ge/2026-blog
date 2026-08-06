'use client'

import { useRef } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { useMusicStore } from '../stores/music-store'
import { usePublish } from '../hooks/use-publish'

export function MusicActions() {
	const { loading, form, mode, originalSlug } = useMusicStore()
	const { isAuth, onChoosePrivateKey, onPublish, onDelete } = usePublish()
	const keyInputRef = useRef<HTMLInputElement>(null)
	const router = useRouter()

	const handleSave = () => {
		if (!isAuth) {
			keyInputRef.current?.click()
			return
		}
		onPublish()
	}

	const handleDelete = () => {
		if (!isAuth) {
			toast.info('请先导入密钥')
			return
		}
		const confirmMsg = form?.title ? `确定删除《${form.title}》吗？该操作不可恢复。` : '确定删除当前歌曲吗？该操作不可恢复。'
		if (window.confirm(confirmMsg)) {
			onDelete()
		}
	}

	const handleCancel = () => {
		if (!window.confirm('放弃本次修改吗？')) return
		router.push('/music')
	}

	const buttonText = isAuth ? '保存' : '导入密钥'

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
			<ul className='fixed bottom-4 right-4 z-50 flex items-center gap-2'>
				{mode === 'edit' && (
					<motion.div
						initial={{ opacity: 0, scale: 0.6 }}
						animate={{ opacity: 1, scale: 1 }}
						className='flex items-center gap-2'>
						<div className='rounded-lg border bg-blue-50 px-4 py-2 text-sm text-blue-700'>编辑模式</div>
						<motion.button
							initial={{ opacity: 0, scale: 0.6 }}
							animate={{ opacity: 1, scale: 1 }}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className='rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-100'
							disabled={loading}
							onClick={handleDelete}>
							删除
						</motion.button>
					</motion.div>
				)}

				<motion.button
					initial={{ opacity: 0, scale: 0.6 }}
					animate={{ opacity: 1, scale: 1 }}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={handleCancel}
					disabled={loading}
					className='bg-card rounded-xl border px-4 py-2 text-sm'>
					取消
				</motion.button>

				<motion.button
					initial={{ opacity: 0, scale: 0.6 }}
					animate={{ opacity: 1, scale: 1 }}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					className='brand-btn px-6'
					disabled={loading}
					onClick={handleSave}>
					{buttonText}
				</motion.button>
			</ul>
		</>
	)
}
