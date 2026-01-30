
const SUPABASE_URL = 'https://icrmiwopkmfzbryykwli.supabase.co';
const SERVICE_KEY = 'sb_secret_ftJ5J1r1WPMTKMllL936MQ_dA6IMs69';

async function main() {
    const headers = {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
    };

    try {
        console.log('--- 正在檢查資料庫 (Checking DB) ---');

        // 1. Check LeaderBinding for duplicates
        // Encode column names
        const colLeader = encodeURIComponent('團主 ID');
        const colWave = encodeURIComponent('所屬波段');

        // Target specific user and wave 3
        const url = `${SUPABASE_URL}/rest/v1/leaderbinding?select=*&${colLeader}=eq.Ub6e6a2d6e6358bd68b656638e974b1c6&${colWave}=eq.3`;

        console.log('Querying:', url);
        const res = await fetch(url, { headers });

        if (!res.ok) {
            throw new Error(`HTTP Error: ${res.status} ${res.statusText} ${await res.text()}`);
        }

        const bindings = await res.json();
        console.log('--- 綁定資料 (Leader Bindings) ---');
        console.log(`找到 ${bindings.length} 筆資料 (Found ${bindings.length} rows):`);
        console.log(JSON.stringify(bindings, null, 2));

        if (bindings.length > 0) {
            const row = bindings[0];
            const rawList = row['已啟用商品名單'] || "";
            const list = rawList.split(',').map(s => s.trim());
            console.log(`\n[Enabled List] Count: ${list.length}`);
            console.log(list);
        }

        // 2. Check Products for Commas
        console.log('\n--- 檢查商品名稱是否有逗號 (Checking Products for Commas) ---');
        const prodRes = await fetch(`${SUPABASE_URL}/rest/v1/products?select=商品名稱`, { headers });
        const products = await prodRes.json();

        const dangerousProducts = products.filter(p => p['商品名稱'] && p['商品名稱'].includes(','));
        if (dangerousProducts.length > 0) {
            console.log('[!!!] 發現危險商品！名稱包含逗號 (Found products with commas):');
            console.log(JSON.stringify(dangerousProducts, null, 2));
        } else {
            console.log('[OK] 沒有商品包含逗號 (No commas in product names)');
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
