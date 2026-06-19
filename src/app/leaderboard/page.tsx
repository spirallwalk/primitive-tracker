import { cookies } from 'next/headers'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase'
import { computeDayScore, MAX_DAY_SCORE } from '@/lib/habits'

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function getWeekStart(offsetWeeks = 0): string {
  const now = new Date()
  const day = now.getDay()
  const diff = (day === 0 ? -6 : 1 - day) - offsetWeeks * 7
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  return monday.toISOString().split('T')[0]
}

function getMonthStart(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
}

type LogRow = { user_id: string; habit_id: string; logged_at: string; users: unknown }

function computeScores(logs: LogRow[]) {
  const userNames: Record<string, string> = {}
  const userDayHabits: Record<string, Record<string, string[]>> = {}

  for (const log of logs) {
    const uid = log.user_id
    const day = log.logged_at
    const name = (log.users as { name: string } | null)?.name ?? 'Unknown'
    userNames[uid] = name
    if (!userDayHabits[uid]) userDayHabits[uid] = {}
    if (!userDayHabits[uid][day]) userDayHabits[uid][day] = []
    userDayHabits[uid][day].push(log.habit_id)
  }

  return Object.entries(userDayHabits)
    .map(([uid, days]) => ({
      name: userNames[uid],
      score: Object.values(days).reduce((sum, ids) => sum + computeDayScore(ids), 0),
    }))
    .sort((a, b) => b.score - a.score)
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  return `${fmt(start)} ~ ${fmt(end)}`
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { tab = 'today' } = await searchParams
  const activeTab = typeof tab === 'string' ? tab : 'today'

  const cookieStore = await cookies()
  const currentUsername = cookieStore.get('username')?.value

  const supabase = createServiceClient()
  const today = getToday()
  const thisWeekStart = getWeekStart(0)
  const lastWeekStart = getWeekStart(1)
  const monthStart = getMonthStart()

  // 지난 주 우승자 명예의 전당 저장
  const { data: existingFame } = await supabase
    .from('hall_of_fame')
    .select('week_start')
    .eq('week_start', lastWeekStart)
    .maybeSingle()

  if (!existingFame) {
    const { data: lastWeekLogs } = await supabase
      .from('habit_logs')
      .select('user_id, habit_id, logged_at, users(name)')
      .gte('logged_at', lastWeekStart)
      .lt('logged_at', thisWeekStart)

    if (lastWeekLogs && lastWeekLogs.length > 0) {
      const ranked = computeScores(lastWeekLogs as LogRow[])
      const winner = ranked[0]
      if (winner) {
        await supabase.from('hall_of_fame').upsert(
          { week_start: lastWeekStart, user_name: winner.name, score: winner.score },
          { onConflict: 'week_start' }
        )
      }
    }
  }

  const { data: hallOfFame } = await supabase
    .from('hall_of_fame')
    .select('week_start, user_name, score')
    .order('week_start', { ascending: false })
    .limit(10)

  // 탭별 데이터 fetch
  let logs: LogRow[] = []
  let periodLabel = ''
  let emptyMessage = ''

  const now = new Date()
  const fmt = (d: Date) => d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })

  if (activeTab === 'today') {
    const { data } = await supabase
      .from('habit_logs')
      .select('user_id, habit_id, logged_at, users(name)')
      .eq('logged_at', today)
    logs = (data ?? []) as LogRow[]
    periodLabel = now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
    emptyMessage = '오늘 아직 아무도 없어요 — 첫 번째가 되세요!'
  } else if (activeTab === 'week') {
    const { data } = await supabase
      .from('habit_logs')
      .select('user_id, habit_id, logged_at, users(name)')
      .gte('logged_at', thisWeekStart)
    logs = (data ?? []) as LogRow[]
    periodLabel = `${fmt(new Date(thisWeekStart + 'T00:00:00'))} – ${fmt(now)}`
    emptyMessage = '이번 주 아직 기록이 없어요.'
  } else if (activeTab === 'month') {
    const { data } = await supabase
      .from('habit_logs')
      .select('user_id, habit_id, logged_at, users(name)')
      .gte('logged_at', monthStart)
    logs = (data ?? []) as LogRow[]
    periodLabel = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
    emptyMessage = '이번 달 아직 기록이 없어요.'
  }

  const leaderboard = computeScores(logs)
  const medals = ['🥇', '🥈', '🥉']

  const tabs = [
    { id: 'today', label: '오늘' },
    { id: 'week', label: '이번 주' },
    { id: 'month', label: '이번 달' },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="text-zinc-600 hover:text-white text-sm transition-colors"
        >
          ← back
        </Link>

        <div className="mt-6 mb-6">
          <h1 className="text-2xl font-bold tracking-tight">leaderboard</h1>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 mb-5">
          {tabs.map((t) => (
            <Link
              key={t.id}
              href={`/leaderboard?tab=${t.id}`}
              className={[
                'flex-1 text-center py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === t.id
                  ? 'bg-white text-black'
                  : 'text-zinc-500 hover:text-zinc-200',
              ].join(' ')}
            >
              {t.label}
            </Link>
          ))}
        </div>

        <p className="text-zinc-600 text-sm mb-4">{periodLabel}</p>

        {leaderboard.length === 0 ? (
          <p className="text-zinc-700">{emptyMessage}</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {leaderboard.map((entry, i) => {
              const isCurrentUser = entry.name === currentUsername
              return (
                <li
                  key={entry.name}
                  className={[
                    'flex items-center gap-4 rounded-xl px-5 py-4',
                    isCurrentUser
                      ? 'bg-zinc-800 ring-1 ring-zinc-600'
                      : 'bg-zinc-900',
                  ].join(' ')}
                >
                  <span className="text-lg w-6 text-center shrink-0">
                    {medals[i] ?? <span className="text-zinc-600 font-mono text-sm">{i + 1}</span>}
                  </span>
                  <span className="flex-1 font-medium">
                    {entry.name}
                    {isCurrentUser && (
                      <span className="text-zinc-500 text-xs ml-2">(you)</span>
                    )}
                  </span>
                  <span className="text-zinc-400 text-sm font-mono tabular-nums">
                    {entry.score}pt
                  </span>
                </li>
              )
            })}
          </ol>
        )}

        <p className="text-zinc-800 text-xs mt-6 text-center">
          {activeTab === 'today' && `최대 ${MAX_DAY_SCORE}pt / 일`}
          {activeTab === 'week' && `최대 ${MAX_DAY_SCORE * 7}pt / 주`}
          {activeTab === 'month' && `최대 ${MAX_DAY_SCORE}pt × ${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}일`}
        </p>

        {/* 명예의 전당 */}
        {hallOfFame && hallOfFame.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-zinc-800" />
              <h2 className="text-xs font-mono tracking-widest text-zinc-500 uppercase">명예의 전당</h2>
              <div className="h-px flex-1 bg-zinc-800" />
            </div>
            <div className="flex flex-col gap-2">
              {hallOfFame.map((entry) => (
                <div
                  key={entry.week_start}
                  className="flex items-center gap-4 rounded-xl px-5 py-3 bg-zinc-900"
                >
                  <span className="text-base">🏆</span>
                  <span className="flex-1 font-medium text-sm">{entry.user_name}</span>
                  <span className="text-zinc-600 text-xs font-mono">{formatWeekRange(entry.week_start)}</span>
                  <span className="text-amber-500 text-sm font-mono tabular-nums">{entry.score}pt</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
