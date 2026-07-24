import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { fetchDashboardStats, type DashboardStats } from '@/lib/api'

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  )
}

export function StatsDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setStats(await fetchDashboardStats())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const maxJlpt = stats
    ? Math.max(1, ...stats.vocabulary_by_jlpt.map((row) => row.count))
    : 1
  const maxDaily = stats
    ? Math.max(1, ...stats.reviews_last_7_days.map((row) => row.count))
    : 1

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
        <CardDescription>
          Counts across your study data, JLPT breakdown, and review activity
          (streak uses review history from M10 onward).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : stats ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile label="Vocabulary" value={stats.vocabulary_total} />
              <StatTile label="Kanji (library)" value={stats.kanji_total} />
              <StatTile label="Grammar notes" value={stats.grammar_notes_total} />
              <StatTile label="Flashcard decks" value={stats.decks_total} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatTile label="SRS due now" value={stats.srs_due_now} />
              <StatTile label="Words tracked (SRS)" value={stats.srs_tracked} />
              <StatTile label="Total review ratings" value={stats.review_events_total} />
              <StatTile label="Study streak (days)" value={stats.review_streak_days} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Vocabulary by JLPT</p>
              <ul className="space-y-2">
                {stats.vocabulary_by_jlpt.map((row) => (
                  <li key={row.level} className="flex items-center gap-3 text-sm">
                    <span className="w-8 font-medium">{row.level}</span>
                    <div className="h-3 flex-1 rounded-full bg-muted">
                      <div
                        className="h-3 rounded-full bg-primary"
                        style={{ width: `${(row.count / maxJlpt) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-muted-foreground">
                      {row.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Reviews (last 7 days)</p>
              <ul className="flex h-36 items-end gap-2">
                {stats.reviews_last_7_days.map((row) => (
                  <li
                    key={row.day}
                    className="flex flex-1 flex-col items-center gap-1 text-xs"
                  >
                    <div
                      className="w-full rounded-t-md bg-primary/80"
                      style={{
                        height: `${(row.count / maxDaily) * 100}%`,
                        minHeight: row.count > 0 ? '0.5rem' : '0.125rem',
                      }}
                      title={`${row.count} reviews`}
                    />
                    <span className="text-muted-foreground">
                      {row.day.slice(5)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : null}

        <Button type="button" variant="outline" onClick={() => void load()}>
          Refresh stats
        </Button>
      </CardContent>
    </Card>
  )
}
