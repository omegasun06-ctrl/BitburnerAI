/** @param {NS} ns **/
export async function main(ns) {
  const [
    target,
    batchId,
    hackThreads,
    growThreads,
    weakenThreadsHack,
    weakenThreadsGrow,
    hackTime,
    growTime,
    weakenTime
  ] = ns.args;

  const scriptDir = "/daemons/";
  const hackScript = scriptDir + "hack.js";
  const growScript = scriptDir + "grow.js";
  const weakenScript = scriptDir + "weaken.js";

  const now = Date.now();

  // Calculate delays so that actions land in the correct order
  const weakenGrowDelay = weakenTime - growTime + 100;
  const growDelay = weakenGrowDelay - 100;
  const weakenHackDelay = weakenTime - hackTime + 200;
  const hackDelay = weakenHackDelay - 200;

  // Launch weaken for grow
  ns.run(weakenScript, weakenThreadsGrow, target, batchId, "wg", weakenGrowDelay);
  // Launch grow
  ns.run(growScript, growThreads, target, batchId, "g", growDelay);
  // Launch weaken for hack
  ns.run(weakenScript, weakenThreadsHack, target, batchId, "wh", weakenHackDelay);
  // Launch hack
  ns.run(hackScript, hackThreads, target, batchId, "h", hackDelay);

  ns.print(`🚀 Batch ${batchId} launched on ${target}`);
}