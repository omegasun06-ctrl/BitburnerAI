/** @param {NS} ns **/
export async function main(ns) {
    const target = ns.args[0];
    if (!target) {
        ns.tprint("❌ ERROR: No target server specified.");
        return;
    }

    const progressionServers = [
        "CSEC",
        "avmnite-02h",
        "I.I.I.I",
        "run4theh111z",
        "fulcrumassets"
    ];

    const path = findPath(ns, "home", target);
    ns.scp("/hacking/worm.js", target)
    if (!path) {
        ns.tprint(`❌ ERROR: Could not find a path to ${target}`);
        return;
    }

    // Connect to the server
    if (ns.singularity && ns.singularity.connect) {
        ns.tprint(`🔗 Connecting to ${target} via Singularity API...`);
        for (const server of path) {
            if (!ns.singularity.connect(server)) {
                ns.tprint(`❌ ERROR: Failed to connect to ${server}`);
                return;
            }
            await ns.sleep(100); // slight delay for stability
        }
    } else {
        const command = path.map(s => `connect ${s}`).join("; ");
        ns.tprint("📋 Singularity not available. Use this in terminal:");
        ns.tprint(command);
        return; // can't backdoor without being connected
    }

    // Only backdoor if it's a progression server
    if (!progressionServers.includes(target)) {
        ns.tprint(`ℹ️ ${target} is not a progression-critical server. Skipping backdoor.`);
        return;
    }

    // Auto-nuke if needed
    if (!ns.hasRootAccess(target)) {
        ns.tprint(`🛠️ No root access on ${target}. Attempting to nuke using /hacking/worm.js...`);
        const pid = ns.run("/hacking/worm.js", 1, target);
        if (pid === 0) {
            ns.tprint("❌ ERROR: Failed to run /hacking/worm.js. Is it on this server?");
            return;
        }

        // Wait for worm.js to finish
        while (ns.isRunning(pid)) {
            await ns.sleep(500);
        }

        if (!ns.hasRootAccess(target)) {
            ns.tprint(`❌ ERROR: Still no root access on ${target} after worm.js.`);
            return;
        }

        ns.tprint(`✅ Root access gained on ${target}.`);
    }

    // Backdoor if not already installed
    
    const requiredLevel = ns.getServerRequiredHackingLevel(target);
    const currentLevel = ns.getHackingLevel();

    if (currentLevel < requiredLevel) {
        ns.tprint(`🚫 Skipping backdoor: Your hacking level (${currentLevel}) is below ${requiredLevel} required for ${target}.`);
        return;
    }

    if (ns.getServer(target).backdoorInstalled) {
        ns.tprint(`ℹ️ Backdoor already installed on ${target}.`);
        return;
    }

    ns.tprint(`🚪 Installing backdoor on ${target}...`);
    await ns.singularity.installBackdoor();
    ns.tprint(`✅ Backdoor successfully installed on ${target}`);

    ns.singularity.connect(target);
}

// Breadth-first search to find path from start to target
function findPath(ns, start, target) {
    const queue = [[start]];
    const visited = new Set();

    while (queue.length > 0) {
        const path = queue.shift();
        const node = path[path.length - 1];

        if (node === target) return path;

        if (!visited.has(node)) {
            visited.add(node);
            for (const neighbor of ns.scan(node)) {
                if (!visited.has(neighbor)) {
                    queue.push([...path, neighbor]);
                }
            }
        }
    }

    return null;
}