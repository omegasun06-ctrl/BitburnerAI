/** @param {NS} ns **/
export async function run(ns, sleeveNum, params = {}) {
    const company = params.company ?? "MegaCorp";
    await ns.sleeve.setToCompanyWork(sleeveNum, company);
}
