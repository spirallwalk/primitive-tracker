'use client'

import { useOptimistic, useTransition, useState } from 'react'
import { logHabit } from '../actions'
import type { Habit, LevelGroup } from '@/lib/habits'

const LEVEL_CONFIG: Record<number, {
  topBorder: string
  label: string
  grid: string
}> = {
  0: { topBorder: 'border-t-orange-800', label: '생존',   grid: 'grid-cols-3' },
  1: { topBorder: 'border-t-orange-700', label: '항상성', grid: 'grid-cols-3' },
  2: { topBorder: 'border-t-amber-600',  label: '성장',   grid: 'grid-cols-3' },
  3: { topBorder: 'border-t-amber-500',  label: '연결',   grid: 'grid-cols-2 sm:grid-cols-4' },
  4: { topBorder: 'border-t-amber-400',  label: '초월',   grid: 'grid-cols-2' },
}

export function HabitsGrid({
  levelGroups,
  initialLogs,
}: {
  levelGroups: LevelGroup[]
  initialLogs: string[]
}) {
  const [optimisticLogs, updateOptimistic] = useOptimistic(
    initialLogs,
    (state: string[], habitId: string) =>
      state.includes(habitId)
        ? state.filter((id) => id !== habitId)
        : [...state, habitId]
  )
  const [, startTransition] = useTransition()
  const [pressedId, setPressedId] = useState<string | null>(null)

  function toggle(habitId: string) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(12)
    setPressedId(habitId)
    startTransition(async () => {
      updateOptimistic(habitId)
      await logHabit(habitId)
    })
  }

  return (
    <div className="w-full max-w-[680px] mx-auto flex flex-col gap-2">
      {levelGroups.map((group) => {
        const cfg = LEVEL_CONFIG[group.level]
        const completed = group.habits.filter((h) => optimisticLogs.includes(h.id)).length
        const total = group.habits.length

        return (
          <div
            key={group.level}
            className={[
              'stone-card rounded-2xl px-3 py-2.5',
              'border border-[rgba(90,52,14,0.35)] border-t-2',
              cfg.topBorder,
            ].join(' ')}
          >
            {/* Compact header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono text-torch-dim uppercase tracking-widest">
                  Lv.{group.level}
                </span>
                <span className="w-px h-2.5 bg-torch-dim/40 inline-block" />
                <span className="text-xs font-bold text-bone">{cfg.label}</span>
              </div>
              <span className="text-[10px] font-mono text-ash/70">{completed}/{total}</span>
            </div>

            {/* Horizontal pill buttons */}
            <div className={`grid ${cfg.grid} gap-1.5`}>
              {group.habits.map((habit: Habit) => {
                const isLogged = optimisticLogs.includes(habit.id)
                return (
                  <button
                    key={habit.id}
                    onClick={() => toggle(habit.id)}
                    onAnimationEnd={() => setPressedId(null)}
                    className={[
                      'flex items-center gap-2 rounded-xl h-11 px-3',
                      'transition-colors duration-150 select-none cursor-pointer',
                      isLogged
                        ? `${habit.bg} text-white torch-glow`
                        : 'bg-[rgba(10,5,1,0.55)] text-ash border border-[rgba(138,96,40,0.3)] hover:border-[rgba(196,132,58,0.5)] hover:text-bone',
                      pressedId === habit.id ? 'btn-pressed' : '',
                    ].join(' ')}
                  >
                    <span className="text-base leading-none shrink-0">{habit.emoji}</span>
                    <span className="text-[10px] font-semibold leading-tight">{habit.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
