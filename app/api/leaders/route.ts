import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get('lineUserId');
    const action = searchParams.get('action');

    try {
        const runtimeUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

        if (!runtimeUrl || !serviceKey) {
            return NextResponse.json({ success: false, error: "伺服器配置錯誤" }, { status: 500 });
        }

        const adminSupabase = createClient(runtimeUrl, serviceKey);

        if (action === 'check_status' && lineUserId) {
            const { data: existingLeader } = await adminSupabase
                .from("GroupLeaders")
                .select("Username")
                .eq("LineID", lineUserId)
                .maybeSingle();

            return NextResponse.json({ success: true, leader: existingLeader });
        }

        // Default: Fetch all active leaders
        const { data: leadersData, error } = await adminSupabase
            .from("GroupLeaders")
            .select("id, name:團主名稱, avatar_url, store_name:加油站, station_code:站代號, username:Username, latitude:緯度, longitude:經度, address:指定地址, LineID")
            .eq("IsGroupLeader", "Yes");

        if (error) throw error;

        // Fetch all intents to calculate popularity (total quantity)
        // Select only required columns to minimize payload
        const { data: intentData, error: intentError } = await adminSupabase
            .from("intentdb")
            .select("團主 ID, 數量");

        // Default to not breaking if intentdb fails, just return 0 qty
        const qtyMap: Record<string, number> = {};
        if (intentData && !intentError) {
            intentData.forEach((row: any) => {
                const leaderId = String(row['團主 ID'] || '').trim();
                const qty = parseInt(row['數量'], 10) || 0;
                if (leaderId) {
                    if (!qtyMap[leaderId]) qtyMap[leaderId] = 0;
                    qtyMap[leaderId] += qty;
                }
            });
        }

        // Attach total_qty to each leader
        const data = (leadersData || []).map((leader: any) => ({
            ...leader,
            total_qty: qtyMap[leader.username] || 0
        }));

        // Add Cache-Control headers to cache the response for 1 minute (60 seconds)
        // Stale-while-revalidate allows serving stale content while fetching fresh data in the background
        const headers = new Headers();
        headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

        return NextResponse.json({ success: true, data }, { headers });

    } catch (err: any) {
        console.error('API Leaders Error:', err);
        return NextResponse.json({ success: false, error: err.toString() }, { status: 500 });
    }
}
