import { useCallback, useEffect, useState } from 'react'

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
import { fetchKanjiDetail, fetchKanjiList } from '@/lib/api'
import type { KanjiDetail, KanjiSummary } from '@/features/kanji/types'

type JlptFilter = 'all' | JlptLevel

export function KanjiDictionary() {
  const { isJapaneseStudy } = useAuth()
  const showJlpt = isJapaneseStudy
  const title = isJapaneseStudy ? 'Kanji dictionary' : 'Character dictionary'
  const [items, setItems] = useState<KanjiSummary[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<KanjiDetail | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filter, setFilter] = useState<JlptFilter>('all')
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(handle)
  }, [search])

  const loadList = useCallback(async () => {
    setLoadingList(true)
    setError('')
    try {
      const list = await fetchKanjiList({
        q: debouncedSearch || undefined,
        jlptLevel: filter === 'all' ? undefined : filter,
      })
      setItems(list)
      setSelectedId((current) => {
        if (list.length === 0) {
          return null
        }
        if (current === null || !list.some((k) => k.id === current)) {
          return list[0].id
        }
        return current
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load kanji')
    } finally {
      setLoadingList(false)
    }
  }, [debouncedSearch, filter])

  useEffect(() => {
    void loadList()
  }, [loadList])

  useEffect(() => {
    if (selectedId === null) {
      setDetail(null)
      return
    }
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
  }, [selectedId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Browse seeded {isJapaneseStudy ? 'kanji' : 'characters'} (read-only).
          Detail shows vocabulary that contains each character.
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
          ) : null}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">Entries</p>
            {loadingList ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No kanji match.</p>
            ) : (
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
                      {item.jlpt_level ? (
                        <span className="ml-2 text-xs">{item.jlpt_level}</span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Detail</p>
            {loadingDetail ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : detail ? (
              <div className="space-y-3 rounded-lg border border-border p-4">
                <p className="text-5xl font-medium">{detail.character}</p>
                <p className="text-sm">{detail.meanings}</p>
                {detail.on_readings ? (
                  <p className="text-sm text-muted-foreground">
                    On: {detail.on_readings}
                  </p>
                ) : null}
                {detail.kun_readings ? (
                  <p className="text-sm text-muted-foreground">
                    Kun: {detail.kun_readings}
                  </p>
                ) : null}
                {detail.stroke_count !== null ? (
                  <p className="text-sm text-muted-foreground">
                    Strokes: {detail.stroke_count}
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

                <div className="space-y-2 border-t border-border pt-3">
                  <p className="text-sm font-medium">Related vocabulary</p>
                  {detail.related_words.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No saved words contain this character yet. Add vocabulary
                      with the kanji in the Japanese field (or romaji for now).
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
                Select a kanji from the list.
              </p>
            )}
          </div>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={() => void loadList()}>
          Refresh list
        </Button>
      </CardContent>
    </Card>
  )
}
