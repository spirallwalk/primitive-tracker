'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase'

export type SetUsernameState = { error?: string } | null

export async function setUsername(
  _prev: SetUsernameState,
  formData: FormData
): Promise<SetUsernameState> {
  const name = (formData.get('name') as string ?? '').trim()
  if (name.length < 2) return { error: '닉네임은 2자 이상이어야 합니다' }
  if (name.length > 30) return { error: '닉네임은 30자 이하여야 합니다' }
  if (!/^[a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ_\- ]+$/.test(name)) return { error: '글자, 숫자, 한글, 공백, 하이픈, 밑줄만 사용 가능합니다' }

  const supabase = createServiceClient()
  const { data: user, error } = await supabase
    .from('users')
    .upsert({ name }, { onConflict: 'name' })
    .select('id')
    .single()

  if (error || !user) return { error: 'Could not save name — try again' }

  const cookieStore = await cookies()
  cookieStore.set('username', name, { maxAge: 60 * 60 * 24 * 365, path: '/' })
  cookieStore.set('user_id', user.id, { maxAge: 60 * 60 * 24 * 365, path: '/', httpOnly: true })

  revalidatePath('/')
  return null
}

export async function resetUser(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('username')
  cookieStore.delete('user_id')
  redirect('/')
}

export type SubmitFeedbackState = { error?: string; success?: boolean } | null

export async function submitFeedback(
  _prev: SubmitFeedbackState,
  formData: FormData
): Promise<SubmitFeedbackState> {
  const cookieStore = await cookies()
  const username = cookieStore.get('username')?.value
  if (!username) return { error: '로그인이 필요합니다' }

  const message = (formData.get('message') as string ?? '').trim()
  if (message.length < 5) return { error: '5자 이상 입력해 주세요' }
  if (message.length > 500) return { error: '500자 이하로 작성해 주세요' }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('feedback')
    .insert({ user_name: username, message })

  if (error) return { error: '저장 실패 — 다시 시도해 주세요' }

  revalidatePath('/feedback')
  return { success: true }
}

export type SubmitPostState = { error?: string; success?: boolean } | null

export async function submitCommunityPost(
  _prev: SubmitPostState,
  formData: FormData
): Promise<SubmitPostState> {
  const cookieStore = await cookies()
  const username = cookieStore.get('username')?.value

  const category = (formData.get('category') as string ?? '').trim()
  const title = (formData.get('title') as string ?? '').trim()
  const content = (formData.get('content') as string ?? '').trim()

  if (!['review', 'suggestion'].includes(category)) return { error: '잘못된 카테고리입니다' }
  if (title.length < 2) return { error: '제목은 2자 이상 입력해 주세요' }
  if (title.length > 100) return { error: '제목은 100자 이하로 작성해 주세요' }
  if (content.length < 10) return { error: '내용은 10자 이상 입력해 주세요' }
  if (content.length > 2000) return { error: '내용은 2000자 이하로 작성해 주세요' }
  if (category === 'review' && !username) return { error: '후기는 닉네임 설정 후 작성 가능해요' }

  const supabase = createServiceClient()
  const { error } = await supabase.from('community_posts').insert({
    category,
    title,
    content,
    user_name: category === 'review' ? username : null,
  })

  if (error) return { error: '저장 실패 — 다시 시도해 주세요' }

  revalidatePath('/community')
  return { success: true }
}

export async function likeCommunityPost(postId: string): Promise<void> {
  const cookieStore = await cookies()
  const userId = cookieStore.get('user_id')?.value
  if (!userId) return

  const supabase = createServiceClient()

  const [{ data: existing }, { data: post }] = await Promise.all([
    supabase
      .from('community_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('community_posts')
      .select('like_count')
      .eq('id', postId)
      .single(),
  ])

  if (!post) return

  if (existing) {
    await Promise.all([
      supabase.from('community_likes').delete().eq('id', existing.id),
      supabase
        .from('community_posts')
        .update({ like_count: Math.max(0, post.like_count - 1) })
        .eq('id', postId),
    ])
  } else {
    await Promise.all([
      supabase.from('community_likes').insert({ post_id: postId, user_id: userId }),
      supabase
        .from('community_posts')
        .update({ like_count: post.like_count + 1 })
        .eq('id', postId),
    ])
  }

  revalidatePath('/community')
}

export async function logHabit(habitId: string): Promise<void> {
  const cookieStore = await cookies()
  const userId = cookieStore.get('user_id')?.value
  if (!userId) return

  const supabase = createServiceClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: existing } = await supabase
    .from('habit_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('habit_id', habitId)
    .eq('logged_at', today)
    .maybeSingle()

  if (existing) {
    await supabase.from('habit_logs').delete().eq('id', existing.id)
  } else {
    await supabase.from('habit_logs').insert({ user_id: userId, habit_id: habitId, logged_at: today })
  }

  revalidatePath('/')
  revalidatePath('/leaderboard')
}
