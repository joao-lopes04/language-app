import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  fetchDueWords,
  fetchReviewSummary,
  rateWordReview,
  type DueWord,
  type ReviewRating,
  type ReviewSummary,
} from '@/lib/api'

export function ReviewSession() {
  const [summary, setSummary] = useState<ReviewSummary | null>(null)
  const [queue, setQueue] = useState<DueWord[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(false)
  const [error, setError] = useState('')
  const [sessionActive, setSessionActive] = useState(false)

  const loadOverview = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [nextSummary, due] = await Promise.all([
        fetchReviewSummary(),
        fetchDueWords(),
      ])
      setSummary(nextSummary)
      setQueue(due)
      setIndex(0)
      setFlipped(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load review data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  const current = sessionActive ? queue[index] : undefined

  async function handleRate(nextRating: ReviewRating) {
    if (!current) {
      return
    }
    setRating(true)
    setError('')
    try {
      await rateWordReview(current.id, nextRating)
      const remaining = queue.filter((_, i) => i !== index)
      setQueue(remaining)
      setIndex(0)
      setFlipped(false)
      if (remaining.length === 0) {
        setSessionActive(false)
        await loadOverview()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rating')
    } finally {
      setRating(false)
    }
  }

  function startSession() {
    if (queue.length === 0) {
      setError('No cards are due right now.')
      return
    }
    setSessionActive(true)
    setIndex(0)
    setFlipped(false)
    setError('')
  }

  if (sessionActive && current) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SRS review</CardTitle>
          <CardDescription>
            Card {index + 1} of {queue.length} due — rate after you
            reveal the answer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <button
            type="button"
            className="mx-auto flex min-h-48 w-full max-w-md flex-col items-center justify-center rounded-xl border border-border bg-muted/40 p-6 text-center transition-colors hover:bg-muted/60"
            onClick={() => setFlipped((value) => !value)}
          >
            {!flipped ? (
              <>
                <p className="text-3xl font-semibold">{current.japanese}</p>
                <p className="mt-2 text-muted-foreground">{current.reading}</p>
                <p className="mt-4 text-xs text-muted-foreground">Tap to reveal</p>
              </>
            ) : (
              <>
                <p className="text-xl font-medium">{current.meaning}</p>
                {current.notes ? (
                  <p className="mt-2 text-sm text-muted-foreground">{current.notes}</p>
                ) : null}
              </>
            )}
          </button>

          {flipped ? (
            <div className="grid gap-2 sm:grid-cols-3">
              <Button
                type="button"
                variant="destructive"
                disabled={rating}
                onClick={() => void handleRate('again')}
              >
                Again
              </Button>
              <Button
                type="button"
                disabled={rating}
                onClick={() => void handleRate('good')}
              >
                Good
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={rating}
                onClick={() => void handleRate('easy')}
              >
                Easy
              </Button>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              Reveal the answer before rating.
            </p>
          )}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSessionActive(false)
              void loadOverview()
            }}
          >
            Exit review
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spaced repetition</CardTitle>
        <CardDescription>
          Words you have never reviewed count as due. Ratings change when you
          see them again (Again ≈ 10 minutes, Good/Easy = longer intervals).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : summary ? (
          <ul className="grid gap-2 text-sm sm:grid-cols-3">
            <li className="rounded-lg border border-border p-3">
              <p className="text-muted-foreground">Due now</p>
              <p className="text-2xl font-semibold">{summary.due_count}</p>
            </li>
            <li className="rounded-lg border border-border p-3">
              <p className="text-muted-foreground">Vocabulary</p>
              <p className="text-2xl font-semibold">{summary.total_words}</p>
            </li>
            <li className="rounded-lg border border-border p-3">
              <p className="text-muted-foreground">Tracked in SRS</p>
              <p className="text-2xl font-semibold">{summary.tracked_count}</p>
            </li>
          </ul>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={startSession} disabled={queue.length === 0}>
            Start review ({queue.length})
          </Button>
          <Button type="button" variant="outline" onClick={() => void loadOverview()}>
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
