require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env.production');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectTable() {
    const tableName = process.argv[2];
    const column = process.argv[3];
    const value = process.argv[4];

    if (!tableName) {
        console.log('Usage: node inspect_db.js <table_name> [column] [value]');
        console.log('Example: node inspect_db.js GroupLeaders');
        console.log('Example: node inspect_db.js GroupLeaders Username D0100-107930');
        return;
    }

    console.log(`Inspecting table: ${tableName}...`);

    let query = supabase.from(tableName).select('*');

    if (column && value) {
        console.log(`Filtering by ${column} = ${value}`);
        query = query.eq(column, value);
    } else {
        query = query.limit(5);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log(`Found ${data.length} rows:`);
        console.dir(data, { depth: null, colors: true });
    }
}

inspectTable();
