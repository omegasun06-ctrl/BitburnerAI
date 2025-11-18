/** @param {NS} ns **/
export async function run(ns, sleeveNum, params = {}) {
    const actionType = params.actionType ?? "General" 
    const action = params.action ?? "Training";
    ns.tprint(`assigning ${sleeveNum} to ${actionType} : ${action}`)
    await ns.sleeve.setToBladeburnerAction(sleeveNum, action);
}
