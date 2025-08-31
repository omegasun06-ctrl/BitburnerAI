/**
 * @param {NS} ns
 */
export async function main(ns) {
  const [target, delayRaw, batchId = "no-batch-id"] = ns.args;
  const delay = Number(delayRaw) || 0;

  if (!target) {
    ns.tprint(`❌ [${batchId}] No target provided to hack.js`);
    return;
  }

  if (delay > 0) {
    ns.print(`⏱️ [${batchId}] Sleeping for ${delay}ms before hacking ${target}`);
    await ns.sleep(delay);
  }

  ns.print(`💸 [${batchId}] Hacking ${target}`);
  await ns.hack(target);
}
