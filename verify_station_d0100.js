require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkStation() {
    console.log('Checking StationList for D0100...');

    // 1. Try to fetch any row to see columns (if possible)
    const { data: sample, error: sampleError } = await supabase
        .from('StationList')
        .select('*')
        .limit(1);

    if (sampleError) {
        console.error('Error fetching sample:', sampleError);
    } else if (sample && sample.length > 0) {
        console.log('Sample row columns:', Object.keys(sample[0]));
    } else {
        console.log('StationList is empty or no read access.');
    }

    // 2. Try the exact query used in the app
    const stationCode = 'D0100';
    console.log(`Querying StationList for StationCode = '${stationCode}'...`);

    const { data, error } = await supabase
        .from('StationList')
        .select('*')
        .eq('StationCode', stationCode);

    if (error) {
        console.error('Query error:', error);

        // Fallback: Try querying by '站代號' if the first query failed possibly due to column name
        console.log("Trying query with column '站代號'...");
        const { data: dataTw, error: errorTw } = await supabase
            .from('StationList')
            .select('*')
            .eq('站代號', stationCode);

        if (errorTw) {
            console.error('Query error (站代號):', errorTw);
        } else {
            console.log('Found with 站代號:', dataTw);
        }

    } else {
        console.log('Query result:', data);
        if (data.length === 0) {
            console.log('D0100 NOT found in StationList using StationCode.');
        } else {
            console.log('D0100 FOUND in StationList.');
        }
    }
}

checkStation();
