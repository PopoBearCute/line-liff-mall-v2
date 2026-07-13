const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TARGET_LEADER_ID = process.env.TARGET_LEADER_ID;
const TARGET_WAVE_ID = process.env.TARGET_WAVE_ID || '3';

if (!SUPABASE_URL || !SERVICE_KEY || !TARGET_LEADER_ID) {
    console.error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or TARGET_LEADER_ID in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const superNormalize = (value) => String(value || '')
    .replace(/\s+/g, '')
    .replace(/[（(]/g, '(')
    .replace(/[）)]/g, ')')
    .replace(/[【\[]/g, '[')
    .replace(/[】\]]/g, ']')
    .replace(/['’]/g, "'")
    .toLowerCase();

async function main() {
    console.log(`--- Inspecting Wave ${TARGET_WAVE_ID} Products ---`);
    const { data: products, error: prodError } = await supabase
        .from('products')
        .select('*')
        .eq('WaveID', TARGET_WAVE_ID);

    if (prodError) throw prodError;
    console.log(`Found ${products?.length || 0} products.`);
    products?.forEach((product) => {
        console.log(`[${product.id}] Name: "${product['商品名稱']}" (Norm: ${superNormalize(product['商品名稱'])})`);
    });

    console.log('\n--- Inspecting Leader Binding ---');
    const { data: bindings, error: bindError } = await supabase
        .from('leaderbinding')
        .select('*')
        .eq('團主 ID', TARGET_LEADER_ID)
        .eq('所屬波段', TARGET_WAVE_ID);

    if (bindError) throw bindError;
    console.log(`Found ${bindings?.length || 0} bindings.`);
    bindings?.forEach((binding) => {
        const enabledCount = String(binding['已啟用商品名單'] || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .length;
        console.log(`Binding ${binding.id}: ${enabledCount} enabled products`);
    });
}

main().catch((err) => {
    console.error('Error:', err);
    process.exitCode = 1;
});
