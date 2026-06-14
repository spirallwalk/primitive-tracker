'use client'

import { useOptimistic, useTransition } from 'react'
import { logHabit } from '../actions'
import type { Habit, LevelGroup } from '@/lib/habits'

const WIDTHS: Record<number, number> = {
  0: 680,
  1: 560,
  2: 440,
  3: 320,
  4: 200,
}

const LEVEL_CONFIG: Record<number, {
  topBorder: string
  label: string
  desc: string
  grid: string
}> = {
  0: { topBorder: 'border-t-orange-800', label: '생존',   desc: '이것 없이는 아무것도 없다',       grid: 'grid-cols-3' },
  1: { topBorder: 'border-t-orange-700', label: '항상성', desc: '몸의 자연스러운 리듬을 유지한다', grid: 'grid-cols-3' },
  2: { topBorder: 'border-t-amber-600',  label: '성장',   desc: '몸을 의도적으로 단련한다',        grid: 'grid-cols-3' },
  3: { topBorder: 'border-t-amber-500',  label: '연결',   desc: '인간은 부족 안에서 번성한다',     grid: 'grid-cols-2' },
  4: { topBorder: 'border-t-amber-400',  label: '초월',   desc: '생각을 놓아주고 깊이 들어간다',  grid: 'grid-cols-2' },
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

  function toggle(habitId: string) {
    startTransition(async () => {
      updateOptimistic(habitId)
      await logHabit(habitId)
    })
  }

  const pyramid = [...levelGroups].reverse()

  return (
    /* 680px = base width, mx-auto centers the whole pyramid */
    <div className="mx-auto overflow-x-hidden" style={{ width: `${WIDTHS[0]}px` }}>
      <div className="relative">

        {/* ── Pyramid silhouette ── */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* filled pyramid */}
          <polygon
            points="50,0 100,100 0,100"
            fill="rgba(120,75,20,0.10)"
          />
          {/* outline — non-scaling-stroke keeps 1.5 px at any zoom */}
          <polygon
            points="50,0 100,100 0,100"
            fill="none"
            stroke="rgba(196,132,58,0.35)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* ── Level cards ── */}
        <div className="relative flex flex-col items-center gap-2">
          {pyramid.map((group) => {
            const cfg = LEVEL_CONFIG[group.level]
            const completed = group.habits.filter((h) => optimisticLogs.includes(h.id)).length
            const total = group.habits.length

            return (
              <div
                key={group.level}
                style={{ width: `${WIDTHS[group.level]}px` }}
                className={[
                  'stone-card rounded-2xl p-4',
                  'border border-[rgba(90,52,14,0.35)] border-t-2',
                  cfg.topBorder,
                ].join(' ')}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[9px] font-mono tracking-[0.2em] text-torch-dim uppercase mb-0.5">
                      Level {group.level}
                    </p>
                    <p className="text-sm font-semibold text-bone tracking-tight leading-none">
                      {cfg.label}
                    </p>
                    <p className="text-[11px] text-ash mt-1 leading-snug">
                      {cfg.desc}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-ash shrink-0 ml-3 mt-0.5">
                    {completed}/{total}
                  </span>
                </div>

                <div className={`grid ${cfg.grid} gap-2`}>
                  {group.habits.map((habit: Habit) => {
                    const isLogged = optimisticLogs.includes(habit.id)
                    return (
                      <button
                        key={habit.id}
                        onClick={() => toggle(habit.id)}
                        className={[
                          'flex flex-col items-center justify-center gap-1 rounded-xl min-h-[96px] px-2 py-3',
                          'transition-all duration-150 active:scale-95 select-none cursor-pointer',
                          isLogged
                            ? `${habit.bg} text-white torch-glow`
                            : 'bg-[rgba(10,5,1,0.55)] text-ash border border-[rgba(138,96,40,0.3)] hover:border-[rgba(196,132,58,0.5)] hover:text-bone',
                        ].join(' ')}
                      >
                        <span className="text-xl leading-none">{habit.emoji}</span>
                        <span className="text-[10px] font-medium leading-snug text-center">
                          {habit.name}
                        </span>
                        <span className={[
                          'text-[9px] leading-tight text-center whitespace-pre-line',
                          isLogged ? 'text-white/80' : 'text-white/70',
                        ].join(' ')}>
                          {habit.hint}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
