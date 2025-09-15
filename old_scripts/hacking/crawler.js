import {getAllServers, getAccessibleServers} from '/utils.js';
import {zeroHack} from '/tools/arrayRepo.js'
const IGNORE = ["darkweb"]
const SLEEP_MIN = 3
/** @param {NS} ns */
function disable_logs(ns) {
	var logs = ["scan", "run", 'getServerRequiredHackingLevel', 'getHackingLevel']
	for (var i in logs) {
		ns.disableLog(logs[i])
	}
}

export async function crawl(ns) {
  const servers = getAccessibleServers(ns).concat(zeroHack);
  const serv_set = new Set(servers);
  serv_set.add("home");

  // Determine how many ports we can open
  const portPrograms = [
    "BruteSSH.exe",
    "FTPCrack.exe",
    "relaySMTP.exe",
    "HTTPWorm.exe",
    "SQLInject.exe"
  ];
  const availablePortCount = portPrograms.filter(p => ns.fileExists(p, "home")).length;

  let i = 0;
  while (i < servers.length) {
    const server = servers[i];

    const requiredPorts = ns.getServerNumPortsRequired(server);
    const isIgnored = IGNORE.includes(server);
    const isRooted = ns.hasRootAccess(server);

    if (!isRooted && !isIgnored && requiredPorts <= availablePortCount) {
      ns.print("attempting to hack ", server);
      ns.run("/hacking/worm.js", 1, server);
      await ns.sleep(100);
    }

    const neighbors = ns.scan(server);
    for (const neighbor of neighbors) {
      if (!serv_set.has(neighbor)) {
        serv_set.add(neighbor);
        servers.push(neighbor);
      }
    }

    i += 1;
  }
}

/** @param {NS} ns */
export async function main(ns) {
	//disable_logs(ns)
	while (true) {
		await crawl(ns)
		await ns.sleep(6000 * SLEEP_MIN)
	}

}