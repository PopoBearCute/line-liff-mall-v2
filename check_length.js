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
        console.log('--- Checking String Length ---');
        const colLeader = encodeURIComponent('團主 ID');
        const colWave = encodeURIComponent('所屬波段');
        const url = `${SUPABASE_URL}/rest/v1/leaderbinding?select=*&${colLeader}=eq.${encodeURIComponent(TARGET_LEADER_ID)}&${colWave}=eq.${encodeURIComponent(TARGET_WAVE_ID)}`;

        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

        const bindings = await res.json();
        if (bindings.length === 0) {
            console.log('No binding found.');
            return;
        }

        const rawList = bindings[0]['已啟用商品名單'] || '';
        const len = rawList.length;
        console.log(`[Current Length]: ${len} characters`);

        if (len > 230) {
            console.log(`[DANGER] Length is ${len}. Consider changing the column type to text.`);
        } else {
            console.log('[OK] Length is below the warning threshold.');
        }
    } catch (err) {
        console.error('Error:', err);
        process.exitCode = 1;
    }
}

main();
