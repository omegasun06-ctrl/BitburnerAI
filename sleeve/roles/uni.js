/** @param {NS} ns **/
export async function run(ns, sleeveNum) {
    const university = "Rothman University";
    const course = "Computer Science";
    await ns.sleeve.setToUniversityCourse(sleeveNum, university, course);
}
