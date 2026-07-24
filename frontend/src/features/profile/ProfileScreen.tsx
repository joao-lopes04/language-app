import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AdminPanel } from '@/features/admin/AdminPanel'
import { StatsDashboard } from '@/features/stats/StatsDashboard'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import {
  changePassword,
  exportVocabularyCsv,
  importVocabularyCsv,
} from '@/lib/api'
import {
  isReviewRemindersEnabled,
  requestReviewReminderPermission,
  setReviewRemindersEnabled,
} from '@/hooks/useReviewReminders'
import {
  STUDY_LANGUAGE_LABELS,
  type StudyLanguage,
} from '@/lib/study-language'

const LANGUAGES: StudyLanguage[] = ['ja', 'zh']

export function ProfileScreen() {
  const { user, logout, setStudyLanguage, refreshUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [csvMsg, setCsvMsg] = useState('')
  const [remindersOn, setRemindersOn] = useState(() => isReviewRemindersEnabled())
  const [reminderMsg, setReminderMsg] = useState('')

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

  async function onChangePassword(event: React.FormEvent) {
    event.preventDefault()
    setPasswordMsg('')
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setPasswordMsg('Password updated.')
      await refreshUser()
    } catch (err) {
      setPasswordMsg(err instanceof Error ? err.message : 'Failed')
    }
  }

  async function onExportCsv() {
    setCsvMsg('')
    try {
      const blob = await exportVocabularyCsv()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'vocabulary.csv'
      a.click()
      URL.revokeObjectURL(url)
      setCsvMsg('Download started.')
    } catch (err) {
      setCsvMsg(err instanceof Error ? err.message : 'Export failed')
    }
  }

  async function onImportCsv(file: File | null) {
    if (!file) {
      return
    }
    setCsvMsg('')
    try {
      const result = await importVocabularyCsv(file)
      setCsvMsg(`Imported ${result.created} words (${result.skipped} skipped).`)
    } catch (err) {
      setCsvMsg(err instanceof Error ? err.message : 'Import failed')
    }
  }

  async function onToggleReminders(enabled: boolean) {
    setReminderMsg('')
    if (enabled) {
      const permission = await requestReviewReminderPermission()
      if (permission === 'unsupported') {
        setReminderMsg('Notifications are not supported in this browser.')
        return
      }
      if (permission === 'denied') {
        setReminderMsg('Allow notifications in browser settings to use reminders.')
        return
      }
    }
    setReviewRemindersEnabled(enabled)
    setRemindersOn(enabled)
    setReminderMsg(
      enabled
        ? 'Reminders on — up to one notification per day when words are due.'
        : 'Reminders off.',
    )
  }

  return (
    <Card className="border-0 shadow-none sm:border sm:shadow-sm">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Language, appearance, password, and vocabulary backup.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-1 text-sm">
          <p className="text-muted-foreground">Signed in as</p>
          <p className="font-medium">{user.email}</p>
        </div>

        <fieldset className="space-y-2" disabled={busy}>
          <legend className="text-sm text-muted-foreground">Appearance</legend>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => setTheme('light')}
            >
              Light
            </Button>
            <Button
              type="button"
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => setTheme('dark')}
            >
              Dark
            </Button>
          </div>
        </fieldset>

        <fieldset className="space-y-2" disabled={busy}>
          <legend className="text-sm text-muted-foreground">Study language</legend>
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
        </fieldset>

        <form className="space-y-3" onSubmit={(e) => void onChangePassword(e)}>
          <p className="text-sm font-medium">Change password</p>
          <input
            type="password"
            placeholder="Current password"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="New password (8+ characters)"
            minLength={8}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Button type="submit" size="sm" variant="outline">
            Update password
          </Button>
          {passwordMsg ? (
            <p className="text-xs text-muted-foreground">{passwordMsg}</p>
          ) : null}
        </form>

        <div className="space-y-2">
          <p className="text-sm font-medium">Review reminders</p>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={remindersOn}
              onChange={(e) => void onToggleReminders(e.target.checked)}
            />
            Notify when SRS words are due (once per day)
          </label>
          {reminderMsg ? (
            <p className="text-xs text-muted-foreground">{reminderMsg}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Vocabulary CSV</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => void onExportCsv()}>
              Export CSV
            </Button>
            <label className="inline-flex cursor-pointer items-center rounded-md border border-input px-3 py-2 text-sm hover:bg-muted">
              Import CSV
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => void onImportCsv(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          {csvMsg ? <p className="text-xs text-muted-foreground">{csvMsg}</p> : null}
        </div>

        {user.is_admin ? (
          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-sm font-medium">Admin</p>
            <AdminPanel />
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="button" variant="outline" onClick={logout}>
          Sign out
        </Button>

        <StatsDashboard />
      </CardContent>
    </Card>
  )
}
