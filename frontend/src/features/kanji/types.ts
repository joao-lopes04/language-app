import type { JlptLevel } from '@/features/vocabulary/jlpt'

export type KanjiSummary = {
  id: number
  character: string
  meanings: string
  jlpt_level: JlptLevel | null
  hsk_level: number | null
  is_favorite: boolean
}

export type KanjiRelatedWord = {
  id: number
  japanese: string
  reading: string
  meaning: string
}

export type KanjiDetail = {
  id: number
  character: string
  meanings: string
  on_readings: string | null
  kun_readings: string | null
  stroke_count: number | null
  jlpt_level: JlptLevel | null
  hsk_level: number | null
  notes: string | null
  related_words: KanjiRelatedWord[]
  is_favorite: boolean
}

export type KanjiPage = {
  items: KanjiSummary[]
  total: number
  limit: number
  offset: number
}

export type FetchKanjiParams = {
  q?: string
  jlptLevel?: JlptLevel
  hskLevel?: number
  favoritesOnly?: boolean
  limit?: number
  offset?: number
}
