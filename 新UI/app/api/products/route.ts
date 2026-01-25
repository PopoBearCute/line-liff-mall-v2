import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

            if (wishEnd) wishEnd.setHours(23, 59, 59, 999);
            if (saleEnd) saleEnd.setHours(23, 59, 59, 999);

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

        // 3. Leader Identity
        let isLeader = (leaderId && userId && String(leaderId).trim() === String(userId).trim()) || false;
        let leaderName = '團購主';

        if (leaderId) {
            // leaderbinding columns based on GAS logic: 
            // LeaderId (Key), LeaderId (Value), LeaderName, EnabledProducts
            const matches = bindingData.filter((r: any) =>
                String(r['團主 ID'] || r.leader_id || r.LeaderId) === String(leaderId)
            );
            if (matches.length > 0) {
                const lastMatch = matches[matches.length - 1];
                leaderName = lastMatch['團主名稱'] || lastMatch.leader_name || lastMatch.LeaderName || leaderName;
            }
        }

        // 4. Aggregation (Mapping IntentDB Chinese Columns)
        const progressMap: Record<string, number> = {};
        const votersMap: Record<string, any[]> = {};
        const prodAvatarsMap: Record<string, string[]> = {};
        const enabledProductsMap: Record<string, string[]> = {};

        bindingData.forEach((row: any) => {
            const bWave = String(row['波段'] || row.wave || row.Wave).trim();
            const bLeader = String(row['團主 ID'] || row.leader_id || row.LeaderId).trim();
            if (bLeader === String(leaderId || '').trim()) {
                const rawProds = row['已啟用商品'] || row.enabled_products || row.EnabledProducts || "";
                enabledProductsMap[bWave] = String(rawProds).split(',').map(s => s.trim()).filter(s => s !== "");
            }
        });

        intentData.forEach((row: any) => {
            const rowWave = String(row['波段'] || row.wave || row.Wave);
            const rowLeader = String(row['團主 ID'] || row.leader_id || row.LeaderId);
            if (activeWaves.some((w: any) => w.wave === rowWave) && rowLeader === String(leaderId || '')) {
                const prodName = row['商品名稱'] || row.prod_name || row.ProdName;
                const normalizedName = superNormalize(prodName);
                const qty = Number(row['數量'] || row.qty || row.Qty);
                if (qty > 0) {
                    progressMap[normalizedName] = (progressMap[normalizedName] || 0) + qty;
                    if (!votersMap[normalizedName]) votersMap[normalizedName] = [];
                    votersMap[normalizedName].push({
                        name: row['團員暱稱'] || row.user_name || "匿名",
                        qty: qty,
                        userId: row['團員 ID'] || row.user_id
                    });
                    const avatar = row.picurl || row.user_avatar;
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

        return NextResponse.json({ success: true, leaderId, leaderName, isLeader, activeWaves });

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

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // --- Action: Batch Submit (一籃一次送) ---
        if (data.action === 'submit_batch_intent') {
            const { wave, leaderId, userId, userName, userAvatar, items } = data;

            // 1. Auto Binding Check (Ensure LeaderBinding exists)
            const bindingKey = `${String(leaderId || '').trim()}_${String(wave).trim()}`;

            const { data: existingBinding } = await supabase
                .from('leaderbinding')
                .select('*')
                .eq('團主 ID', String(leaderId))
                .eq('波段', String(wave))
                .maybeSingle();

            if (!existingBinding && leaderId) {
                // Insert new binding
                await supabase.from('leaderbinding').insert({
                    '波段': String(wave),
                    '團主 ID': String(leaderId),
                    '團主名稱': data.leaderName || '團購主',
                    '更新時間': getLegacyTimeStr()
                });
            }

            // 2. Process Items (Upsert Intent)
            for (const item of items) {
                const { prodName, qty } = item;
                const normalizedProdName = superNormalize(prodName);

                // UniqueKey logic from GAS: LeaderId_Wave_UserId_NormalizedProdName
                const uniqueKey = `${String(leaderId).trim()}_${String(wave).trim()}_${String(userId).trim()}_${normalizedProdName}`;

                // Check if exists
                const { data: existingIntent } = await supabase
                    .from('intentdb')
                    .select('*')
                    .eq('唯一金鑰', uniqueKey)
                    .maybeSingle();

                if (existingIntent) {
                    const currentQty = Number(existingIntent['數量'] || 0);
                    let newQty = currentQty + Number(qty);
                    if (newQty < 0) newQty = 0;

                    await supabase
                        .from('intentdb')
                        .update({
                            '數量': newQty,
                            '更新時間': getLegacyTimeStr(),
                            '團員暱稱': userName,
                            'picurl': userAvatar || ""
                        })
                        .eq('唯一金鑰', uniqueKey);
                } else {
                    let initialQty = Number(qty);
                    if (initialQty < 0) initialQty = 0;
                    if (initialQty > 0) {
                        await supabase
                            .from('intentdb')
                            .insert({
                                '唯一金鑰': uniqueKey,
                                '波段': String(wave),
                                '團主 ID': String(leaderId),
                                '團員 ID': String(userId),
                                '商品名稱': prodName,
                                '數量': initialQty,
                                '更新時間': getLegacyTimeStr(),
                                '團員暱稱': userName,
                                'picurl': userAvatar || ""
                            });
                    }
                }
            }
            return NextResponse.json({ success: true });
        }

        // --- Action: Enable Product ---
        if (data.action === 'enable_product') {
            const { wave, leaderId, prodName, isEnabled } = data;
            const targetLeaderId = String(leaderId).trim();
            const targetWave = String(wave).trim();
            const targetName = String(prodName || "").trim();
            const shouldEnable = (isEnabled === true || String(isEnabled).toLowerCase() === 'true' || isEnabled === 1);
            const targetNormalized = superNormalize(targetName);

            // Find Binding
            const { data: bindingRow } = await supabase
                .from('leaderbinding')
                .select('*')
                .eq('團主 ID', targetLeaderId)
                .eq('波段', targetWave)
                .maybeSingle();

            if (bindingRow) {
                let currentEnabled = String(bindingRow['已啟用商品'] || '');
                let list = currentEnabled ? currentEnabled.split(',').map(s => s.trim()).filter(s => s !== "") : [];

                if (shouldEnable) {
                    if (!list.some(item => superNormalize(item) === targetNormalized)) {
                        list.push(targetName);
                    }
                } else {
                    list = list.filter(item => superNormalize(item) !== targetNormalized);
                }

                // Update
                await supabase
                    .from('leaderbinding')
                    .update({ '已啟用商品': list.join(',') })
                    .eq('團主 ID', targetLeaderId)
                    .eq('波段', targetWave);

                return NextResponse.json({ success: true, debug: { found: true } });
            } else if (shouldEnable) {
                // Not found, create new
                await supabase.from('leaderbinding').insert({
                    '波段': targetWave,
                    '團主 ID': targetLeaderId,
                    '團主名稱': data.leaderName || '團購主',
                    '更新時間': getLegacyTimeStr(),
                    '已啟用商品': targetName
                });
                return NextResponse.json({ success: true, debug: { created: true } });
            } else {
                return NextResponse.json({ success: false, error: "此團購波段尚未建立綁定資料，無法關閉商品。" });
            }
        }

        // --- Action: Auto Register Leader ---
        if (data.action === 'auto_register_leader') {
            const { wave, leaderId, leaderName } = data;
            const targetLeaderId = String(leaderId).trim();
            const targetWave = String(wave).trim();

            const { data: exists } = await supabase
                .from('leaderbinding')
                .select('*')
                .eq('團主 ID', targetLeaderId)
                .eq('波段', targetWave)
                .maybeSingle();

            if (!exists && leaderId) {
                await supabase.from('leaderbinding').insert({
                    '波段': targetWave,
                    '團主 ID': targetLeaderId,
                    '團主名稱': leaderName || '團購主',
                    '更新時間': getLegacyTimeStr(),
                    '已啟用商品': ""
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
