import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
// ideally use SERVICE_ROLE_KEY for admin operations if available, otherwise fallback to public key
// preventing client-side exposure of logic is the main gain here if we don't have service key yet.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://icrmiwopkmfzbryykwli.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY || 'sb_publishable_9tQYpbr0kHS2i9kSbgedjA_mzcJIn2y';
const supabase = createClient(supabaseUrl, supabaseKey);

// Hardcoded PIN for now (as per plan), could be moved to env later
const ADMIN_PIN = process.env.ADMIN_PIN || "0920401419";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, pin, payload } = body;

        // 1. Verify PIN
        if (pin !== ADMIN_PIN) {
            return NextResponse.json({ success: false, error: "密碼錯誤 (Invalid PIN)" }, { status: 401 });
        }

        // 2. Handle Actions
        if (action === 'login') {
            return NextResponse.json({ success: true, message: "Login successful" });
        }

        if (action === 'create') {
            const { error } = await supabase.from('products').insert([payload]);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        if (action === 'update') {
            // Payload should include identifier to find the record (Wait, we use composite keys usually)
            // But payload here is the "fields to update". We need criteria.
            // Let's expect payload to have { filter: {...}, data: {...} } OR 
            // adhere to the structure sent from frontend.
            // Frontend currently does:
            // update(payload).eq('WaveID', ...).eq('商品名稱', ...)
            // So we need distinct args.

            const { filter, data } = payload;

            // Special case: Key change (Delete old -> Insert new) handled in frontend or here?
            // Frontend logic was: if keyChanged -> Delete Old -> Insert New.
            // Let's implement that logic here if action is 'replace' or handle logic in frontend?
            // If we want to secure it, logic should be here.

            // Let's stick to simple mapped actions first.
            const query = supabase.from('products').update(data);

            // Apply filters
            Object.entries(filter).forEach(([key, value]) => {
                query.eq(key, value as any);
            });

            const { error } = await query;
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        if (action === 'delete') {
            const { filter } = payload;
            const query = supabase.from('products').delete();
            Object.entries(filter).forEach(([key, value]) => {
                query.eq(key, value as any);
            });
            const { error } = await query;
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        if (action === 'replace') {
            // Composite key update workaround: Delete old -> Insert new
            const { oldFilter, newData } = payload;

            // 1. Delete
            const delQuery = supabase.from('products').delete();
            Object.entries(oldFilter).forEach(([key, value]) => {
                delQuery.eq(key, value as any);
            });
            const { error: delErr } = await delQuery;
            if (delErr) throw delErr;

            // 2. Insert
            const { error: insErr } = await supabase.from('products').insert([newData]);
            if (insErr) throw insErr;

            return NextResponse.json({ success: true });
        }

        if (action === 'batch_insert') {
            const { rows } = payload;
            const { error } = await supabase.from('products').insert(rows);
            if (error) throw error;
            return NextResponse.json({ success: true, count: rows.length });
        }

        return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });

    } catch (err: any) {
        console.error('Admin API Error:', err);
        return NextResponse.json({ success: false, error: err.message || err.toString() }, { status: 500 });
    }
}
