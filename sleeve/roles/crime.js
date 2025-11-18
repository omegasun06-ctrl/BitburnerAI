/** @param {NS} ns **/
export async function run(ns, sleeveNum, params={} ) {
    const crime = params.crime ?? "Mug People";
    await ns.sleeve.setToCommitCrime(sleeveNum, crime);
}
