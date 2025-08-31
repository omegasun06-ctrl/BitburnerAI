/** @param {NS} ns **/
export async function main(ns) {
  const executeScript = "/scripts/execute.js";
  const scriptRam = 1.75; // Approximate RAM cost of autoHack/grow/weaken scripts
  const loopDelay = 60000;
  const buffer = 2; // RAM buffer to avoid over-allocation

  while (true) {
    const allServers = scanAll(ns);
    const purchasedServers = ns.getPurchasedServers();
    const hackingLevel = ns.getHackingLevel();

    // Filter hackable targets
    const hackableTargets = allServers
      .filter(s =>
        ns.hasRootAccess(s) &&
        ns.getServerMaxRam(s) > 0 &&
        ns.getServerMaxRam(s) !== 0 &&
        !purchasedServers.includes(s) &&
        s !== "home" &&
        ns.getServerRequiredHackingLevel(s) <= hackingLevel
      )
      .sort((a, b) => ns.getServerMaxMoney(b) - ns.getServerMaxMoney(a));

    // Launch HGW on home targeting the most profitable server
    const homeMaxRam = ns.getServerMaxRam("home");
    const homeUsedRam = ns.getServerUsedRam("home");
    const homeAvailableRam = homeMaxRam - homeUsedRam;
    const homeRamLimit = homeMaxRam * 0.75;

    if (hackableTargets.length > 0 && homeAvailableRam > scriptRam) {
      const bestTarget = hackableTargets[0]; // already sorted by max money
      const threads = Math.floor(homeRamLimit / scriptRam);

      if (threads > 0) {
        await ns.scp(executeScript, "home");
        ns.exec(executeScript, "home", 1, "hack", bestTarget, "home");
        ns.exec(executeScript, "home", 1, "grow", bestTarget, "home");
        ns.exec(executeScript, "home", 1, "weaken", bestTarget, "home");
      }
    }

    // Personal servers
    const personalServers = purchasedServers.filter(s =>
        ns.getServerMaxRam(s) > 4
    );

    // Other rooted servers with RAM (non-purchased)
    const rootedHosts = allServers.filter(s =>
      ns.hasRootAccess(s) &&
      ns.getServerMaxRam(s) > 0 &&
      !purchasedServers.includes(s) &&
      s !== "home"
    );

    for (const target of hackableTargets) {
      let action = "";
      const security = ns.getServerSecurityLevel(target);
      const minSecurity = ns.getServerMinSecurityLevel(target);
      const money = ns.getServerMoneyAvailable(target);
      const maxMoney = ns.getServerMaxMoney(target);

      if (security > minSecurity + 5) {
        action = "weaken";
      } else if (money < maxMoney * 0.75) {
        action = "grow";
      } else {
        action = "hack";
      }

      // Launch on personal servers
      for (const host of personalServers) {
        const freeRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
        if (freeRam >= scriptRam + buffer) {
          await ns.scp(executeScript, host);
          ns.exec(executeScript, host, 1, action, target, host);
        }
      }

      // Launch on other rooted servers
      const lowRamServers = [
        "CSEC", "avmnite-02h", "I.I.I.I", "run4theh111z", "rho-construction",
        "n00dles", "foodnstuff", "sigma-cosmetics", "joesguns", "nectar-net",
        "zer0", "phantasy", "omega-net", "crush-fitness"
      ];


      for (const host of rootedHosts) {
        const maxRam = ns.getServerMaxRam(host);
        const freeRam = maxRam - ns.getServerUsedRam(host);

        if (maxRam <= 8) {
          // Run execute.js from home targeting the low-RAM server
          ns.exec(executeScript, "home", 1, action, target, host);
        } else if (freeRam >= scriptRam + buffer) {
          await ns.scp(executeScript, host);
          ns.exec(executeScript, host, 1, action, target, host);
        }
      }

    }

    await ns.sleep(loopDelay);
  }
}

/** @param {NS} ns **/
function scanAll(ns) {
  const visited = new Set();
  const stack = ["home"];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!visited.has(current)) {
      visited.add(current);
      stack.push(...ns.scan(current));
    }
  }
  return [...visited];
}
