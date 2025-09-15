
/**
 * @param {NS} ns
 */
export async function main(ns) {
    const [target, delayRaw, batchId = "no-batch-id"] = ns.args;
    const delay = Number(delayRaw) || 0;

    if (!target) {
        ns.tprint(`❌ [${batchId}] No target provided to grow.js`);
        return;
    }

    if (delay > 0) {
        ns.print(`⏱️ [${batchId}] Sleeping for ${delay}ms before growing ${target}`);
        await ns.sleep(delay);
    }

    ns.print(`🌱 [${batchId}] Growing ${target}`);
    await ns.grow(target);
}
