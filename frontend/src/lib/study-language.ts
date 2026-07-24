export type StudyLanguage = 'ja' | 'zh'

export const STUDY_LANGUAGE_LABELS: Record<StudyLanguage, string> = {
  ja: 'Japanese',
  zh: 'Chinese',
}

export function isJapanese(language: StudyLanguage): boolean {
  return language === 'ja'
}
