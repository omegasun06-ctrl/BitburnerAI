
import { HackPlanner } from "/hacking/planner";

const FLAGS = [
  ["help", false]
]

/** @param {NS} ns **/
export async function main(ns) {
  ns.clearLog();

  const flags = ns.flags(FLAGS); // ✅ Declare flags first

  if (flags.help) {
    ns.tprint("Provide hack/grow/weaken planning services on a netscript port");
    return;
  }

  const hackPlanner = new HackPlanner(ns); // ✅ Then use it
  const bestPlans = hackPlanner.mostProfitableServers(flags);
  const exportData = bestPlans.map(plan => ({
    hostname: plan.server.hostname,
    batch: plan.batch,
    delays: plan.batch.getDelays?.(),
    moneyPerSec: plan.moneyPerSec,
    peakRam: plan.peakRam,
    numBatches: plan.numBatchesAtOnce,
    condition: plan.condition
  }));
  await ns.write("/logs/batchPlans.txt", JSON.stringify(exportData, null, 2), "w");

}