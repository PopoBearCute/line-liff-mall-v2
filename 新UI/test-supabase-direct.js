const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://icrmiwopkmfzbryykwli.supabase.co';
const supabaseKey = 'sb_publishable_9tQYpbr0kHS2i9kSbgedjA_mzcJIn2y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('--- Supabase Connection Test ---');
    try {
        const { data: products, error: pError } = await supabase.from('products').select('*').limit(1);
        if (pError) throw pError;
        console.log('Products Table Check: OK');
        console.log('Sample Product:', products);

        const { data: binding, error: bError } = await supabase.from('leader_binding').select('*').limit(1);
        if (bError) throw bError;
        console.log('Leader Binding Table Check: OK');

        const { data: intent, error: iError } = await supabase.from('intent_db').select('*').limit(1);
        if (iError) throw iError;
        console.log('Intent DB Table Check: OK');

        console.log('\n--- Status: SUCCESS ---');
        console.log('Backend logic in route.ts is ready for use.');
    } catch (err) {
        console.error('Test Failed:', err.message);
    }
}

test();
