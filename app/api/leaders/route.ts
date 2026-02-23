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
        const { data, error } = await adminSupabase
            .from("GroupLeaders")
            .select("id, name:團主名稱, avatar_url, store_name:加油站, station_code:站代號, username:Username, latitude:緯度, longitude:經度, address:指定地址, LineID")
            .eq("IsGroupLeader", "Yes");

        if (error) throw error;

        return NextResponse.json({ success: true, data });

    } catch (err: any) {
        console.error('API Leaders Error:', err);
        return NextResponse.json({ success: false, error: err.toString() }, { status: 500 });
    }
}
