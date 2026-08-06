import useSWR from 'swr'
import { useAuthStore } from '@/hooks/use-auth'
import type { MusicTrackItem } from '@/app/music/types'

export type { MusicTrackItem } from '@/app/music/types'

// 改进 fetcher，抛出状态码以便处理 404
const fetcher = async (url: string) => {
	const res = await fetch(url, { cache: 'no-store' })
	if (!res.ok) {
		const error: any = new Error('Fetch failed')
		error.status = res.status
		throw error
	}
	const data = await res.json()
	return Array.isArray(data) ? data : []
}

export function useMusicIndex() {
	const { isAuth } = useAuthStore()
	const { data, error, isLoading } = useSWR<MusicTrackItem[]>('/music/index.json', fetcher, {
		revalidateOnFocus: false,
		revalidateOnReconnect: true
	})

	let result = data || []
	if (!isAuth) {
		result = result.filter(item => !item.hidden)
	}

	return {
		items: result,
		loading: isLoading,
		error
	}
}
