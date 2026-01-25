import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Keep for public READ access
import { createClient } from '@supabase/supabase-js'; // For private WRITE access

// --- Helper Functions to Match GAS Logic ---

const superNormalize = (s: any): string => {
    return String(s || "")
        .replace(/\s+/g, "")
        .replace(/[（(]/g, "(")
        .replace(/[）)]/g, ")")
        .replace(/[【\[]/g, "[")
        .replace(/[】\]]/g, "]")
        .replace(/['’]/g, "'")
        .toLowerCase();
};

const parseDateSafe = (val: any): Date | null => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
};

const formatDate = (date: Date | null): string | null => {
    if (!date) return null;
    try {
        const options: Intl.DateTimeFormatOptions = {
            timeZone: 'Asia/Taipei',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: false,
        };

        const df = new Intl.DateTimeFormat('en-US', options);
        const parts = df.formatToParts(date);
        const part = (type: string) => parts.find(p => p.type === type)?.value;

        const h = parseInt(part('hour') || '0', 10);
        const m = parseInt(part('minute') || '0', 10);

        if (h === 23 && m === 59) {
            return `${part('month')}/${part('day')}`;
        }
        return `${part('month')}/${part('day')} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    } catch (e) {
        return null;
    }
};

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const leaderId = searchParams.get('leaderId');
    const userId = searchParams.get('userId');

    try {
        // 1. Fetch Data using discovered table names
        const [productsRes, intentRes, bindingRes] = await Promise.all([
            supabase.from('products').select('*'),
            supabase.from('intentdb').select('*'),
            supabase.from('leaderbinding').select('*'),
        ]);

        if (productsRes.error) throw productsRes.error;
        if (intentRes.error) throw intentRes.error;
        if (bindingRes.error) throw bindingRes.error;

        const productData = productsRes.data || [];
        const intentData = intentRes.data || [];
        const bindingData = bindingRes.data || [];

        // 2. Process Waves Logic (Mapping Chinese Columns)
        const now = new Date();
        const wavesMap: Record<string, any> = {};

        productData.forEach((row: any) => {
            const waveId = String(row.WaveID || "").trim();
            if (!waveId) return;

            const wishStart = parseDateSafe(row['選品開始時間']);
            const wishEnd = parseDateSafe(row['選品結束時間']);
            const saleStart = parseDateSafe(row['販售開始時間']);
            const saleEnd = parseDateSafe(row['販售結束時間']);

            // Fix Timezone: Force End of Day to be 23:59:59 in Taipei (UTC+8)
            // 23:59 TPE = 15:59 UTC
            if (wishEnd) wishEnd.setUTCHours(15, 59, 59, 999);
            if (saleEnd) saleEnd.setUTCHours(15, 59, 59, 999);

            let phase = 'closed';
            const isAllEmpty = !row['選品開始時間'] && !row['選品結束時間'] && !row['販售開始時間'] && !row['販售結束時間'];

            if (isAllEmpty) {
                phase = 'collecting';
            } else {
                const isValid = (d: Date | null) => d instanceof Date && !isNaN(d.getTime());
                if (isValid(wishStart) && isValid(wishEnd) && wishStart && wishEnd && now >= wishStart && now <= wishEnd) {
                    phase = 'collecting';
                } else if (isValid(wishEnd) && isValid(saleEnd) && wishEnd && saleEnd && now > wishEnd && now <= saleEnd) {
                    phase = 'active';
                }
            }

            if (phase !== 'closed') {
                if (!wavesMap[waveId]) {
                    wavesMap[waveId] = { wave: waveId, phase: phase, products: [] };
                }

                let displayDate = (phase === 'collecting')
                    ? (formatDate(wishEnd) || formatDate(saleEnd))
                    : (formatDate(saleEnd) || formatDate(wishEnd));

                wavesMap[waveId].products.push({
                    name: String(row['商品名稱'] || "").trim(),
                    origPrice: row['原價'] ? Number(row['原價']) : null,
                    price: row['團購價'],
                    description: row['商品描述'] || "",
                    img: row['圖片網址'],
                    link: row['商城連結'] || "",
                    moq: Number(row.MOQ || 0),
                    endDate: displayDate || "無日期"
                });
            }
        });

        const activeWaves = Object.values(wavesMap);



        // 3. Leader Identity & Avatar Lookup
        let isLeader = (leaderId && userId && String(leaderId).trim() === String(userId).trim()) || false;
        let leaderName = '團購主';
        let leaderAvatar = '';

        if (leaderId) {
            const targetId = String(leaderId).trim();
            // 3.1 Get Name from Binding
            const matches = bindingData.filter((r: any) =>
                String(r['團主 ID']) === targetId
            );
            if (matches.length > 0) {
                const lastMatch = matches[matches.length - 1];
                leaderName = lastMatch['團主名稱'] || leaderName;
            }

            // 3.2 Get Avatar from IntentDB (Look for any usage by this leader)
            // Strategy: Find any order placed by this leader to get their avatar
            // Since we already fetched intentData, we can just search in memory
            const avatarMatch = intentData.find((r: any) => String(r['團員 ID']) === targetId && r.picurl);
            if (avatarMatch) {
                leaderAvatar = avatarMatch.picurl;
            }
        }

        // 4. Aggregation (Mapping IntentDB Chinese Columns)
        const progressMap: Record<string, number> = {};
        const votersMap: Record<string, any[]> = {};
        const prodAvatarsMap: Record<string, string[]> = {};
        const enabledProductsMap: Record<string, string[]> = {};

        bindingData.forEach((row: any) => {
            // Schema: 所屬波段, 團主 ID, 已啟用商品名單
            const bWave = String(row['所屬波段'] || "").trim();
            const bLeader = String(row['團主 ID'] || "").trim();
            if (bLeader === String(leaderId || '').trim()) {
                const rawProds = row['已啟用商品名單'] || "";
                enabledProductsMap[bWave] = String(rawProds).split(',').map(s => s.trim()).filter(s => s !== "");
            }
        });

        intentData.forEach((row: any) => {
            const rowWave = String(row['波段'] || "");
            const rowLeader = String(row['團主 ID'] || "");
            if (activeWaves.some((w: any) => w.wave === rowWave) && rowLeader === String(leaderId || '')) {
                const prodName = row['商品名稱'] || "";
                const normalizedName = superNormalize(prodName);
                const qty = Number(row['數量'] || 0);
                if (qty > 0) {
                    progressMap[normalizedName] = (progressMap[normalizedName] || 0) + qty;
                    if (!votersMap[normalizedName]) votersMap[normalizedName] = [];
                    votersMap[normalizedName].push({
                        name: row['團員暱稱'] || "匿名",
                        qty: qty,
                        userId: row['團員 ID']
                    });
                    const avatar = row.picurl;
                    if (avatar && !prodAvatarsMap[normalizedName]) prodAvatarsMap[normalizedName] = [];
                    if (avatar && !prodAvatarsMap[normalizedName].includes(avatar)) prodAvatarsMap[normalizedName].push(avatar);
                }
            }
        });

        // 5. Enrich
        activeWaves.forEach((waveObj: any) => {
            const enabledList = (enabledProductsMap[waveObj.wave] || []).map(item => superNormalize(item));
            waveObj.products.forEach((prod: any) => {
                const normName = superNormalize(prod.name);
                prod.currentQty = progressMap[normName] || 0;
                prod.voters = votersMap[normName] || [];
                prod.buyerAvatars = prodAvatarsMap[normName] || [];
                prod.isEnabled = enabledList.includes(normName);
            });
        });

        return NextResponse.json({ success: true, leaderId, leaderName, leaderAvatar, isLeader, activeWaves });

    } catch (err: any) {
        console.error('API Error:', err);
        return NextResponse.json({ success: false, error: err.toString() }, { status: 500 });
    }
}

// Helper for DB Write Time (Matching GAS legacy format: 2026/1/24 上午 1:35:56)
const getLegacyTimeStr = (): string => {
    return new Date().toLocaleString('zh-TW', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
    });
};

// Helper to verify LIFF ID Token
async function verifyLiffToken(idToken: string): Promise<string | null> {
    if (!idToken) return null;

    // Local Dev Mock: Allow mock_token to bypass LINE verification
    if (idToken === 'mock_token') {
        return 'DEV_TEST_USER_123';
    }

    try {
        const res = await fetch('https://api.line.me/oauth2/v2.1/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                id_token: idToken,
                client_id: process.env.NEXT_PUBLIC_LIFF_ID || '2008798234-72bJqeYx' // Sync with frontend fallback
            })
        });
        const data = await res.json();
        if (data.error) {
            console.error('Token Verify Error:', data.error_description);
            return null;
        }
        return data.sub; // The real User ID
    } catch (e) {
        console.error('Token Verify Ex:', e);
        return null;
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { idToken, action, leaderId, userId } = data;
        const cleanLeaderId = String(leaderId || "").replace(/^\?leaderId=/, "").trim();
        const cleanUserId = String(userId || "").trim();
        console.log(`[API POST] Action: ${action}, leaderId: ${cleanLeaderId}, userId: ${cleanUserId}`);

        // Initialize Admin Client (Bypasses RLS)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!serviceRoleKey) {
            console.error('[API] CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing!');
            return NextResponse.json({
                success: false,
                error: "伺服器配置錯誤：缺少寫入密鑰 (Service Role Key)。如果您在本地開發，請重啟 npm run dev 並確認 .env.local 內容。"
            }, { status: 500 });
        }

        const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

        // --- Action: Batch Submit (一籃一次送) ---
        if (data.action === 'submit_batch_intent') {
            const { wave, leaderId, userId, userName, userAvatar, items } = data;

            // Security Check: Verify User Identity
            const verifiedUserId = await verifyLiffToken(idToken);
            if (!verifiedUserId || verifiedUserId !== String(userId).trim()) {
                console.error(`[API Auth] 驗證失敗. Verified: ${verifiedUserId}, Provided: ${userId}`);
                return NextResponse.json({ success: false, error: "身分驗證失敗，請嘗試重新登入 (Auth Mismatch)" }, { status: 403 });
            }

            const targetWave = Number(wave);
            const targetUserId = String(userId).trim();
            // --- USE CLEAN LEADER ID ---
            const targetLeaderId = cleanLeaderId;

            // 1. Auto Binding Check (Ensure LeaderBinding exists)
            // Schema: 所屬波段, 團主 ID
            const { data: existingBinding } = await adminSupabase
                .from('leaderbinding')
                .select('*')
                .eq('團主 ID', targetLeaderId)
                .eq('所屬波段', targetWave) // Schema says bigint
                .maybeSingle();

            if (!existingBinding && targetLeaderId) {
                // Insert new binding
                await adminSupabase.from('leaderbinding').insert({
                    '所屬波段': targetWave,
                    '團主 ID': targetLeaderId,
                    '團主名稱': data.leaderName || '團購主',
                    '綁定時間': new Date().toISOString(), // Schema says timestamp with time zone
                    '已啟用商品名單': '' // Initialize
                });
            }

            // 2. Process Items (Upsert Intent)
            for (const item of items) {
                const { prodName, qty } = item;
                const normalizedProdName = superNormalize(prodName);

                // UniqueKey logic from GAS: LeaderId_Wave_UserId_NormalizedProdName
                const uniqueKey = `${targetLeaderId}_${String(wave).trim()}_${targetUserId}_${normalizedProdName}`;

                // Check if exists
                const { data: existingIntent, error: selectError } = await adminSupabase
                    .from('intentdb')
                    .select('*')
                    .eq('唯一金鑰', uniqueKey)
                    .maybeSingle();

                if (selectError) throw new Error(`Select Intent Error: ${selectError.message}`);

                if (existingIntent) {
                    const currentQty = Number(existingIntent['數量'] || 0);
                    let newQty = currentQty + Number(qty);
                    if (newQty < 0) newQty = 0;

                    const { error: updateError } = await adminSupabase
                        .from('intentdb')
                        .update({
                            '數量': newQty,
                            '更新時間': getLegacyTimeStr(),
                            '團員暱稱': userName,
                            'picurl': userAvatar || ""
                        })
                        .eq('唯一金鑰', uniqueKey);

                    if (updateError) throw new Error(`Update Intent Error: ${updateError.message}`);
                } else {
                    let initialQty = Number(qty);
                    if (initialQty < 0) initialQty = 0;
                    if (initialQty > 0) {
                        const { error: insertError } = await adminSupabase
                            .from('intentdb')
                            .insert({
                                '唯一金鑰': uniqueKey,
                                '波段': targetWave, // intentdb uses '波段' (bigint)
                                '團主 ID': targetLeaderId,
                                '團員 ID': targetUserId,
                                '商品名稱': prodName,
                                '數量': initialQty,
                                '更新時間': getLegacyTimeStr(), // intentdb uses '更新時間' (text)
                                '團員暱稱': userName,
                                'picurl': userAvatar || ""
                            });

                        if (insertError) throw new Error(`Insert Intent Error: ${insertError.message}`);
                    }
                }
            }
            return NextResponse.json({ success: true });
        }

        // --- Action: Enable Product ---
        if (data.action === 'enable_product') {
            const { wave, leaderId, prodName, isEnabled } = data;

            // Security Check: Verify Leader Identity
            // Only the Leader can enable/disable products
            const verifiedUserId = await verifyLiffToken(idToken);
            if (!verifiedUserId || verifiedUserId !== cleanLeaderId) {
                console.error(`[API Auth] 團主驗證失敗. Verified: ${verifiedUserId}, Expected Leader: ${cleanLeaderId}`);
                return NextResponse.json({ success: false, error: "權限不足：您不是本團團主 (Identity Mismatch)" }, { status: 403 });
            }

            const targetLeaderId = cleanLeaderId;
            const targetWave = Number(wave); // bigint
            const targetName = String(prodName || "").trim();
            const shouldEnable = (isEnabled === true || String(isEnabled).toLowerCase() === 'true' || isEnabled === 1);
            const targetNormalized = superNormalize(targetName);

            // Find Binding
            const { data: bindingRow, error: selectBindingError } = await adminSupabase
                .from('leaderbinding')
                .select('*')
                .eq('團主 ID', targetLeaderId)
                .eq('所屬波段', targetWave)
                .maybeSingle();

            if (selectBindingError) throw new Error(`Select Binding Error: ${selectBindingError.message}`);

            if (bindingRow) {
                let currentEnabled = String(bindingRow['已啟用商品名單'] || '');
                let list = currentEnabled ? currentEnabled.split(',').map(s => s.trim()).filter(s => s !== "") : [];

                if (shouldEnable) {
                    if (!list.some(item => superNormalize(item) === targetNormalized)) {
                        list.push(targetName);
                    }
                } else {
                    list = list.filter(item => superNormalize(item) !== targetNormalized);
                }

                // Update
                const { error: updateError } = await adminSupabase
                    .from('leaderbinding')
                    .update({ '已啟用商品名單': list.join(',') })
                    .eq('團主 ID', targetLeaderId)
                    .eq('所屬波段', targetWave);

                if (updateError) throw new Error(`Update Binding Error: ${updateError.message}`);

                return NextResponse.json({ success: true, debug: { found: true } });
            } else if (shouldEnable) {
                // Not found, create new
                const { error: insertError } = await adminSupabase.from('leaderbinding').insert({
                    '所屬波段': targetWave,
                    '團主 ID': targetLeaderId,
                    '團主名稱': data.leaderName || '團購主',
                    '綁定時間': new Date().toISOString(),
                    '已啟用商品名單': targetName
                });

                if (insertError) throw new Error(`Insert Binding Error: ${insertError.message}`);

                return NextResponse.json({ success: true, debug: { created: true } });
            } else {
                return NextResponse.json({ success: false, error: "此團購波段尚未建立綁定資料，無法關閉商品。" }, { status: 400 });
            }
        }

        // --- Action: Auto Register Leader ---
        if (data.action === 'auto_register_leader') {
            const { wave, leaderId, leaderName } = data;

            // Security Check: Verify Leader Identity
            const verifiedUserId = await verifyLiffToken(idToken);
            if (!verifiedUserId || verifiedUserId !== cleanLeaderId) {
                return NextResponse.json({ success: false, error: "身分驗證失敗 (Token Mismatch)" }, { status: 403 });
            }

            const targetLeaderId = cleanLeaderId;
            const targetWave = Number(wave);

            const { data: exists } = await adminSupabase
                .from('leaderbinding')
                .select('*')
                .eq('團主 ID', targetLeaderId)
                .eq('所屬波段', targetWave)
                .maybeSingle();

            if (!exists && leaderId) {
                await adminSupabase.from('leaderbinding').insert({
                    '所屬波段': targetWave,
                    '團主 ID': targetLeaderId,
                    '團主名稱': leaderName || '團購主',
                    '綁定時間': new Date().toISOString(),
                    '已啟用商品名單': ""
                });
            }
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: false, error: "Unknown action" });

    } catch (err: any) {
        console.error('API POST Error:', err);
        return NextResponse.json({ success: false, error: err.toString() }, { status: 500 });
    }
}
