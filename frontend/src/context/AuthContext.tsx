import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import {
  fetchCurrentUser,
  loginUser,
  registerUser,
  updateStudyLanguage,
  type AuthUser,
} from '@/lib/api'
import { clearAuthToken, getAuthToken, setAuthToken } from '@/lib/auth-storage'
import type { StudyLanguage } from '@/lib/study-language'
import { isJapanese } from '@/lib/study-language'

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  dataEpoch: number
  isJapaneseStudy: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  setStudyLanguage: (language: StudyLanguage) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataEpoch, setDataEpoch] = useState(0)

  const applySession = useCallback((next: AuthUser | null) => {
    setUser(next)
    setDataEpoch((n) => n + 1)
  }, [])

  const refreshUser = useCallback(async () => {
    const token = getAuthToken()
    if (!token) {
      applySession(null)
      return
    }
    try {
      applySession(await fetchCurrentUser())
    } catch {
      clearAuthToken()
      applySession(null)
    }
  }, [applySession])

  useEffect(() => {
    void (async () => {
      setLoading(true)
      await refreshUser()
      setLoading(false)
    })()
  }, [refreshUser])

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginUser(email, password)
      setAuthToken(result.access_token)
      applySession(result.user)
    },
    [applySession],
  )

  const register = useCallback(
    async (email: string, password: string) => {
      const result = await registerUser(email, password)
      setAuthToken(result.access_token)
      applySession(result.user)
    },
    [applySession],
  )

  const logout = useCallback(() => {
    clearAuthToken()
    applySession(null)
  }, [applySession])

  const setStudyLanguage = useCallback(
    async (language: StudyLanguage) => {
      const updated = await updateStudyLanguage(language)
      applySession(updated)
    },
    [applySession],
  )

  const value = useMemo(
    (): AuthContextValue => ({
      user,
      loading,
      dataEpoch,
      isJapaneseStudy: user ? isJapanese(user.study_language) : true,
      login,
      register,
      logout,
      setStudyLanguage,
      refreshUser,
    }),
    [
      user,
      loading,
      dataEpoch,
      login,
      register,
      logout,
      setStudyLanguage,
      refreshUser,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
