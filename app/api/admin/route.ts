import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client - Only allow SERVICE_ROLE_KEY
// [Robust Fix] Check both prefixed and non-prefixed versions
export async function POST(request: Request) {
    try {
        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
        const ADMIN_PIN = process.env.ADMIN_PIN;

        // Validate configuration at runtime
        if (!ADMIN_PIN) {
            console.error('[Admin API] ADMIN_PIN environment variable is not set');
            return NextResponse.json({ success: false, error: "伺服器配置錯誤：缺少 ADMIN_PIN 環境變數" }, { status: 500 });
        }

        if (!supabaseUrl || !supabaseKey) {
            console.error('[Admin API] Missing Supabase environment variables');
            return NextResponse.json({ success: false, error: "伺服器配置錯誤：缺少 Supabase 連線資訊 (URL 或 KEY)" }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

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

        if (action === 'list') {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('WaveID', { ascending: false });

            if (error) throw error;
            return NextResponse.json({ success: true, products: data });
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
                query.eq(key, value as string | number | boolean);
            });

            const { error } = await query;
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        if (action === 'delete') {
            const { filter } = payload;
            const query = supabase.from('products').delete();
            Object.entries(filter).forEach(([key, value]) => {
                query.eq(key, value as string | number | boolean);
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
                delQuery.eq(key, value as string | number | boolean);
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

    } catch (err) {
        console.error('Admin API Error:', err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
    }
}
