import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { forgotPassword, resetPassword } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

type Mode = 'login' | 'register' | 'forgot' | 'reset'

export function AuthScreen() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [resetToken, setResetToken] = useState('')
  const [info, setInfo] = useState('')

  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    try {
      if (mode === 'login') {
        await login(email.trim(), password)
      } else if (mode === 'register') {
        if (password.length < 8) {
          setError('Password must be at least 8 characters.')
          return
        }
        await register(email.trim(), password)
      } else if (mode === 'forgot') {
        const result = await forgotPassword(email.trim())
        setInfo(result.message)
        if (result.reset_token) {
          setInfo(
            `${result.message} Dev token: ${result.reset_token} — switch to Reset password.`,
          )
          setResetToken(result.reset_token)
        }
      } else if (mode === 'reset') {
        if (password.length < 8) {
          setError('Password must be at least 8 characters.')
          return
        }
        await resetPassword(resetToken.trim(), password)
        setMode('login')
        setInfo('Password reset. Sign in with your new password.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const title =
    mode === 'login'
      ? 'Sign in'
      : mode === 'register'
        ? 'Create account'
        : mode === 'forgot'
          ? 'Forgot password'
          : 'Reset password'

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Language Study
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your vocabulary, reviews, and stats — on any device.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              {mode === 'login' && 'Use the email and password you registered with.'}
              {mode === 'register' &&
                'Each account keeps its own words, decks, and progress.'}
              {mode === 'forgot' &&
                'We will create a reset token if the email exists (email sending not configured yet).'}
              {mode === 'reset' && 'Paste your reset token and choose a new password.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
              <label className="block space-y-1 text-sm">
                <span className="text-muted-foreground">Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              {mode === 'reset' ? (
                <label className="block space-y-1 text-sm">
                  <span className="text-muted-foreground">Reset token</span>
                  <input
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    required
                  />
                </label>
              ) : null}
              {mode !== 'forgot' ? (
                <label className="block space-y-1 text-sm">
                  <span className="text-muted-foreground">Password</span>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={
                        mode === 'login' ? 'current-password' : 'new-password'
                      }
                      required
                      minLength={
                        mode === 'register' || mode === 'reset' ? 8 : undefined
                      }
                      className="w-full rounded-md border border-input bg-background py-2.5 pl-3 pr-10 text-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" aria-hidden />
                      ) : (
                        <Eye className="size-4" aria-hidden />
                      )}
                    </button>
                  </div>
                </label>
              ) : null}
              {info ? (
                <p className="text-sm text-muted-foreground">{info}</p>
              ) : null}
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy
                  ? 'Please wait…'
                  : mode === 'login'
                    ? 'Sign in'
                    : mode === 'register'
                      ? 'Create account'
                      : mode === 'forgot'
                        ? 'Send reset link'
                        : 'Reset password'}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              {mode === 'login' ? (
                <>
                  <button
                    type="button"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                    onClick={() => {
                      setMode('forgot')
                      setError('')
                      setInfo('')
                    }}
                  >
                    Forgot password?
                  </button>
                  {' · '}
                  New here?{' '}
                  <button
                    type="button"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                    onClick={() => {
                      setMode('register')
                      setError('')
                      setInfo('')
                    }}
                  >
                    Create an account
                  </button>
                </>
              ) : mode === 'register' ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                    onClick={() => {
                      setMode('login')
                      setError('')
                      setInfo('')
                    }}
                  >
                    Sign in
                  </button>
                </>
              ) : mode === 'forgot' ? (
                <>
                  <button
                    type="button"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                    onClick={() => {
                      setMode('reset')
                      setError('')
                    }}
                  >
                    I have a reset token
                  </button>
                  {' · '}
                  <button
                    type="button"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                    onClick={() => {
                      setMode('login')
                      setError('')
                      setInfo('')
                    }}
                  >
                    Back to sign in
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                    onClick={() => {
                      setMode('forgot')
                      setError('')
                      setInfo('')
                    }}
                  >
                    Request token
                  </button>
                  {' · '}
                  <button
                    type="button"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                    onClick={() => {
                      setMode('login')
                      setError('')
                      setInfo('')
                    }}
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
