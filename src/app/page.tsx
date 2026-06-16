import { cookies } from 'next/headers'
import Link from 'next/link'
import { HABITS, LEVEL_GROUPS, computeDayScore, MAX_DAY_SCORE } from '@/lib/habits'
import { createServiceClient } from '@/lib/supabase'
import { HabitsGrid } from './components/habits-grid'
import { SetupForm } from './components/setup-form'
import { resetUser } from './actions'

export default async function Page() {
  const cookieStore = await cookies()
  const username = cookieStore.get('username')?.value
  const userId = cookieStore.get('user_id')?.value

  if (!username || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <p className="text-[10px] font-mono tracking-[0.22em] text-torch-dim uppercase mb-4">
            Primitive Tracker
          </p>
          <h1 className="text-3xl font-bold text-bone mb-2 tracking-tight leading-tight">
            원시의 피라미드로<br />돌아가라
          </h1>
          <p className="text-ash mb-8 text-sm">
            매일 가장 인간적인 습관을 기록한다
          </p>
          <SetupForm />
        </div>
      </div>
    )
  }

  const supabase = createServiceClient()
  const today = new Date().toISOString().split('T')[0]

  const [{ data: todayData }, { data: allDateLogs }] = await Promise.all([
    supabase.from('habit_logs').select('habit_id').eq('user_id', userId).eq('logged_at', today),
    supabase.from('habit_logs').select('logged_at').eq('user_id', userId),
  ])

  const todayLogs = todayData?.map((l) => l.habit_id) ?? []
  const count = todayLogs.length

  // Streak: consecutive days ending today (or yesterday if today has no logs)
  const loggedDateSet = new Set(allDateLogs?.map(l => l.logged_at) ?? [])
  let streak = 0
  const streakCur = new Date()
  if (count === 0) streakCur.setDate(streakCur.getDate() - 1)
  for (let i = 0; i < 365; i++) {
    const d = streakCur.toISOString().split('T')[0]
    if (!loggedDateSet.has(d)) break
    streak++
    streakCur.setDate(streakCur.getDate() - 1)
  }
  const score = computeDayScore(todayLogs)
  const total = HABITS.length
  const pct = Math.round((score / MAX_DAY_SCORE) * 100)

  const dateStr = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

  return (
    <div className="min-h-screen text-bone">
      <div className="max-w-[760px] mx-auto px-4 pt-8 pb-16">

        {/* Header */}
        <header className="flex items-start justify-between mb-8">
          <div>
            <p className="text-[9px] font-mono tracking-[0.22em] text-torch-dim uppercase mb-1">
              Primitive Tracker
            </p>
            <p className="text-ash text-xs">{dateStr}</p>
          </div>
          <div className="flex items-center gap-5">
            <Link
              href="/calendar"
              className="text-xs text-ash hover:text-bone transition-colors font-mono tracking-wide"
            >
              캘린더 →
            </Link>
            <Link
              href="/leaderboard"
              className="text-xs text-ash hover:text-bone transition-colors font-mono tracking-wide"
            >
              순위표 →
            </Link>
            <Link
              href="/feedback"
              className="text-xs text-ash hover:text-bone transition-colors font-mono tracking-wide"
            >
              방명록 →
            </Link>
            <form action={resetUser}>
              <button
                type="submit"
                title="닉네임 변경"
                className="text-xs text-[rgba(139,115,85,0.6)] font-mono hover:text-ash transition-colors group flex items-center gap-1"
              >
                {username}
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px]">✎</span>
              </button>
            </form>
          </div>
        </header>

        {/* Score */}
        <div className="mb-8">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-bold tabular-nums text-bone">{score}점</span>
            <span className="text-ash text-lg">/ {MAX_DAY_SCORE}</span>
            <span className="text-ash text-xs ml-auto font-mono">{count}/{total}개</span>
          </div>
          <div className="h-px bg-[rgba(90,52,14,0.3)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #92400e 0%, #d97706 60%, #f97316 100%)',
                boxShadow: '0 0 8px rgba(251,146,60,0.5)',
              }}
            />
          </div>
          {(streak >= 1 || count === total) && (
            <div className="flex items-center gap-4 mt-2">
              {streak >= 1 && (
                <p className="text-torch text-xs font-mono">🔥 {streak}일째</p>
              )}
              {count === total && (
                <p className="text-torch text-xs font-mono tracking-widest">◆ PERFECT DAY</p>
              )}
            </div>
          )}
        </div>

        {/* Section divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px flex-1 bg-[rgba(90,52,14,0.25)]" />
          <p className="text-[9px] font-mono tracking-[0.22em] text-[rgba(139,115,85,0.5)] uppercase">
            원시 욕구 피라미드
          </p>
          <div className="h-px flex-1 bg-[rgba(90,52,14,0.25)]" />
        </div>

        {/* Pyramid */}
        <HabitsGrid levelGroups={LEVEL_GROUPS} initialLogs={todayLogs} />
      </div>
    </div>
  )
}
