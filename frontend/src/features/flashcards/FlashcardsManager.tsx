import { useCallback, useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  createDeck,
  createDeckFromHsk,
  createDeckFromJlpt,
  deleteDeck,
  fetchDeck,
  fetchDecks,
  fetchWords,
  setDeckWords,
  type Deck,
  type DeckSummary,
  type Word,
} from '@/lib/api'
import { JLPT_LEVELS, type JlptLevel } from '@/features/vocabulary/jlpt'
import { useAuth } from '@/context/AuthContext'

type Screen = 'decks' | 'edit' | 'study'

function shuffleIndices(length: number): number[] {
  const indices = Array.from({ length }, (_, i) => i)
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return indices
}

export function FlashcardsManager() {
  const { isJapaneseStudy } = useAuth()
  const [screen, setScreen] = useState<Screen>('decks')
  const [decks, setDecks] = useState<DeckSummary[]>([])
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null)
  const [allWords, setAllWords] = useState<Word[]>([])
  const [selectedWordIds, setSelectedWordIds] = useState<Set<number>>(new Set())
  const [newDeckName, setNewDeckName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quickJlpt, setQuickJlpt] = useState<JlptLevel>('N5')
  const [quickHsk, setQuickHsk] = useState<1 | 2>(1)

  const [studyOrder, setStudyOrder] = useState<number[]>([])
  const [studyPosition, setStudyPosition] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const loadDecks = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setDecks(await fetchDecks())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load decks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDecks()
  }, [loadDecks])

  async function openDeckEditor(deckId: number) {
    setError('')
    try {
      const [deck, words] = await Promise.all([fetchDeck(deckId), fetchWords()])
      setActiveDeck(deck)
      setAllWords(words)
      setSelectedWordIds(new Set(deck.words.map((w) => w.id)))
      setScreen('edit')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open deck')
    }
  }

  async function handleQuickLevelDeck() {
    setError('')
    try {
      const deck = isJapaneseStudy
        ? await createDeckFromJlpt(quickJlpt)
        : await createDeckFromHsk(quickHsk)
      await loadDecks()
      await openDeckEditor(deck.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deck')
    }
  }

  async function handleCreateDeck(event: React.FormEvent) {
    event.preventDefault()
    const name = newDeckName.trim()
    if (!name) {
      return
    }
    setError('')
    try {
      const deck = await createDeck(name)
      setNewDeckName('')
      await loadDecks()
      await openDeckEditor(deck.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deck')
    }
  }

  async function handleSaveDeckWords() {
    if (!activeDeck) {
      return
    }
    setError('')
    try {
      const updated = await setDeckWords(activeDeck.id, [...selectedWordIds])
      setActiveDeck(updated)
      await loadDecks()
      setScreen('decks')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save deck')
    }
  }

  async function handleDeleteDeck(deckId: number) {
    if (!window.confirm('Delete this deck?')) {
      return
    }
    setError('')
    try {
      await deleteDeck(deckId)
      if (activeDeck?.id === deckId) {
        setActiveDeck(null)
        setScreen('decks')
      }
      await loadDecks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete deck')
    }
  }

  function startStudy(deck: Deck) {
    if (deck.words.length === 0) {
      setError('Add words to this deck before studying.')
      return
    }
    setActiveDeck(deck)
    setStudyOrder(shuffleIndices(deck.words.length))
    setStudyPosition(0)
    setFlipped(false)
    setScreen('study')
    setError('')
  }

  async function handleStartStudyFromList(deckId: number) {
    setError('')
    try {
      const deck = await fetchDeck(deckId)
      startStudy(deck)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start study')
    }
  }

  const currentCard = useMemo(() => {
    if (!activeDeck || screen !== 'study' || studyOrder.length === 0) {
      return null
    }
    const wordIndex = studyOrder[studyPosition]
    return activeDeck.words[wordIndex] ?? null
  }, [activeDeck, screen, studyOrder, studyPosition])

  function goNext() {
    if (!activeDeck) {
      return
    }
    setFlipped(false)
    setStudyPosition((pos) => (pos + 1) % studyOrder.length)
  }

  function goPrev() {
    if (!activeDeck) {
      return
    }
    setFlipped(false)
    setStudyPosition(
      (pos) => (pos - 1 + studyOrder.length) % studyOrder.length,
    )
  }

  function reshuffle() {
    if (!activeDeck) {
      return
    }
    setStudyOrder(shuffleIndices(activeDeck.words.length))
    setStudyPosition(0)
    setFlipped(false)
  }

  if (screen === 'study' && activeDeck && currentCard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Study: {activeDeck.name}</CardTitle>
          <CardDescription>
            Card {studyPosition + 1} of {studyOrder.length} — click the card to
            flip (no spaced repetition yet).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <button
            type="button"
            className="mx-auto flex min-h-48 w-full max-w-md flex-col items-center justify-center rounded-xl border border-border bg-muted/40 p-6 text-center transition-colors hover:bg-muted/60"
            onClick={() => setFlipped((f) => !f)}
          >
            {!flipped ? (
              <>
                <p className="text-3xl font-semibold">{currentCard.japanese}</p>
                <p className="mt-2 text-muted-foreground">{currentCard.reading}</p>
                <p className="mt-4 text-xs text-muted-foreground">Show meaning</p>
              </>
            ) : (
              <>
                <p className="text-xl font-medium">{currentCard.meaning}</p>
                {currentCard.notes ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {currentCard.notes}
                  </p>
                ) : null}
                <p className="mt-4 text-xs text-muted-foreground">
                  {currentCard.jlpt_level} · tap to hide
                </p>
              </>
            )}
          </button>
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" variant="outline" onClick={goPrev}>
              Previous
            </Button>
            <Button type="button" onClick={goNext}>
              Next
            </Button>
            <Button type="button" variant="outline" onClick={reshuffle}>
              Shuffle
            </Button>
            <Button type="button" variant="outline" onClick={() => setScreen('decks')}>
              Exit study
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (screen === 'edit' && activeDeck) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edit deck: {activeDeck.name}</CardTitle>
          <CardDescription>
            Choose which vocabulary words belong in this deck.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {allWords.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add vocabulary words first, then return here.
            </p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
              {allWords.map((word) => (
                <li key={word.id}>
                  <label className="flex cursor-pointer items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selectedWordIds.has(word.id)}
                      onChange={(e) => {
                        setSelectedWordIds((prev) => {
                          const next = new Set(prev)
                          if (e.target.checked) {
                            next.add(word.id)
                          } else {
                            next.delete(word.id)
                          }
                          return next
                        })
                      }}
                    />
                    <span>
                      <span className="font-medium">{word.japanese}</span>{' '}
                      <span className="text-muted-foreground">
                        ({word.reading}) — {word.meaning}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void handleSaveDeckWords()}>
              Save deck
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setScreen('decks')}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flashcard decks</CardTitle>
        <CardDescription>
          Build decks from your vocabulary, then study with flip cards (M8 — no
          SRS scheduling yet).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="flex flex-wrap gap-2" onSubmit={(e) => void handleCreateDeck(e)}>
          <input
            className="min-w-[12rem] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={newDeckName}
            onChange={(e) => setNewDeckName(e.target.value)}
            placeholder="New deck name (e.g. N5 verbs)"
          />
          <Button type="submit">Create deck</Button>
        </form>

        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border p-3">
          <p className="w-full text-sm font-medium">Quick deck from level</p>
          {isJapaneseStudy ? (
            <select
              className="rounded-md border border-input bg-background px-2 py-2 text-sm"
              value={quickJlpt}
              onChange={(e) => setQuickJlpt(e.target.value as JlptLevel)}
            >
              {JLPT_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          ) : (
            <select
              className="rounded-md border border-input bg-background px-2 py-2 text-sm"
              value={quickHsk}
              onChange={(e) => setQuickHsk(Number(e.target.value) as 1 | 2)}
            >
              <option value={1}>HSK 1</option>
              <option value={2}>HSK 2</option>
            </select>
          )}
          <Button type="button" variant="outline" onClick={() => void handleQuickLevelDeck()}>
            Create from vocabulary
          </Button>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading decks…</p>
        ) : decks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No decks yet. Create one and add words from your vocabulary list.
          </p>
        ) : (
          <ul className="space-y-2">
            {decks.map((deck) => (
              <li
                key={deck.id}
                className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{deck.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {deck.word_count} word{deck.word_count === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleStartStudyFromList(deck.id)}
                  >
                    Study
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void openDeckEditor(deck.id)}
                  >
                    Edit words
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => void handleDeleteDeck(deck.id)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
