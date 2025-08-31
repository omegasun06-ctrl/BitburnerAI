
/** @param {NS} ns **/
export async function main(ns) {
    const target = ns.args[0];
    const delay = ns.args[1] || 0;
    const batchId = ns.args[2] || "unknown-batch";

    if (delay > 0) await ns.sleep(delay);
    await ns.grow(target);

    ns.print(`🌱 [${batchId}] Grow executed on ${target}`);
}
