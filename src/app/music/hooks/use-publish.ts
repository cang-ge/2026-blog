import { useCallback } from 'react'
import { readFileAsText } from '@/lib/file-utils'
import { toast } from 'sonner'
import { pushMusic } from '../services/push-music'
import { deleteMusic } from '../services/delete-music'
import { setPrimaryMusic } from '../services/set-primary-music'
import { useMusicStore } from '../stores/music-store'
import { useAuthStore } from '@/hooks/use-auth'

export function usePublish() {
	const { loading, setLoading, form, audioSource, mode, originalSlug } = useMusicStore()
	const { isAuth, setPrivateKey } = useAuthStore()

	const onChoosePrivateKey = useCallback(
		async (file: File) => {
			const pem = await readFileAsText(file)
			setPrivateKey(pem)
		},
		[setPrivateKey]
	)

	const onPublish = useCallback(async () => {
		try {
			setLoading(true)
			await pushMusic({
				slug: form.slug,
				title: form.title,
				artist: form.artist,
				order: form.order,
				hidden: form.hidden,
				duration: form.duration,
				audioSource,
				mode,
				originalSlug
			})
		} catch (err: any) {
			console.error(err)
			toast.error(err?.message || '操作失败')
		} finally {
			setLoading(false)
		}
	}, [form, audioSource, mode, originalSlug, setLoading])

	const onDelete = useCallback(async () => {
		const targetSlug = originalSlug || form.slug
		if (!targetSlug) {
			toast.error('缺少 slug，无法删除')
			return
		}
		try {
			setLoading(true)
			await deleteMusic(targetSlug)
		} catch (err: any) {
			console.error(err)
			toast.error(err?.message || '删除失败')
		} finally {
			setLoading(false)
		}
	}, [form.slug, originalSlug, setLoading])

	const onSetPrimary = useCallback(
		async (slug: string) => {
			try {
				setLoading(true)
				await setPrimaryMusic(slug)
			} catch (err: any) {
				console.error(err)
				toast.error(err?.message || '设置失败')
			} finally {
				setLoading(false)
			}
		},
		[setLoading]
	)

	return {
		isAuth,
		loading,
		onChoosePrivateKey,
		onPublish,
		onDelete,
		onSetPrimary
	}
}
