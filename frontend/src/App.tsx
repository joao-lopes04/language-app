import { AppShell } from '@/components/AppShell'
import { AuthScreen } from '@/features/auth/AuthScreen'
import { useAuth } from '@/context/AuthContext'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!user) {
    return <AuthScreen />
  }

  return <AppShell />
}

export default App
