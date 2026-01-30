require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const LEADER_ID = "Ub6e6a2d6e6358bd68b656638e974b1c6";
const WAVE = 3; // The "Sea Products" wave ID (Assuming it's 3 or 4 based on user context)
// Wait, user said "Sea Product", let's check ALL waves for this leader.

async function check() {
    console.log(`Checking bindings for Leader: ${LEADER_ID}`);
    const { data, error } = await supabase
        .from('leaderbinding')
        .select('*')
        .eq('團主 ID', LEADER_ID);

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log(`Found ${data.length} bindings:`);
    data.forEach(row => {
        console.log(`[ID: ${row.id}] Wave: ${row['所屬波段']} | Enabled: ${row['已啟用商品名單']}`);
    });

    // Check for duplicates
    const counts = {};
    data.forEach(row => {
        const key = row['所屬波段'];
        counts[key] = (counts[key] || 0) + 1;
    });

    console.log("--- Duplicates check ---");
    let hasDup = false;
    for (const [wave, count] of Object.entries(counts)) {
        if (count > 1) {
            console.log(`❌ WARNING: Wave ${wave} has ${count} duplicate rows!`);
            hasDup = true;
        } else {
            console.log(`✅ Wave ${wave} is clean (1 row).`);
        }
    }
}

check();
