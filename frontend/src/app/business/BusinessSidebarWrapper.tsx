'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase-client';

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
    href: '/business/repricing',
    label: 'Repricing',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
  },
  {
    href: '/business/searches',
    label: 'Searches made',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />,
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
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: { data: { session: any } }) => {
      if (!data.session) {
        router.push('/business/login');
      } else {
        setAuthed(true);
        const u = data.session.user;
        const email = u?.email || '';
        setUserEmail(email);
        // Prefer a name from user metadata; else derive from the email handle.
        const metaName = u?.user_metadata?.name || u?.user_metadata?.full_name;
        setUserName(metaName || (email ? email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Account'));
      }
      setCheckingAuth(false);
    });
  }, [router]);

  const initials = (userName || userEmail || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  if (checkingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <p style={{ fontSize: 14, color: '#64748B' }}>Checking access…</p>
      </div>
    );
  }
  if (!authed) return null; // redirecting to login

  return (
    <div className="flex min-h-screen bg-slate-50 text-[#0F172A]">
      <aside
        className="w-52 flex flex-col justify-between fixed inset-y-0 left-0"
        style={{ background: 'linear-gradient(180deg, #1560c9 0%, #0F52BA 55%, #0c449c 100%)' }}
      >
        <div>
          <div className="px-6 py-6">
            <Link href="/business" className="flex items-baseline gap-2">
              <span className="font-extrabold text-lg text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                rebuq<span className="text-[#FCD34D]">.</span>
              </span>
              <span className="text-xs font-semibold tracking-wide text-white/70 uppercase">Business</span>
            </Link>
          </div>

          <div className="px-6 mb-6">
            <button className="w-full text-xs font-semibold text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 rounded-md py-2.5 transition-colors">
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
                      ? 'bg-white/20 text-white font-semibold'
                      : 'text-white/80 hover:bg-white/10 hover:text-white font-medium'
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

        <div className="px-6 py-6 border-t border-white/15">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm text-white truncate">{userName || 'Account'}</p>
              <p className="text-xs text-white/60 truncate">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/business/login'); }}
            className="w-full text-xs font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-md py-2 transition-colors flex items-center justify-center gap-2"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-52">{children}</main>
    </div>
  );
}
