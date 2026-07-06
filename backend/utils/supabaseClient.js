// backend/utils/supabaseClient.js
//
// Server-side Supabase client for the backend. Uses the service_role key,
// which bypasses Row Level Security — appropriate here since this runs
// entirely on the server (Railway), never in a browser.
//
// Accepts either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY —
// your Railway project already had the latter set from earlier work,
// so this avoids needing to touch Railway again.

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[supabaseClient] SUPABASE_URL or a Supabase service key (SUPABASE_SERVICE_ROLE_KEY / ' +
    'SUPABASE_SERVICE_KEY) is not set yet. Add them in Railway: Project -> Variables.'
  );
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

module.exports = supabase;
