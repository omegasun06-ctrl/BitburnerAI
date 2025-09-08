/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("ALL");

    const maxPayoffTime = 600; // seconds (10 minutes)
    const sleepTime = 5000; // ms
    const hasFormulas = ns.fileExists("Formulas.exe", "home");

    while (true) {
        let bestUpgrade = null;
        let bestROI = Infinity;

        const nodeCount = ns.hacknet.numNodes();

        // Check new node purchase
        const newNodeCost = ns.hacknet.getPurchaseNodeCost();
        const newNodeGain = hasFormulas ? estimateNewNodeProductionFormulas(ns) : estimateNewNodeProductionApprox(ns);
        const newNodeROI = newNodeCost / newNodeGain;

        if (newNodeROI < bestROI) {
            bestROI = newNodeROI;
            bestUpgrade = { type: "new-node", cost: newNodeCost };
        }

        // Check upgrades for each node
        for (let i = 0; i < nodeCount; i++) {
            const stats = ns.hacknet.getNodeStats(i);

            // Level upgrade
            const levelCost = ns.hacknet.getLevelUpgradeCost(i, 1);
            const levelGain = hasFormulas ? estimateGainFormulas(ns, stats, "level") : estimateGainApprox(stats, "level");
            const levelROI = levelCost / levelGain;
            if (levelROI < bestROI) {
                bestROI = levelROI;
                bestUpgrade = { type: "level", node: i, cost: levelCost };
            }

            // RAM upgrade
            const ramCost = ns.hacknet.getRamUpgradeCost(i, 1);
            const ramGain = hasFormulas ? estimateGainFormulas(ns, stats, "ram") : estimateGainApprox(stats, "ram");
            const ramROI = ramCost / ramGain;
            if (ramROI < bestROI) {
                bestROI = ramROI;
                bestUpgrade = { type: "ram", node: i, cost: ramCost };
            }

            // Core upgrade
            const coreCost = ns.hacknet.getCoreUpgradeCost(i, 1);
            const coreGain = hasFormulas ? estimateGainFormulas(ns, stats, "core") : estimateGainApprox(stats, "core");
            const coreROI = coreCost / coreGain;
            if (coreROI < bestROI) {
                bestROI = coreROI;
                bestUpgrade = { type: "core", node: i, cost: coreCost };
            }
        }

        // Execute best upgrade if ROI is acceptable
        if (bestUpgrade && bestROI < maxPayoffTime) {
            switch (bestUpgrade.type) {
                case "new-node":
                    ns.hacknet.purchaseNode();
                    ns.tprint(`🆕 Purchased new Hacknet node for \$${ns.formatNumber(bestUpgrade.cost)}`);
                    break;
                case "level":
                    ns.hacknet.upgradeLevel(bestUpgrade.node, 1);
                    ns.tprint(`⬆️ Upgraded level of node ${bestUpgrade.node} for \$${ns.formatNumber(bestUpgrade.cost)}`);
                    break;
                case "ram":
                    ns.hacknet.upgradeRam(bestUpgrade.node, 1);
                    ns.tprint(`🧠 Upgraded RAM of node ${bestUpgrade.node} for \$${ns.formatNumber(bestUpgrade.cost)}`);
                    break;
                case "core":
                    ns.hacknet.upgradeCore(bestUpgrade.node, 1);
                    ns.tprint(`💪 Upgraded cores of node ${bestUpgrade.node} for \$${ns.formatNumber(bestUpgrade.cost)}`);
                    break;
            }
        } else {
            ns.print("⏳ No profitable upgrades found. Waiting...");
        }

        await ns.sleep(sleepTime);
    }

    // --- Estimation Functions ---

    function estimateGainFormulas(ns, stats, type) {
        const baseProd = ns.formulas.hacknetNodes.moneyGainRate(stats.level, stats.ram, stats.cores);
        let newStats = { ...stats };

        switch (type) {
            case "level":
                newStats.level += 1;
                break;
            case "ram":
                newStats.ram *= 2;
                break;
            case "core":
                newStats.cores += 1;
                break;
        }

        const newProd = ns.formulas.hacknetNodes.moneyGainRate(newStats.level, newStats.ram, newStats.cores);
        return newProd - baseProd;
    }

    function estimateNewNodeProductionFormulas(ns) {
        return ns.formulas.hacknetNodes.moneyGainRate(1, 1, 1);
    }

    function estimateGainApprox(stats, type) {
        const baseProd = stats.production;
        let multiplier = 1;

        switch (type) {
            case "level":
                multiplier = 1.01; // small gain
                break;
            case "ram":
                multiplier = 1.4; // RAM doubles, assume 40% gain
                break;
            case "core":
                multiplier = 1.2; // modest gain
                break;
        }

        return baseProd * (multiplier - 1);
    }

    function estimateNewNodeProductionApprox(ns) {
        const nodeCount = ns.hacknet.numNodes();
        if (nodeCount === 0) return 1;
        let total = 0;
        for (let i = 0; i < nodeCount; i++) {
            total += ns.hacknet.getNodeStats(i).production;
        }
        return total / nodeCount;
    }
}