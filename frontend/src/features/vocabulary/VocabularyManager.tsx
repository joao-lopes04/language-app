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
import {
  createWord,
  deleteWord,
  fetchWords,
  updateWord,
  type Word,
  type WordInput,
} from '@/lib/api'

import { consumeWordDraft } from '@/lib/word-draft'

const emptyForm: WordInput = {
  japanese: '',
  reading: '',
  meaning: '',
  notes: '',
  jlpt_level: 'N5',
}

function toPayload(form: WordInput): WordInput {
  return {
    japanese: form.japanese.trim(),
    reading: form.reading.trim(),
    meaning: form.meaning.trim(),
    notes: form.notes?.trim() ? form.notes.trim() : null,
    jlpt_level: form.jlpt_level,
  }
}

type FilterValue = 'all' | JlptLevel

type VocabularyManagerProps = {
  draftNonce?: number
}

export function VocabularyManager({ draftNonce = 0 }: VocabularyManagerProps) {
  const { isJapaneseStudy } = useAuth()
  const termLabel = isJapaneseStudy ? 'Japanese' : 'Chinese'
  const readingLabel = isJapaneseStudy ? 'Reading' : 'Pinyin / reading'
  const showJlpt = isJapaneseStudy
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<WordInput>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [filter, setFilter] = useState<FilterValue>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 300)
    return () => window.clearTimeout(handle)
  }, [search])

  const loadWords = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setWords(
        await fetchWords({
          jlptLevel: filter === 'all' ? undefined : filter,
          q: debouncedSearch || undefined,
        }),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load words')
    } finally {
      setLoading(false)
    }
  }, [filter, debouncedSearch])

  useEffect(() => {
    void loadWords()
  }, [loadWords])

  useEffect(() => {
    if (draftNonce === 0) {
      return
    }
    const draft = consumeWordDraft()
    if (draft) {
      setEditingId(null)
      setForm(draft)
    }
  }, [draftNonce])

  function startEdit(word: Word) {
    setEditingId(word.id)
    setForm({
      japanese: word.japanese,
      reading: word.reading,
      meaning: word.meaning,
      notes: word.notes ?? '',
      jlpt_level: word.jlpt_level,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    const payload = toPayload(form)
    if (!payload.japanese || !payload.reading || !payload.meaning) {
      setError(`${termLabel}, reading, and meaning are required.`)
      return
    }

    try {
      if (editingId === null) {
        await createWord(payload)
      } else {
        await updateWord(editingId, payload)
      }
      cancelEdit()
      await loadWords()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this word?')) {
      return
    }
    setError('')
    try {
      await deleteWord(id)
      if (editingId === id) {
        cancelEdit()
      }
      await loadWords()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vocabulary</CardTitle>
        <CardDescription>
          {showJlpt
            ? 'Search words and filter by JLPT level (N5 beginner → N1 advanced).'
            : 'Search and manage your Chinese vocabulary.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-3" onSubmit={(e) => void handleSubmit(e)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">{termLabel}</span>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.japanese}
                onChange={(e) =>
                  setForm((f) => ({ ...f, japanese: e.target.value }))
                }
                placeholder="例: 食べる"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">{readingLabel}</span>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.reading}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reading: e.target.value }))
                }
                placeholder="例: たべる"
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="text-muted-foreground">Meaning</span>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.meaning}
                onChange={(e) =>
                  setForm((f) => ({ ...f, meaning: e.target.value }))
                }
                placeholder="例: to eat"
              />
            </label>
            {showJlpt ? (
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">JLPT level</span>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.jlpt_level}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    jlpt_level: e.target.value as JlptLevel,
                  }))
                }
              >
                {JLPT_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>
            ) : null}
          </div>
          <label className="block space-y-1 text-sm">
            <span className="text-muted-foreground">Notes (optional)</span>
            <textarea
              className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.notes ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="Grammar tip, example sentence, etc."
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit">
              {editingId === null ? 'Add word' : 'Save changes'}
            </Button>
            {editingId !== null ? (
              <Button type="button" variant="outline" onClick={cancelEdit}>
                Cancel edit
              </Button>
            ) : null}
          </div>
        </form>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="space-y-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <label className="block min-w-[12rem] flex-1 space-y-1 text-sm">
              <span className="text-muted-foreground">Search</span>
              <input
                type="search"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`${termLabel}, reading, meaning, notes…`}
              />
            </label>
            {showJlpt ? (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              JLPT filter
              <select
                className="rounded-md border border-input bg-background px-2 py-2 text-sm text-foreground"
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterValue)}
              >
                <option value="all">All levels</option>
                {JLPT_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level} only
                  </option>
                ))}
              </select>
            </label>
            ) : null}
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : words.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No words match your search or filter. Try clearing search or
              choosing &quot;All levels&quot;.
            </p>
          ) : (
            <ul className="space-y-2">
              {words.map((word) => (
                <li
                  key={word.id}
                  className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="space-y-1 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-medium">{word.japanese}</p>
                      {showJlpt ? (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                        {word.jlpt_level}
                      </span>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground">{word.reading}</p>
                    <p>{word.meaning}</p>
                    {word.notes ? (
                      <p className="text-xs text-muted-foreground">{word.notes}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(word)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => void handleDelete(word.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
