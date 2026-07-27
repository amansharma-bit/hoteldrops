import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Coming-soon gate.
//
// Sends every public page to /coming-soon while rebuq is still being finished.
// The business console and everything it needs stay fully open:
//
//   /business   the GRN console and its login (/business/login)
//   /api        every backend/API route
//   /coming-soon the page itself (so it doesn't redirect to itself)
//   /_next, favicon, and other static assets
//
// To take the whole site live later: delete this file (or empty the matcher).
// ---------------------------------------------------------------------------

const OPEN_PREFIXES = [
  '/business',
  '/api',
  '/coming-soon',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let anything under an open prefix through untouched.
  if (OPEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // Everything else on the public site shows coming soon.
  const url = request.nextUrl.clone();
  url.pathname = '/coming-soon';
  return NextResponse.rewrite(url);
}

// Skip Next internals and static files so images, fonts and the build assets
// still load on the coming-soon page itself.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|woff2?)$).*)'],
};
