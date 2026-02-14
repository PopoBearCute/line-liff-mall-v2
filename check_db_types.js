const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Manually parse .env.production
const env = fs.readFileSync('.env.production', 'utf8');
const config = {};
env.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) config[key.trim()] = value.trim();
});

const url = config.NEXT_PUBLIC_SUPABASE_URL;
const key = config.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error("Missing credentials");
    process.exit(1);
}

async function checkSchema() {
    const supabase = createClient(url, key);

    console.log("Checking WaveID types...");

    const { data: p } = await supabase.from('products').select('WaveID').limit(1);
    const { data: i } = await supabase.from('intentdb').select('波段').limit(1);
    const { data: l } = await supabase.from('leaderbinding').select('所屬波段').limit(1);

    if (p && p[0]) console.log("Products WaveID type:", typeof p[0].WaveID, "Value:", p[0].WaveID);
    if (i && i[0]) console.log("IntentDB 波段 type:", typeof i[0].波段, "Value:", i[0].波段);
    if (l && l[0]) console.log("LeaderBinding 所屬波段 type:", typeof l[0]['所屬波段'], "Value:", l[0]['所屬波段']);
}

checkSchema().catch(console.error);
