'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/',            label: '홈',     icon: '🏕' },
  { href: '/calendar',   label: '캘린더',  icon: '📅' },
  { href: '/leaderboard',label: '순위표',  icon: '🏆' },
  { href: '/community',  label: '커뮤니티',icon: '💬' },
  { href: '/feedback',   label: '방명록',  icon: '✍️' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-[rgba(196,132,58,0.15)] bg-[rgba(10,6,2,0.92)] backdrop-blur-md"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-1 py-1.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[52px] ${
                active
                  ? 'text-torch'
                  : 'text-ash/55 hover:text-ash'
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className={`text-[10px] font-medium tracking-tight ${
                active ? 'text-torch' : 'text-ash/55'
              }`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
