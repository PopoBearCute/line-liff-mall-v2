require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TARGET_LEADER_ID = process.env.TARGET_LEADER_ID;
const TARGET_WAVE_ID = process.env.TARGET_WAVE_ID || '3';

if (!SUPABASE_URL || !SERVICE_KEY || !TARGET_LEADER_ID) {
    console.error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or TARGET_LEADER_ID in .env.local');
    process.exit(1);
}

async function main() {
    const headers = {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
    };

    try {
        console.log('--- Checking leader bindings ---');
        const colLeader = encodeURIComponent('團主 ID');
        const colWave = encodeURIComponent('所屬波段');
        const bindingUrl = `${SUPABASE_URL}/rest/v1/leaderbinding?select=*&${colLeader}=eq.${encodeURIComponent(TARGET_LEADER_ID)}&${colWave}=eq.${encodeURIComponent(TARGET_WAVE_ID)}`;
        const bindingRes = await fetch(bindingUrl, { headers });

        if (!bindingRes.ok) {
            throw new Error(`HTTP ${bindingRes.status}: ${await bindingRes.text()}`);
        }

        const bindings = await bindingRes.json();
        console.log(`Found ${bindings.length} binding rows.`);
        bindings.forEach((binding) => {
            const enabledCount = String(binding['已啟用商品名單'] || '')
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean)
                .length;
            console.log(`Binding ${binding.id}: ${enabledCount} enabled products`);
        });

        console.log('\n--- Checking product names for commas ---');
        const productRes = await fetch(`${SUPABASE_URL}/rest/v1/products?select=商品名稱`, { headers });
        if (!productRes.ok) {
            throw new Error(`HTTP ${productRes.status}: ${await productRes.text()}`);
        }

        const products = await productRes.json();
        const namesWithCommas = products
            .map((product) => product['商品名稱'])
            .filter((name) => name && name.includes(','));
        console.log(`Found ${namesWithCommas.length} product names containing commas.`);
    } catch (err) {
        console.error('Error:', err);
        process.exitCode = 1;
    }
}

main();
