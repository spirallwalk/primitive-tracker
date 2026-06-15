import { cookies } from 'next/headers'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase'
import { FeedbackForm } from './feedback-form'

export default async function FeedbackPage() {
  const cookieStore = await cookies()
  const username = cookieStore.get('username')?.value

  const supabase = createServiceClient()
  const { data: entries } = await supabase
    .from('feedback')
    .select('id, user_name, message, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/" className="text-zinc-600 hover:text-white text-sm transition-colors">
          ← back
        </Link>

        <div className="mt-6 mb-8">
          <h1 className="text-2xl font-bold tracking-tight">방명록</h1>
          <p className="text-zinc-600 text-sm mt-1">
            불편한 점, 추가하고 싶은 습관, 뭐든 남겨주세요
          </p>
        </div>

        {username ? (
          <div className="mb-10">
            <p className="text-zinc-500 text-xs font-mono mb-3">{username} 으로 남기기</p>
            <FeedbackForm />
          </div>
        ) : (
          <div className="mb-10 rounded-xl bg-zinc-900 px-5 py-4 text-sm text-zinc-500">
            <Link href="/" className="text-zinc-300 underline underline-offset-2">닉네임 설정</Link> 후 남길 수 있어요
          </div>
        )}

        <div className="flex items-center gap-3 mb-5">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-xs font-mono tracking-widest text-zinc-600 uppercase">
            {entries?.length ?? 0}개의 의견
          </span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        {entries && entries.length > 0 ? (
          <div className="flex flex-col gap-3">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-xl bg-zinc-900 px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{entry.user_name}</span>
                  <span className="text-zinc-600 text-xs font-mono">
                    {new Date(entry.created_at).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
                  {entry.message}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-700 text-sm">아직 의견이 없어요 — 첫 번째가 되어보세요!</p>
        )}
      </div>
    </div>
  )
}
