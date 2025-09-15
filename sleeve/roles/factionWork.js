/** @param {NS} ns **/
export async function run(ns, sleeveNum) {
    const faction = "CyberSec";
    const workType = "hacking";
    await ns.sleeve.setToFactionWork(sleeveNum, faction, workType);
}
