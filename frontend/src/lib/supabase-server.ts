import { createClient } from '@supabase/supabase-js';

// SERVER-SIDE ONLY. Never import this file in a 'use client' component —
// it uses the service_role key, which bypasses Row Level Security entirely
// and must never reach the browser.
//
// Required environment variables (set these in Vercel project settings,
// NOT committed to the repo):
//   SUPABASE_URL              — your Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY — the service_role secret key (Settings -> API)
//
// Do NOT prefix these with NEXT_PUBLIC_ — that prefix makes a variable
// visible in browser JavaScript, which would leak the service_role key to
// anyone who opens dev tools on your site.

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. ' +
    'Add them in Vercel: Project Settings -> Environment Variables.'
  );
}

export const supabaseServer = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false }, // server-side, no session needed
  }
);
