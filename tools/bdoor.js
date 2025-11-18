/** @param {NS} ns **/
export async function main(ns) {
    const target = ns.args[0];
    if (!target) {
        ns.tprint("❌ ERROR: No server name supplied. Usage: run backdoor-server.js [server]");
        return;
    }

    // Try to connect to the server
    try {
        ns.tprint(`🔌 Connecting to ${target}...`);
        await ns.singularity.connect(target);
    } catch (e) {
        ns.tprint(`❌ Failed to connect to ${target}: ${e}`);
        return;
    }

    // Try to backdoor the server
    try {
        ns.tprint(`🔐 Installing backdoor on ${target}...`);
        await ns.singularity.installBackdoor();
        ns.tprint(`✅ Backdoor installed on ${target}`);
    } catch (e) {
        ns.tprint(`❌ Failed to backdoor ${target}: ${e}`);
    }
}