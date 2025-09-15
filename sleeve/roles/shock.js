/** @param {NS} ns **/
export async function run(ns, sleeveNum) {
    const sleeve = ns.sleeve.getSleeve(sleeveNum);

    if (sleeve.shock > 0) {
        await ns.sleeve.setToShockRecovery(sleeveNum);
        ns.print(`🧠 Sleeve ${sleeveNum} recovering from shock (${sleeve.shock.toFixed(2)}%)`);
    } else {
        await ns.sleeve.setToSynchronize(sleeveNum);
        ns.print(`✅ Sleeve ${sleeveNum} has no shock. Synchronizing.`);
    }
}
