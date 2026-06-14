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
        placeholder="your name"
        maxLength={30}
        required
        autoFocus
        className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
      />
      {state?.error && (
        <p className="text-red-400 text-sm">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-white text-black rounded-xl px-4 py-3 font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-50"
      >
        {pending ? 'setting up…' : 'start tracking →'}
      </button>
    </form>
  )
}
