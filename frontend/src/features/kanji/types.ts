import type { JlptLevel } from '@/features/vocabulary/jlpt'
import type { Word } from '@/lib/api'

export type KanjiSummary = {
  id: number
  character: string
  meanings: string
  jlpt_level: JlptLevel | null
}

export type KanjiDetail = {
  id: number
  character: string
  meanings: string
  on_readings: string | null
  kun_readings: string | null
  stroke_count: number | null
  jlpt_level: JlptLevel | null
  notes: string | null
  related_words: Word[]
}

export type FetchKanjiParams = {
  q?: string
  jlptLevel?: JlptLevel
}
