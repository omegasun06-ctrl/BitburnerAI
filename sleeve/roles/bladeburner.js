/** @param {NS} ns **/
export async function run(ns, sleeveNum) {
    const action = "Training";
    await ns.sleeve.setToBladeburnerAction(sleeveNum, "General", action);
}
