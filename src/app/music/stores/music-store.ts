import { create } from 'zustand'
import { toast } from 'sonner'
import { loadMusic } from '@/lib/load-music'
import type { AudioSource } from '../types'

export type MusicForm = {
	slug: string
	title: string
	artist: string
	order: number
	hidden: boolean
	duration?: number
}

type MusicStore = {
	// Mode state
	mode: 'create' | 'edit'
	originalSlug: string | null
	setMode: (mode: 'create' | 'edit', originalSlug?: string) => void

	// Form state
	form: MusicForm
	updateForm: (updates: Partial<MusicForm>) => void
	setForm: (form: MusicForm) => void

	// Audio source state
	audioSource: AudioSource | null
	setAudioSource: (source: AudioSource | null) => void
	setAudioDuration: (duration: number) => void

	// Publish state
	loading: boolean
	setLoading: (loading: boolean) => void

	// Load music for editing
	loadMusicForEdit: (slug: string) => Promise<void>

	// Reset to create mode
	reset: () => void
}

const initialForm: MusicForm = {
	slug: '',
	title: '',
	artist: '',
	order: 0,
	hidden: false
}

export const useMusicStore = create<MusicStore>((set, get) => ({
	// Mode state
	mode: 'create',
	originalSlug: null,
	setMode: (mode, originalSlug) => set({ mode, originalSlug: originalSlug || null }),

	// Form state
	form: { ...initialForm },
	updateForm: updates => set(state => ({ form: { ...state.form, ...updates } })),
	setForm: form => set({ form }),

	// Audio source state
	audioSource: null,
	setAudioSource: source => {
		const prev = get().audioSource
		if (prev?.type === 'file' && (source?.type !== 'file' || prev.previewUrl !== source.previewUrl)) {
			URL.revokeObjectURL(prev.previewUrl)
		}
		set({ audioSource: source })
	},
	setAudioDuration: duration =>
		set(state => ({
			form: { ...state.form, duration },
			audioSource: state.audioSource ? { ...state.audioSource, duration } : state.audioSource
		})),

	// Publish state
	loading: false,
	setLoading: loading => set({ loading }),

	// Load music for editing
	loadMusicForEdit: async (slug: string) => {
		try {
			set({ loading: true })
			const music = await loadMusic(slug)
			const cfg = music.config
			const audioSource: AudioSource | null = cfg.audioSrc
				? { type: 'url', url: cfg.audioSrc }
				: null

			set({
				mode: 'edit',
				originalSlug: slug,
				form: {
					slug,
					title: cfg.title || '',
					artist: cfg.artist || '',
					order: cfg.order ?? 0,
					hidden: cfg.hidden || false,
					duration: cfg.duration
				},
				audioSource,
				loading: false
			})

			toast.success('音乐加载成功')
		} catch (err: any) {
			console.error('Failed to load music:', err)
			toast.error(err?.message || '加载音乐失败')
			set({ loading: false })
			throw err
		}
	},

	// Reset to create mode
	reset: () => {
		// Revoke object URLs
		const { audioSource } = get()
		if (audioSource?.type === 'file') {
			URL.revokeObjectURL(audioSource.previewUrl)
		}

		set({
			mode: 'create',
			originalSlug: null,
			form: { ...initialForm },
			audioSource: null
		})
	}
}))
