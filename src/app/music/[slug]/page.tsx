'use client'

import { useParams } from 'next/navigation'
import { useLoadMusic } from '../hooks/use-load-music'
import { MusicEditor } from '../components/music-editor'
import { MusicActions } from '../components/music-actions'

export default function EditMusicPage() {
	const params = useParams() as { slug?: string }
	const slug = params?.slug || ''

	const { loading } = useLoadMusic(slug)

	if (loading) {
		return <div className='text-secondary flex h-screen items-center justify-center text-sm'>加载中...</div>
	}

	if (!slug) {
		return <div className='flex h-screen items-center justify-center text-sm text-red-500'>无效的音乐 ID</div>
	}

	return (
		<>
			<div className='flex h-full justify-center gap-6 px-6 pt-24 pb-12'>
				<MusicEditor />
			</div>
			<MusicActions />
		</>
	)
}
