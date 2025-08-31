/** @param {NS} ns **/
export async function main(ns) {
    const launcherPath = "/player/buy_pserv.js"; // Update if needed
    const serverSuffix = "-pserv";
    const maxServers = ns.getPurchasedServerLimit();
    const maxRam = ns.getPurchasedServerMaxRam();

    while (true) {
        const availableMoney = ns.getServerMoneyAvailable("home");
        const servers = ns.getPurchasedServers();

        // Determine upgrade candidates
        let upgradeableServers = [];
        let bestRam = 0;

        for (let ram = maxRam; ram >= 2; ram /= 2) {
            const costPerServer = ns.getPurchasedServerCost(ram);
            const totalCost = costPerServer * 5;

            if (totalCost <= availableMoney * 0.5) {
                // Find servers below this RAM
                upgradeableServers = servers.filter(s => ns.getServerMaxRam(s) < ram);

                if (upgradeableServers.length >= 5) {
                    bestRam = ram;
                    break;
                }
            }
        }

        if (bestRam > 0) {
            ns.tprint(`🛠️ Upgrading ${upgradeableServers.length} servers to ${bestRam}GB RAM`);
            const pid = ns.run(launcherPath, 1, bestRam);
            if (pid === 0) {
                ns.tprint("❌ Failed to start Launcher. Check RAM or script path.");
            } else {
                ns.tprint(`🚀 Launcher started with PID ${pid}`);
            }
        } else {
            ns.print("⏳ No upgrade conditions met. Waiting...");
        }

        await ns.sleep(30000); // Wait 30 seconds
    }
}
