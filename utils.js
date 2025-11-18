import {scriptsToCopy, getScripts } from '/extendedUtils.js';
/**
 *
 * @param {NS} ns
 * @param {string} str
 */
export function printBoth(ns, str) {
  ns.print(str);
  ns.tprint(str);
}


/**
 * Suppress logs to reduce console clutter and RAM usage.
 * @param {NS} ns
 * @param {string[]} logs
 */
export function suppressLogs(ns, logs = []) {
  for (const log of logs) ns.disableLog(log);
}

/**
 *
 * @param {NS} ns
 * @returns {Promise<void>}
 */
export async function copyScriptsToAll(ns) {
  for (let server of getServers(ns)) if (server !== 'home') await ns.scp(scriptsToCopy(), server, 'home');
}


export function getAllServers(ns) {
  const discovered = new Set();
  const stack = ["home"];

  while (stack.length > 0) {
    const server = stack.pop();
    if (discovered.has(server)) continue;
    if (!ns.serverExists(server)) continue;
    discovered.add(server);

    for (const neighbor of ns.scan(server)) {
      if (ns.serverExists(neighbor)) {
        stack.push(neighbor);
      }
    }
  }

  const excluded = ["darkweb", "home"];
  return Array.from(discovered).filter(h => !excluded.includes(h));
}




/** @returns {Object[]} */
export function getActionData() {
  return [
    // General
    { name: 'Training', type: 'General', rewardFac: 0, rankGain: 0 },
    { name: 'Field Analysis', type: 'General', rewardFac: 1, rankGain: 0.1, accuracy: 'eff' },
    { name: 'Recruitment', type: 'General', rewardFac: 0, rankGain: 0 },
    { name: 'Diplomacy', type: 'General', rewardFac: 0, rankGain: 0 },
    { name: 'Hyperbolic Regeneration Chamber', type: 'General', rewardFac: 0, rankGain: 0 },
    { name: 'Incite Violence', type: 'General', rewardFac: 0, rankGain: 0 },

    // Contracts
    { name: 'Tracking', type: 'Contract', rewardFac: 1.041, rankGain: 0.3 },
    { name: 'Bounty Hunter', type: 'Contract', rewardFac: 1.085, rankGain: 0.9 },
    { name: 'Retirement', type: 'Contract', rewardFac: 1.065, rankGain: 0.6 },

    // Operations
    { name: 'Investigation', type: 'Operation', rewardFac: 1.07, rankGain: 2.2, accuracy: 0.4 },
    { name: 'Undercover Operation', type: 'Operation', rewardFac: 1.09, rankGain: 4.4, accuracy: 0.8 },
    { name: 'Sting Operation', type: 'Operation', rewardFac: 1.095, rankGain: 5.5, late: true },
    { name: 'Raid', type: 'Operation', rewardFac: 1.1, rankGain: 55, late: true },
    { name: 'Stealth Retirement Operation', type: 'Operation', rewardFac: 1.11, rankGain: 22, late: true },
    { name: 'Assassination', type: 'Operation', rewardFac: 1.14, rankGain: 44 }
  ];
}

/**
 *
 * @param {NS} ns
 * @param {number} minimumRam
 */
export function deployBatchers(ns, minimumRam = 2 ** 14) {
  const scripts = getScripts();
  const servers = getAccessibleServers(ns);
  const hackables = getOptimalHackable(ns, servers);
  // filter and sort servers according to RAM
  const hosts = servers.filter(server => ns.getServerMaxRam(server) >= minimumRam).sort((a, b) => ns.getServerMaxRam(b) - ns.getServerMaxRam(a));
  // Deploy batchers
  for (let i = 0; i < Math.min(hosts.length, hackables.length); i++) {
    if (!ns.isRunning(scripts.batcher, hosts[i], hackables[i])) {
      ns.scriptKill(scripts.batcher, hosts[i]);
      ns.exec(scripts.batcher, hosts[i], 1, hackables[i]);
    }
  }
}

/**
 *
 * @param {NS} ns
 */
export function manageAndHack(ns) {
  const scripts = getScripts();
  const servers = getAccessibleServers(ns);
  const hackables = getOptimalHackable(ns, servers);
  const [freeRams, filteredHackables] = getFreeRams(ns, servers, hackables);
  const hackstates = getHackStates(ns, servers, filteredHackables);
  for (const target of filteredHackables) {
    const money = ns.getServerMoneyAvailable(target);
    const maxMoney = ns.getServerMaxMoney(target);
    const minSec = ns.getServerMinSecurityLevel(target);
    const sec = ns.getServerSecurityLevel(target);
    const secDiff = sec - minSec;
    if (secDiff > 0) {
      const threads = Math.ceil(secDiff * 20) - hackstates.get(target).weaken;
      if (threads > 0 && !findPlaceToRun(ns, scripts.weaken, threads, freeRams, target)) return;
    }
    let moneyPercent = money / maxMoney;
    if (moneyPercent === 0) moneyPercent = 0.1;
    if (moneyPercent < 0.9) {
      const threads = Math.ceil(ns.growthAnalyze(target, 1 / moneyPercent)) - hackstates.get(target).grow;
      if (threads > 0 && !findPlaceToRun(ns, scripts.grow, threads, freeRams, target)) return;
    }
    if (moneyPercent > 0.75 && secDiff < 50) {
      let threads = Math.floor(ns.hackAnalyzeThreads(target, money - (0.4 * maxMoney))) - hackstates.get(target).hack;
      if (threads > 0 && !findPlaceToRun(ns, scripts.hack, threads, freeRams, target)) return;
    }
  }
}

/**
 *
 * @param {NS} ns
 * @param {string[]} servers
 * @param {string[]} hackables
 * @returns {Object<number, number, number>}
 */
function getHackStates(ns, servers, hackables) {
  const scripts = getScripts();
  const hackstates = new Map();
  for (let server of servers.values()) {
    for (let hackable of hackables.values()) {
      let weakenScript = ns.getRunningScript(scripts.weaken, server, hackable);
      let growScript = ns.getRunningScript(scripts.grow, server, hackable);
      let hackScript = ns.getRunningScript(scripts.hack, server, hackable);
      if (hackstates.has(hackable)) {
        hackstates.get(hackable).weaken += !weakenScript ? 0 : weakenScript.threads;
        hackstates.get(hackable).grow += !growScript ? 0 : growScript.threads;
        hackstates.get(hackable).hack += !hackScript ? 0 : hackScript.threads;
      } else {
        hackstates.set(hackable, {
          weaken: !weakenScript ? 0 : weakenScript.threads,
          grow: !growScript ? 0 : growScript.threads,
          hack: !hackScript ? 0 : hackScript.threads
        });
      }
    }
  }
  return hackstates;
}

/**
 *
 * @param {NS} ns
 */
export function updateOverview(ns) {
  const doc = eval('document');
  const hook0 = doc.getElementById('overview-extra-hook-0');
  const hook1 = doc.getElementById('overview-extra-hook-1');
  try {
    const headers = [];
    const values = [];
    headers.push(`Income\u00A0`);
    values.push(`${formatMoney(ns, ns.getTotalScriptIncome()[0])}`);
    headers.push(`Karma`);
    values.push(`${formatNumber(ns, ns.heart.break())}`);
    hook0.innerText = headers.join('\n');
    hook1.innerText = values.join('\n');
  } catch (err) {
    ns.print(`ERROR: Update Skipped: ${String(err)}`);
  }
}

/**
 *
 * @param {NS} ns
 * @param {string} server
 * @returns {null|string[]}
 */
export function routeFinder(ns, server) {
  const route = [];
  const found = recursiveRouteFinder(ns, '', ns.getHostname(), server, route);
  if (found) return route;
  else return null;
}

/**
 *
 * @param {NS} ns
 * @param {string} parent
 * @param {string} host
 * @param {string} server
 * @param {string[]} route
 * @returns {boolean}
 */
export function recursiveRouteFinder(ns, parent, host, server, route) {
  const children = ns.scan(host);
  for (let child of children) {
    if (parent === child) {
      continue;
    }
    if (child === server) {
      route.unshift(child);
      route.unshift(host);
      return true;
    }
    if (recursiveRouteFinder(ns, host, child, server, route)) {
      route.unshift(host);
      return true;
    }
  }
  return false;
}

/**
 *
 * @param {NS} ns
 * @returns {string[]}
 */
export function getServers(ns) {
  const serverList = ['home'];
  for (let s of serverList) ns.scan(s).filter(n => !serverList.includes(n)).forEach(n => serverList.push(n));
  return serverList;
}

/**
 *
 * @param {NS} ns
 * @param {string} server
 * @returns {boolean}
 */
export function hackServer(ns, server) {
  //if (ns.getServerRequiredHackingLevel(server) > ns.getHackingLevel()) return false;
  if (ns.hasRootAccess(server)) return true;
  let portOpened = 0;
  if (ns.fileExists('BruteSSH.exe', 'home')) {
    ns.brutessh(server);
    portOpened++;
  }
  if (ns.fileExists('FTPCrack.exe', 'home')) {
    ns.ftpcrack(server);
    portOpened++;
  }
  if (ns.fileExists('HTTPWorm.exe', 'home')) {
    ns.httpworm(server);
    portOpened++;
  }
  if (ns.fileExists('relaySMTP.exe', 'home')) {
    ns.relaysmtp(server);
    portOpened++;
  }
  if (ns.fileExists('SQLInject.exe', 'home')) {
    ns.sqlinject(server);
    portOpened++;
  }
  if (ns.getServerNumPortsRequired(server) <= portOpened) {
    ns.nuke(server);
    return true;
  }
  return false;
}

/**
 *
 * @param {NS} ns
 * @returns {string[]}
 */

export function getAccessibleServers(ns, onlyFactionServers = false) {
  const allServers = scanAll(ns);
  const purchased = ns.getPurchasedServers();

  return allServers.filter(s =>
    ns.hasRootAccess(s) &&
    !s.startsWith("hacknet-node-") &&
    (!onlyFactionServers || (s !== "home" && !purchased.includes(s)))
  );
}


/**
 * Recursively scans all servers starting from "home"
 * @param {NS} ns
 * @returns {string[]} list of all discovered servers
 */
export function scanAll(ns) {
  const discovered = new Set();
  const stack = ["home"];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!discovered.has(current)) {
      discovered.add(current);
      for (const neighbor of ns.scan(current)) {
        stack.push(neighbor);
      }
    }
  }

  return Array.from(discovered);
}

/**
 *
 * @param {NS} ns
 * @param {string} script
 * @param {number} threads
 * @param {Object<string, number>[]} freeRams
 * @param {*[]} scriptArgs
 * @returns {boolean}
 */
export function findPlaceToRun(ns, script, threads, freeRams, ...scriptArgs) {
  const scriptRam = ns.getScriptRam(script);
  let remainingThreads = threads;
  while (freeRams.length > 0) {
    const host = freeRams[0].host;
    const ram = freeRams[0].freeRam;
    if (ram < scriptRam) freeRams.shift();
    else if (ram < scriptRam * remainingThreads) { // Put as many threads as we can
      const threadsForThisHost = Math.floor(ram / scriptRam);
      ns.exec(script, host, threadsForThisHost, ...scriptArgs);
      remainingThreads -= threadsForThisHost;
      freeRams.shift();
    } else { // All remaining threads were placed
      ns.exec(script, host, remainingThreads, ...scriptArgs);
      freeRams[0].freeRam -= scriptRam * remainingThreads;
      return true;
    }
  }
  return false;
}

export function* range(start, stop, step = 1) {
  for (let i = start; i < stop; i += step) {
    yield i;
  }
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 *
 * @param {NS} ns
 * @param {string[]} servers
 * @param {string[]} hackables
 * @returns {Object<string, number>[] | [Object<string, number>[], string[]]}
 */
export function getFreeRams(ns, servers, hackables) {
  const scripts = getScripts();
  const freeRams = [];
  const unhackables = [];
  for (const server of servers) {
    if (hackables && ns.scriptRunning(scripts.batcher, server)) { // Check if we have a batcher running on this server
      const process = ns.ps(server).find(s => s.filename === scripts.batcher); // Find the process of the batcher
      unhackables.push(process.args[0]); // Don't hack the target of the batcher
      continue; // Don't run scripts on the host
    }
    const freeRam = getFreeRam(ns, server);
    if (freeRam > 0) freeRams.push({ host: server, freeRam: freeRam });
  }
  const sortedFreeRams = freeRams.sort((a, b) => b.freeRam - a.freeRam);
  if (hackables) {
    const filteredHackables = hackables.filter(hackable => !unhackables.includes(hackable));
    return [sortedFreeRams, filteredHackables];
  }
  return sortedFreeRams;
}

/**
 *
 * @param {NS} ns
 * @param {string} server
 * @return {number}
 */
export function getFreeRam(ns, server, ignoreNonManagerScripts = false) {
  //const data = readFromFile(ns, getPortNumbers().reservedRam);
  //const reservedRam = (data[server] ?? [{'ram': 0}]).reduce((a, b) => a + b.ram, 0);
  let freeRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
  if (ignoreNonManagerScripts) {
    const managerScripts = getManagerScripts();
    ns.ps(server).forEach(p => {
      const script = p.filename;
      if (!managerScripts.includes(script)) freeRam += ns.getScriptRam(script, server) * p.threads;
    });
  }
  return freeRam;
}

/**
 *
 * @param {NS} ns
 * @param {string[]} servers
 * @param {number} cores
 * @returns {string[]}
 */
export function getOptimalHackable(ns, servers, cores = 1) {
  return servers.filter(server => ns.getServerMaxMoney(server) > 0).sort((a, b) => targetCost(ns, b, cores)[0] - targetCost(ns, a, cores)[0]);
}

/**
 *
 * @param {NS} ns
 * @param {string} target
 * @param {number} cores
 * @param {number} hackPercent
 * @param {number} freeRam
 * @returns {[number, number, number]}
 */
export function targetCost(ns, target, cores = 1, hackPercent = 0.5, freeRam = 2 ** 15) {
  const form = ns.formulas.hacking;
  const player = ns.getPlayer(); // Get player info
  const server = ns.getServer(target); // Get server info
  server.hackDifficulty = server.minDifficulty; // Assume server is at min sec
  // Security
  const hackSec = ns.hackAnalyzeSecurity(1); // Sec increase for 1 hack thread
  const growSec = ns.growthAnalyzeSecurity(1); // Sec increase for 1 grow thread
  const weakenSec = ns.weakenAnalyze(1, cores); // Sec decrease for 1 weaken thread
  // Script Rams
  const scripts = getScripts();
  const hackRam = ns.getScriptRam(scripts.hack);
  const growRam = ns.getScriptRam(scripts.grow);
  const weakenRam = ns.getScriptRam(scripts.weaken);

  // RAM calculations

  // Hack threads per hack percent
  const hackThreads = hackPercent / form.hackPercent(server, player);
  // Weaken threads needed per hack thread
  const weakenThreadsPerHackThread = hackSec / weakenSec;
  // Weaken threads per hack thread
  const weakenThreadsAfterHack = weakenThreadsPerHackThread * hackThreads;
  // Percent to grow by 1 thread at min sec
  const growPercent = form.growPercent(server, 1, player, cores);
  // Grow threads needed
  const growThreads = Math.log(1 / (1 - hackPercent)) / Math.log(growPercent);
  // Weaken threads needed per grow thread
  const weakenThreadsPerGrowThread = growSec / weakenSec;
  // Weaken threads needed per grow thread
  const weakenThreadsAfterGrow = weakenThreadsPerGrowThread * growThreads;
  // Cycle RAM
  const cycleRam = hackThreads * hackRam + growThreads * growRam + (weakenThreadsAfterHack + weakenThreadsAfterGrow) * weakenRam;
  // Number of cycles in one cycle group
  const cycleCount = Math.floor(freeRam / cycleRam);
  // Group RAM
  const groupRam = cycleRam * cycleCount;

  // Stolen money calculations

  // Chance to hack at min sec
  const chance = form.hackChance(server, player);
  // Average money stolen per cycle
  const averageMoneyPerCycle = server.moneyMax * hackPercent * chance;
  // Average money stolen per group
  const averageMoneyPerGroup = averageMoneyPerCycle * cycleCount;

  // Time taken calculations

  // Time taken for weaken
  const weakenTime = form.weakenTime(server, player);
  // Time taken from one cycle to the next
  const cycleDelay = weakenTime / cycleCount;
  // Time taken from one group to the next
  const groupDelay = cycleDelay * cycleCount; // equivalent to weaken time

  // Cost function calculations

  // Average Money per unit Ram per unit time
  const averageMoneyPerRamPerTime = averageMoneyPerGroup / (2 * groupDelay * groupRam);
  // Average money stolen per unit Ram
  const averageMoneyPerRam = averageMoneyPerRamPerTime * (2 * groupDelay);
  // Average money stolen per unit time
  const averageMoneyPerTime = averageMoneyPerGroup * groupRam;

  // Cost
  return [averageMoneyPerRamPerTime, averageMoneyPerRam, averageMoneyPerTime];
}

/**
 *
 * @param {NS} ns
 * @param {string} server
 * @returns {number}
 */
export function altTargetCost(ns, server) { // Doesn't use Formulas
  const hack = ns.hackAnalyzeChance(server) * ns.hackAnalyze(server) * ns.getServerMaxMoney(server) ** 4 / ns.getHackTime(server);
  const grow = ns.getGrowTime(server) * ns.growthAnalyze(server, 2) ** 2;
  const weaken = ns.getWeakenTime(server) * ns.getServerMinSecurityLevel(server) ** 2;
  return hack / (grow * weaken);
}


/**
 *
 * @param {NS} ns
 * @param {string} handle
 * @param {*} data
 * @param {string} mode
 */
export async function writeToFile(ns, portNumber, data, mode = 'w') {
  if (typeof data !== 'string') data = JSON.stringify(data);
  await ns.write(getFileHandle(portNumber), data, mode);
}

/**
 *
 * @param {NS} ns
 * @param {number} portNumber
 * @param {boolean} saveToFile
 * @param {string} mode
 * @returns {Object<*>}
 */
export function readFromFile(ns, portNumber) {
  const data = ns.read(getFileHandle(portNumber));
  return data ? JSON.parse(data) : defaultPortData(portNumber);
}

/**
 *
 * @param {NS} ns
 * @param {number} portNumber
 * @param {Object<*>} data
 * @param {string} mode
 * @returns {Promise<void>}
 */
export async function modifyFile(ns, portNumber, dataToModify, mode = 'w') {
  const data = readFromFile(ns, portNumber);
  const updatedData = recursiveModify(data, dataToModify);
  await writeToFile(ns, portNumber, updatedData, mode);
}

/**
 *
 * @param {Object<*>} data
 * @param {Object<*>} dataToModify
 * @returns {Object<*>}
 */
function recursiveModify(data, dataToModify) {
  for (const [key, val] of Object.entries(dataToModify)) {
    if (typeof val === 'object' && !Array.isArray(val) && data[key]) {
      const _data = data[key];
      recursiveModify(_data, val);
      data[key] = _data;
    } else data[key] = val;
  }
  return data;
}

export function totalThreadsAvailable(ns, scriptRam = 1.75) {
    const servers = ns.getPurchasedServers().concat(ns.scan("home"));
    return servers.reduce((sum, server) => {
        const maxRam = ns.getServerMaxRam(server);
        const usedRam = ns.getServerUsedRam(server);
        const availableRam = maxRam - usedRam;
        return sum + Math.floor(availableRam / scriptRam);
    }, 0);
}

export function maxThreadsAvailable(ns, scriptRam = 1.75) {
    const servers = ns.getPurchasedServers().concat(ns.scan("home"));
    return servers.reduce((max, server) => {
        const maxRam = ns.getServerMaxRam(server);
        const usedRam = ns.getServerUsedRam(server);
        const availableRam = maxRam - usedRam;
        const threads = Math.floor(availableRam / scriptRam);
        return Math.max(max, threads);
    }, 0);
}

/** Server Classes **/

export class ServerModel {
  constructor(ns, hostname) {
    this.ns = ns;
    this.hostname = hostname;
    this.maxRam = ns.getServerMaxRam(hostname);
    this.usedRam = ns.getServerUsedRam(hostname);
    this.hasAdminRights = ns.hasRootAccess(hostname);
    this.requiredHackingSkill = ns.getServerRequiredHackingLevel(hostname);
    this.moneyAvailable = ns.getServerMoneyAvailable(hostname);
    this.moneyMax = ns.getServerMaxMoney(hostname);
  }

  getAvailableRam() {
    return Math.max(0, this.maxRam - this.usedRam);
  }

  getThreads(scriptRam) {
    return Math.floor(this.getAvailableRam() / scriptRam);
  }
}


export class ServerList {
    constructor(ns) {
        this.ns = ns;
        this.ServerClass = ServerModel; // default, can be overridden
        this.servers = getAllServers(ns).map(hostname => new this.ServerClass(ns, hostname));
    }

    loadServer(hostname) {
        return new this.ServerClass(this.ns, hostname);
    }

  getScriptableServers(scriptRam) {
    return this.servers.filter(server => server.getThreads(scriptRam) > 0);
  }

  getHackableServers(player) {
    return this.servers.filter(server =>
      server.hasAdminRights &&
      server.requiredHackingSkill <= player.skills.hacking &&
      server.moneyMax > 0
    );
  }

  getPlayerOwnedServers() {
    return this.servers.filter(server => server.hostname.endsWith("pserv"));
  }

  getHacknetServers() {
    return this.servers.filter(server => server.hostname.startsWith("hacknet-node"));
  }

  getSmallestServers() {
    return [...this.servers].sort((a, b) => a.maxRam - b.maxRam);
  }

  getBiggestServers() {
    return [...this.servers].sort((a, b) => b.maxRam - a.maxRam);
  }

  loadServer(hostname) {
    return new this.ServerClass(this.ns, hostname);
  }

}

/**
 * Scores an augmentation based on a focus type.
 * @param {Object} stats
 * @param {string} focusType
 * @returns {number}
 */
export function scoreAugment(stats, focusType) {
  const focusStats = {
    HACKING: ["hacking", "hacking_exp"],
    COMBAT: ["strength", "defense", "dexterity", "agility"],
    REP: ["faction_rep"],
    CHA: ["charisma", "charisma_exp"]
  };
  return focusStats[focusType]
    .map(stat => stats[stat] && stats[stat] > 1.0 ? (stats[stat] - 1) * 100 : 0)
    .reduce((a, b) => a + b, 0);
}

