import { cookies } from 'next/headers'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase'

function getWeekStart(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  return monday.toISOString().split('T')[0]
}

export default async function LeaderboardPage() {
  const cookieStore = await cookies()
  const currentUsername = cookieStore.get('username')?.value

  const supabase = createServiceClient()
  const weekStart = getWeekStart()

  const { data: logs } = await supabase
    .from('habit_logs')
    .select('user_id, habit_id, users(name)')
    .gte('logged_at', weekStart)

  const scores: Record<string, { name: string; count: number }> = {}
  for (const log of logs ?? []) {
    const uid = log.user_id
    const usersField = log.users as unknown as { name: string } | null
    const name = usersField?.name ?? 'Unknown'
    if (!scores[uid]) scores[uid] = { name, count: 0 }
    scores[uid].count++
  }

  const leaderboard = Object.values(scores).sort((a, b) => b.count - a.count)

  const weekStartDate = new Date(weekStart)
  const today = new Date()
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const weekStr = `${fmt(weekStartDate)} – ${fmt(today)}`

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="text-zinc-600 hover:text-white text-sm transition-colors"
        >
          ← back
        </Link>

        <div className="mt-6 mb-8">
          <h1 className="text-2xl font-bold tracking-tight">leaderboard</h1>
          <p className="text-zinc-600 text-sm mt-1">{weekStr}</p>
        </div>

        {leaderboard.length === 0 ? (
          <p className="text-zinc-700">no habits logged this week yet — be first!</p>
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
                    {entry.count}
                  </span>
                </li>
              )
            })}
          </ol>
        )}

        <p className="text-zinc-800 text-xs mt-8 text-center">
          max {15 * 7} habits possible this week
        </p>
      </div>
    </div>
  )
}
