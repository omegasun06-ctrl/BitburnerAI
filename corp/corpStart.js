/** @param {NS} ns **/
export async function main(ns) {
    const corpName = "OmegaTek";
    const industry = "Refinery";
    const divisionName = "OreBGud";
    const city = "Sector-12";

    // Create Corporation if not already created
    if (!ns.corporation.hasCorporation()) {
        ns.corporation.createCorporation(corpName, true);
        ns.tprint(`Created Corporation: ${corpName}`);
    }

    // Create Division
    const corp = ns.corporation.getCorporation();
    if (!corp.divisions.some(d => d.name === divisionName)) {
        ns.corporation.expandIndustry(industry, divisionName);
        ns.tprint(`Created Division: ${divisionName}`);
    }

    // Expand to Sector-12
    const division = ns.corporation.getDivision(divisionName);
    if (!division.cities.includes(city)) {
        ns.corporation.expandCity(divisionName, city);
        ns.tprint(`Expanded to city: ${city}`);
    }

    // Hire 3 employees
    const office = ns.corporation.getOffice(divisionName, city);
    const toHire = 3 - office.employees.length;
    for (let i = 0; i < toHire; i++) {
        ns.corporation.hireEmployee(divisionName, city);
    }

    // Assign jobs
    ns.corporation.setAutoJobAssignment(divisionName, city, "Operations", 1);
    ns.corporation.setAutoJobAssignment(divisionName, city, "Engineer", 1);
    ns.corporation.setAutoJobAssignment(divisionName, city, "Business", 1);

    ns.tprint("Basic setup complete.");
}
