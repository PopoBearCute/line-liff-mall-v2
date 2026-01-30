import { createClient } from '@supabase/supabase-js';

// Reverting to simple, direct variable reading to match Cloud Run console exactly
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error("CRITICAL: Supabase URL or KEY is missing from environment variables!");
}

// Create client - only if variables exist to prevent crash
export const supabase = url && key ? createClient(url, key) : null as any;
