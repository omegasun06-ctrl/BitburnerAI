/** @param {NS} ns **/
export async function run(ns, sleeveNum) {
    const crime = "Mug People";
    await ns.sleeve.setToCommitCrime(sleeveNum, crime);
}
