/** @param {NS} ns **/
export async function main(ns) {
    const baseScripts = ["grow.js", "hack.js", "weaken.js"];
    const targets = ["n00dles", "foodnstuff"];
    const scanned = new Set();
    const rooted = new Set();

    // Ensure basic scripts exist
    for (const script of baseScripts) {
        if (!ns.fileExists(script)) {
            await ns.write(script, getScriptContent(script), "w");
        }
    }

    // Scan and nuke
    function scanNetwork(host = "home") {
        const neighbors = ns.scan(host);
        for (const server of neighbors) {
            if (!scanned.has(server)) {
                scanned.add(server);
                scanNetwork(server);
            }
        }
    }

    function tryRoot(server) {
        if (ns.hasRootAccess(server)) return true;
        const ports = [
            { tool: "BruteSSH.exe", fn: ns.brutessh },
            { tool: "FTPCrack.exe", fn: ns.ftpcrack },
            { tool: "RelaySMTP.exe", fn: ns.relaysmtp },
            { tool: "HTTPWorm.exe", fn: ns.httpworm },
            { tool: "SQLInject.exe", fn: ns.sqlinject },
        ];
        let opened = 0;
        for (const { tool, fn } of ports) {
            if (ns.fileExists(tool)) {
                fn(server);
                opened++;
            }
        }
        if (opened >= ns.getServerNumPortsRequired(server)) {
            ns.nuke(server);
            return true;
        }
        return false;
    }

    function deployScripts(server, target) {
        const ram = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
        const scriptRam = ns.getScriptRam("hack.js");
        const threads = Math.floor(ram / scriptRam);
        if (threads > 0) {
            ns.scp(baseScripts, server);
            ns.exec("hack.js", server, threads, target);
        }
    }

    // Main loop
    while (true) {
        scanNetwork();
        for (const server of scanned) {
            if (!rooted.has(server) && tryRoot(server)) {
                rooted.add(server);
            }
        }

        for (const server of rooted) {
            for (const target of targets) {
                if (ns.getServerRequiredHackingLevel(target) <= ns.getHackingLevel()) {
                    deployScripts(server, target);
                }
            }
        }

        // Expand targets as hacking level increases
        for (const server of scanned) {
            if (ns.hasRootAccess(server) && ns.getServerRequiredHackingLevel(server) <= ns.getHackingLevel()) {
                if (!targets.includes(server)) targets.push(server);
            }
        }

        await ns.sleep(60000); // Check every minute
    }

    // Script content generator
    function getScriptContent(name) {
        switch (name) {
            case "hack.js":
                return `/** @param {NS} ns **/ export async function main(ns) { await ns.hack(ns.args[0]); }`;
            case "grow.js":
                return `/** @param {NS} ns **/ export async function main(ns) { await ns.grow(ns.args[0]); }`;
            case "weaken.js":
                return `/** @param {NS} ns **/ export async function main(ns) { await ns.weaken(ns.args[0]); }`;
            default:
                return "";
        }
    }
}