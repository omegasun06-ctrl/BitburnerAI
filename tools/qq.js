/** @param {NS} ns **/
export async function main(ns) {
    const [s = "home", sc, tRaw, ...a] = ns.args;
    const t = tRaw && !isNaN(tRaw) ? parseInt(tRaw) : 1;

    if (!sc) {
        return;
    }

    const need = ns.getScriptRam(sc) * t;

    while (true) {
        const free = ns.getServerMaxRam(s) - ns.getServerUsedRam(s);
        if (free >= need) {
            ns.exec(sc, s, t, ...a);
            break;
        }
        await ns.sleep(5000);
    }
}
