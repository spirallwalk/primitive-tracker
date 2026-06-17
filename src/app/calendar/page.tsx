import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase'
import { HABITS, computeDayScore } from '@/lib/habits'

const LEVEL_DOT_COLORS: Record<number, string> = {
  0: 'bg-indigo-400',
  1: 'bg-yellow-400',
  2: 'bg-orange-400',
  3: 'bg-violet-400',
  4: 'bg-purple-400',
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('user_id')?.value
  if (!userId) redirect('/')

  const params = await searchParams
  const now = new Date()
  const year = parseInt(params.year ?? String(now.getFullYear()), 10)
  const month = parseInt(params.month ?? String(now.getMonth() + 1), 10)

  const today = now.toISOString().split('T')[0]
  const monthStr = String(month).padStart(2, '0')
  const monthStart = `${year}-${monthStr}-01`
  const daysInMonth = new Date(year, month, 0).getDate()
  const monthEnd = `${year}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`

  const supabase = createServiceClient()
  const { data: logs } = await supabase
    .from('habit_logs')
    .select('logged_at, habit_id')
    .eq('user_id', userId)
    .gte('logged_at', monthStart)
    .lte('logged_at', monthEnd)

  // Group habits by date
  const dayHabits: Record<string, string[]> = {}
  for (const log of logs ?? []) {
    if (!dayHabits[log.logged_at]) dayHabits[log.logged_at] = []
    dayHabits[log.logged_at].push(log.habit_id)
  }

  const habitLevelMap = new Map(HABITS.map(h => [h.id, h.level]))

  // Calendar grid cells (null = empty padding before month starts)
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const prevYear = month === 1 ? year - 1 : year
  const prevMonth = month === 1 ? 12 : month - 1
  const nextYear = month === 12 ? year + 1 : year
  const nextMonth = month === 12 ? 1 : month + 1

  const totalDaysLogged = Object.keys(dayHabits).length
  const totalScore = Object.values(dayHabits).reduce((sum, habits) => sum + computeDayScore(habits), 0)

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  })

  return (
    <div className="min-h-screen text-bone">
      <div className="max-w-[760px] mx-auto px-4 pt-8 pb-16">

        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Link href="/" className="text-xs text-ash hover:text-bone transition-colors font-mono">
            ← 홈
          </Link>
          <p className="text-[9px] font-mono tracking-[0.22em] text-torch-dim uppercase">
            Primitive Tracker
          </p>
          <div className="w-12" />
        </header>

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href={`/calendar?year=${prevYear}&month=${prevMonth}`}
            className="w-8 h-8 flex items-center justify-center text-ash hover:text-bone transition-colors font-mono text-lg"
          >
            ‹
          </Link>
          <h1 className="text-xl font-bold text-bone tracking-tight">{monthLabel}</h1>
          <Link
            href={`/calendar?year=${nextYear}&month=${nextMonth}`}
            className="w-8 h-8 flex items-center justify-center text-ash hover:text-bone transition-colors font-mono text-lg"
          >
            ›
          </Link>
        </div>

        {/* Day-of-week headers + Calendar grid wrapped in translucent card */}
        <div className="calendar-card px-3 py-4">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_LABELS.map(d => (
              <div key={d} className="text-center text-[10px] font-mono text-ash/70 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (day === null) return <div key={i} />

              const dateStr = `${year}-${monthStr}-${String(day).padStart(2, '0')}`
              const habits = dayHabits[dateStr] ?? []
              const hasLogs = habits.length > 0
              const score = hasLogs ? computeDayScore(habits) : 0
              const isToday = dateStr === today
              const levelsDone = new Set(
                habits
                  .map(id => habitLevelMap.get(id))
                  .filter((l): l is number => l !== undefined)
              )

              return (
                <div
                  key={dateStr}
                  className={[
                    'relative rounded-lg p-1.5 min-h-[60px] sm:min-h-[72px]',
                    hasLogs
                      ? 'bg-[rgba(255,248,235,0.14)] border border-[rgba(196,132,58,0.35)]'
                      : 'bg-[rgba(255,248,235,0.05)]',
                    isToday ? 'ring-1 ring-torch' : '',
                  ].join(' ')}
                >
                  <div className={[
                    'text-[11px] font-mono leading-none',
                    isToday ? 'text-torch font-bold' : hasLogs ? 'text-bone' : 'text-ash/50',
                  ].join(' ')}>
                    {day}
                  </div>
                  {hasLogs && (
                    <>
                      <div className="flex flex-wrap gap-[3px] mt-1.5">
                        {[0, 1, 2, 3, 4].map(level => (
                          <div
                            key={level}
                            className={[
                              'w-1.5 h-1.5 rounded-full',
                              levelsDone.has(level) ? LEVEL_DOT_COLORS[level] : 'opacity-0',
                            ].join(' ')}
                          />
                        ))}
                      </div>
                      <div className="absolute bottom-1 right-1.5 text-[9px] font-mono text-torch tabular-nums">
                        {score}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Monthly summary */}
        <div className="flex items-center gap-3 mt-8 mb-4">
          <div className="h-px flex-1 bg-[rgba(90,52,14,0.25)]" />
          <p className="text-[9px] font-mono tracking-[0.22em] text-[rgba(139,115,85,0.5)] uppercase">
            이번 달 기록
          </p>
          <div className="h-px flex-1 bg-[rgba(90,52,14,0.25)]" />
        </div>

        <div className="flex gap-8">
          <div>
            <p className="text-[9px] font-mono text-ash/60 uppercase tracking-widest mb-1">기록한 날</p>
            <p className="text-2xl font-bold tabular-nums text-bone">
              {totalDaysLogged}<span className="text-ash text-sm ml-1">일</span>
            </p>
          </div>
          <div>
            <p className="text-[9px] font-mono text-ash/60 uppercase tracking-widest mb-1">총 점수</p>
            <p className="text-2xl font-bold tabular-nums text-torch">
              {totalScore}<span className="text-ash text-sm ml-1">pt</span>
            </p>
          </div>
        </div>

        {/* Level legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-6">
          {([
            [0, '생존'],
            [1, '항상성'],
            [2, '성장'],
            [3, '연결'],
            [4, '초월'],
          ] as [number, string][]).map(([level, label]) => (
            <div key={level} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${LEVEL_DOT_COLORS[level]}`} />
              <span className="text-[10px] font-mono text-ash/70">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
