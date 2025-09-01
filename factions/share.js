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
		findPlaceToRun(ns, script, threads, freeRams, i++);
		await ns.sleep(5000);
        ns.exec("/contracts/contractor.js", "home", 1);
	}
}