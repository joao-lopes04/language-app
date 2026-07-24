import { useCallback, useEffect, useState } from 'react'
import { Star } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { JLPT_LEVELS, type JlptLevel } from '@/features/vocabulary/jlpt'
import { useAuth } from '@/context/AuthContext'
import {
  createDeckFromHsk,
  createDeckFromJlpt,
  fetchKanjiDetail,
  fetchKanjiList,
  setKanjiFavorite,
} from '@/lib/api'
import { kanjiToWordDraft, saveWordDraft } from '@/lib/word-draft'
import type { KanjiDetail, KanjiSummary } from '@/features/kanji/types'

type KanjiDictionaryProps = {
  onAddToVocabulary?: () => void
}

type JlptFilter = 'all' | JlptLevel
type HskFilter = 'all' | 1 | 2
const PAGE_SIZE = 50

function lastViewedKey(language: string) {
  return `kanji-last-viewed-${language}`
}

export function KanjiDictionary({ onAddToVocabulary }: KanjiDictionaryProps) {
  const { isJapaneseStudy, user } = useAuth()
  const showJlpt = isJapaneseStudy
  const title = isJapaneseStudy ? 'Kanji dictionary' : 'Character dictionary'
  const [items, setItems] = useState<KanjiSummary[]>([])
  const [total, setTotal] = useState(0)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<KanjiDetail | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filter, setFilter] = useState<JlptFilter>('all')
  const [hskFilter, setHskFilter] = useState<HskFilter>('all')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState('')
  const [deckMsg, setDeckMsg] = useState('')

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(handle)
  }, [search])

  const loadPage = useCallback(
    async (offset: number, append: boolean) => {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoadingList(true)
      }
      setError('')
      try {
        const page = await fetchKanjiList({
          q: debouncedSearch || undefined,
          jlptLevel: filter === 'all' ? undefined : filter,
          hskLevel: hskFilter === 'all' ? undefined : hskFilter,
          favoritesOnly,
          limit: PAGE_SIZE,
          offset,
        })
        setTotal(page.total)
        setItems((prev) => (append ? [...prev, ...page.items] : page.items))
        if (!append) {
          const saved = user
            ? localStorage.getItem(lastViewedKey(user.study_language))
            : null
          const savedId = saved ? Number(saved) : null
          const firstId = page.items[0]?.id ?? null
          const pick =
            savedId && page.items.some((k) => k.id === savedId)
              ? savedId
              : firstId
          setSelectedId(pick)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load kanji')
      } finally {
        setLoadingList(false)
        setLoadingMore(false)
      }
    },
    [debouncedSearch, filter, hskFilter, favoritesOnly, user],
  )

  useEffect(() => {
    void loadPage(0, false)
  }, [loadPage])

  useEffect(() => {
    if (selectedId === null || !user) {
      setDetail(null)
      return
    }
    localStorage.setItem(lastViewedKey(user.study_language), String(selectedId))
    let cancelled = false
    async function loadDetail() {
      setLoadingDetail(true)
      setError('')
      try {
        const data = await fetchKanjiDetail(selectedId!)
        if (!cancelled) {
          setDetail(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load detail')
          setDetail(null)
        }
      } finally {
        if (!cancelled) {
          setLoadingDetail(false)
        }
      }
    }
    void loadDetail()
    return () => {
      cancelled = true
    }
  }, [selectedId, user])

  async function toggleFavorite(kanjiId: number, next: boolean) {
    await setKanjiFavorite(kanjiId, next)
    setItems((prev) =>
      prev.map((k) => (k.id === kanjiId ? { ...k, is_favorite: next } : k)),
    )
    if (detail?.id === kanjiId) {
      setDetail({ ...detail, is_favorite: next })
    }
  }

  function openAddToVocabulary() {
    if (!detail) {
      return
    }
    saveWordDraft(kanjiToWordDraft(detail, isJapaneseStudy))
    onAddToVocabulary?.()
  }

  async function createDeckFromFilter() {
    setDeckMsg('')
    try {
      if (isJapaneseStudy) {
        const level = filter === 'all' ? 'N5' : filter
        await createDeckFromJlpt(level)
        setDeckMsg(`Deck created from your ${level} vocabulary. Open Decks to study.`)
      } else {
        const level = hskFilter === 'all' ? 1 : hskFilter
        await createDeckFromHsk(level)
        setDeckMsg(`Deck created from HSK ${level} vocabulary. Open Decks to study.`)
      }
    } catch (err) {
      setDeckMsg(err instanceof Error ? err.message : 'Could not create deck')
    }
  }

  const canLoadMore = items.length < total

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {loadingList && items.length === 0
            ? 'Loading character list…'
            : isJapaneseStudy
              ? `${total} kanji (N5 + N4). Showing ${items.length}.`
              : `${total} characters (HSK 1–2). Showing ${items.length}.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="block min-w-[12rem] flex-1 space-y-1 text-sm">
            <span className="text-muted-foreground">Search</span>
            <input
              type="search"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Character, meaning, reading…"
            />
          </label>
          {showJlpt ? (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              JLPT
              <select
                className="rounded-md border border-input bg-background px-2 py-2 text-sm text-foreground"
                value={filter}
                onChange={(e) => setFilter(e.target.value as JlptFilter)}
              >
                <option value="all">All</option>
                {JLPT_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              HSK
              <select
                className="rounded-md border border-input bg-background px-2 py-2 text-sm text-foreground"
                value={hskFilter}
                onChange={(e) =>
                  setHskFilter(
                    e.target.value === 'all' ? 'all' : (Number(e.target.value) as 1 | 2),
                  )
                }
              >
                <option value="all">All</option>
                <option value="1">HSK 1</option>
                <option value="2">HSK 2</option>
              </select>
            </label>
          )}
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={favoritesOnly}
              onChange={(e) => setFavoritesOnly(e.target.checked)}
            />
            Favorites
          </label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void createDeckFromFilter()}
          >
            {isJapaneseStudy
              ? filter === 'all'
                ? 'Deck from N5 words'
                : `Deck from ${filter} words`
              : hskFilter === 'all'
                ? 'Deck from HSK 1 words'
                : `Deck from HSK ${hskFilter} words`}
          </Button>
        </div>
        {deckMsg ? <p className="text-xs text-muted-foreground">{deckMsg}</p> : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">Entries</p>
            {loadingList && items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No kanji match.</p>
            ) : (
              <>
                <ul className="max-h-80 space-y-1 overflow-y-auto rounded-lg border border-border p-1">
                  {items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                          selectedId === item.id
                            ? 'bg-muted font-medium'
                            : 'hover:bg-muted/60'
                        }`}
                        onClick={() => setSelectedId(item.id)}
                      >
                        <span className="text-2xl">{item.character}</span>
                        <span className="ml-2 flex-1 truncate text-muted-foreground">
                          {item.meanings}
                        </span>
                        <button
                          type="button"
                          className="ml-1 shrink-0 p-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            void toggleFavorite(item.id, !item.is_favorite)
                          }}
                          aria-label="Toggle favorite"
                        >
                          <Star
                            className={`size-4 ${
                              item.is_favorite
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-muted-foreground'
                            }`}
                          />
                        </button>
                      </button>
                    </li>
                  ))}
                </ul>
                {canLoadMore ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={loadingMore}
                    onClick={() => void loadPage(items.length, true)}
                  >
                    {loadingMore ? 'Loading…' : 'Load more'}
                  </Button>
                ) : null}
              </>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Detail</p>
            {loadingDetail ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : detail ? (
              <div className="space-y-3 rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-5xl font-medium">{detail.character}</p>
                  <button
                    type="button"
                    onClick={() => void toggleFavorite(detail.id, !detail.is_favorite)}
                    aria-label="Toggle favorite"
                  >
                    <Star
                      className={`size-6 ${
                        detail.is_favorite
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-sm">{detail.meanings}</p>
                {detail.on_readings ? (
                  <p className="text-sm text-muted-foreground">
                    {isJapaneseStudy ? 'On: ' : 'Reading: '}
                    {detail.on_readings}
                  </p>
                ) : null}
                {detail.kun_readings ? (
                  <p className="text-sm text-muted-foreground">
                    Kun: {detail.kun_readings}
                  </p>
                ) : null}
                {detail.hsk_level ? (
                  <p className="text-sm text-muted-foreground">
                    HSK {detail.hsk_level}
                  </p>
                ) : null}
                {showJlpt && detail.jlpt_level ? (
                  <p className="text-sm">
                    JLPT:{' '}
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs">
                      {detail.jlpt_level}
                    </span>
                  </p>
                ) : null}
                {detail.notes ? (
                  <p className="text-xs text-muted-foreground">{detail.notes}</p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" onClick={openAddToVocabulary}>
                    Add to vocabulary
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Opens Words with the form prefilled so you can edit before saving.
                </p>
                <div className="space-y-2 border-t border-border pt-3">
                  <p className="text-sm font-medium">Related vocabulary</p>
                  {detail.related_words.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No saved words contain this character yet.
                    </p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {detail.related_words.map((word) => (
                        <li key={word.id} className="rounded-md bg-muted/50 px-2 py-1">
                          <span className="font-medium">{word.japanese}</span>{' '}
                          <span className="text-muted-foreground">
                            ({word.reading}) — {word.meaning}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a character from the list.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
