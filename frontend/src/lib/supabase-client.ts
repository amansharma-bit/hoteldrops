// lib/supabase-client.ts
//
// Frontend Supabase client — uses the public ANON key (safe to expose in
// browser code), NOT the service key (which stays server-side only, in
// backend/middleware/requireAuth.js).

'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
