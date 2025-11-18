/** @param {NS} ns **/
export async function main(ns) {
    const division = "FarmzRez";
    const cities = ["Sector-12", "Aevum", "Volhaven", "Chongqing", "New Tokyo", "Ishima"];
    const materials = [
        { name: "Hardware", qty: 10 },
        { name: "AI Cores", qty: 10 },
        { name: "Real Estate", qty: 270 }
    ];
    const upgrades = ["Smart Factories", "Smart Storage", "FocusWires", "Neural Accelerators", "Speech Processor Implants"];

    // Expand to all cities
    for (const city of cities) {
        if (!ns.corporation.getDivision(division).cities.includes(city)) {
            ns.corporation.expandCity(division, city);
            ns.tprint(`Expanded to ${city}`);
        }

        // Hire employees
        const office = ns.corporation.getOffice(division, city);
        const toHire = 6 - office.employees.length;
        for (let i = 0; i < toHire; i++) {
            ns.corporation.hireEmployee(division, city);
        }

        // Assign jobs
        ns.corporation.setAutoJobAssignment(division, city, "Operations", 2);
        ns.corporation.setAutoJobAssignment(division, city, "Engineer", 2);
        ns.corporation.setAutoJobAssignment(division, city, "Business", 2);

        // Warehouse setup
        if (!ns.corporation.hasWarehouse(division, city)) {
            ns.corporation.purchaseWarehouse(division, city);
        }

        // Upgrade warehouse if needed
        const warehouse = ns.corporation.getWarehouse(division, city);
        if (warehouse.level < 5) {
            ns.corporation.upgradeWarehouse(division, city);
        }

        // Buy materials
        for (const mat of materials) {
            ns.corporation.buyMaterial(division, city, mat.name, mat.qty);
        }

        // Stop buying after 10 seconds
        await ns.sleep(10000);
        for (const mat of materials) {
            ns.corporation.buyMaterial(division, city, mat.name, 0);
        }

        // Enable Smart Supply if unlocked
        if (ns.corporation.hasUnlockUpgrade("Smart Supply")) {
            ns.corporation.setSmartSupply(division, city, true);
        }
    }

    // Upgrade corporation-wide upgrades
    for (const upgrade of upgrades) {
        const level = ns.corporation.getUpgradeLevel(upgrade);
        if (level < 5) {
            ns.corporation.levelUpgrade(upgrade);
            ns.tprint(`Upgraded ${upgrade} to level ${level + 1}`);
        }
    }

    ns.tprint("✅ Agriculture growth management complete.");
}
