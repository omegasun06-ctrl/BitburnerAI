/**
 * @param {NS} ns
 */
export async function main(ns) {
  const [target, delayRaw, batchId = "no-batch-id"] = ns.args;
  const delay = Number(delayRaw) || 0;

  if (!target) {
    ns.tprint(`❌ [${batchId}] No target provided to weaken.js`);
    return;
  }

  if (delay > 0) {
    ns.print(`⏱️ [${batchId}] Sleeping for ${delay}ms before weakening ${target}`);
    await ns.sleep(delay);
  }

  ns.print(`🔻 [${batchId}] Weakening ${target}`);
  await ns.weaken(target);
}