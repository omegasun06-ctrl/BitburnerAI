/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("sleep");
    const scriptNames = {
        hack: "/daemons/hack.js",
        grow: "/daemons/grow.js",
        weaken: "/daemons/weaken.js"
    };

    const servers = getAllServers(ns).filter(s => ns.hasRootAccess(s));
    const homeRam = ns.getServerMaxRam("home") - ns.getServerUsedRam("home");

    const actionStats = [];

    for (const server of servers) {
        if (!ns.hasRootAccess(server) || ns.getServerRequiredHackingLevel(server) > ns.getHackingLevel()) continue;

        const hackXp = ns.getHackExpGain(server);
        const growXp = ns.getGrowExpGain(server);
        const weakenXp = ns.getWeakenExpGain(server);

        actionStats.push({
            server,
            action: "hack",
            xp: hackXp,
            time: ns.getHackTime(server)
        });
        actionStats.push({
            server,
            action: "grow",
            xp: growXp,
            time: ns.getGrowTime(server)
        });
        actionStats.push({
            server,
            action: "weaken",
            xp: weakenXp,
            time: ns.getWeakenTime(server)
        });
    }

    // Sort by XP per second
    actionStats.sort((a, b) => (b.xp / b.time) - (a.xp / a.time));

    for (const host of servers) {
        const maxRam = ns.getServerMaxRam(host);
        const usedRam = ns.getServerUsedRam(host);
        const freeRam = maxRam - usedRam;

        if (freeRam < 1.75) continue;

        const best = actionStats.find(stat => ns.hasRootAccess(stat.server));
        if (!best) continue;

        const script = scriptNames[best.action];
        const ramPerThread = ns.getScriptRam(script);
        const threads = Math.floor(freeRam / ramPerThread);

        if (threads > 0) {
            ns.exec(script, host, threads, best.server);
            ns.tprint(`Running ${best.action} on ${best.server} from ${host} with ${threads} threads`);
        }
    }
}

function getAllServers(ns) {
    const discovered = new Set();
    const stack = ["home"];

    while (stack.length > 0) {
        const current = stack.pop();
        discovered.add(current);
        for (const neighbor of ns.scan(current)) {
            if (!discovered.has(neighbor)) {
                stack.push(neighbor);
            }
        }
    }

    return [...discovered];
}
  