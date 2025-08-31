
export async function main(ns) {
    const target = ns.args[0] || "n00dles";
    const server = ns.getHostname();

    // Get times
    const hackTime = ns.getHackTime(target);
    const growTime = ns.getGrowTime(target);
    const weakenTime = ns.getWeakenTime(target);

    // RAM usage
    const ramHack = ns.getScriptRam("/daemons/hack.js");
    const ramGrow = ns.getScriptRam("/daemons/grow.js");
    const ramWeaken = ns.getScriptRam("/daemons/weaken.js");

    if (ramHack === 0 || ramGrow === 0 || ramWeaken === 0) {
        ns.tprint("❌ One or more script RAM values are 0. Make sure /daemons/, /daemons/grow.js, and /daemons/weaken.js exist and are not empty.");
        return;
    }

    const ramAvailable = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);

    // Hack calculations
    const hackFraction = ns.hackAnalyze(target); // fraction of money stolen per thread
    const moneyAvailable = ns.getServerMoneyAvailable(target);
    const moneyToSteal = moneyAvailable * 0.1; // steal 10%
    const hackThreads = Math.ceil(moneyToSteal / (moneyAvailable * hackFraction));

    // Grow calculations
    const growthAmount = 1 / (1 - 0.1); // /daemons/grow back 10% stolen = 1.111...
    const growThreads = Math.ceil(ns.growthAnalyze(target, growthAmount));

    // Weaken calculations
    const hackSecIncrease = ns.hackAnalyzeSecurity(hackThreads);
    const growSecIncrease = ns.growthAnalyzeSecurity(growThreads);
    const weakenThreadsHack = Math.ceil(hackSecIncrease / ns.weakenAnalyze(1));
    const weakenThreadsGrow = Math.ceil(growSecIncrease / ns.weakenAnalyze(1));

    // Total RAM needed
    const totalRam = (hackThreads * ramHack) + (growThreads * ramGrow) +
                     (weakenThreadsHack + weakenThreadsGrow) * ramWeaken;

    if (totalRam > ramAvailable) {
        ns.tprint("❌ Not enough RAM for this batch.");
        return;
    }

    // Delays
    const delay = 200;
    const weakenHackDelay = 0;
    const hackDelay = weakenTime - hackTime - delay;
    const growDelay = weakenTime - growTime + delay;
    const weakenGrowDelay = delay * 2;

    // Launch batch
    ns.exec("/daemons/weaken.js", server, weakenThreadsHack, target, weakenHackDelay);
    ns.exec("/daemons/hack.js", server, hackThreads, target, hackDelay);
    ns.exec("/daemons/grow.js", server, growThreads, target, growDelay);
    ns.exec("/daemons/weaken.js", server, weakenThreadsGrow, target, weakenGrowDelay);

    ns.tprint(`✅ Batch launched on ${target}:
  - Hack: ${hackThreads} threads
  - Grow: ${growThreads} threads
  - Weaken (Hack): ${weakenThreadsHack} threads
  - Weaken (Grow): ${weakenThreadsGrow} threads`);
}
