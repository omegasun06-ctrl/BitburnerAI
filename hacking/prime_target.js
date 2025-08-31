/** @param {NS} ns **/
export async function main(ns) {
  const target = ns.args[0];
  if (!target) {
    ns.tprint("Usage: run prime-target.js [target]");
    return;
  }

  const weakenScript = "/daemons/weaken.js";
  const growScript = "/daemons/grow.js";
  const weakenRam = ns.getScriptRam(weakenScript);
  const growRam = ns.getScriptRam(growScript);

  if (weakenRam === 0 || growRam === 0) {
    ns.tprint("❌ Error: Script RAM cost is zero. Check that the scripts exist and are not empty.");
    return;
  }

  const minSec = ns.getServerMinSecurityLevel(target);
  const curSec = ns.getServerSecurityLevel(target);
  const curMoney = ns.getServerMoneyAvailable(target);
  const maxMoney = ns.getServerMaxMoney(target);

  const weakenThreads = Math.ceil((curSec - minSec) / ns.weakenAnalyze(1));
  const growRatio = maxMoney / Math.max(curMoney, 1);
  const growThreads = Math.ceil(ns.growthAnalyze(target, growRatio));

  ns.print(`Target: ${target}`);
  ns.print(`Weaken Threads Needed: ${weakenThreads}`);
  ns.print(`Grow Threads Needed: ${growThreads}`);

  const servers = ["home", ...ns.getPurchasedServers()];
  let weakenLeft = weakenThreads;
  let growLeft = growThreads;

  for (const server of servers) {
    const freeRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
    if (freeRam < Math.min(weakenRam, growRam)) continue;

    let weakenPossible = Math.floor(freeRam / weakenRam);
    let weakenToRun = Math.min(weakenLeft, weakenPossible);
    let ramAfterWeaken = freeRam - (weakenToRun * weakenRam);

    let growPossible = Math.floor(ramAfterWeaken / growRam);
    let growToRun = Math.min(growLeft, growPossible);
    ns.scp(weakenScript, server);
    ns.scp(growScript, server);
    if (weakenToRun > 0) {
      ns.exec(weakenScript, server, weakenToRun, target, "batch-prime: "+server);
      weakenLeft -= weakenToRun;
    }

    if (growToRun > 0) {
      ns.exec(growScript, server, growToRun, target, "batch-prime: "+server);
      growLeft -= growToRun;
    }

    if (weakenLeft <= 0 && growLeft <= 0) break;
  }

  if (weakenLeft > 0 || growLeft > 0) {
    ns.print(`⚠️ Not enough RAM to launch all threads. Remaining - Weaken: ${weakenLeft}, Grow: ${growLeft}`);
  } else {
    ns.print("✅ Optimization scripts launched successfully.");
  }
}
