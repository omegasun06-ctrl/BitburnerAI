/** @param {NS} ns **/
import {getAllServers} from "/utils.js"
export async function main(ns) {
  const weakenScript = "/daemons/weaken.js";
  const batchId = "BatchID: Hacking Farm";
  const refreshInterval = 5000;

  let lastXp = ns.getPlayer().exp.hacking;
  let lastTime = Date.now();

  while (true) {
    const allServers = getAllServers(ns);
    const purchased = ns.getPurchasedServers();

    const targets = allServers.filter(s =>
      s !== "home" &&
      !purchased.includes(s) &&
      ns.hasRootAccess(s) &&
      ns.getServerRequiredHackingLevel(s) <= ns.getHackingLevel()
    );


    const bestTarget = targets.sort((a, b) =>
      ns.getServerSecurityLevel(a) - ns.getServerSecurityLevel(b)
    )[0];

    if (!bestTarget) {
      ns.print("No valid targets found.");
      await ns.sleep(refreshInterval);
      continue;
    }

    const weakenTime = ns.getWeakenTime(bestTarget);
    const delayRaw = Math.floor(weakenTime * 0.9); // Slight offset to avoid overlap

    const launchers = allServers.filter(s =>
    ns.hasRootAccess(s) 
);

for (const host of launchers) {
    const maxRam = ns.getServerMaxRam(host);
    const usedRam = ns.getServerUsedRam(host);
    const freeRam = maxRam - usedRam;

    const ramPerThread = ns.getScriptRam(weakenScript) || 1.75;
    const threads = Math.floor(freeRam / ramPerThread);

    if (threads > 0) {
      if(!ns.fileExists("/daemons/weaken.js", host)){
        ns.scp("/daemons/weaken.js", host)
      }
        ns.exec(weakenScript, host, threads, bestTarget, delayRaw, batchId);
        ns.print(`Weaken launched on ${bestTarget} from ${host} with ${threads} threads`);
    }
}


    // XP tracking
    const currentXp = ns.getPlayer().exp.hacking;
    const currentTime = Date.now();
    const xpGain = currentXp - lastXp;
    const timeElapsed = (currentTime - lastTime) / 1000;
    const xpPerSec = (xpGain / timeElapsed).toFixed(2);

    ns.print(`XP Gain: ${xpGain} | Time: ${timeElapsed}s | XP/sec: ${xpPerSec}`);

    lastXp = currentXp;
    lastTime = currentTime;

    await ns.sleep(refreshInterval);
  }
}

// function getAllServers(ns) {
//   const discovered = new Set();
//   const stack = ["home"];

//   while (stack.length > 0) {
//     const current = stack.pop();
//     discovered.add(current);
//     for (const neighbor of ns.scan(current)) {
//       if (!discovered.has(neighbor)) {
//         stack.push(neighbor);
//       }
//     }
//   }

//   return [...discovered];
// }
