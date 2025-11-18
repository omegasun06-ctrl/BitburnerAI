/** @param {NS} ns **/
export async function run(ns, sleeveNum, params = {} ) {
    const university = params.uni ?? "Rothman University";
    const course = params.course ?? "Computer Science";
    await ns.sleeve.setToUniversityCourse(sleeveNum, university, course);
}
