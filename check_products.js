require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Checking Product Wave IDs...");
    const { data, error } = await supabase
        .from('products')
        .select('商品名稱, WaveID, MO Q, 原價, 團購價');

    if (error) {
        console.error("Error:", error);
        return;
    }

    const problematic = data.filter(p => p['商品名稱'].includes('海菜') || p['商品名稱'].includes('蝦餅'));

    console.log("--- Problematic Products ---");
    problematic.forEach(p => {
        console.log(`[${p.WaveID}] ${p['商品名稱']}`);
    });
}

check();
