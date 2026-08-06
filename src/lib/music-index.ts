'use client'

import { readTextFileFromRepo, toBase64Utf8 } from '@/lib/github-client'

import type { MusicTrackItem } from '@/app/music/types'

export type { MusicTrackItem } from '@/app/music/types'

const MUSIC_INDEX_PATH = 'public/music/index.json'

export async function prepareMusicIndex(token: string, owner: string, repo: string, item: MusicTrackItem, branch: string): Promise<string> {
	let list: MusicTrackItem[] = []
	try {
		const txt = await readTextFileFromRepo(token, owner, repo, MUSIC_INDEX_PATH, branch)
		if (txt) list = JSON.parse(txt)
	} catch {
		// ignore parse errors and start from empty list
	}
	const map = new Map<string, MusicTrackItem>(list.map(i => [i.slug, i]))
	// 编辑时保留原 addedAt，避免重排
	const existing = list.find(i => i.slug === item.slug)
	const itemToSet = existing ? { ...item, addedAt: existing.addedAt } : item
	map.set(itemToSet.slug, itemToSet)
	const next = Array.from(map.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
	return JSON.stringify(next, null, 2)
}

export async function removeMusicFromIndex(token: string, owner: string, repo: string, slug: string, branch: string): Promise<string> {
	let list: MusicTrackItem[] = []
	try {
		const txt = await readTextFileFromRepo(token, owner, repo, MUSIC_INDEX_PATH, branch)
		if (txt) list = JSON.parse(txt)
	} catch {
		// ignore parse errors and keep empty list
	}
	const next = list.filter(item => item.slug !== slug)
	return JSON.stringify(next, null, 2)
}
