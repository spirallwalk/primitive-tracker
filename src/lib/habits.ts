export type Habit = {
  id: string
  emoji: string
  name: string
  hint: string
  bg: string
  level: number
}

export type LevelGroup = {
  level: number
  label: string
  habits: Habit[]
}

const ALL_HABITS: Habit[] = [
  // 레벨 0: 생존
  { id: 'sleep',      emoji: '😴',   name: '수면',          hint: '7-9시간\n취침 전 폰 금지',        bg: 'bg-indigo-500',  level: 0 },
  { id: 'water',      emoji: '💧',   name: '물',            hint: '하루 2L\n기상 직후 500ml',          bg: 'bg-blue-500',    level: 0 },
  { id: 'breathe',    emoji: '😮‍💨',  name: '호흡',          hint: '복식호흡\n4-7-8 호흡법',            bg: 'bg-teal-500',    level: 0 },

  // 레벨 1: 항상성
  { id: 'sunlight',   emoji: '☀️',   name: '햇빛',          hint: '아침 15분\n햇빛 쬐기',              bg: 'bg-yellow-500',  level: 1 },
  { id: 'walk',       emoji: '🚶',   name: '걷기',          hint: '20분 이상 산책\n러닝 30분 (존2)',     bg: 'bg-green-500',   level: 1 },
  { id: 'nutrition',  emoji: '🥩',   name: '영양',          hint: '자연식\n가공식품 줄이기',            bg: 'bg-emerald-500', level: 1 },

  // 레벨 2: 성장
  { id: 'discomfort', emoji: '🧊',   name: '의도된 불편함', hint: '냉수샤워\n사우나\n금식',             bg: 'bg-cyan-500',    level: 2 },
  { id: 'strength',   emoji: '🏋️',  name: '근력운동',      hint: '웨이트\n푸쉬업\n스쿼트',            bg: 'bg-orange-500',  level: 2 },
  { id: 'cardio',     emoji: '🔥',   name: '고강도운동',    hint: '크로스핏\nF45\n인터벌',              bg: 'bg-red-500',     level: 2 },
  { id: 'zone5',      emoji: '⚡',   name: '존5',           hint: '전력 질주\n최대심박 90%+\n타바타',   bg: 'bg-amber-500',   level: 2 },

  // 레벨 3: 연결
  { id: 'tribe',      emoji: '👥',   name: '부족',          hint: '친구 만나기\n운동 모임',             bg: 'bg-violet-500',  level: 3 },
  { id: 'facetime',   emoji: '🤝',   name: '대면',          hint: '눈맞춤\n포옹\n직접 만남',            bg: 'bg-pink-500',    level: 3 },
  { id: 'contribute', emoji: '🌱',   name: '기여',          hint: '남 돕기\n작은 친절',                 bg: 'bg-lime-500',    level: 3 },
  { id: 'sex',        emoji: '❤️',   name: '사랑',          hint: '—',                                  bg: 'bg-rose-500',    level: 3 },

  // 레벨 4: 초월
  { id: 'defocus',    emoji: '🌀',   name: '탈집중',        hint: '멍때리기\n자연 속 산책',             bg: 'bg-slate-500',   level: 4 },
  { id: 'flow',       emoji: '🎯',   name: '몰입',          hint: '독서\n글쓰기\n창작',                 bg: 'bg-purple-500',  level: 4 },
]

export const HABITS = ALL_HABITS

export const LEVEL_GROUPS: LevelGroup[] = [
  { level: 0, label: '레벨 0  생존',   habits: ALL_HABITS.filter(h => h.level === 0) },
  { level: 1, label: '레벨 1  항상성', habits: ALL_HABITS.filter(h => h.level === 1) },
  { level: 2, label: '레벨 2  성장',   habits: ALL_HABITS.filter(h => h.level === 2) },
  { level: 3, label: '레벨 3  연결',   habits: ALL_HABITS.filter(h => h.level === 3) },
  { level: 4, label: '레벨 4  초월',   habits: ALL_HABITS.filter(h => h.level === 4) },
]

export const LEVEL_SCORE: Record<number, number> = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5 }

export function computeDayScore(loggedHabitIds: string[]): number {
  const loggedSet = new Set(loggedHabitIds)
  let score = 0
  for (const habit of ALL_HABITS) {
    if (loggedSet.has(habit.id)) score += LEVEL_SCORE[habit.level]
  }
  if (loggedSet.size === ALL_HABITS.length) score += 10
  return score
}

// 3×1 + 3×2 + 4×3 + 4×4 + 2×5 + 10 보너스 = 57
export const MAX_DAY_SCORE = ALL_HABITS.reduce((s, h) => s + LEVEL_SCORE[h.level], 0) + 10
