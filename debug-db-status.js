const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://icrmiwopkmfzbryykwli.supabase.co';
const SERVICE_KEY = 'sb_secret_ftJ5J1r1WPMTKMllL936MQ_dA6IMs69';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
    console.log('--- Inspecting Wave 3 Products ---');
    const { data: products, error: prodError } = await supabase
        .from('products')
        .select('*')
        .eq('WaveID', 3);

    if (prodError) console.error(prodError);
    console.log(`Found ${products?.length} products in Wave 3.`);
    if (products && products.length > 0) {
        products.forEach(p => {
            console.log(`[${p.id}] Name: "${p['商品名稱']}" (Norm: ${superNormalize(p['商品名稱'])})`);
        });
    }

    console.log('\n--- Inspecting Leader Binding for Leader Ub6... ---');
    const targetLeaderId = 'Ub6e6a2d6e6358bd68b656638e974b1c6';
    const { data: binding, error: bindError } = await supabase
        .from('leaderbinding')
        .select('*')
        .eq('團主 ID', targetLeaderId)
        .eq('所屬波段', 3);

    if (bindError) console.error(bindError);
    console.log(`Found ${binding?.length} bindings.`);
    if (binding && binding.length > 0) {
        binding.forEach(b => {
            console.log(`Binding ID: ${b.id}`);
            console.log(`Enabled List: "${b['已啟用商品名單']}"`);
        });
    }
}

const superNormalize = (s) => {
    return String(s || "")
        .replace(/\s+/g, "")
        .replace(/[（(]/g, "(")
        .replace(/[）)]/g, ")")
        .replace(/[【\[]/g, "[")
        .replace(/[】\]]/g, "]")
        .replace(/['’]/g, "'")
        .toLowerCase();
};

main();
