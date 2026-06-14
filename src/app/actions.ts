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
