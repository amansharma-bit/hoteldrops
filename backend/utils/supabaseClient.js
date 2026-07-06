// backend/utils/supabaseClient.js
//
// Server-side Supabase client for the backend. Uses the service_role key,
// which bypasses Row Level Security — appropriate here since this runs
// entirely on the server (Railway), never in a browser.
//
// Required environment variables (set in Railway — separately from
// Vercel; these are two different platforms and each needs its own copy):
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '[supabaseClient] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set yet. ' +
    'Add them in Railway: Project -> Variables.'
  );
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

module.exports = supabase;
