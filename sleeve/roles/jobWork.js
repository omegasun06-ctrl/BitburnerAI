/** @param {NS} ns **/
export async function run(ns, sleeveNum) {
    const company = "MegaCorp";
    await ns.sleeve.setToCompanyWork(sleeveNum, company);
}
