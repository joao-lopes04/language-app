import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { StatsDashboard } from '@/features/stats/StatsDashboard'
import { useAuth } from '@/context/AuthContext'
import {
  STUDY_LANGUAGE_LABELS,
  type StudyLanguage,
} from '@/lib/study-language'

const LANGUAGES: StudyLanguage[] = ['ja', 'zh']

export function ProfileScreen() {
  const { user, logout, setStudyLanguage } = useAuth()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!user) {
    return null
  }

  async function onLanguageChange(next: StudyLanguage) {
    if (next === user?.study_language) {
      return
    }
    setError('')
    setBusy(true)
    try {
      await setStudyLanguage(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update language')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="border-0 shadow-none sm:border sm:shadow-sm">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Switch study language to keep separate vocabulary and stats for
          Japanese and Chinese.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1 text-sm">
          <p className="text-muted-foreground">Signed in as</p>
          <p className="font-medium">{user.email}</p>
        </div>

        <fieldset className="space-y-2" disabled={busy}>
          <legend className="text-sm text-muted-foreground">
            Study language
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((code) => (
              <Button
                key={code}
                type="button"
                variant={user.study_language === code ? 'default' : 'outline'}
                className="h-auto py-3"
                onClick={() => void onLanguageChange(code)}
              >
                {STUDY_LANGUAGE_LABELS[code]}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Changing language reloads your words, decks, grammar notes, and
            character list for that language.
          </p>
        </fieldset>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="button" variant="outline" onClick={logout}>
          Sign out
        </Button>

        <StatsDashboard />
      </CardContent>
    </Card>
  )
}
