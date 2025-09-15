/** @param {NS} ns */
export async function main(ns) {

const tasks = ns.gang.getTaskNames();
for (const task of tasks) {
  const stats = ns.gang.getTaskStats(task);
  ns.tprint(`${task}: Respect=${stats.baseRespect}, Money=${stats.baseMoney}, Territory=${stats.baseTerritory}`);
}

}