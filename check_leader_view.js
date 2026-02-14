
require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Checking Product Phases and Leader View...");
    const now = new Date();
    // Simulate current time as User's time if needed, but here we use server time (UTC/System)
    // Actually we should match the API logic

    // 1. Fetch Products
    const { data: products, error } = await supabase.from('products').select('*');
    if (error) { console.error(error); return; }

    console.log(`Total Products: ${products.length}`);

    // Replicate API Phase Logic
    const wavesMap = {};
    products.forEach(row => {
        const waveId = String(row.WaveID || "").trim();
        if (!waveId) return;

        const wishStart = row['選品開始時間'] ? new Date(row['選品開始時間']) : null;
        const wishEnd = row['選品結束時間'] ? new Date(row['選品結束時間']) : null;
        const saleStart = row['販售開始時間'] ? new Date(row['販售開始時間']) : null;
        const saleEnd = row['販售結束時間'] ? new Date(row['販售結束時間']) : null;

        let phase = 'closed';
        const isAllEmpty = !row['選品開始時間'] && !row['選品結束時間'] && !row['販售開始時間'] && !row['販售結束時間'];

        if (isAllEmpty) {
            phase = 'collecting';
        } else {
            const isValid = (d) => d instanceof Date && !isNaN(d.getTime());
            if (isValid(wishStart) && isValid(wishEnd) && wishStart && wishEnd && now >= wishStart && now <= wishEnd) {
                phase = 'collecting';
            } else if (isValid(wishEnd) && isValid(saleEnd) && wishEnd && saleEnd && now > wishEnd && now <= saleEnd) {
                phase = 'active';
            }
        }

        if (!wavesMap[waveId]) wavesMap[waveId] = { collecting: 0, active: 0, products: [] };
        if (phase === 'collecting') wavesMap[waveId].collecting++;
        if (phase === 'active') wavesMap[waveId].active++;

        wavesMap[waveId].products.push({ name: row['商品名稱'], phase });
    });

    console.log("\n--- Wave Summary ---");
    console.table(Object.entries(wavesMap).map(([id, data]) => ({ WaveID: id, Collecting: data.collecting, Active: data.active })));

    // 2. Check LeaderBinding for a sample leader (D12345-123456) if known, or just look at binding table
    console.log("\n--- Leader Bindings Sample ---");
    const { data: bindings } = await supabase.from('leaderbinding').select('*').limit(5);
    bindings.forEach(b => {
        const enabledList = (b['已啟用商品名單'] || "").split(',').filter(s => s);
        console.log(`Leader: ${b['團主 ID']}, Wave: ${b['所屬波段']}, Enabled Count: ${enabledList.length}`);
    });

}

main();
