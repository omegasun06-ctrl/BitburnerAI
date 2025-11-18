/** @param {NS} ns */
export async function main(ns) { 
  
  const divisions = ["Agriculture" ]//, "Chemical", "Tobacco"];
  const cities = ["Aevum", "Chongqing", "Sector-12", "New Tokyo", "Ishima", "Volhaven"];

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

      }
   }
}