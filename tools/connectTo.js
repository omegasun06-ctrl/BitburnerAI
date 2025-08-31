
/** @param {NS} ns **/
export async function main(ns) {
    const target = ns.args[0];
    if (!target) {
        ns.tprint("Usage: run connectTo.js [target]");
        return;
    }

    const visited = new Set();
    const path = [];

    function dfs(current, currentPath) {
        if (visited.has(current)) return false;
        visited.add(current);
        currentPath.push(current);

        if (current === target) {
            path.push(...currentPath);
            return true;
        }

        for (const neighbor of ns.scan(current)) {
            if (dfs(neighbor, [...currentPath])) return true;
        }

        return false;
    }

    dfs("home", []);

    if (path.length === 0) {
        ns.tprint(`Target '${target}' not found.`);
        return;
    }

    ns.tprint("Connection path:");
    ns.tprint(path.join(" -> "));

    // Print terminal command
    const terminalCommand = path.map(p => `connect ${p}`).join("; ");
    ns.tprint("\nCopy and paste this into the terminal:");
    ns.tprint(terminalCommand);
}
