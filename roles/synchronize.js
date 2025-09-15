/** @param {NS} ns **/
export async function run(ns, sleeveNum) {
    const sleeve = ns.sleeve.getSleeve(sleeveNum);
    if (sleeve.shock > 0) {
        await ns.sleeve.setToShockRecovery(sleeveNum);
    } else {
        await ns.sleeve.setToSynchronize(sleeveNum);
    }
}
