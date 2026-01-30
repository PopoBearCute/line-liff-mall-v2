require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking leaderbinding columns types...");
    const { data, error } = await supabase
        .from('leaderbinding')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (data.length > 0) {
        const row = data[0];
        for (const key in row) {
            console.log(`${key}: ${typeof row[key]} (${row[key]})`);
        }
    } else {
        console.log("No data found to check types.");
    }
}

check();
