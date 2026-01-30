const SUPABASE_URL = 'https://icrmiwopkmfzbryykwli.supabase.co';
const SERVICE_KEY = 'sb_secret_ftJ5J1r1WPMTKMllL936MQ_dA6IMs69';

async function main() {
    const headers = {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
    };

    try {
        console.log('--- Checking String Length ---');
        // Check LeaderBinding
        const colLeader = encodeURIComponent('團主 ID');
        const colWave = encodeURIComponent('所屬波段');
        const url = `${SUPABASE_URL}/rest/v1/leaderbinding?select=*&${colLeader}=eq.Ub6e6a2d6e6358bd68b656638e974b1c6&${colWave}=eq.3`;

        const res = await fetch(url, { headers });
        const bindings = await res.json();

        if (bindings.length > 0) {
            const row = bindings[0];
            const rawList = row['已啟用商品名單'] || "";
            const len = rawList.length;
            console.log(`[Current Length]: ${len} characters`);
            console.log(`[Content Preview]: ${rawList.substring(0, 50)}...`);

            if (len > 230) {
                console.log(`[DANGER] Length is ${len}. Typically VARCHAR limits are 255. This is dangerously close!`);
                console.log('Use SQL to fix: ALTER TABLE leaderbinding ALTER COLUMN "已啟用商品名單" TYPE text;');
            } else {
                console.log('[OK] Length seems fine (far from 255).');
            }
        } else {
            console.log("No binding found.");
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

main();
