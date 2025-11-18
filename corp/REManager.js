/** @param {NS} ns **/
export async function main(ns) {
    const division = "Agriculture";
    const cities = ["Aevum", "Chongqing", "Sector-12", "New Tokyo", "Ishima", "Volhaven"];
    const products = ns.corporation.getDivision(division).products;
    const interval = 60000; // 60 seconds
    //if (products.length === 0) {
     //   ns.tprint("❌ No products found in Real Estate division.");
     //   return;
   // }

    let lastSellCities = [];
    let lastBuyCities = [];

    while (true) {
        const cityRevenueMap = {};

        for (const city of cities) {
            let totalRevenue = 0;
            for (const product of products) {
                const data = ns.corporation.getProduct(division, city, product);
                totalRevenue += data.stats[0]; // Revenue
            }
            cityRevenueMap[city] = totalRevenue;
        }

        const sortedCities = Object.entries(cityRevenueMap)
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);

        const topSellCities = sortedCities.slice(0, 3);
        const bottomBuyCities = sortedCities.slice(-3);

        const configChanged =
            JSON.stringify(topSellCities) !== JSON.stringify(lastSellCities) ||
            JSON.stringify(bottomBuyCities) !== JSON.stringify(lastBuyCities);

        if (configChanged) {
            ns.tprint("🔄 Configuration changed:");
            ns.tprint(`🏆 Selling in: ${topSellCities.join(", ")}`);
            ns.tprint(`📉 Buying from: ${bottomBuyCities.join(", ")}`);
        }

        for (const city of cities) {
            const isSellCity = topSellCities.includes(city);
            const isBuyCity = bottomBuyCities.includes(city);

            ns.corporation.setSmartSupply(division, city, isSellCity);

            for (const product of products) {
                if (isSellCity) {
                    ns.corporation.sellProduct(division, city, product, "MAX", "MP");
                } else {
                    ns.corporation.sellProduct(division, city, product, "0", "MP");
                }
            }

            if (isBuyCity) {
                ns.corporation.buyMaterial(division, city, "Real Estate", 100); // Adjust as needed
            } else {
                ns.corporation.buyMaterial(division, city, "Real Estate", 0);
            }
        }

        lastSellCities = topSellCities;
        lastBuyCities = bottomBuyCities;

        await ns.sleep(interval);
    }
}
