require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const targetLeaderId = process.env.TARGET_LEADER_ID;

if (!supabaseUrl || !supabaseKey || !targetLeaderId) {
    console.error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or TARGET_LEADER_ID in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase
        .from('leaderbinding')
        .select('id, 所屬波段, 已啟用商品名單')
        .eq('團主 ID', targetLeaderId);

    if (error) throw error;

    console.log(`Found ${data.length} bindings.`);
    const counts = {};
    data.forEach((row) => {
        const wave = String(row['所屬波段']);
        const enabledCount = String(row['已啟用商品名單'] || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .length;
        counts[wave] = (counts[wave] || 0) + 1;
        console.log(`Binding ${row.id}: wave ${wave}, ${enabledCount} enabled products`);
    });

    const duplicates = Object.entries(counts).filter(([, count]) => count > 1);
    if (duplicates.length === 0) {
        console.log('No duplicate waves found.');
        return;
    }

    duplicates.forEach(([wave, count]) => {
        console.log(`Duplicate warning: wave ${wave} has ${count} rows.`);
    });
}

check().catch((err) => {
    console.error('Error:', err);
    process.exitCode = 1;
});
