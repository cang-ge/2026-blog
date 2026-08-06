import type { MusicConfig } from '@/app/music/types'

export type LoadedMusic = {
	slug: string
	config: MusicConfig
}

export async function loadMusic(slug: string): Promise<LoadedMusic> {
	if (!slug) {
		throw new Error('Slug is required')
	}

	let config: MusicConfig = { title: '', artist: '', audioSrc: '' }
	const configRes = await fetch(`/music/${encodeURIComponent(slug)}/config.json`)
	if (configRes.ok) {
		try {
			config = await configRes.json()
		} catch {
			// keep empty config
		}
	} else {
		throw new Error('Music not found')
	}

	return { slug, config }
}
