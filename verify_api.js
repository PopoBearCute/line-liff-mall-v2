require('dotenv').config({ path: '.env.local' });

const targetLeaderId = process.env.TARGET_LEADER_ID;
const siteUrl = process.env.SITE_URL || 'http://localhost:3000';

if (!targetLeaderId) {
    console.error('Missing TARGET_LEADER_ID in .env.local');
    process.exit(1);
}

const url = new URL('/api/products', siteUrl);
url.searchParams.set('leaderId', targetLeaderId);

async function verify() {
    console.log(`Verifying API at ${url.origin}`);
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(data.error || `HTTP ${response.status}`);
    }

    const waves = Array.isArray(data.activeWaves) ? data.activeWaves : [];
    const products = waves.flatMap((wave) => wave.products || []);
    const missingWaveId = products.filter((product) => !product.waveId).length;

    console.log(`Waves: ${waves.length}`);
    console.log(`Products: ${products.length}`);
    console.log(`Products missing waveId: ${missingWaveId}`);
}

verify().catch((err) => {
    console.error('Error:', err);
    process.exitCode = 1;
});
