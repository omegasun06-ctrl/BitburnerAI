/** @param {NS} ns **/
export async function main(ns) {
    const args = ns.args;
    const s = args.length > 1 ? args[0] : "home";
    const sc = args.length > 1 ? args[1] : args[0];
    const t = args.length > 2 && !isNaN(args[2]) ? parseInt(args[2]) : 1;
    const a = args.slice(args.length > 2 ? 3 : args.length > 1 ? 2 : 1);

    if (!sc) {
        ns.tprint("Usage: run queue-runner.js [server (optional)] [script] [threads (optional)] [...args]");
        return;
    }

    const r = ns.getScriptRam(sc);
    const need = r * t;

    while (true) {
        const free = ns.getServerMaxRam(s) - ns.getServerUsedRam(s);
        if (free >= need) {
            ns.tprint(`Launching ${sc} on ${s} with ${t} thread(s)`);
            ns.exec(sc, s, t, ...a);
            break;
        }
        await ns.sleep(5000);
    }
}