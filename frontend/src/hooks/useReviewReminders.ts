import { useCallback, useEffect, useRef } from 'react'

import { fetchReviewSummary } from '@/lib/api'

const ENABLED_KEY = 'language_study_review_reminders'
const LAST_NOTIFIED_KEY = 'language_study_review_reminder_day'
const CHECK_MS = 15 * 60 * 1000

export function isReviewRemindersEnabled(): boolean {
  return localStorage.getItem(ENABLED_KEY) === 'true'
}

export function setReviewRemindersEnabled(enabled: boolean): void {
  localStorage.setItem(ENABLED_KEY, enabled ? 'true' : 'false')
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

async function maybeNotify(): Promise<void> {
  if (!isReviewRemindersEnabled()) {
    return
  }
  if (typeof Notification === 'undefined') {
    return
  }
  if (Notification.permission !== 'granted') {
    return
  }
  if (localStorage.getItem(LAST_NOTIFIED_KEY) === todayKey()) {
    return
  }
  try {
    const summary = await fetchReviewSummary()
    if (summary.due_count <= 0) {
      return
    }
    localStorage.setItem(LAST_NOTIFIED_KEY, todayKey())
    new Notification('Language Study', {
      body: `${summary.due_count} word${summary.due_count === 1 ? '' : 's'} due for review.`,
      tag: 'review-due',
    })
  } catch {
    // ignore when offline or logged out
  }
}

export function useReviewReminders(active: boolean) {
  const timerRef = useRef<number | null>(null)

  const check = useCallback(() => {
    if (active) {
      void maybeNotify()
    }
  }, [active])

  useEffect(() => {
    if (!active) {
      return
    }
    void maybeNotify()
    timerRef.current = window.setInterval(() => void maybeNotify(), CHECK_MS)
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current)
      }
    }
  }, [active, check])
}

export async function requestReviewReminderPermission(): Promise<
  NotificationPermission | 'unsupported'
> {
  if (typeof Notification === 'undefined') {
    return 'unsupported'
  }
  if (Notification.permission === 'granted') {
    return 'granted'
  }
  if (Notification.permission === 'denied') {
    return 'denied'
  }
  return Notification.requestPermission()
}
