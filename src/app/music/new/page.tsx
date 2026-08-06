'use client'

import { useEffect } from 'react'
import { useMusicStore } from '../stores/music-store'
import { MusicEditor } from '../components/music-editor'
import { MusicActions } from '../components/music-actions'

export default function NewMusicPage() {
	const { reset } = useMusicStore()

	useEffect(() => {
		reset()
	}, [reset])

	return (
		<>
			<div className='flex h-full justify-center gap-6 px-6 pt-24 pb-12'>
				<MusicEditor />
			</div>
			<MusicActions />
		</>
	)
}
