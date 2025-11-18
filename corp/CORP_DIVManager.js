// division-manager.js
/** @param {NS} ns **/
export async function main(ns) {
  const divisionName = ns.args[0];
  const corp = ns.corporation.getCorporation();
  const division = ns.corporation.getDivision(divisionName);
  const cities = ["Aevum", "Chongqing", "Sector-12", "New Tokyo", "Ishima", "Volhaven"];

  // Buy Smart Supply
  if (!division.smartSupplyEnabled && corp.funds > 100e6) {
    ns.tprint("Enabling Smart Supply...");
    if (!ns.corporation.hasUnlock("Smart Supply")) { ns.corporation.purchaseUnlock("Smart Supply") }
    for (const city of cities) {
      let c = city;
      ns.print(cities)
      ns.print(c)
    ns.corporation.setSmartSupply(divisionName, c, true);
  }}

  // Expand to cities and buy warehouses
  for (const city of cities) {
    if (!division.cities.includes(city)) {
      ns.tprint(`Expanding to ${city}...`);
      ns.corporation.expandCity(divisionName, city);
    }

    const warehouse = ns.corporation.getWarehouse(divisionName, city);
    if (!warehouse) {
      ns.tprint(`Buying warehouse in ${city}...`);
      ns.corporation.purchaseWarehouse(divisionName, city);
    }
  }

  // Upgrade offices and assign employees
  for (const city of cities) {
    const office = ns.corporation.getOffice(divisionName, city);
    if (office.size < 4) {
      ns.tprint(`Upgrading office in ${city} to size 4...`);
      ns.corporation.upgradeOfficeSize(divisionName, city, 4 - office.size);
    }

    const roles = ["Operations", "Engineer", "Business", "Management"];
    for (let i = 0; i < roles.length; i++) {
      ns.corporation.hireEmployee(divisionName, city);
    }
//need to handle if no unassigned employees
    //ns.corporation.setAutoJobAssignment(divisionName, city, "Operations", 1);
    //ns.corporation.setAutoJobAssignment(divisionName, city, "Engineer", 1);
   // ns.corporation.setAutoJobAssignment(divisionName, city, "Business", 1);
   // ns.corporation.setAutoJobAssignment(divisionName, city, "Management", 1);
  }
   ns.run("/corp/CORP_WHManager.js", 1, divisionName);
}
