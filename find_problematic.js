require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Searching for '花枝排' and '小管' in products table...");
    const { data: products, error } = await supabase
        .from('products')
        .select('商品名稱, WaveID, id');

    if (error) {
        console.error("Error:", error);
        return;
    }

    const targets = products.filter(p => p['商品名稱'].includes('花枝排') || p['商品名稱'].includes('小管'));

    console.log("--- Results ---");
    targets.forEach(p => {
        console.log(`[ID: ${p.id}] [Wave: ${p.WaveID}] ${p['商品名稱']}`);
    });
}

check();
