// ============================================================
// BayuOne — Supabase client (single instance)
// ============================================================
// This is the ONLY place in BayuOne that creates a Supabase
// client. Every other module imports it from here.
//
// The publishable (anon) key is safe to expose in frontend code
// as long as Row Level Security is enabled on all tables.
// NEVER put the service_role key here.
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://voxnrgoitktdiyvsvfac.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vjUIAoqsAJRadmN3DM-04w_jh1oNkl9';

export const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Shared constant used by every module that links to BayuOne TikTok.
export const TIKTOK_BAYUONE_URL = 'https://www.tiktok.com/@bayuone.my';
