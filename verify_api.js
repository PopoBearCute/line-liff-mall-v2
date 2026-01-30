const LEADER_ID = "Ub6e6a2d6e6358bd68b656638e974b1c6";
const URL = `https://line-liff-mall-v2-939192288922.asia-east1.run.app/api/products?leaderId=${LEADER_ID}`;

async function verify() {
    console.log(`Verifying API at: ${URL}`);
    try {
        const response = await fetch(URL);
        const data = await response.json();
        const allProducts = data.activeWaves.flatMap(w => w.products);

        console.log("Total Products:", allProducts.length);

        const sample = allProducts.find(p => p.name.includes('花枝排'));
        if (sample) {
            console.log("--- Sample Product ---");
            console.log("Name:", sample.name);
            console.log("WaveId Field:", sample.waveId);
            if (sample.waveId) {
                console.log("✅ SUCCESS: WaveId found in API!");
            } else {
                console.log("❌ FAILURE: WaveId is MISSING in API. (Needs redeploy of route.ts)");
            }
        } else {
            console.log("❌ Could not find '花枝排' in API response.");
        }
    } catch (err) {
        console.error("Error fetching API:", err);
    }
}

verify();
