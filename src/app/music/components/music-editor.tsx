'use client'

import { motion } from 'motion/react'
import { INIT_DELAY } from '@/consts'
import { useMusicStore } from '../stores/music-store'
import { AudioSection } from './sections/audio-section'

export function MusicEditor() {
	const { form, updateForm, mode } = useMusicStore()
	const isEdit = mode === 'edit'

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ delay: INIT_DELAY }}
			className='bg-card flex w-[640px] flex-col gap-4 rounded-[40px] border p-6 shadow'>
			<div className='mb-1 flex gap-3'>
				<input
					type='text'
					placeholder='歌曲标题'
					className='bg-card flex-1 rounded-lg border px-3 py-2 text-sm'
					value={form.title}
					onChange={e => updateForm({ title: e.target.value })}
				/>
				<input
					type='text'
					placeholder='歌手 / 作者'
					className='bg-card w-[200px] rounded-lg border px-3 py-2 text-sm'
					value={form.artist}
					onChange={e => updateForm({ artist: e.target.value })}
				/>
			</div>

			<div className='flex items-center gap-3'>
				<input
					type='text'
					placeholder='slug（英文小写，创建后不可改）'
					className='bg-card flex-1 rounded-lg border px-3 py-2 text-sm'
					value={form.slug}
					disabled={isEdit}
					onChange={e =>
						updateForm({
							slug: e.target.value
								.toLowerCase()
								.replace(/[^a-z0-9-]/g, '-')
								.replace(/-+/g, '-')
						})
					}
				/>
				<input
					type='number'
					placeholder='排序'
					className='bg-card w-[80px] rounded-lg border px-3 py-2 text-sm'
					value={form.order}
					onChange={e => updateForm({ order: Number(e.target.value) || 0 })}
				/>
				<label className='flex items-center gap-2 text-sm'>
					<input
						type='checkbox'
						checked={form.hidden}
						onChange={e => updateForm({ hidden: e.target.checked })}
					/>
					前台隐藏
				</label>
			</div>

			{isEdit && form.duration !== undefined && (
				<div className='text-xs text-secondary'>时长：约 {Math.floor(form.duration / 60)}分{form.duration % 60}秒</div>
			)}

			<AudioSection />
		</motion.div>
	)
}
