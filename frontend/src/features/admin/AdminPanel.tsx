import { useEffect, useState } from 'react'

import { fetchAdminUsers, type AdminUserSummary } from '@/lib/api'

export function AdminPanel() {
  const [users, setUsers] = useState<AdminUserSummary[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      setError('')
      try {
        setUsers(await fetchAdminUsers())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading accounts…</p>
  }
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Registered accounts</p>
      <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
        {users.map((u) => (
          <li key={u.id} className="rounded-md border border-border px-3 py-2">
            <p className="font-medium">{u.email}</p>
            <p className="text-xs text-muted-foreground">
              {u.study_language.toUpperCase()} · {u.word_count} words
            </p>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        Passwords are never stored in plain text and cannot be viewed.
      </p>
    </div>
  )
}
