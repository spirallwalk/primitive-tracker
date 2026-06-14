'use client'

import { useActionState } from 'react'
import { setUsername } from '../actions'
import type { SetUsernameState } from '../actions'

export function SetupForm() {
  const [state, action, pending] = useActionState<SetUsernameState, FormData>(setUsername, null)

  return (
    <form action={action} className="flex flex-col gap-3">
      <input
        type="text"
        name="name"
        placeholder="닉네임 (한글 가능)"
        maxLength={30}
        required
        autoFocus
        autoComplete="off"
        className="bg-[rgba(10,5,1,0.65)] border border-[rgba(196,132,58,0.4)] rounded-xl px-4 py-3 text-bone placeholder-[rgba(160,132,92,0.5)] focus:outline-none focus:border-[rgba(196,132,58,0.8)] transition-colors text-base backdrop-blur-sm"
      />
      {state?.error && (
        <p className="text-red-400 text-sm">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-[rgba(196,132,58,0.9)] text-[#0d0905] rounded-xl px-4 py-3 font-bold hover:bg-[rgba(224,144,64,1)] transition-colors disabled:opacity-50 text-base tracking-wide"
      >
        {pending ? '설정 중…' : '시작하기 →'}
      </button>
    </form>
  )
}
