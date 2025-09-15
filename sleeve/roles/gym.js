/** @param {NS} ns **/
export async function run(ns, sleeveNum) {
    const stat = "Strength";
    const gym = "Powerhouse Gym";
    await ns.sleeve.setToGymWorkout(sleeveNum, gym, stat);
}
