/** @param {NS} ns **/
export async function main(ns) {
  const division = "Agriculture";
  const industry = "Agriculture";
  const cities = ["Sector-12", "Aevum", "Volhaven", "Chongqing", "New Tokyo", "Ishima"];
  const boostMaterials = [
    { name: "Hardware", rate: 5 },
    { name: "AI Cores", rate: 5 },
    { name: "Real Estate", rate: 270 }
  ];

  // Create Corporation and Division
  if (!ns.corporation.hasCorporation()) {
    ns.corporation.createCorporation("MyComp", true);
    ns.tprint("Corporation created.");
  }

  const corp = ns.corporation.getCorporation();
  if (!corp.divisions.some(d => d.name === division)) {
    ns.corporation.expandIndustry(industry, division);
    ns.tprint("Agriculture division created.");
  }

  // Expand to cities and buy warehouses
  for (const city of cities) {
    if (!ns.corporation.getDivision(division).cities.includes(city)) {
      ns.corporation.expandCity(division, city);
      ns.tprint(`Expanded to ${city}`);
    }

    if (!ns.corporation.hasWarehouse(division, city)) {
      ns.corporation.purchaseWarehouse(division, city);
      ns.tprint(`Warehouse purchased in ${city}`);
    }

    // Upgrade office size to 4
    const office = ns.corporation.getOffice(division, city);
    if (office.size < 4) {
      ns.corporation.upgradeOfficeSize(division, city, 1);
      ns.tprint(`Upgraded office size to 4 in ${city}`);
    }

    // Hire employees if needed
    while (ns.corporation.getOffice(division, city).employees.length < 4) {
      ns.corporation.hireEmployee(division, city);
    }

    // Assign all to R&D
    ns.corporation.setAutoJobAssignment(division, city, "Research & Development", 4);
  }

  // Wait until RP ≥ 55
  while (ns.corporation.getDivision(division).researchPoints < 55) {
    await ns.sleep(5000);
  }
  ns.tprint("Reached 55 Research Points.");

  // Ensure max morale and energy before switching roles
  for (const city of cities) {
    const office = ns.corporation.getOffice(division, city);
    const allGood = office.employeeProduction.every(emp =>
      emp.energy === 100 && emp.morale === 100
    );
    if (!allGood) {
      ns.tprint(`Waiting for morale/energy in ${city}...`);
      while (!office.employeeProduction.every(emp => emp.energy === 100 && emp.morale === 100)) {
        await ns.sleep(5000);
      }
    }

    // Reassign roles
    ns.corporation.setAutoJobAssignment(division, city, "Operations", 1);
    ns.corporation.setAutoJobAssignment(division, city, "Engineer", 1);
    ns.corporation.setAutoJobAssignment(division, city, "Business", 1);
    ns.corporation.setAutoJobAssignment(division, city, "Management", 1);
    ns.tprint(`Roles reassigned in ${city}`);
  }

  // Custom Smart Supply logic (skip Smart Supply unlock)
  for (const city of cities) {
    for (const mat of boostMaterials) {
      ns.corporation.buyMaterial(division, city, mat.name, mat.rate);
    }
  }

  // Wait 10 seconds then stop buying
  await ns.sleep(10000);
  for (const city of cities) {
    for (const mat of boostMaterials) {
      ns.corporation.buyMaterial(division, city, mat.name, 0);
    }
  }

  // Buy Smart Storage upgrade
  if (ns.corporation.getUpgradeLevel("Smart Storage") < 1) {
    ns.corporation.levelUpgrade("Smart Storage");
    ns.tprint("Smart Storage upgraded.");
  }

  // Buy 2 AdVert levels
  for (let i = 0; i < 2; i++) {
    ns.corporation.levelUpgrade("Advert.Inc");
    ns.tprint(`AdVert level ${i + 1} purchased.`);
  }

  ns.tprint("✅ Round 1 setup complete.");
}
