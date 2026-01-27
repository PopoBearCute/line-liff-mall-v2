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

async function listTables() {
    console.log('--- Listing Tables ---');
    try {
        // Supabase doesn't have a direct "list tables" in JS client easily without RPC or querying pg_catalog
        // But we can try to query common names or use a trick
        // Trying to fetch from a non-existent table to see error messages sometimes helps or we can use the API

        // Better: Try the names the user mentioned but capitalized
        const tablesToTry = ['LeaderBinding', 'IntentDB', 'leader_binding', 'intent_db', 'leader-binding', 'intent-db'];

        for (const t of tablesToTry) {
            const { error } = await supabase.from(t).select('*').limit(1);
            if (!error) {
                console.log(`Found Table: ${t}`);
            } else {
                console.log(`Table ${t} not found: ${error.message}`);
            }
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

listTables();
