/** @param {NS} ns **/
export async function main(ns) {
  const scriptDir = "/daemons/";
  const scripts = ["hack.js", "grow.js", "weaken.js"];
  const batcherScript = "/hacking/batcher.js";
  const primeScript = "/hacking/prime_target.js";
  const plannerFile = "/logs/batchPlans.txt";
  const logfile = "/logs/HACKManager.txt";

  const loopDelay = 30000;
  const batchSpacing = 10;
  const refreshRate = 5;
  const hysteresis = 0.20;
  const minHoldMs = 2 * 60 * 1000;

  ns.rm(logfile, "home");

  let loopCount = 0;
  let plannerTargets = [];
  const usePlanner = ns.args.includes("--usePlanner");

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
    const minMoneyFloor = Math.max(2e5, Math.min(2e7, playerLevel * 5e3));
    for (const server of servers) {
      if (!ns.hasRootAccess(server)) continue;
      const maxMoney = ns.getServerMaxMoney(server);
      if (maxMoney < minMoneyFloor) continue;
      const minSecurity = ns.getServerMinSecurityLevel(server);
      const hackChance = ns.hackAnalyzeChance(server);
      const requiredLevel = ns.getServerRequiredHackingLevel(server);
      if (requiredLevel > playerLevel) continue;
      const ratio = requiredLevel / Math.max(1, playerLevel);
      const proximity = Math.min(1, Math.max(0.4, 1 - Math.abs(ratio - 0.8)));
      const secExp = 1.35;
      const score = (maxMoney * hackChance * proximity) / Math.pow(minSecurity, secExp);
      candidates.push({ server, maxMoney, minSecurity, hackChance, requiredLevel, score });
    }
    return candidates.sort((a, b) => b.score - a.score);
  }

  function shouldSwitchTarget(current, best) {
    if (!current) return true;
    if (!best) return false;
    const heldLongEnough = (Date.now() - activeSince) >= minHoldMs;
    const significantlyBetter = best.score > current.score * (1 + hysteresis);
    return heldLongEnough && significantlyBetter;
  }

  let candidates = getPrioritizedTargets(ns);
  let activeTarget = candidates.length ? candidates[0] : null;
  let activeSince = Date.now();

  while (true) {
    if (usePlanner && loopCount % refreshRate === 0 && ns.fileExists(plannerFile)) {
      try {
        const data = ns.read(plannerFile);
        const parsed = JSON.parse(data);
        plannerTargets = parsed.map(p => {
          if (!p.hostname || typeof p.moneyPerSec !== "number") throw new Error("Invalid planner entry");
          return {
            server: p.hostname,
            maxMoney: 0,
            minSecurity: 1,
            hackChance: 1,
            requiredLevel: 1,
            score: p.moneyPerSec
          };
        });
        candidates = plannerTargets;
        ns.print(`📊 Planner recommends: ${candidates[0].server} ($${candidates[0].score.toFixed(2)}/sec)`);
      } catch (err) {
        ns.print("❌ ERROR: Failed to parse planner batch plan JSON.");
        ns.print(err.message);
      }
    }

    if (!usePlanner && loopCount % refreshRate === 0) {
      candidates = getPrioritizedTargets(ns);
    }

    const best = candidates[0];
    if (!activeTarget || !ns.hasRootAccess(activeTarget.server) || shouldSwitchTarget(activeTarget, best)) {
      activeTarget = best ?? null;
      activeSince = Date.now();
      if (activeTarget) {
        const msg = `🎯 Active target set to ${activeTarget.server} (score=${activeTarget.score.toFixed(2)})`;
        ns.print(msg);
        await ns.write(logfile, `${new Date().toISOString()} ${msg}\n`, "a");
      } else {
        ns.print("⚠️ No viable active target found.");
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

    for (const server of playerServers) {
      await ns.scp([primeScript, batcherScript, "utils.js", ...scripts.map(s => scriptDir + s)], server);
      const maxRam = ns.getServerMaxRam(server);
      const usedRam = ns.getServerUsedRam(server);
      let freeRam = maxRam - usedRam;
      if (server === "home") freeRam = Math.max(0, freeRam - 4096);

      const moneyAvailable = ns.getServerMoneyAvailable(activeTarget.server);
      const moneyMax = activeTarget.maxMoney;
      if (moneyAvailable < moneyMax * 0.95) {
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
        continue;
      }

      const ramHack = ns.getScriptRam(scriptDir + "hack.js");
      const ramGrow = ns.getScriptRam(scriptDir + "grow.js");
      const ramWeaken = ns.getScriptRam(scriptDir + "weaken.js");
      const unitRam = ramHack + (2 * ramGrow) + (2 * ramWeaken);
      if (unitRam <= 0) continue;

      let hackTime = ns.getHackTime(activeTarget.server);
      let growTime = ns.getGrowTime(activeTarget.server);
      let weakenTime = ns.getWeakenTime(activeTarget.server);
      if (ns.fileExists("Formulas.exe", "home")) {
        const serverObj = ns.getServer(activeTarget.server);
        const player = ns.getPlayer();
        hackTime = ns.formulas.hacking.hackTime(serverObj, player);
        growTime = ns.formulas.hacking.growTime(serverObj, player);
        weakenTime = ns.formulas.hacking.weakenTime(serverObj, player);
      }

      while (freeRam >= unitRam) {
        const scaleFactor = Math.floor(freeRam / unitRam);
        if (scaleFactor < 1) break;

        const batchId = `batch-${Date.now()}-${server}-${activeTarget.server}`;
        const pid = ns.exec(
          batcherScript,
          server,
          1,
          activeTarget.server,
          batchId,
          scaleFactor,
          scaleFactor * 2,
          scaleFactor,
          scaleFactor,
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
          break;
        }
      }
    }

    loopCount++;
    ns.print(`🔁 Sleeping for ${loopDelay / 1000} seconds...`);
    await ns.sleep(loopDelay);
  }
}