import { getAuthToken } from '@/lib/auth-storage'
import type {
  FetchKanjiParams,
  KanjiDetail,
  KanjiPage,
} from '@/features/kanji/types'
import type { JlptLevel } from '@/features/vocabulary/jlpt'
import type { StudyLanguage } from '@/lib/study-language'

const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(
  /\/$/,
  '',
)

const API_BASE =
  configuredApiUrl || (import.meta.env.DEV ? '/api/v1' : '')

if (!API_BASE && import.meta.env.PROD) {
  throw new Error(
    'Missing VITE_API_URL for production build. Set it in Cloudflare Pages env or frontend/.env.production.',
  )
}

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  const token = getAuthToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(`${API_BASE}${path}`, { ...init, headers })
}

async function ensureOk(response: Response, label: string): Promise<void> {
  if (!response.ok) {
    let detail = `${label} (${response.status})`
    try {
      const body = (await response.json()) as { detail?: unknown }
      if (body.detail) {
        detail += `: ${JSON.stringify(body.detail)}`
      }
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(detail)
  }
}

export async function fetchHealth(): Promise<{ status: string }> {
  const response = await apiFetch('/health')
  await ensureOk(response, 'Health check failed')
  return response.json() as Promise<{ status: string }>
}

export type AppMeta = {
  id: number
  app_name: string
  schema_version: string
}

export async function fetchAppMeta(): Promise<AppMeta> {
  const response = await apiFetch('/meta')
  await ensureOk(response, 'Meta fetch failed')
  return response.json() as Promise<AppMeta>
}

export type AuthUser = {
  id: number
  email: string
  study_language: StudyLanguage
  is_admin?: boolean
}

export type TokenResponse = {
  access_token: string
  token_type: string
  user: AuthUser
}

export async function registerUser(
  email: string,
  password: string,
): Promise<TokenResponse> {
  const response = await apiFetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  await ensureOk(response, 'Registration failed')
  return response.json() as Promise<TokenResponse>
}

export async function loginUser(
  email: string,
  password: string,
): Promise<TokenResponse> {
  const body = new URLSearchParams()
  body.set('username', email)
  body.set('password', password)
  const response = await apiFetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  await ensureOk(response, 'Login failed')
  return response.json() as Promise<TokenResponse>
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const response = await apiFetch('/auth/me')
  await ensureOk(response, 'Failed to load profile')
  return response.json() as Promise<AuthUser>
}

export async function updateStudyLanguage(
  studyLanguage: StudyLanguage,
): Promise<AuthUser> {
  const response = await apiFetch('/auth/me/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ study_language: studyLanguage }),
  })
  await ensureOk(response, 'Failed to update language')
  return response.json() as Promise<AuthUser>
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<AuthUser> {
  const response = await apiFetch('/auth/me/password', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  })
  await ensureOk(response, 'Failed to change password')
  return response.json() as Promise<AuthUser>
}

export type ForgotPasswordResult = {
  message: string
  reset_token?: string | null
}

export async function forgotPassword(email: string): Promise<ForgotPasswordResult> {
  const response = await apiFetch('/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  await ensureOk(response, 'Forgot password failed')
  return response.json() as Promise<ForgotPasswordResult>
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<AuthUser> {
  const response = await apiFetch('/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword }),
  })
  await ensureOk(response, 'Reset password failed')
  return response.json() as Promise<AuthUser>
}

export type AdminUserSummary = {
  id: number
  email: string
  study_language: StudyLanguage
  created_at: string
  word_count: number
}

export async function fetchAdminUsers(): Promise<AdminUserSummary[]> {
  const response = await apiFetch('/admin/users')
  await ensureOk(response, 'Failed to load users')
  return response.json() as Promise<AdminUserSummary[]>
}

export async function exportVocabularyCsv(): Promise<Blob> {
  const response = await apiFetch('/words/export')
  await ensureOk(response, 'Export failed')
  return response.blob()
}

export async function importVocabularyCsv(file: File): Promise<{
  created: number
  skipped: number
}> {
  const body = new FormData()
  body.append('file', file)
  const response = await apiFetch('/words/import', {
    method: 'POST',
    body,
  })
  await ensureOk(response, 'Import failed')
  return response.json() as Promise<{ created: number; skipped: number }>
}

export type Word = {
  id: number
  japanese: string
  reading: string
  meaning: string
  notes: string | null
  jlpt_level: JlptLevel
  created_at: string
}

export type WordInput = {
  japanese: string
  reading: string
  meaning: string
  notes?: string | null
  jlpt_level: JlptLevel
}

export type FetchWordsParams = {
  jlptLevel?: JlptLevel
  q?: string
}

export async function fetchWords(params: FetchWordsParams = {}): Promise<Word[]> {
  const search = new URLSearchParams()
  if (params.jlptLevel !== undefined) {
    search.set('jlpt_level', params.jlptLevel)
  }
  const trimmed = params.q?.trim()
  if (trimmed) {
    search.set('q', trimmed)
  }
  const queryString = search.toString()
  const response = await apiFetch(
    `/words${queryString ? `?${queryString}` : ''}`,
  )
  await ensureOk(response, 'Failed to load words')
  return response.json() as Promise<Word[]>
}

export async function createWord(input: WordInput): Promise<Word> {
  const response = await apiFetch('/words', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  await ensureOk(response, 'Failed to create word')
  return response.json() as Promise<Word>
}

export async function updateWord(
  id: number,
  input: Partial<WordInput>,
): Promise<Word> {
  const response = await apiFetch(`/words/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  await ensureOk(response, 'Failed to update word')
  return response.json() as Promise<Word>
}

export async function deleteWord(id: number): Promise<void> {
  const response = await apiFetch(`/words/${id}`, {
    method: 'DELETE',
  })
  await ensureOk(response, 'Failed to delete word')
}

export async function fetchKanjiList(
  params: FetchKanjiParams = {},
): Promise<KanjiPage> {
  const search = new URLSearchParams()
  const trimmed = params.q?.trim()
  if (trimmed) {
    search.set('q', trimmed)
  }
  if (params.jlptLevel !== undefined) {
    search.set('jlpt_level', params.jlptLevel)
  }
  if (params.hskLevel !== undefined) {
    search.set('hsk_level', String(params.hskLevel))
  }
  if (params.favoritesOnly) {
    search.set('favorites_only', 'true')
  }
  if (params.limit !== undefined) {
    search.set('limit', String(params.limit))
  }
  if (params.offset !== undefined) {
    search.set('offset', String(params.offset))
  }
  const queryString = search.toString()
  const response = await apiFetch(
    `/kanji${queryString ? `?${queryString}` : ''}`,
  )
  await ensureOk(response, 'Failed to load kanji')
  return response.json() as Promise<KanjiPage>
}

export async function setKanjiFavorite(
  kanjiId: number,
  favorite: boolean,
): Promise<void> {
  const response = await apiFetch(`/kanji/${kanjiId}/favorite`, {
    method: favorite ? 'POST' : 'DELETE',
  })
  await ensureOk(response, 'Failed to update favorite')
}

export async function fetchKanjiDetail(id: number): Promise<KanjiDetail> {
  const response = await apiFetch(`/kanji/${id}`)
  await ensureOk(response, 'Failed to load kanji detail')
  return response.json() as Promise<KanjiDetail>
}

export type GrammarNote = {
  id: number
  title: string
  content: string
  jlpt_level: JlptLevel | null
  created_at: string
  updated_at: string
}

export type GrammarNoteInput = {
  title: string
  content: string
  jlpt_level?: JlptLevel | null
}

export type FetchGrammarNotesParams = {
  q?: string
  jlptLevel?: JlptLevel
}

export async function fetchGrammarNotes(
  params: FetchGrammarNotesParams = {},
): Promise<GrammarNote[]> {
  const search = new URLSearchParams()
  const trimmed = params.q?.trim()
  if (trimmed) {
    search.set('q', trimmed)
  }
  if (params.jlptLevel !== undefined) {
    search.set('jlpt_level', params.jlptLevel)
  }
  const queryString = search.toString()
  const response = await apiFetch(
    `/grammar-notes${queryString ? `?${queryString}` : ''}`,
  )
  await ensureOk(response, 'Failed to load grammar notes')
  return response.json() as Promise<GrammarNote[]>
}

export async function createGrammarNote(
  input: GrammarNoteInput,
): Promise<GrammarNote> {
  const response = await apiFetch('/grammar-notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  await ensureOk(response, 'Failed to create note')
  return response.json() as Promise<GrammarNote>
}

export async function updateGrammarNote(
  id: number,
  input: Partial<GrammarNoteInput>,
): Promise<GrammarNote> {
  const response = await apiFetch(`/grammar-notes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  await ensureOk(response, 'Failed to update note')
  return response.json() as Promise<GrammarNote>
}

export async function deleteGrammarNote(id: number): Promise<void> {
  const response = await apiFetch(`/grammar-notes/${id}`, {
    method: 'DELETE',
  })
  await ensureOk(response, 'Failed to delete note')
}

export type DeckSummary = {
  id: number
  name: string
  created_at: string
  word_count: number
}

export type Deck = {
  id: number
  name: string
  created_at: string
  words: Word[]
}

export async function fetchDecks(): Promise<DeckSummary[]> {
  const response = await apiFetch('/decks')
  await ensureOk(response, 'Failed to load decks')
  return response.json() as Promise<DeckSummary[]>
}

export async function fetchDeck(id: number): Promise<Deck> {
  const response = await apiFetch(`/decks/${id}`)
  await ensureOk(response, 'Failed to load deck')
  return response.json() as Promise<Deck>
}

export async function createDeck(name: string): Promise<Deck> {
  const response = await apiFetch('/decks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  await ensureOk(response, 'Failed to create deck')
  return response.json() as Promise<Deck>
}

export async function createDeckFromJlpt(level: JlptLevel): Promise<Deck> {
  const response = await apiFetch('/decks/from-jlpt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jlpt_level: level }),
  })
  await ensureOk(response, 'Failed to create deck from JLPT level')
  return response.json() as Promise<Deck>
}

export async function createDeckFromHsk(hskLevel: number): Promise<Deck> {
  const response = await apiFetch('/decks/from-hsk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hsk_level: hskLevel }),
  })
  await ensureOk(response, 'Failed to create deck from HSK level')
  return response.json() as Promise<Deck>
}

export async function updateDeckName(id: number, name: string): Promise<Deck> {
  const response = await apiFetch(`/decks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  await ensureOk(response, 'Failed to rename deck')
  return response.json() as Promise<Deck>
}

export async function setDeckWords(id: number, wordIds: number[]): Promise<Deck> {
  const response = await apiFetch(`/decks/${id}/words`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word_ids: wordIds }),
  })
  await ensureOk(response, 'Failed to update deck words')
  return response.json() as Promise<Deck>
}

export async function deleteDeck(id: number): Promise<void> {
  const response = await apiFetch(`/decks/${id}`, {
    method: 'DELETE',
  })
  await ensureOk(response, 'Failed to delete deck')
}

export type ReviewRating = 'again' | 'good' | 'easy'

export type WordReviewState = {
  due_at: string
  interval_days: number
  repetitions: number
  lapses: number
  last_reviewed_at: string | null
}

export type DueWord = Word & {
  review: WordReviewState | null
}

export type ReviewSummary = {
  due_count: number
  total_words: number
  tracked_count: number
}

export async function fetchReviewSummary(): Promise<ReviewSummary> {
  const response = await apiFetch('/reviews/summary')
  await ensureOk(response, 'Failed to load review summary')
  return response.json() as Promise<ReviewSummary>
}

export async function fetchDueWords(): Promise<DueWord[]> {
  const response = await apiFetch('/reviews/due')
  await ensureOk(response, 'Failed to load due words')
  return response.json() as Promise<DueWord[]>
}

export async function rateWordReview(
  wordId: number,
  rating: ReviewRating,
): Promise<{ word: Word; review: WordReviewState }> {
  const response = await apiFetch(`/reviews/${wordId}/rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating }),
  })
  await ensureOk(response, 'Failed to save review rating')
  return response.json() as Promise<{ word: Word; review: WordReviewState }>
}

export type JlptCount = {
  level: JlptLevel
  count: number
}

export type HskCount = {
  level: number
  count: number
}

export type ReviewsByDay = {
  day: string
  count: number
}

export type DashboardStats = {
  vocabulary_total: number
  kanji_total: number
  grammar_notes_total: number
  decks_total: number
  srs_tracked: number
  srs_due_now: number
  review_events_total: number
  review_streak_days: number
  vocabulary_by_jlpt: JlptCount[]
  vocabulary_by_hsk: HskCount[]
  reviews_last_7_days: ReviewsByDay[]
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await apiFetch('/stats/dashboard')
  await ensureOk(response, 'Failed to load dashboard stats')
  return response.json() as Promise<DashboardStats>
}
