import { getPortNumbers, readFromFile } from '/utils.js';

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

    const data = readFromFile(ns, getPortNumbers().stock).long;
    const stock = data.includes(target);

    if (delay > 0) {
        ns.print(`⏱️ [${batchId}] Sleeping for ${delay}ms before growing ${target}`);
        await ns.sleep(delay);
    }

    ns.print(`🌱 [${batchId}] Growing ${target} (stock-aware: ${stock})`);
    await ns.grow(target, { stock });
}
