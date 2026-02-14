require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDuplicates() {
    console.log('Fetching all products...');

    // items per page
    const pageSize = 1000;
    let allProducts = [];
    let from = 0;
    let to = pageSize - 1;
    let fetchMore = true;

    while (fetchMore) {
        const { data, error } = await supabase
            .from('products')
            .select('id, 商品名稱, WaveID')
            .range(from, to);

        if (error) {
            console.error('Error fetching products:', error);
            return;
        }

        if (data.length > 0) {
            allProducts = allProducts.concat(data);
            from += pageSize;
            to += pageSize;
        } else {
            fetchMore = false;
        }

        if (data.length < pageSize) {
            fetchMore = false;
        }
    }

    console.log(`Total products scanned: ${allProducts.length}`);

    const nameCounts = {};
    allProducts.forEach(p => {
        const name = (p['商品名稱'] || '').trim();
        if (name) {
            if (!nameCounts[name]) {
                nameCounts[name] = { count: 0, waves: [], ids: [] };
            }
            nameCounts[name].count++;
            nameCounts[name].waves.push(p.WaveID);
            nameCounts[name].ids.push(p.id);
        }
    });

    const duplicates = Object.entries(nameCounts)
        .filter(([name, data]) => data.count > 1)
        .map(([name, data]) => ({
            name,
            count: data.count,
            waves: data.waves,
            ids: data.ids
        }));

    if (duplicates.length === 0) {
        console.log('No duplicate product names found.');
    } else {
        console.log(`Found ${duplicates.length} duplicate product names:`);
        duplicates.forEach(d => {
            console.log(`\nDuplicate Group: "${d.name}"`);
            d.ids.forEach((id, index) => {
                console.log(`  - ID: ${id} (Wave: ${d.waves[index]})`);
            });
        });
    }
}

checkDuplicates();
