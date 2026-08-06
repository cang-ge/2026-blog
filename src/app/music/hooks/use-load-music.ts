import { useEffect } from 'react'
import { useMusicStore } from '../stores/music-store'

export function useLoadMusic(slug: string) {
	const loadMusicForEdit = useMusicStore(state => state.loadMusicForEdit)
	const loading = useMusicStore(state => state.loading)

	useEffect(() => {
		if (!slug) return
		loadMusicForEdit(slug).catch(() => {
			// 错误已由 store 内部 toast，这里吞掉避免未捕获 promise
		})
	}, [slug, loadMusicForEdit])

	return { loading }
}
