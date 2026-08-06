export type MusicTrackItem = {
	slug: string
	title: string
	artist: string
	src: string
	duration?: number
	order: number
	hidden?: boolean
	addedAt: string
}

export type MusicConfig = {
	title: string
	artist: string
	audioSrc: string
	order: number
	duration?: number
	hidden?: boolean
}

export type AudioSource =
	| { type: 'file'; file: File; previewUrl: string; filename: string; hash?: string; duration?: number }
	| { type: 'url'; url: string }
