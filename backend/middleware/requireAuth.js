// middleware/requireAuth.js
//
// Protects backend API routes — verifies the request carries a valid
// Supabase session token. Without this, anyone who discovers an API URL
// (like /api/live-search/bookings-list) could call it directly and see
// real booking data, even if the frontend page itself has a login wall.

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated. Please sign in.' });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: 'Session invalid or expired. Please sign in again.' });
  }

  // Double-check the email is still on the allowed list — covers the case
  // where someone's access needs to be revoked later without deleting
  // their Supabase account entirely.
  const { data: allowed } = await supabase
    .from('allowed_business_users')
    .select('email')
    .eq('email', data.user.email)
    .single();

  if (!allowed) {
    return res.status(403).json({ error: 'This account is not authorized for business access.' });
  }

  req.user = data.user;
  next();
}

module.exports = { requireAuth };
