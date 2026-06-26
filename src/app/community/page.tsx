import { cookies } from 'next/headers'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase'
import { CommunityHeader } from './community-header'
import { LikeButton } from './like-button'

type Post = {
  id: string
  category: 'review' | 'suggestion'
  title: string
  content: string
  user_name: string | null
  view_count: number
  like_count: number
  comment_count: number
  created_at: string
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return '방금'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}일 전`
  return new Date(dateStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; sort?: string }>
}) {
  const { tab = 'review', sort = 'latest' } = await searchParams

  const cookieStore = await cookies()
  const username = cookieStore.get('username')?.value
  const userId = cookieStore.get('user_id')?.value

  const supabase = createServiceClient()
  const category = tab === 'suggestion' ? 'suggestion' : 'review'
  const isReviewTab = category === 'review'

  const baseQuery = supabase
    .from('community_posts')
    .select('id, category, title, content, user_name, view_count, like_count, comment_count, created_at')
    .eq('category', category)
    .limit(50)

  const [{ data: posts, error }, { data: likes }] = await Promise.all([
    sort === 'popular'
      ? baseQuery.order('like_count', { ascending: false }).order('comment_count', { ascending: false })
      : baseQuery.order('created_at', { ascending: false }),
    userId
      ? supabase.from('community_likes').select('post_id').eq('user_id', userId)
      : Promise.resolve({ data: null, error: null }),
  ])

  const likedSet = new Set((likes ?? []).map((l: { post_id: string }) => l.post_id))

  return (
    <div className="min-h-screen text-bone">
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-16">
        <Link href="/" className="text-ash hover:text-bone text-sm transition-colors font-mono">
          ← back
        </Link>

        <div className="mt-6">
          <h1 className="text-2xl font-bold text-bone tracking-tight">커뮤니티</h1>
          <p className="text-ash text-sm mt-1 leading-relaxed">
            오늘 습관 어땠는지 남기고, 사이트에 바라는 점도 자유롭게 적어보세요
          </p>
        </div>

        <CommunityHeader username={username} />

        {/* Tabs + Sort */}
        <div className="flex flex-col gap-3 mt-8 mb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 bg-[rgba(29,21,17,0.85)] border border-[rgba(196,132,58,0.1)] rounded-xl p-1">
            <Link
              href={`/community?tab=review&sort=${sort}`}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isReviewTab ? 'bg-torch text-[#0d0905]' : 'text-ash hover:text-bone'
              }`}
            >
              오늘의 후기
            </Link>
            <Link
              href={`/community?tab=suggestion&sort=${sort}`}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                !isReviewTab ? 'bg-torch text-[#0d0905]' : 'text-ash hover:text-bone'
              }`}
            >
              원시인에게 바란다
            </Link>
          </div>

          <div className="flex gap-1 bg-[rgba(29,21,17,0.85)] border border-[rgba(196,132,58,0.1)] rounded-xl p-1 text-xs self-start sm:self-auto">
            <Link
              href={`/community?tab=${tab}&sort=latest`}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                sort !== 'popular'
                  ? 'bg-[rgba(196,132,58,0.2)] text-bone'
                  : 'text-ash hover:text-bone'
              }`}
            >
              최신순
            </Link>
            <Link
              href={`/community?tab=${tab}&sort=popular`}
              className={`px-3 py-1.5 rounded-lg transition-colors font-medium ${
                sort === 'popular'
                  ? 'bg-[rgba(196,132,58,0.2)] text-bone'
                  : 'text-ash hover:text-bone'
              }`}
            >
              인기순
            </Link>
          </div>
        </div>

        {/* Feed */}
        {error ? (
          <p className="text-ash/60 text-sm text-center py-16">
            불러오는 중 오류가 발생했어요
          </p>
        ) : !posts || posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-ash text-sm">아직 글이 없어요</p>
            <p className="text-ash/40 text-xs mt-1">첫 번째 글을 남겨보세요!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {(posts as Post[]).map((post) => {
              const popular = post.like_count + post.comment_count >= 5
              return (
                <article
                  key={post.id}
                  className="rounded-2xl px-5 py-4 border border-[rgba(196,132,58,0.13)] bg-[rgba(29,21,17,0.9)] shadow-[0_2px_20px_rgba(0,0,0,0.5)] backdrop-blur-sm"
                >
                  {popular && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-torch bg-[rgba(196,132,58,0.15)] rounded-full px-2.5 py-0.5 mb-2">
                      🔥 인기
                    </span>
                  )}

                  <h3 className="font-semibold text-bone text-[15px] leading-snug">
                    {post.title}
                  </h3>

                  <p className="text-ash text-sm mt-1.5 leading-relaxed line-clamp-2">
                    {post.content}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[rgba(196,132,58,0.08)]">
                    <span className="text-xs text-ash/70">
                      {isReviewTab ? (post.user_name ?? '익명') : '익명'}
                      <span className="text-ash/35 mx-1.5">·</span>
                      {timeAgo(post.created_at)}
                    </span>
                    <div className="flex items-center gap-3 text-xs text-ash/50">
                      <span>👁 {post.view_count}</span>
                      <span>💬 {post.comment_count}</span>
                      {!isReviewTab && (
                        <LikeButton
                          postId={post.id}
                          initialCount={post.like_count}
                          isLiked={likedSet.has(post.id)}
                          hasUser={!!userId}
                        />
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
