/** @param {import(".").NS } ns */
export async function main(ns) {
  const scriptDir = "/daemons/";
  const scripts = ["hack.js", "grow.js", "weaken.js"];
  const batcherScript = "/hacking/batcher.js";
  const primeScript = "/hacking/prime_target.js";
  const loopDelay = 30000;
  const batchSpacing = 10;
  const maxLoops = ns.args[0] || Infinity;
  const refreshRate = 5; // recompute candidates every N loops
  const logfile = "/logs/batch_manager.txt";

  // Stabilizers
  const hysteresis = 0.20;         // require +20% better score to switch
  const minHoldMs = 2 * 60 * 1000; // hold target at least 2 minutes

  ns.rm(logfile, "home");

  let loopCount = 0;
  let candidates = getPrioritizedTargets(ns);
  const hasFormulas = ns.fileExists("Formulas.exe", "home");

  // Active target state
  let activeTarget = candidates.length ? candidates[0] : null;
  let activeSince = Date.now();

  function shouldSwitchTarget(current, best) {
    if (!current) return true;
    if (!best) return false;
    const heldLongEnough = (Date.now() - activeSince) >= minHoldMs;
    const significantlyBetter = best.score > current.score * (1 + hysteresis);
    return heldLongEnough && significantlyBetter;
  }

  while (loopCount < maxLoops) {
    // Refresh candidates periodically
    if (loopCount % refreshRate === 0) {
      candidates = getPrioritizedTargets(ns);

      // Re-evaluate active target with hysteresis
      const best = candidates[0];
      // If current target is gone or not rooted, or clearly worse, switch
      if (!activeTarget || !ns.hasRootAccess(activeTarget.server) || shouldSwitchTarget(activeTarget, best)) {
        activeTarget = best || null;
        activeSince = Date.now();
        if (activeTarget) {
          const msg = `🎯 Active target set to ${activeTarget.server} (score=${activeTarget.score.toFixed(2)})`;
          ns.print(msg);
          await ns.write(logfile, `${new Date().toISOString()} ${msg}\n`, "a");
        } else {
          ns.print("⚠️ No viable active target found.");
        }
      }
    }

    if (!activeTarget) {
      ns.print("⏳ Waiting for a viable active target...");
      await ns.sleep(loopDelay);
      loopCount++;
      continue;
    }

    const playerServers = ["home", ...ns.getPurchasedServers()];
    const supportServers = getAllServers(ns).filter(s =>
      !playerServers.includes(s) &&
      ns.hasRootAccess(s) &&
      ns.getServerMaxRam(s) > 0
    );

    // === PLAYER SERVERS: Only run batches for the active target ===
    for (const server of playerServers) {
      // Make sure *all* required scripts are present on the host
      await ns.scp([primeScript, batcherScript, "utils.js", ...scripts.map(s => scriptDir + s)], server);

      const maxRam = ns.getServerMaxRam(server);
      const usedRam = ns.getServerUsedRam(server);
      let freeRam = maxRam - usedRam;
      if (server === "home") freeRam = Math.max(0, freeRam - 4096);

      // Priming phase for active target (only)
      const moneyAvailable = ns.getServerMoneyAvailable(activeTarget.server);
      const moneyMax = activeTarget.maxMoney;

      if (moneyAvailable < moneyMax * 0.95) {
        // Only one priming per server per target
        const isPriming = ns.ps(server).some(p => p.filename === primeScript && p.args.includes(activeTarget.server));
        const ramNeeded = ns.getScriptRam(primeScript);

        if (!isPriming && freeRam >= ramNeeded) {
          const pid = ns.exec(primeScript, server, 1, activeTarget.server);
          if (pid !== 0) {
            const message = `🧪 Priming ${activeTarget.server} on ${server}`;
            ns.print(message);
            await ns.write(logfile, `${new Date().toISOString()} ${message}\n`, "a");
            freeRam -= ramNeeded;
          }
        }
        // Skip batch launch if still priming
        continue;
      }

      // Compute batch RAM unit once
      const ramHack = ns.getScriptRam(scriptDir + "hack.js");
      const ramGrow = ns.getScriptRam(scriptDir + "grow.js");
      const ramWeaken = ns.getScriptRam(scriptDir + "weaken.js");
      const unitRam = ramHack + (2 * ramGrow) + (2 * ramWeaken);
      if (unitRam <= 0) continue;

      // Derive times
      let hackTime = ns.getHackTime(activeTarget.server);
      let growTime = ns.getGrowTime(activeTarget.server);
      let weakenTime = ns.getWeakenTime(activeTarget.server);
      if (hasFormulas) {
        const serverObj = ns.getServer(activeTarget.server);
        const player = ns.getPlayer();
        hackTime = ns.formulas.hacking.hackTime(serverObj, player);
        growTime = ns.formulas.hacking.growTime(serverObj, player);
        weakenTime = ns.formulas.hacking.weakenTime(serverObj, player);
      }

      // Launch as many batches as RAM allows, but ONLY for activeTarget
      while (freeRam >= unitRam) {
        const scaleFactor = Math.floor(freeRam / unitRam);
        if (scaleFactor < 1) break;

        const hackThreads = scaleFactor;
        const growThreads = scaleFactor * 2;
        const weakenThreadsHack = scaleFactor;
        const weakenThreadsGrow = scaleFactor;

        const now = Date.now();
        const batchId = `batch-${now}-${server}-${activeTarget.server}`;
        const pid = ns.exec(
          batcherScript,
          server,
          1,
          activeTarget.server,
          batchId,
          hackThreads,
          growThreads,
          weakenThreadsHack,
          weakenThreadsGrow,
          hackTime,
          growTime,
          weakenTime
        );

        if (pid !== 0) {
          const message = `✅ Batch on ${server} -> ${activeTarget.server} with ${scaleFactor}x threads`;
          ns.print(message);
          await ns.write(logfile, `${new Date().toISOString()} ${message}\n`, "a");
          freeRam -= unitRam * scaleFactor;
          await ns.sleep(batchSpacing);
        } else {
          // Could not start (race/permission/etc.), break to avoid tight loop
          break;
        }
      }
    }

    // --- Crawler Integration ---
const wormScript = "/hacking/worm.js"; // Update path if needed
const portPrograms = [
    "BruteSSH.exe",
    "FTPCrack.exe",
    "relaySMTP.exe",
    "HTTPWorm.exe",
    "SQLInject.exe"
];

for (const prog of portPrograms) {
  if(!ns.fileExists(prog, "home")) {
      ns.purchaseProgram(prog);
    }  
};

const availablePrograms = portPrograms.filter(p => ns.fileExists(p, "home")).length;

const allServers = scanAll(ns);
for (const server of allServers) {
    if (
        !ns.hasRootAccess(server) &&
        ns.getServerNumPortsRequired(server) <= availablePrograms &&
        !ns.ps("home").some(p => p.filename === wormScript && p.args.includes(server))
    ) {
        const pid = ns.run(wormScript, 1, server);
        if (pid !== 0) {
            ns.print(`🪱 Running worm.js on ${server} (needs ${ns.getServerNumPortsRequired(server)} ports)`);
        } else {
            ns.print(`⚠️ Failed to run worm.js on ${server}`);
        }
    }
}

    // === SUPPORT SERVERS: Point them to the same active target ===
 
for (const support of supportServers) {
  await ns.scp([scriptDir + "grow.js", scriptDir + "weaken.js", "utils.js"], support);

  let freeRam = ns.getServerMaxRam(support) - ns.getServerUsedRam(support);
  const ramGrow = ns.getScriptRam(scriptDir + "grow.js");
  const ramWeaken = ns.getScriptRam(scriptDir + "weaken.js");

  let launchedGrow = 0, launchedWeaken = 0;

  // Try WEAKEN first (fills half if possible)
  let tw = Math.floor((freeRam / 2) / ramWeaken);
  if (tw >= 1) {
    const pidW = ns.exec(scriptDir + "weaken.js", support, tw, activeTarget.server);
    if (pidW !== 0) {
      launchedWeaken = tw;
      freeRam -= tw * ramWeaken;
    } else {
      tw = 0; // didn’t launch
    }
  }

  // Then fill remaining with GROW
  let tg = Math.floor(freeRam / ramGrow);
  if (tg >= 1) {
    const pidG = ns.exec(scriptDir + "grow.js", support, tg, activeTarget.server);
    if (pidG !== 0) {
      launchedGrow = tg;
      freeRam -= tg * ramGrow;
    } else {
      tg = 0;
    }
  }

  // If nothing launched (e.g., server with very little RAM), try single-script fallback
  if (launchedGrow === 0 && launchedWeaken === 0) {
    const twOnly = Math.floor((ns.getServerMaxRam(support) - ns.getServerUsedRam(support)) / ramWeaken);
    if (twOnly >= 1) {
      const pidW = ns.exec(scriptDir + "weaken.js", support, twOnly, activeTarget.server);
      if (pidW !== 0) launchedWeaken = twOnly;
    } else {
      const tgOnly = Math.floor((ns.getServerMaxRam(support) - ns.getServerUsedRam(support)) / ramGrow);
      if (tgOnly >= 1) {
        const pidG = ns.exec(scriptDir + "grow.js", support, tgOnly, activeTarget.server);
        if (pidG !== 0) launchedGrow = tgOnly;
      }
    }
  }

  if (launchedGrow || launchedWeaken) {
    ns.print(`🧬 Support ${support}: ${launchedGrow} grow + ${launchedWeaken} weaken on ${activeTarget.server}`);
  }
}


    loopCount++;
    ns.print(`🔁 Sleeping for ${loopDelay / 1000} seconds...`);
    await ns.sleep(loopDelay);
  }
}

function getAllServers(ns) {
  const discovered = new Set(["home"]);
  const queue = ["home"];

  while (queue.length > 0) {
    const current = queue.shift();
    const neighbors = ns.scan(current);
    for (const neighbor of neighbors) {
      if (!discovered.has(neighbor)) {
        discovered.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return Array.from(discovered);
}


function getPrioritizedTargets(ns) {
  const servers = getAllServers(ns);
  const candidates = [];
  const playerLevel = ns.getHackingLevel();

  // Dynamic min money floor to avoid low-value targets as you progress
  // Floor grows with your level but capped to something reasonable early on
  const minMoneyFloor = Math.max(2e5, Math.min(2e7, playerLevel * 5e3)); // tweak as you like

  for (const server of servers) {
    if (!ns.hasRootAccess(server)) continue;

    const maxMoney = ns.getServerMaxMoney(server);
    if (maxMoney < minMoneyFloor) continue; // drop trivial targets

    const minSecurity = ns.getServerMinSecurityLevel(server);
    const hackChance = ns.hackAnalyzeChance(server);
    const requiredLevel = ns.getServerRequiredHackingLevel(server);
    if (requiredLevel > playerLevel) continue;

    // --- Proximity weight: favors targets close to your level (but not below ~40%)
    // 0.4 .. 1.0, peaking near ~0.8 of your level
    const ratio = requiredLevel / Math.max(1, playerLevel);
    const proximity = Math.min(1, Math.max(0.4, 1 - Math.abs(ratio - 0.8))); // peak at 0.8

    // Security exponent >1 to penalize high-sec more
    const secExp = 1.35;

    // Score: bigger money, better chance, lower security, closer level
    const score = (maxMoney * hackChance * proximity) / Math.pow(minSecurity, secExp);

    candidates.push({
      server,
      maxMoney,
      minSecurity,
      hackChance,
      requiredLevel,
      score,
    });
  }

  return candidates.sort((a, b) => b.score - a.score);
}


function scanAll(ns) {
    const discovered = new Set();
    const stack = ["home"];

    while (stack.length > 0) {
        const host = stack.pop();
        if (!discovered.has(host)) {
            discovered.add(host);
            const neighbors = ns.scan(host);
            for (const neighbor of neighbors) {
                if (!discovered.has(neighbor)) {
                    stack.push(neighbor);
                }
            }
        }
    }

    return Array.from(discovered);
}

