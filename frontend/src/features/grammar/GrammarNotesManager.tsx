import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { MarkdownPreview } from '@/features/grammar/MarkdownPreview'
import { JLPT_LEVELS, type JlptLevel } from '@/features/vocabulary/jlpt'
import {
  createGrammarNote,
  deleteGrammarNote,
  fetchGrammarNotes,
  updateGrammarNote,
  type GrammarNote,
  type GrammarNoteInput,
} from '@/lib/api'

const emptyForm: GrammarNoteInput = {
  title: '',
  content: '',
  jlpt_level: null,
}

type JlptFilter = 'all' | JlptLevel
type EditorMode = 'view' | 'edit'

export function GrammarNotesManager() {
  const [notes, setNotes] = useState<GrammarNote[]>([])
  const [selectedId, setSelectedId] = useState<number | 'new' | null>(null)
  const [form, setForm] = useState<GrammarNoteInput>(emptyForm)
  const [mode, setMode] = useState<EditorMode>('view')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filter, setFilter] = useState<JlptFilter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => window.clearTimeout(handle)
  }, [search])

  const loadNotes = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const list = await fetchGrammarNotes({
        q: debouncedSearch || undefined,
        jlptLevel: filter === 'all' ? undefined : filter,
      })
      setNotes(list)
      setSelectedId((current) => {
        if (current === 'new') {
          return current
        }
        if (list.length === 0) {
          return null
        }
        if (current === null || !list.some((n) => n.id === current)) {
          return list[0].id
        }
        return current
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, filter])

  useEffect(() => {
    void loadNotes()
  }, [loadNotes])

  useEffect(() => {
    if (selectedId === 'new') {
      setForm(emptyForm)
      setMode('edit')
      return
    }
    if (typeof selectedId !== 'number') {
      return
    }
    const note = notes.find((n) => n.id === selectedId)
    if (!note) {
      return
    }
    setForm({
      title: note.title,
      content: note.content,
      jlpt_level: note.jlpt_level,
    })
  }, [selectedId, notes])

  const selectedNote =
    typeof selectedId === 'number'
      ? (notes.find((n) => n.id === selectedId) ?? null)
      : null

  useEffect(() => {
    if (typeof selectedId === 'number') {
      setMode('view')
    }
  }, [selectedId])

  function startNewNote() {
    setSelectedId('new')
    setForm(emptyForm)
    setMode('edit')
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    const title = form.title.trim()
    const content = form.content.trim()
    if (!title || !content) {
      setError('Title and content are required.')
      return
    }
    const payload: GrammarNoteInput = {
      title,
      content,
      jlpt_level: form.jlpt_level ?? null,
    }

    try {
      if (selectedId === 'new') {
        const created = await createGrammarNote(payload)
        setSelectedId(created.id)
      } else if (typeof selectedId === 'number') {
        await updateGrammarNote(selectedId, payload)
      }
      setMode('view')
      await loadNotes()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  async function handleDelete() {
    if (typeof selectedId !== 'number') {
      return
    }
    if (!window.confirm('Delete this grammar note?')) {
      return
    }
    setError('')
    try {
      await deleteGrammarNote(selectedId)
      setSelectedId(null)
      await loadNotes()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grammar notes</CardTitle>
        <CardDescription>
          Write notes in Markdown (headings, lists, **bold**). Stored in your
          database like vocabulary.
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
              placeholder="Title or note text…"
            />
          </label>
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
          <Button type="button" onClick={startNewNote}>
            New note
          </Button>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">Notes</p>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No notes yet. Click &quot;New note&quot;.
              </p>
            ) : (
              <ul className="max-h-80 space-y-1 overflow-y-auto rounded-lg border border-border p-1">
                {notes.map((note) => (
                  <li key={note.id}>
                    <button
                      type="button"
                      className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        selectedId === note.id
                          ? 'bg-muted font-medium'
                          : 'hover:bg-muted/60'
                      }`}
                      onClick={() => setSelectedId(note.id)}
                    >
                      <span className="block truncate">{note.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {note.jlpt_level ?? 'No JLPT tag'} · updated{' '}
                        {new Date(note.updated_at).toLocaleDateString()}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">Editor</p>
              {selectedId !== null && selectedId !== 'new' && mode === 'view' ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMode('edit')}
                >
                  Edit
                </Button>
              ) : null}
            </div>

            {selectedId === null ? (
              <p className="text-sm text-muted-foreground">
                Select a note or create a new one.
              </p>
            ) : mode === 'view' && selectedNote ? (
              <div className="space-y-3 rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold">{selectedNote.title}</h2>
                  {selectedNote.jlpt_level ? (
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs">
                      {selectedNote.jlpt_level}
                    </span>
                  ) : null}
                </div>
                <MarkdownPreview content={selectedNote.content} />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => void handleDelete()}
                >
                  Delete note
                </Button>
              </div>
            ) : (
              <form className="space-y-3" onSubmit={(e) => void handleSave(e)}>
                <label className="block space-y-1 text-sm">
                  <span className="text-muted-foreground">Title</span>
                  <input
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    placeholder="例: て-form (te-form)"
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-muted-foreground">JLPT (optional)</span>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.jlpt_level ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        jlpt_level: e.target.value
                          ? (e.target.value as JlptLevel)
                          : null,
                      }))
                    }
                  >
                    <option value="">None</option>
                    {JLPT_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-muted-foreground">Content (Markdown)</span>
                  <textarea
                    className="min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
                    value={form.content}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, content: e.target.value }))
                    }
                    placeholder={'## Rule\n\n- Example: 食べ**て** + ください'}
                  />
                </label>
                {form.content.trim() ? (
                  <div className="rounded-lg border border-dashed border-border p-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Preview
                    </p>
                    <MarkdownPreview content={form.content} />
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button type="submit">Save</Button>
                  {selectedId !== 'new' ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMode('view')}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </form>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
