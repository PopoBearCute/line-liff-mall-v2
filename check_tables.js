require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listTables() {
    console.log('Listing tables via stored procedure or introspection...');

    // Try querying information_schema if possible (often blocked for anon)
    // Or try 'rpc' if there is a function exposed.
    // Since we don't know, let's try a few known table names from file listing
    // "StationList", "GroupLeaders", "Station", "stations", "Stations"

    const candidates = [
        "StationList", "stationList", "station_list", "Station", "Stations", "stations",
        "GroupLeaders", "group_leaders", "GroupLeader", "group_leader"
    ];

    for (const table of candidates) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (!error) {
            console.log(`Table '${table}' EXISTS. Sample keys:`, data.length > 0 ? Object.keys(data[0]) : 'Empty');
        } else {
            // console.log(`Table '${table}' error: ${error.message}`);
        }
    }
}

listTables();
