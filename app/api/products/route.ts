import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Keep for public READ access
import { createClient } from '@supabase/supabase-js'; // For private WRITE access

// --- Helper Functions to Match GAS Logic ---

const superNormalize = (s: string | null | undefined): string => {
    if (!s) return "";
    return String(s)
        .replace(/\s+/g, "") // Remove all spaces
        .replace(/[（(]/g, "(")
        .replace(/[）)]/g, ")")
        .replace(/[【\[]/g, "[")
        .replace(/[】\]]/g, "]")
        .replace(/['’]/g, "'")
        .replace(/[\u200B-\u200D\uFEFF]/g, "") // Remove zero-width spaces
        .toLowerCase()
        .trim();
};

const parseDateSafe = (val: string | number | Date | null | undefined): Date | null => {
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
        const runtimeUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const runtimeKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY;

        if (!runtimeUrl || !runtimeKey) {
            return NextResponse.json({ success: false, error: "伺服器配置錯誤：缺少 Supabase 連線資訊 (URL 或 KEY)" }, { status: 500 });
        }

        const supabaseInternal = createClient(runtimeUrl, runtimeKey);
        console.log(`[API GET] Fetching data for leader: ${leaderId}, user: ${userId}`);
        // 1. Fetch Data using discovered table names
        const [productsRes, intentRes, bindingRes] = await Promise.all([
            supabaseInternal.from('products').select('*'),
            supabaseInternal.from('intentdb').select('*'),
            supabaseInternal.from('leaderbinding').select('*'),
        ]);

        if (productsRes.error) throw productsRes.error;
        if (intentRes.error) throw intentRes.error;
        if (bindingRes.error) throw bindingRes.error;

        const productData = productsRes.data || [];
        const intentData = intentRes.data || [];
        const bindingData = bindingRes.data || [];

        // 2. Process Waves Logic (Mapping Chinese Columns)
        const now = new Date();
        const wavesMap: Record<string, { wave: string; phase: string; products: any[] }> = {};

        productData.forEach((row: Record<string, any>) => {
            const waveId = String(row.WaveID || "").trim();
            if (!waveId) return;

            const wishStart = parseDateSafe(row['選品開始時間']);
            const wishEnd = parseDateSafe(row['選品結束時間']);
            const saleStart = parseDateSafe(row['販售開始時間']);
            const saleEnd = parseDateSafe(row['販售結束時間']);

            // Fix Timezone: Force End of Day to be 23:59:59 in Taipei (UTC+8) - REMOVED to respect user time
            // 23:59 TPE = 15:59 UTC
            // if (wishEnd) wishEnd.setUTCHours(15, 59, 59, 999);
            // if (saleEnd) saleEnd.setUTCHours(15, 59, 59, 999);

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
                const key = `${waveId}_${phase}`;
                if (!wavesMap[key]) {
                    wavesMap[key] = { wave: waveId, phase: phase, products: [] };
                }

                let displayDate = (phase === 'collecting')
                    ? (formatDate(wishEnd) || formatDate(saleEnd))
                    : (formatDate(saleEnd) || formatDate(wishEnd));

                wavesMap[key].products.push({
                    name: String(row['商品名稱'] || "").trim(),
                    origPrice: row['原價'] ? Number(row['原價']) : null,
                    price: row['團購價'],
                    description: row['商品描述'] || "",
                    img: row['圖片網址'],
                    link: row['商城連結'] || "",
                    moq: Number(row.MOQ || 0),
                    endDate: displayDate || "無日期",
                    waveId: waveId
                });
            }
        });

        const activeWaves = Object.values(wavesMap);



        // 3. Leader Identity & Avatar Lookup
        // [Bug #1 Fix] 正確的身分判定：查詢 GroupLeaders 資料表
        // 比對「站點代號 (Username)」與「目前登入者的 LINE UID (LineID)」
        // 舊邏輯（錯誤）：leaderId === userId → 永遠 false，因為兩者是不同概念的 ID
        let isLeader = false;
        if (leaderId && userId) {
            const { data: leaderRow } = await supabaseInternal
                .from('GroupLeaders')
                .select('Username, LineID')
                .eq('Username', String(leaderId).trim())
                .eq('LineID', String(userId).trim())
                .maybeSingle();

            isLeader = !!leaderRow;
            console.log(`[API GET] isLeader check: Username="${leaderId}", LineID="${userId}" → ${isLeader}`);
        }
        let leaderName = '團購主';
        let leaderAvatar = '';

        if (leaderId) {
            const targetId = String(leaderId).trim();
            console.log(`[API GET] Resolving Leader Name for ID: "${targetId}"`);

            // 3.1 Get Name from Binding
            const matches = bindingData.filter((r: any) =>
                String(r['團主 ID']).trim() === targetId
            );
            console.log(`[API GET] Binding Matches Found: ${matches.length}`, matches.map((m: any) => m['團主名稱']));

            if (matches.length > 0) {
                const lastMatch = matches[matches.length - 1];
                leaderName = lastMatch['團主名稱'] || leaderName;
                console.log(`[API GET] Resolved Name: ${leaderName}`);
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

    } catch (err) {
        console.error('API Error:', err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
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

    // Trim LIFF ID to prevent "wrong format" errors from accidental spaces
    const envLiffId = (process.env.NEXT_PUBLIC_LIFF_ID || '').trim();
    // LINE Verification requires Channel ID (e.g., 2008798234), not full LIFF ID (e.g., 2008798234-72bJqeYx)
    const envChannelId = (process.env.LINE_CHANNEL_ID || '').trim();

    // Auto-extract Channel ID if not provided (takes the part before the first dash)
    const extractedChannelId = envLiffId.includes('-') ? envLiffId.split('-')[0] : envLiffId;

    // Prioritize Channel ID, fallback to extracted ID
    const verificationClientId = envChannelId || extractedChannelId || '2008798234';

    if (!envChannelId) {
        console.warn("[LIFF Verify] Warning: LINE_CHANNEL_ID is missing. Falling back to LIFF_ID, which may fail verification.");
    }

    try {
        const res = await fetch('https://api.line.me/oauth2/v2.1/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                id_token: idToken,
                client_id: verificationClientId
            })
        });
        const data = await res.json();
        if (data.error) {
            console.error('Token Verify Error:', data.error_description);
            // Return a special string starting with "ERROR:" to indicate specifics
            return `ERROR: ${data.error_description || data.error}`;
        }
        return data.sub; // The real User ID
    } catch (e) {
        console.error('Token Verify Ex:', e);
        return `ERROR: Internal Verify Exception`;
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { idToken, action, leaderId, userId } = data;
        const cleanLeaderId = String(leaderId || "").replace(/^\?leaderId=/, "").trim();
        const cleanUserId = String(userId || "").trim();
        console.log(`[API POST] Action: ${action}, Leader: ${cleanLeaderId}, User: ${cleanUserId}`);
        console.log(`[API POST] Payload: ${JSON.stringify(data)}`);

        const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json({
                success: false,
                error: "伺服器配置錯誤：缺少 Supabase 連線資訊或寫入密鑰 (Service Role Key)。"
            }, { status: 500 });
        }

        const adminSupabase = createClient(supabaseUrl, serviceRoleKey);

        // --- Action: Batch Submit (一籃一次送) ---
        if (data.action === 'submit_batch_intent') {
            const { wave, leaderId, userId, userName, userAvatar, items } = data;

            // Security Check: Verify User Identity
            const verifiedUserId = await verifyLiffToken(idToken);

            // Check if verification returned an error string
            if (verifiedUserId && verifiedUserId.startsWith('ERROR:')) {
                return NextResponse.json({ success: false, error: `身分驗證錯誤: ${verifiedUserId.replace('ERROR:', '')}` }, { status: 401 });
            }

            const isAuthValid = verifiedUserId === cleanUserId;

            if (!isAuthValid) {
                console.error(`[API Auth] 驗證失敗. Verified: ${verifiedUserId}, Provided: ${cleanUserId}`);
                return NextResponse.json({ success: false, error: "身分驗證失敗，請嘗試在本機重新整理或在手機重新登入" }, { status: 403 });
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
            const verifiedUserId = await verifyLiffToken(idToken);

            // Check if verification returned an error string
            if (verifiedUserId && verifiedUserId.startsWith('ERROR:')) {
                return NextResponse.json({ success: false, error: `身分驗證錯誤: ${verifiedUserId.replace('ERROR:', '')}` }, { status: 401 });
            }

            // Security Check: Verify Leader Identity (Match Username + LineID)
            const { data: leaderRow } = await adminSupabase
                .from('GroupLeaders')
                .select('Username, LineID')
                .eq('Username', cleanLeaderId)
                .eq('LineID', verifiedUserId)
                .maybeSingle();

            const isLeaderAuthValid = !!leaderRow;

            if (!isLeaderAuthValid) {
                console.error(`[API Auth] 團主驗證失敗 (不符綁定關係). User UID: ${verifiedUserId}, Target Station: ${cleanLeaderId}`);
                return NextResponse.json({ success: false, error: "權限不足：您的身分不符 (Leader Auth Mismatch)" }, { status: 403 });
            }

            const targetLeaderId = cleanLeaderId;
            const targetWave = String(wave).trim(); // Always use String
            const targetName = String(prodName || "").trim();
            const shouldEnable = (isEnabled === true || String(isEnabled).toLowerCase() === 'true' || isEnabled === 1);
            const targetNormalized = superNormalize(targetName);

            // Find Binding (Robust way: select all, take first)
            const { data: bindings, error: selectBindingError } = await adminSupabase
                .from('leaderbinding')
                .select('*')
                .eq('團主 ID', targetLeaderId)
                .eq('所屬波段', targetWave);

            if (selectBindingError) throw new Error(`Select Binding Error: ${selectBindingError.message}`);

            const bindingRow = bindings && bindings.length > 0 ? bindings[0] : null;

            if (bindingRow) {
                let currentEnabled = String(bindingRow['已啟用商品名單'] || '');
                let list = currentEnabled ? currentEnabled.split(',').map(s => s.trim()).filter(s => s !== "") : [];

                // Normalization Logic: Use robust check
                const targetNormalized = superNormalize(targetName);

                if (shouldEnable) {
                    if (!list.some(item => superNormalize(item) === targetNormalized)) {
                        list.push(targetName);
                    }
                } else {
                    list = list.filter(item => superNormalize(item) !== targetNormalized);
                }

                // Update (Target the specific ID we found to avoid updating duplicates inconsistently)
                const { error: updateError } = await adminSupabase
                    .from('leaderbinding')
                    .update({ '已啟用商品名單': list.join(',') })
                    .eq('id', bindingRow.id); // Use PK if possible, or exact filters

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

        // --- Action: Unbind Leader Identity ---
        if (data.action === 'unbind_leader') {
            // Security Check: Verify LIFF Token
            const verifiedUserId = await verifyLiffToken(idToken);
            if (!verifiedUserId) {
                return NextResponse.json({ success: false, error: "身分驗證失敗：無法取得 Token" }, { status: 401 });
            }
            if (verifiedUserId.startsWith('ERROR:')) {
                return NextResponse.json({ success: false, error: `身分驗證錯誤: ${verifiedUserId.replace('ERROR:', '')}` }, { status: 401 });
            }

            // Verify the user actually owns a binding in GroupLeaders
            const { data: boundRow } = await adminSupabase
                .from('GroupLeaders')
                .select('id, Username, LineID')
                .eq('LineID', verifiedUserId)
                .maybeSingle();

            if (!boundRow) {
                return NextResponse.json({ success: false, error: "找不到您的團主綁定資料" }, { status: 404 });
            }

            // Clear LineID (unbind)
            const { error: updateError } = await adminSupabase
                .from('GroupLeaders')
                .update({ LineID: null })
                .eq('id', boundRow.id);

            if (updateError) {
                console.error('[API] Unbind error:', updateError);
                return NextResponse.json({ success: false, error: `解除失敗: ${updateError.message}` }, { status: 500 });
            }

            console.log(`[API] Leader unbound: ${boundRow.Username} (was ${verifiedUserId})`);
            return NextResponse.json({ success: true, unboundStation: boundRow.Username });
        }

        return NextResponse.json({ success: false, error: "Unknown action" });

    } catch (err: any) {
        console.error('API POST Error:', err);
        return NextResponse.json({ success: false, error: err.toString() }, { status: 500 });
    }
}
