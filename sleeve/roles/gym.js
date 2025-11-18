/** @param {NS} ns **/
export async function run(ns, sleeveNum, params = {}) {
    const stat = params.stat ?? "Strength";
    const gym = params.gym ?? "Powerhouse Gym";
    await ns.sleeve.setToGymWorkout(sleeveNum, gym, stat);
}
