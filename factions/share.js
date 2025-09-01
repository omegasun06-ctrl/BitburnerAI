import {copyScriptsToAll, findPlaceToRun, getAccessibleServers, getFreeRams, getScripts} from '/utils.js';

/**
 *
 * @param {NS} ns
 * @returns {Promise<void>}
 */
export async function main(ns) {
	await copyScriptsToAll(ns);
	const threads = Number.MAX_SAFE_INTEGER;
	const script = getScripts().share;
	let i = 0;
	// noinspection InfiniteLoopJS
	while (true) {
		const servers = getAccessibleServers(ns, true); // true = only non-home, non-purchased
		const freeRams = getFreeRams(ns, servers);
		
		let totalFreeRam = Object.values(freeRams).reduce((a, b) => a + b, 0);
		let currentShareRam = getTotalShareRam(ns, servers);

		if (isWorthSharingMore(currentShareRam, totalFreeRam)) {
			findPlaceToRun(ns, script, threads, freeRams, i++);
		}

		await ns.sleep(5000);
        ns.exec("/contracts/contractor.js", "home", 1);
	}
}


function getTotalShareRam(ns, servers, scriptName = "share.js") {
    let totalRam = 0;
    for (const server of servers) {
        const processes = ns.ps(server);
        for (const proc of processes) {
            if (proc.filename === scriptName) {
                totalRam += proc.threads * ns.getScriptRam(scriptName);
            }
        }
    }
    return totalRam;
}


function isWorthSharingMore(currentRam, additionalRam) {
    const currentBonus = Math.log2(1 + currentRam);
    const newBonus = Math.log2(1 + currentRam + additionalRam);
    const marginalGain = newBonus - currentBonus;
    return marginalGain > 0.05; // tweak this threshold as needed
}
