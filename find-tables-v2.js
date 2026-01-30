const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing required environment variables.');
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findTables() {
    const guesses = [
        'Products', 'products', 'Products_Table',
        'LeaderBinding', 'leader_binding', 'leader-binding', 'leaderbinding', 'Leader_Binding',
        'IntentDB', 'intent_db', 'intent-db', 'intentdb', 'Intent_DB',
        'leader_hub', 'LeaderHub'
    ];

    console.log('--- Table Discovery ---');
    for (const t of guesses) {
        const { data, error } = await supabase.from(t).select('*').limit(0);
        if (!error) {
            console.log(`[FOUND] ${t}`);
            // If found, also try to list columns
            const { data: cols } = await supabase.from(t).select('*').limit(1);
            if (cols && cols.length > 0) {
                console.log(`Columns for ${t}:`, Object.keys(cols[0]));
            }
        }
    }
}

findTables();
