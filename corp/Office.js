/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog("ALL"); // Disable spammy logs
  ns.clearLog(); // Clear log on each run

  const divisions = ["Agriculture" ]//, "Chemical", "Tobacco"];
  const cities = ["Aevum", "Chongqing", "Sector-12", "New Tokyo", "Ishima", "Volhaven"];
  const productCap = 3;

  while (true) {
    for (const division of divisions) {
      ns.print(`Managing division: ${division}`);

      for (const city of cities) {
        ns.print(`  City: ${city}`);

        const divInfo = ns.corporation.getDivision(division);

        // Always enable Smart Supply
        ns.corporation.setSmartSupply(division, city, true);
        ns.print(`    Smart Supply enabled`);

        // Warehouse management
        const warehouse = ns.corporation.getWarehouse(division, city);
        const usage = warehouse.sizeUsed / warehouse.size;
        if (usage > 0.9) {
          ns.print(`    Upgrading warehouse (usage: ${(usage * 100).toFixed(1)}%)`);
          ns.corporation.upgradeWarehouse(division, city);
        }

        // Office management
        const office = ns.corporation.getOffice(division, city);
        ns.print(office.size)
        if (office.size < 4) {
          ns.print(`    Upgrading office to size 4`);
          ns.corporation.upgradeOfficeSize(division, city, 4 - office.size);
        } else if (office.size < 8) {
          ns.print(`    Upgrading office to size 8`);
          ns.corporation.upgradeOfficeSize(division, city, 8 - office.size);
        }

        // Hire employees

        if (office?.employees && Array.isArray(office.employees)) {
          while (office.employees.length < office.size) {
            ns.corporation.hireEmployee(division, city);
            ns.print(`    Hired employee`);
          }
        } else {
          ns.print(`    Warning: office.employees is undefined in ${division} - ${city}`);
        }



        // Reset all job assignments to 0
        const roles = ["Operations", "Engineer", "Management", "Business", "Research & Development"];
        for (const role of roles) {
          ns.corporation.setAutoJobAssignment(division, city, role, 0);
        }

        // Assign based on total office size
        const total = office.size;
        const ops = Math.floor(total / 3);
        const eng = Math.floor(total / 3);
        const mgmt = total - ops - eng;

        ns.corporation.setAutoJobAssignment(division, city, "Operations", ops);
        ns.corporation.setAutoJobAssignment(division, city, "Engineer", eng);
        ns.corporation.setAutoJobAssignment(division, city, "Management", mgmt);

        ns.print(`    Assigned ${ops} Ops, ${eng} Eng, ${mgmt} Mgmt`);




        // Product logic only if division makes products
        if (divInfo.makesProducts) {
          const products = divInfo.products;
          if (products.length < productCap) {
            const name = `${division}-Product-${Date.now()}`;
            const funds = ns.corporation.getCorporation().funds;
            const invest = funds * 0.1;
            ns.print(`    Creating product: ${name}`);
            ns.corporation.makeProduct(division, city, name, invest, invest);
          }

          for (const product of products) {
            if (ns.corporation.hasResearched(division, "Market-TA.II")) {
              ns.corporation.setProductMarketTA2(division, product, true);
              ns.print(`    Applied Market-TA II to ${product}`);
            }
          }
        }
      }

      // Research upgrades
      const researchNames = ns.corporation.getConstants().researchNames;
      const upgrades = [
        researchNames["Market-TA.I"],
        researchNames["Market-TA.II"],
        researchNames["Capacity.I"],
        researchNames["Capacity.II"],
        researchNames["Self-Correcting Assemblers"]
      ];

      for (const upgrade of upgrades) {
        if (upgrade && !ns.corporation.hasResearched(division, upgrade)) {
          try {
            ns.corporation.research(division, upgrade);
            ns.print(`  Researched: ${upgrade}`);
          } catch (err) {
            ns.print(`  Failed to research ${upgrade}: ${err}`);
          }
        }
      }
    }

    await ns.sleep(6000);
  }
}
