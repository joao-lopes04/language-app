import { useState } from 'react'
import {
  BookOpen,
  GraduationCap,
  Layers,
  Library,
  User,
} from 'lucide-react'

import { FlashcardsManager } from '@/features/flashcards/FlashcardsManager'
import { GrammarNotesManager } from '@/features/grammar/GrammarNotesManager'
import { KanjiDictionary } from '@/features/kanji/KanjiDictionary'
import { ProfileScreen } from '@/features/profile/ProfileScreen'
import { ReviewSession } from '@/features/review/ReviewSession'
import { VocabularyManager } from '@/features/vocabulary/VocabularyManager'
import { useAuth } from '@/context/AuthContext'
import { STUDY_LANGUAGE_LABELS } from '@/lib/study-language'
import { Button } from '@/components/ui/button'

type MainTab = 'words' | 'review' | 'cards' | 'learn' | 'profile'
type LearnPane = 'kanji' | 'grammar'

const TAB_META: {
  id: MainTab
  label: string
  Icon: typeof BookOpen
}[] = [
  { id: 'words', label: 'Words', Icon: BookOpen },
  { id: 'review', label: 'Review', Icon: GraduationCap },
  { id: 'cards', label: 'Decks', Icon: Layers },
  { id: 'learn', label: 'Learn', Icon: Library },
  { id: 'profile', label: 'Profile', Icon: User },
]

export function AppShell() {
  const { user, dataEpoch, isJapaneseStudy } = useAuth()
  const [tab, setTab] = useState<MainTab>('words')
  const [learnPane, setLearnPane] = useState<LearnPane>('kanji')

  const characterLabel = isJapaneseStudy ? 'Kanji' : 'Characters'

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Language Study
            </p>
            <h1 className="text-lg font-semibold leading-tight">
              {user ? STUDY_LANGUAGE_LABELS[user.study_language] : '—'}
            </h1>
          </div>
        </div>
      </header>

      <main
        key={dataEpoch}
        className="flex-1 overflow-y-auto px-4 py-4 pb-24"
      >
        {tab === 'words' ? (
          <VocabularyManager />
        ) : tab === 'review' ? (
          <ReviewSession />
        ) : tab === 'cards' ? (
          <FlashcardsManager />
        ) : tab === 'learn' ? (
          <div className="space-y-4">
            <div className="flex gap-2 rounded-lg bg-muted p-1">
              <Button
                type="button"
                size="sm"
                variant={learnPane === 'kanji' ? 'default' : 'ghost'}
                className="flex-1"
                onClick={() => setLearnPane('kanji')}
              >
                {characterLabel}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={learnPane === 'grammar' ? 'default' : 'ghost'}
                className="flex-1"
                onClick={() => setLearnPane('grammar')}
              >
                Grammar
              </Button>
            </div>
            {learnPane === 'kanji' ? (
              <KanjiDictionary />
            ) : (
              <GrammarNotesManager />
            )}
          </div>
        ) : (
          <ProfileScreen />
        )}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/80"
        aria-label="Main"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around">
          {TAB_META.map(({ id, label, Icon }) => {
            const active = tab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition-colors ${
                  active
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon
                  className={`size-5 ${active ? 'stroke-[2.5px]' : 'stroke-[2px]'}`}
                  aria-hidden
                />
                {label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
