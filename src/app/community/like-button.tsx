'use client'

import { useState, startTransition } from 'react'
import { likeCommunityPost } from '../actions'

export function LikeButton({
  postId,
  initialCount,
  isLiked: initialIsLiked,
  hasUser,
}: {
  postId: string
  initialCount: number
  isLiked: boolean
  hasUser: boolean
}) {
  const [liked, setLiked] = useState(initialIsLiked)
  const [count, setCount] = useState(initialCount)

  function toggle() {
    if (!hasUser) return
    const next = !liked
    setLiked(next)
    setCount((c) => c + (next ? 1 : -1))
    startTransition(() => {
      likeCommunityPost(postId)
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={!hasUser}
      title={hasUser ? (liked ? '공감 취소' : '공감하기') : '닉네임 설정 후 공감 가능'}
      className={`flex items-center gap-1 transition-colors ${
        liked
          ? 'text-torch'
          : hasUser
            ? 'text-ash/50 hover:text-torch/70'
            : 'text-ash/30 cursor-default'
      }`}
    >
      👍 {count}
    </button>
  )
}
