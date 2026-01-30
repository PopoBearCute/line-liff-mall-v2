require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log("Searching for duplicates of '小管' and '花枝'...");
    const { data, error } = await supabase
        .from('products')
        .select('商品名稱, WaveID');

    if (error) {
        console.error("Error:", error);
        return;
    }

    const targets = data.filter(p => p['商品名稱'].includes('小管') || p['商品名稱'].includes('花枝'));

    console.log("--- Found Products ---");
    targets.forEach(p => {
        console.log(`[Wave ${p.WaveID}] ${p['商品名稱']}`);
    });

    // Check for same name in different waves
    const counts = {};
    targets.forEach(p => {
        const name = p['商品名稱'];
        if (!counts[name]) counts[name] = [];
        counts[name].push(p.WaveID);
    });

    console.log("--- Cross-Wave Check ---");
    for (const name in counts) {
        if (new Set(counts[name]).size > 1) {
            console.log(`❌ AMBIGUITY: "${name}" exists in waves: ${counts[name].join(', ')}`);
        }
    }
}

check();
