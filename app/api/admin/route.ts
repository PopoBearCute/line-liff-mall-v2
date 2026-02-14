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
            const name = payload['商品名稱'];
            if (name) {
                const { data: exist } = await supabase
                    .from('products')
                    .select('id')
                    .eq('商品名稱', name)
                    .maybeSingle();

                if (exist) {
                    return NextResponse.json({ success: false, error: `商品名稱重複：${name} 已存在於資料庫中` }, { status: 400 });
                }
            }

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

            // Check duplicate if renaming
            if (data['商品名稱']) {
                const newName = data['商品名稱'];
                // Check if it duplicates OTHER records
                // Need to exclude current record, but we might not have ID in filter...
                // Assuming filter has ID or unique key. If duplicate constraint exists in DB, it will throw anyway.
                // For now, let DB constraint handle update renaming collision to look cleaner, 
                // or extensive check:
                // const { data: exist } = ... .eq('商品名稱', newName).neq('id', filter.id) ...
            }

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

            // Check duplicate for new data
            const name = newData['商品名稱'];
            if (name) {
                // Check if exists (excluding the one we are about to delete? hard to correlate)
                // Simply check if it exists. If it is DIFFERENT from old one.
                // Ideally, we delete first then insert. If we delete first, the name is free.
                // So we don't need to check collision with SELF.
                // But we need to check collision with OTHERS.
                const { data: exist } = await supabase
                    .from('products')
                    .select('id')
                    .eq('商品名稱', name)
                    .maybeSingle();

                // If exist found, we must ensure it is NOT the one we are deleting.
                // But we don't know the ID of the one we are deleting easily without fetching.
                // AND if we are renaming "A" to "B", and "B" already exists -> Block.
                // If we are renaming "A" to "A" (no change) -> Pass.

                // If name exists:
                if (exist) {
                    // If existing ID is NOT covered by oldFilter... tough to know.
                    // Simplest: Check if new Name != old Name (implied by oldFilter NOT having newName)
                    // If oldFilter.商品名稱 !== newData.商品名稱, and newData.商品名稱 exists -> Block.
                    if (oldFilter['商品名稱'] !== name) {
                        return NextResponse.json({ success: false, error: `商品名稱重複：${name} 已存在` }, { status: 400 });
                    }
                }
            }

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

            // 1. Check duplicates within the batch
            const names = new Set();
            for (const row of rows) {
                const name = row['商品名稱'];
                if (names.has(name)) {
                    return NextResponse.json({ success: false, error: `批次資料中包含重複名稱：${name}` }, { status: 400 });
                }
                names.add(name);
            }

            // 2. Check duplicates against DB
            if (rows.length > 0) {
                const rowNames = rows.map((r: any) => r['商品名稱']);
                const { data: exists } = await supabase
                    .from('products')
                    .select('商品名稱')
                    .in('商品名稱', rowNames);

                if (exists && exists.length > 0) {
                    const dupName = exists[0]['商品名稱'];
                    return NextResponse.json({ success: false, error: `部分商品名稱已存在於資料庫：${dupName}` }, { status: 400 });
                }
            }

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
