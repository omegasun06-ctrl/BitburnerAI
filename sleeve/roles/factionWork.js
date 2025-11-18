
export async function run(ns, sleeveNum, params = {}) {
  const faction = params.faction ?? "CyberSec";
  const workType = params.workType ?? "hacking";
  await ns.sleeve.setToFactionWork(sleeveNum, faction, workType);
}
