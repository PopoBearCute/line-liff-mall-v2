const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://icrmiwopkmfzbryykwli.supabase.co';
const supabaseKey = 'sb_publishable_9tQYpbr0kHS2i9kSbgedjA_mzcJIn2y';

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
