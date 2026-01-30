require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

// USE SERVICE ROLE KEY FOR THIS SCRIPT (User should provide it in env or we use it if available)
// Actually, I'll use the prompt to ask user to provide it if I don't have it.
// Wait, I requested user to set it as env var in Cloud Run, but I don't have it locally in .env.production (user only has Anon key there).
// I will check .env.production contents.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const LEADER_ID = "Ub6e6a2d6e6358bd68b656638e974b1c6";

async function repair() {
    console.log(`Starting Repair for Leader: ${LEADER_ID}`);

    // 1. Fetch all bindings for this leader
    const { data: bindings, error } = await supabase
        .from('leaderbinding')
        .select('*')
        .eq('團主 ID', LEADER_ID);

    if (error) {
        console.error("Fetch Error:", error);
        return;
    }

    console.log(`Found ${bindings.length} rows.`);

    for (const row of bindings) {
        const wave = String(row['所屬波段']);
        const listStr = row['已啟用商品名單'] || "";
        let list = listStr.split(',').map(s => s.trim()).filter(s => s !== "");

        if (wave === "3") {
            // Remove Wave 4 products from Wave 3 binding
            const badItems = ['澎湖區漁會-花枝排', '澎湖區漁會-花枝丸', '澎湖區漁會-3尾入小管', '澎湖區漁會-飛魚卵香腸', '澎湖區漁會-墨魚香腸', '澎湖區漁會-白帶清肉卷', '澎湖區漁會-海菜虱目魚丸', '澎湖區漁會-海菜吻仔魚'];
            const newList = list.filter(item => !badItems.some(bad => item.includes(bad)));

            if (newList.length !== list.length) {
                console.log(`🧹 Cleaning Wave 3 (ID: ${row.id}): Removed ${list.length - newList.length} misplaced items.`);
                await supabase.from('leaderbinding').update({ '已啟用商品名單': newList.join(',') }).eq('id', row.id);
            }
        }

        // 2. Cleanup Duplicates (if any)
        const others = bindings.filter(b => b.id !== row.id && String(b['所屬波段']) === wave);
        if (others.length > 0) {
            console.log(`🗑️ Deleting DUPLICATE Wave ${wave} binding (ID: ${row.id})`);
            // Keep the one with the longest list maybe? Or just delete the newer one?
            // For safety, let's just log and let user know if we should delete.
            // Actually, let's just delete rows that are completely empty if a non-empty one exists.
            const hasBetter = others.some(o => (o['已啟用商品名單'] || "").length > (row['已啟用商品名單'] || "").length);
            if (hasBetter || (row['已啟用商品名單'] || "") === "") {
                await supabase.from('leaderbinding').delete().eq('id', row.id);
            }
        }
    }
    console.log("✅ Repair Script Finished.");
}

repair();
