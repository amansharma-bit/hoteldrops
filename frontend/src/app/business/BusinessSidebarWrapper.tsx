'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  {
    href: '/business/overview',
    label: 'Dashboard',
    icon: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9 9 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </>
    ),
  },
  {
    href: '/business/bookings',
    label: 'Bookings',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3m9-14h1m-1 4h1m-5-4h1m-1 4h1"
      />
    ),
  },
  {
    href: '/business/rebookings',
    label: 'Rebookings',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />,
  },
  {
    href: '/business/live-search',
    label: 'Manual Search',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    ),
  },
  {
    href: '/business/reports',
    label: 'Analytics',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0a2 2 0 002 2h2a2 2 0 002-2v-3a2 2 0 00-2-2h-2"
      />
    ),
  },
  {
    href: '/business/settings',
    label: 'Settings',
    icon: (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </>
    ),
  },
];

// This is a plain component, NOT a Next.js layout.tsx — it doesn't wrap
// anything automatically based on folder location. Each dashboard page
// imports this directly and wraps its own content with it.
export default function BusinessSidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-50 text-[#0F172A]">
      <aside
        className="w-52 flex flex-col justify-between fixed inset-y-0 left-0"
        style={{ background: 'linear-gradient(180deg, #12379b 0%, #1447b8 55%, #1e56d6 100%)' }}
      >
        <div>
          <div className="px-6 py-6">
            <Link href="/business" className="flex items-baseline gap-2">
              <span className="font-extrabold text-lg text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                rebuq<span className="text-[#FCD34D]">.</span>
              </span>
              <span className="text-xs font-semibold tracking-wide text-white/50 uppercase">Business</span>
            </Link>
          </div>

          <div className="px-6 mb-6">
            <button className="w-full text-xs font-semibold text-white/70 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md py-2.5 transition-colors">
              Send us feedback
            </button>
          </div>

          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
                    active
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-white/60 hover:bg-white/5 hover:text-white font-medium'
                  }`}
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {item.icon}
                  </svg>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="px-6 py-6 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1447b8] flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
              GN
            </div>
            <div className="overflow-hidden">
              <p className="text-sm text-white truncate">GRN Connect</p>
              <p className="text-xs text-white/40 truncate">deepak.narula@grnconnect.com</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-52">{children}</main>
    </div>
  );
}
