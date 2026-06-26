'use client'

import { useState, useActionState, useEffect, useRef } from 'react'
import { submitCommunityPost } from '../actions'
import type { SubmitPostState } from '../actions'

export function CommunityHeader({
  username,
}: {
  username?: string
}) {
  const [showForm, setShowForm] = useState(false)
  const [category, setCategory] = useState<'review' | 'suggestion'>('review')
  const [state, action, pending] = useActionState<SubmitPostState, FormData>(
    submitCommunityPost,
    null
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
      setShowForm(false)
    }
  }, [state])

  function open(cat: 'review' | 'suggestion') {
    setCategory(cat)
    setShowForm(true)
  }

  const canSubmit = category === 'suggestion' || !!username

  return (
    <div className="mt-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => open('suggestion')}
          className="px-4 py-2 rounded-xl border border-[rgba(196,132,58,0.45)] text-torch text-sm font-medium hover:bg-[rgba(196,132,58,0.08)] transition-colors"
        >
          건의하기
        </button>
        <button
          onClick={() => open('review')}
          className="px-4 py-2 rounded-xl bg-torch text-[#0d0905] text-sm font-semibold hover:bg-torch-bright transition-colors"
        >
          글쓰기 →
        </button>
      </div>

      {showForm && (
        <div className="mt-4 rounded-2xl border border-[rgba(196,132,58,0.22)] bg-[rgba(13,9,5,0.88)] backdrop-blur-sm p-5">
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setCategory('review')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                category === 'review'
                  ? 'bg-torch text-[#0d0905]'
                  : 'text-ash border border-[rgba(196,132,58,0.3)] hover:text-bone'
              }`}
            >
              오늘의 후기
            </button>
            <button
              type="button"
              onClick={() => setCategory('suggestion')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                category === 'suggestion'
                  ? 'bg-torch text-[#0d0905]'
                  : 'text-ash border border-[rgba(196,132,58,0.3)] hover:text-bone'
              }`}
            >
              원시인에게 바란다
            </button>
          </div>

          {category === 'suggestion' && (
            <p className="text-ash/50 text-xs mb-3 font-mono">익명으로 게시됩니다</p>
          )}
          {category === 'review' && !username && (
            <p className="text-amber-500/70 text-xs mb-3">
              후기는 닉네임 설정 후 작성 가능해요
            </p>
          )}

          <form ref={formRef} action={action} className="flex flex-col gap-3">
            <input type="hidden" name="category" value={category} />
            <input
              name="title"
              type="text"
              placeholder="제목"
              required
              maxLength={100}
              className="bg-[rgba(13,9,5,0.7)] border border-[rgba(196,132,58,0.18)] rounded-xl px-4 py-2.5 text-bone placeholder-ash/40 focus:outline-none focus:border-[rgba(196,132,58,0.45)] transition-colors text-sm"
            />
            <textarea
              name="content"
              placeholder={
                category === 'review'
                  ? '오늘 어떤 습관을 했나요? 느낀 점을 공유해주세요 :)'
                  : '사이트에 바라는 점이나 개선 아이디어를 적어주세요'
              }
              required
              maxLength={2000}
              rows={4}
              className="bg-[rgba(13,9,5,0.7)] border border-[rgba(196,132,58,0.18)] rounded-xl px-4 py-2.5 text-bone placeholder-ash/40 focus:outline-none focus:border-[rgba(196,132,58,0.45)] transition-colors text-sm resize-none"
            />
            {state?.error && (
              <p className="text-red-400/80 text-xs">{state.error}</p>
            )}
            <div className="flex justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-ash text-sm hover:text-bone transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={pending || !canSubmit}
                className="px-5 py-2 rounded-xl bg-torch text-[#0d0905] text-sm font-semibold hover:bg-torch-bright transition-colors disabled:opacity-40"
              >
                {pending ? '등록 중…' : '등록하기 →'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
