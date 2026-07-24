import type { WordInput } from '@/lib/api'

const STORAGE_KEY = 'language_study_word_draft'

export function saveWordDraft(draft: WordInput): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
}

export function consumeWordDraft(): WordInput | null {
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }
  sessionStorage.removeItem(STORAGE_KEY)
  try {
    return JSON.parse(raw) as WordInput
  } catch {
    return null
  }
}

export function kanjiToWordDraft(
  detail: {
    character: string
    meanings: string
    on_readings: string | null
    kun_readings: string | null
    jlpt_level: string | null
    notes: string | null
  },
  isJapanese: boolean,
): WordInput {
  const readingSource = isJapanese
    ? detail.kun_readings || detail.on_readings
    : detail.on_readings
  const reading =
    readingSource?.split(/[,、]/)[0]?.trim() || detail.character
  const meaning =
    detail.meanings.split(',')[0]?.trim() || detail.meanings
  return {
    japanese: detail.character,
    reading,
    meaning,
    notes: detail.notes ?? '',
    jlpt_level: (detail.jlpt_level as WordInput['jlpt_level']) ?? 'N5',
  }
}
