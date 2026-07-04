'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  {
    href: '/business/overview',
    label: 'Overview',
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
    href: '/business/reports',
    label: 'Reports',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m0 0a2 2 0 002 2h2a2 2 0 002-2v-3a2 2 0 00-2-2h-2"
      />
    ),
  },
];

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-50 text-[#0F172A]">

      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0F172A] flex flex-col justify-between fixed inset-y-0 left-0">
        <div>
          <div className="px-6 py-6">
            <Link href="/business" className="flex items-baseline gap-2">
              <span
                className="font-extrabold text-lg text-white"
                style={{ fontFamily: 'Sora, sans-serif' }}
              >
                rebuq<span className="text-[#FCD34D]">.</span>
              </span>
              <span className="text-xs font-semibold tracking-wide text-white/50 uppercase">
                Business
              </span>
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
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
              V2F
            </div>
            <div className="overflow-hidden">
              <p className="text-sm text-white truncate">Visa2Fly Ops</p>
              <p className="text-xs text-white/40 truncate">business@visa2fly.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 ml-64">{children}</main>
    </div>
  );
}
