'use client'

import { useActionState, useEffect, useRef } from 'react'
import { submitFeedback } from '../actions'
import type { SubmitFeedbackState } from '../actions'

export function FeedbackForm() {
  const [state, action, pending] = useActionState<SubmitFeedbackState, FormData>(submitFeedback, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <textarea
        name="message"
        placeholder="불편한 점, 추가했으면 하는 습관, 뭐든 좋아요 :)"
        maxLength={500}
        required
        rows={4}
        className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors text-sm resize-none"
      />
      {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
      {state?.success && <p className="text-emerald-400 text-sm">남겨주셔서 감사해요 🙏</p>}
      <button
        type="submit"
        disabled={pending}
        className="self-end bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
      >
        {pending ? '등록 중…' : '남기기 →'}
      </button>
    </form>
  )
}
