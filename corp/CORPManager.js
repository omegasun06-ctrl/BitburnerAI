// Requires WarehouseAPI and OfficeAPI
import { formatMoney, getCities } from '/extendedUtils.js';
/**
 *
 * @param {NS} ns
 * @returns {Promise<void>}
 */
export async function main(ns) {
  ns.disableLog('sleep');
  const unlocked = ns.singularity.getOwnedSourceFiles().some(s => s.n === 3 && s.lvl === 3);
  if (!unlocked && !ns.corporation.hasUnlockUpgrade('Warehouse API')) throw new Error(`This script requires the Warehouse API`);
  if (!unlocked && !ns.corporation.hasUnlockUpgrade('Office API')) throw new Error(`This script requires the Office API`);
  // Set up

  const corp = ns.corporation;
  const cities = getCities();
  const jobs = getJobs();
  const division1 = 'Agriculture';
  const division2 = 'Chemical';
  const division3 = 'Tobacco';

  // Create corporation if not exists
  if (!corp.hasCorporation()) {
    ns.tprint("Creating new corporation...");
    corp.createCorporation("myCorp", false);
  } else {
    ns.tprint("Corporation already exists.");
  }


  // Run setup only if divisions are missing


  const existingDivisions = ns.corporation.getCorporation().divisions.filter(name => {
    try {
      return ns.corporation.getDivision(name) !== null;
    } catch {
      return false;
    }
  });
  ns.tprint(`Existing divisions: ${JSON.stringify(existingDivisions)}`);

  if (!existingDivisions.includes(division1)) {
    await part1(ns, cities, jobs, division1);
  }
  if (!existingDivisions.includes(division2)) {
    await part2(ns, cities, jobs, division1);
  }
  if (!existingDivisions.includes(division3)) {
  await part3(ns, cities, jobs, division2);
   }
  if (!existingDivisions.includes(division3)) {
    //  await part4(ns, cities, jobs, division3);
  }
  // Always run autopilot for product division
  // await autopilot(ns, cities, jobs, division3, [division1, division2]);
}

/**
 *
 * @param {NS} ns
 * @param {string[]} cities
 * @param {Object<string>} jobs
 * @param {string} division
 * @returns {Promise<void>}
 */
/** @param {NS} ns **/
export async function part1(ns, cities, jobs, division) {
  ns.tprint("STARTING CORP PART 1");
  const corp = ns.corporation;
  // Check if division exists
  ns.tprint ("STEP 1: Create Division")
  let divisionExists = false;
  try {
    corp.getDivision(division);
    divisionExists = true;
    ns.tprint(`Division '${division}' already exists.`);
  } catch {
    await expandIndustry(ns, 'Agriculture', division);
    ns.tprint(`Division '${division}' created.`);
  }

  // Unlock Smart Supply if not already unlocked
  ns.tprint ("STEP 2: Unlock Smart Supply")
  const smartSupplyUnlocked = corp.hasUnlock("Smart Supply") || await unlockUpgrade(ns, "Smart Supply");

  // Expand to cities and configure
  ns.tprint ("STEP 3: Expand Division")
  for (let city of cities) {
    const divisionData = corp.getDivision(division);
    //ns.tprint(!divisionData.cities.includes(city))
    if (!divisionData.cities.includes(city)) {
      await expandCity(ns, division, city);
      ns.print(`Expanded to ${city}`);
    }

    // Purchase warehouse if not already present
    let warehouseExists = true;
    try {
      corp.getWarehouse(division, city);
    } catch {
      warehouseExists = false;
    }
    if (!warehouseExists) {
      await purchaseWarehouse(ns, division, city);
      ns.print(`Warehouse purchased in ${city}`);
    }
  
    // Enable Smart Supply if unlocked
    if (smartSupplyUnlocked) {
      corp.setSmartSupply(division, city, true);
      ns.print(`Smart Supply enabled for ${division} (${city})`);
    }
  }
    // Upgrade office to size 4 and assign jobs
    ns.tprint ("STEP 3: Expand Office")
    for (let city of cities) {

      const office = ns.corporation.getOffice(division, city);

      // Upgrade office to size 4 if needed

      if (office.size < 4) {
        const upgradeAmount = 4 - office.size;
        const cost = ns.corporation.getOfficeSizeUpgradeCost(division, city, upgradeAmount);

        if (ns.corporation.getCorporation().funds < cost) {
          ns.print(`💰 Waiting for funds to upgrade office in ${city} (need \$${ns.formatNumber(cost)})`);
          await moneyFor(ns, cost);
        }

        ns.print(`🏢 Upgrading office in ${city} to size 4 (cost: \$${ns.formatNumber(cost)})`);
        ns.corporation.upgradeOfficeSize(division, city, upgradeAmount);
      }


      // Refresh office after upgrade
      let updatedOffice = ns.corporation.getOffice(division, city);

      // Hire employees until office is full
      let hireAttempts = 0;
      while (
        (!updatedOffice.employees || updatedOffice.employees.length < updatedOffice.size) &&
        hireAttempts < updatedOffice.size
      ) {
        const hired = ns.corporation.hireEmployee(division, city);
        if (!hired) {
          ns.print(`Warning: Failed to hire employee in ${city}`);
          break;
        }
        ns.print(`Hired employee in ${city}`);
        hireAttempts++;
        updatedOffice = ns.corporation.getOffice(division, city); // refresh after hire
      }

      // Reset all job assignments to 0
      const roles = ["Operations", "Engineer", "Management", "Business", "Research & Development"];
      for (const role of roles) {
        ns.corporation.setAutoJobAssignment(division, city, role, 0);
      }

      // Assign 1 employee to each role (except R&D)
      ns.corporation.setAutoJobAssignment(division, city, "Operations", 1);
      ns.corporation.setAutoJobAssignment(division, city, "Engineer", 1);
      ns.corporation.setAutoJobAssignment(division, city, "Management", 1);
      ns.corporation.setAutoJobAssignment(division, city, "Business", 1);

      ns.print(`Assigned employees in ${city}`);
    

    // Start selling materials
    corp.sellMaterial(division, city, 'Food', 'MAX', 'MP');
    corp.sellMaterial(division, city, 'Plants', 'MAX', 'MP');
    ns.print(`Selling Food and Plants in ${city}`);



    const hasMarketTA1 = corp.hasResearched(division, "Market-TA.I");
    const hasMarketTA2 = corp.hasResearched(division, "Market-TA.II");

    if (smartSupplyUnlocked) {
      if (hasMarketTA1) {
        corp.setMaterialMarketTA1(division, city, 'Food', true);
        corp.setMaterialMarketTA1(division, city, 'Plants', true);
      }

      if (hasMarketTA2) {
        corp.setMaterialMarketTA2(division, city, 'Food', true);
        corp.setMaterialMarketTA2(division, city, 'Plants', true);
      }



      ns.print(`Market-TA settings applied in ${city} (TA1: ${hasMarketTA1}, TA2: ${hasMarketTA2})`);
    }

  }
ns.tprint ("STEP 5: Hire Advert")
  // Hire AdVert if not already at level 1
  const adVertCount = corp.getHireAdVertCount(division);
  if (adVertCount < 1) {
    await hireAdVertUpto(ns, division, 1);
    ns.print(`AdVert hired for ${division}`);
  } else {
    ns.print(`AdVert already hired for ${division}`);
  }
  ns.toast("CORP PHASE 1 FINISHED");
}

/**
 *
 * @param {NS} ns
 * @param {string[]} cities
 * @param {Object<string>} jobs
 * @param {string }division
 * @returns {Promise<void>}
 */
/** @param {NS} ns **/
export async function part2(ns, cities, jobs, division) {
  ns.tprint("STARTING CORP PART 2");
  const corp = ns.corporation;

  // Step 1: Upgrade employee productivity
  ns.tprint("Step 1: Upgrade employee productivity");
  const upgrades = [
    { name: 'FocusWires', level: 2 },
    { name: 'Neural Accelerators', level: 2 },
    { name: 'Speech Processor Implants', level: 2 },
    { name: 'Nuoptimal Nootropic Injector Implants', level: 2 },
    { name: 'Smart Factories', level: 2 }
  ];
  await upgradeUpto(ns, upgrades);
 ns.tprint("Step 2: Upgrade warehouses to level 3")
  for (let city of cities) {
    await upgradeWarehouseUpto(ns, division, city, 3);
  }
  // Step 3: Initial production boost
  let level = ns.corporation.getUpgradeLevel("Smart Storage");

  let materials = [ 
    { name: 'Hardware', qty: 100+100*(level/10) },
    { name: 'AI Cores', qty: 150+150*(level/10) },
    { name: 'Real Estate', qty: 8500+8500*(level/10) },
    { name: 'Robots', qty: 22+22*(level/10) }
  ];

  ns.tprint("Step 3: Initial production boost");
  for (let city of cities) {
    await buyMaterialsUpto(ns, division, city, materials);
  }

  // Step 3: Wait for investment offer of $210b (round 1)
  const base1 = 201e9
  const adjbase1 = base1 * ns.getBitNodeMultipliers().CorporationValuation;
  ns.tprint(`Step 4: Wait for adjsuted investment offer of ${adjbase1/1000000000}b (round 1 - 210 base)`);
  await investmentOffer(ns, adjbase1, 1);

  // Step 4: Upgrade office to size 9 and assign jobs
  ns.tprint("Step 5: Upgrade office to size 9 and assign jobs");
  for (let city of cities) {
    const positions = [
      { job: "Operations", num: 2 },
      { job: "Engineer", num: 2 },
      { job: "Business", num: 1 },
      { job: "Management", num: 2 },
      { job: "Research & Development", num: 2 }
    ];
    await upgradeOffice(ns, division, city, 9, positions);
  }

  // Step 5: Upgrade factories and storage
  ns.tprint("Step 5: Upgrade factories and storage")
  let factoryUpgrades = [
    { name: 'Smart Factories', level: 5 },
    { name: 'Smart Storage', level: 5 }
  ];
  await upgradeUpto(ns, factoryUpgrades);

  // Step 6: Upgrade warehouses to level 12
  ns.tprint("Step 6: Upgrade warehouses to level 12")
  for (let city of cities) {
    await upgradeWarehouseUpto(ns, division, city, 12);
  }
   // Step 5: Upgrade factories and storage
  factoryUpgrades = [
    { name: 'Smart Factories', level: 15 },
    { name: 'Smart Storage', level: 15 }
  ];
  await upgradeUpto(ns, factoryUpgrades);

  level = ns.corporation.getUpgradeLevel("Smart Storage");
  materials = [ 
    { name: 'Hardware', qty: 100+100*(level/10) },
    { name: 'AI Cores', qty: 150+150*(level/10) },
    { name: 'Real Estate', qty: 8500+8500*(level/10) },
    { name: 'Robots', qty: 22+22*(level/10) }
  ];
  // Step 7: Second production boost
  ns.tprint("Step 7: Second production boost")
  for (let city of cities) {
    await buyMaterialsUpto(ns, division, city, materials);
  }

  // Step 8: Wait for investment offer of $5t (round 2)
  ns.tprint("Step 8: Wait for investment offer of $3t (round 2)")
  await investmentOffer(ns, 3e12, 2);

  // Step 9: Unlock Export
  ns.tprint("Step 9: Unlock Export")
  const exportUnlocked = corp.hasUnlock("Export") || await unlockUpgrade(ns, "Export");

  // Step 10: Upgrade warehouses to level 19
  ns.tprint("Step 10: Upgrade warehouses to level 24")
  for (let city of cities) {
    await upgradeWarehouseUpto(ns, division, city, 24);
  }

  // Step 11: Final production boost
  ns.tprint("// Step 11: Final production boost")
  for (let city of cities) {
    await buyMaterialsUpto(ns, division, city, materials);
  }
  ns.toast("CORP STAGE 2 FINISHED");
}


/**
 *
 * @param {NS} ns
 * @param {string[]} cities
 * @param {Object<string>} jobs
 * @param {string} division
 * @param {string} mainCity
 * @returns {Promise<void>}
 */
export async function part3(ns, cities, jobs, division) {
  ns.tprint("STARTING CORP PART 3");
  const materials = [
    { name: 'Hardware', qty: 400 },
    { name: 'AI Cores', qty: 150 },
    { name: 'Real Estate', qty: 15000 },
    { name: 'Robots', qty: 150 }
  ];
  const corp = ns.corporation;
  // Expand into Chemical industry
  ns.tprint(`STEP 1: Create Chemical division`);
  await expandIndustry(ns, 'Chemical', division);

  // Expand to cities and configure
  ns.tprint(`STEP 2: Expanded Cities, Warehouse, and Office`);
  for (let city of cities) {
    const divisionData = corp.getDivision(division);


    // Expand to city if not already present
    if (!divisionData.cities.includes(city)) {
      ns.tprint(`Expanded to ${city}`);
      await expandCity(ns, division, city);
    }

    // Purchase warehouse if not already present
    let warehouseExists = true;
    try {
      corp.getWarehouse(division, city);
    } catch {
      warehouseExists = false;
    }
    if (!warehouseExists) {
      await purchaseWarehouse(ns, division, city);
      ns.tprint(`Warehouse purchased in ${city}`);
    }

    // Enable Smart Supply if unlocked
    corp.setSmartSupply(division, city, true);
    //ns.tprint(`Smart Supply enabled for ${division} (${city})`);

    // Upgrade office to size 4 and assign jobs
    const office = corp.getOffice(division, city);

    if (office.size < 4) {
      const upgradeAmount = 4 - office.size;
      const cost = ns.corporation.getOfficeSizeUpgradeCost(division, city, upgradeAmount);

      if (ns.corporation.getCorporation().funds < cost) {
        ns.tprint(`💰 Waiting for funds to upgrade office in ${city} (need \$${ns.formatNumber(cost)})`);
        await moneyFor(ns, cost);
      }

      ns.tprint(`🏢 Upgrading office in ${city} to size 4 (cost: \$${ns.formatNumber(cost)})`);
      ns.corporation.upgradeOfficeSize(division, city, upgradeAmount);
    }

      // Refresh office after upgrade
      let updatedOffice = corp.getOffice(division, city);

      // Hire employees until office is full
      let hireAttempts = 0;
      while (
        (!updatedOffice.employees || updatedOffice.employees.length < updatedOffice.size) &&
        hireAttempts < updatedOffice.size
      ) {
        const hired = corp.hireEmployee(division, city);
        if (!hired) {
          ns.print(`Warning: Failed to hire employee in ${city}`);
          break;
        }
        ns.tprint(`Hired employee in ${city}`);
        hireAttempts++;
        updatedOffice = corp.getOffice(division, city); // refresh after hire
      }

      // Reset all job assignments to 0
      const roles = ["Operations", "Engineer", "Management", "Business", "Research & Development"];
      for (const role of roles) {
        corp.setAutoJobAssignment(division, city, role, 0);
      }

      // Assign 1 employee to each role (except R&D)
      corp.setAutoJobAssignment(division, city, "Operations", 1);
      corp.setAutoJobAssignment(division, city, "Engineer", 1);
      corp.setAutoJobAssignment(division, city, "Management", 1);
      corp.setAutoJobAssignment(division, city, "Business", 1);

      ns.tprint(`Assigned employees in ${city}`);

      // Always cancel existing exports before setting new ones
      try {
        corp.cancelExportMaterial(division, city, "Agriculture", city, "Chemicals");
        ns.print(`🧹 Canceled existing Chemicals export from ${division} to Agriculture in ${city}`);
      } catch (e) {
        ns.print(`ℹ️ No existing Chemicals export to cancel in ${city}`);
      }

      try {
        corp.cancelExportMaterial("Agriculture", city, division, city, "Plants");
        ns.print(`🧹 Canceled existing Plants export from Agriculture to ${division} in ${city}`);
      } catch (e) {
        ns.print(`ℹ️ No existing Plants export to cancel in ${city}`);
      }

      // Set up new exports
      corp.exportMaterial(division, city, "Agriculture", city, "Chemicals", "-1*IPROD");
      corp.exportMaterial("Agriculture", city, division, city, "Plants", "-1*IPROD");
      ns.tprint(`✅ Exporting Chemicals from ${division} to Agriculture and Plants back in ${city}`);


      // Upgrade warehouse to level 2
      const warehouse = corp.getWarehouse(division, city);
      if (warehouse.level < 2) {
        await upgradeWarehouseUpto(ns, division, city, 2);
        ns.tprint(`Warehouse upgraded to level 2 in ${city}`);
      }

      // Apply Market-TA settings if researched
      const hasMarketTA1 = corp.hasResearched(division, "Market-TA.I");
      const hasMarketTA2 = corp.hasResearched(division, "Market-TA.II");


      if (hasMarketTA1) {
        corp.setMaterialMarketTA1(division, city, "Chemicals", true);
      }

      if (hasMarketTA2) {
        corp.setMaterialMarketTA2(division, city, "Chemicals", true);
      }

      ns.print(`Market-TA settings applied in ${city} (TA1: ${hasMarketTA1}, TA2: ${hasMarketTA2})`);
    }
    ns.tprint("// Step X: production boost")
    for (let city of cities) {
      await buyMaterialsUpto(ns, division, city, materials);
    }

    ns.toast("CORP STAGE 3 FINISHED");
    ns.tprint("PART 3 COMPLETE")
  }

  /**
   * @param {NS} ns
   * @param {string[]} cities
   * @param {Object<string>} jobs
   * @param {string} division
   * @param {string} mainCity
   * @returns {Promise<void>}
   */
  export async function part4(ns, cities, jobs, division, mainCity = 'Aevum') {
    // Expand into Software industry
    await expandIndustry(ns, 'Tobacco', division);
    for (let city of cities) {
      await expandCity(ns, division, city);
      await purchaseWarehouse(ns, division, city);
      const positions = city === mainCity
        ? [
          { job: jobs.operations, num: 6 },
          { job: jobs.engineer, num: 6 },
          { job: jobs.business, num: 6 },
          { job: jobs.management, num: 6 },
          { job: jobs.RAndD, num: 6 }
        ]
        : [
          { job: jobs.operations, num: 2 },
          { job: jobs.engineer, num: 2 },
          { job: jobs.business, num: 1 },
          { job: jobs.management, num: 2 },
          { job: jobs.RAndD, num: 2 }
        ];
      await upgradeOffice(ns, division, city, city === mainCity ? 30 : 9, positions);
    }

    // Start making Software v1
    if (getLatestVersion(ns, division) === 0)
      await makeProduct(ns, division, mainCity, 'Software v1', 1e9, 1e9);

    // Set up exports from suppliers
    const corp = ns.corporation;
    const suppliers = ['Agriculture', 'Chemical'];
    const materialsToExport = ['Food', 'Plants', 'Chemicals', 'Water']; // Adjust as needed

    for (const supplier of suppliers) {
      for (const city of cities) {
        for (const material of materialsToExport) {
          if (corp.hasWarehouse(supplier, city)) {
            try {
              corp.exportMaterial(supplier, city, division, city, material, 'MAX');
              ns.print(`Exporting ${material} from ${supplier} (${city}) to ${division} (${city})`);
            } catch (e) {
              ns.print(`Failed to export ${material} from ${supplier} (${city}): ${e}`);
            }
          }
        }
      }
    }

  }

  /**
   *
   * @param {NS} ns
   * @param {string[]} cities
   * @param {Object<string>} jobs
   * @param {string} division
   * @param {string} mainCity
   * @returns {Promise<void>}
   */
  export async function autopilot(ns, cities, jobs, division, suppliers = [], mainCity = 'Aevum') {

    const corp = ns.corporation;
    const upgrades = getResearch();
    const minResearch = 50e3;
    let maxProducts = 3;
    if (corp.hasResearched(division, upgrades.capacity1)) maxProducts++;
    if (corp.hasResearched(division, upgrades.capacity2)) maxProducts++;
    // Get latest version
    let version = getLatestVersion(ns, division);
    // noinspection InfiniteLoopJS
    while (true) {
      if (corp.getProduct(division, mainCity, 'Tobacco V' + version).developmentProgress >= 100) {
        // Start selling the developed version
        corp.sellProduct(division, mainCity, 'Tobacco V' + version, 'MAX', 'MP*' + (2 ** (version - 1)), true);
        // Set Market TA II if researched
        if (corp.hasResearched(division, upgrades.market2)) corp.setProductMarketTA2(division, 'Tobacco V' + version, true);
        // Discontinue earliest version
        if (corp.getDivision(division).products.length === maxProducts) corp.discontinueProduct(division, 'Tobacco V' + getEarliestVersion(ns, division));
        // Start making new version
        await makeProduct(ns, division, mainCity, 'Tobacco V' + (version + 1), 1e9 * 2 ** version, 1e9 * 2 ** version);
        // Update current version
        version++;
      }
      // Use hashes to boost research
      if (ns.hacknet.numHashes() >= ns.hacknet.hashCost('Exchange for Corporation Research') &&
        corp.getDivision(division).research < 3 * minResearch) ns.hacknet.spendHashes('Exchange for Corporation Research');
      // Check research progress for lab
      if (!corp.hasResearched(division, upgrades.lab) &&
        corp.getDivision(division).research - corp.getResearchCost(division, upgrades.lab) >= minResearch) {
        corp.research(division, upgrades.lab);
      }
      // Check research progress for Market TAs
      let researchCost = 0;
      if (!corp.hasResearched(division, upgrades.market1)) researchCost += corp.getResearchCost(division, upgrades.market1);
      if (!corp.hasResearched(division, upgrades.market2)) researchCost += corp.getResearchCost(division, upgrades.market2);
      if (corp.hasResearched(division, upgrades.lab) && researchCost > 0 &&
        corp.getDivision(division).research - researchCost >= minResearch) {
        if (!corp.hasResearched(division, upgrades.market1)) corp.research(division, upgrades.market1);
        if (!corp.hasResearched(division, upgrades.market2)) {
          corp.research(division, upgrades.market2);
          // Set Market TA II on for the current selling versions
          for (const product of corp.getDivision(division).products) corp.setProductMarketTA2(division, product, true);
        }
      }
      // Check research progress for Fulcrum
      if (corp.hasResearched(division, upgrades.market2) && !corp.hasResearched(division, upgrades.fulcrum) &&
        corp.getDivision(division).research - corp.getResearchCost(division, upgrades.fulcrum) >= minResearch) {
        corp.research(division, upgrades.fulcrum);
      }
      // Check research progress for Capacity I
      if (corp.hasResearched(division, upgrades.fulcrum) && !corp.hasResearched(division, upgrades.capacity1) &&
        corp.getDivision(division).research - corp.getResearchCost(division, upgrades.capacity1) >= minResearch) {
        corp.research(division, upgrades.capacity1);
        maxProducts++;
      }
      // Check research progress for Capacity II
      if (corp.hasResearched(division, upgrades.capacity1) && !corp.hasResearched(division, upgrades.capacity2) &&
        corp.getDivision(division).research - corp.getResearchCost(division, upgrades.capacity2) >= minResearch) {
        corp.research(division, upgrades.capacity2);
        maxProducts++;
      }
      // Check what is cheaper
      if (corp.getOfficeSizeUpgradeCost(division, mainCity, 15) < corp.getHireAdVertCost(division)) {
        // Upgrade office size in Aevum
        if (corp.getCorporation().funds >= corp.getOfficeSizeUpgradeCost(division, mainCity, 15)) {
          corp.upgradeOfficeSize(division, mainCity, 15);
          hireMaxEmployees(ns, division, mainCity);
          // Assign jobs
          const dist = Math.floor(corp.getOffice(division, mainCity).size / Object.keys(jobs).length);
          for (let job of Object.values(jobs)) {
            await corp.setAutoJobAssignment(division, mainCity, job, dist);
          }
        }
      }
      // Hire advert
      else if (corp.getCorporation().funds >= corp.getHireAdVertCost(division)) corp.hireAdVert(division);
      // Level upgrades
      levelUpgrades(ns, 0.1);
      // Go public
      if (corp.getCorporation().revenue >= 1e18) corp.goPublic(0);
      // If public
      if (corp.getCorporation().public) {
        // Sell a small amount of shares when they amount to more cash than we have on hand
        if (corp.getCorporation().shareSaleCooldown <= 0 &&
          corp.getCorporation().sharePrice * 1e6 > ns.getPlayer().money) corp.sellShares(1e6);
        // Buyback shares when we can
        else if (corp.getCorporation().issuedShares > 0 &&
          ns.getPlayer().money > 2 * corp.getCorporation().issuedShares * corp.getCorporation().sharePrice)
          corp.buyBackShares(corp.getCorporation().issuedShares);

        // Unlock Shady Accounting (cost: 500e9) and goverment Partnership

        const unlockCosts = {
          "Shady Accounting": 500e9,
          "Government Partnership": 1e12
        };

        for (const [name, cost] of Object.entries(unlockCosts)) {
          if (corp.getCorporation().funds >= cost) {
            try {
              corp.unlockUpgrade(name);
              ns.print(`🔓 Unlocked upgrade: ${name}`);
            } catch (err) {
              // Already unlocked or failed
              ns.print(`ℹ️ Upgrade already unlocked or failed: ${name}`);
            }
          }
        }



        // Issue dividends
        corp.issueDividends(dividendsPercentage(ns));
      }
      // Update every second
      ns.print(`Main Loop Wait`);
      await ns.sleep(1000);
    }
  }

  /**
   * Function to level the cheapest upgrade if under a certain percentage of the corp funds
   *
   * @param {NS} ns
   * @param {number} percent
   */
  function levelUpgrades(ns, percent) {
    const corp = ns.corporation;
    let cheapestCost = Infinity;
    let cheapestUpgrade;
    for (const upgrade of getUpgrades()) {
      const cost = corp.getUpgradeLevelCost(upgrade);
      if (cost < cheapestCost) {
        cheapestUpgrade = upgrade;
        cheapestCost = cost;
      }
    }
    if (percent * corp.getCorporation().funds >= cheapestCost) corp.levelUpgrade(cheapestUpgrade);
  }

  /**
   * Function to return a list of upgrades
   *
   * @return {string[]}
   */
  function getUpgrades() {
    return [
      'Smart Factories',
      'Smart Storage',
      'DreamSense',
      'Wilson Analytics',
      'Nuoptimal Nootropic Injector Implants',
      'Speech Processor Implants',
      'Neural Accelerators',
      'FocusWires',
      'ABC SalesBots',
      'Project Insight'
    ];
  }

  /**
   *
   * @param {NS} ns
   * @returns {number}
   */
  function dividendsPercentage(ns) {
    return Math.max(0, Math.min(0.99, Math.log(ns.corporation.getCorporation().revenue) / (20 * Math.log(1000))));
  }

  /**
   *
   * @returns {Object<string>} Jobs
   */
  function getJobs() {
    return {
      operations: 'Operations',
      engineer: 'Engineer',
      business: 'Business',
      management: 'Management',
      RAndD: 'Research & Development'
    };
  }


  /**
   * Function to wait for enough money
   *
   * @param {NS} ns
   * @param {function} func
   * @param {*[]} args
   * @returns {Promise<void>}
   */
  async function moneyFor(ns, funds) {
    while (funds > ns.corporation.getCorporation().funds) {
      ns.print(`Waiting for fund amount: ${funds}`);
      await ns.sleep(1000);
    }
  }

  /**
   * Function to wait for enough money
   *
   * @param {NS} ns
   * @param {number} amount
   * @returns {Promise<void>}
   */
  async function moneyForAmount(ns, amount) {
    while (amount > ns.corporation.getCorporation().funds) {
      ns.print(`Waiting for fund amount: ${amount}`);
      await ns.sleep(1000);
    }
  }

  /**
   * Function to hire employees up to office size
   *
   * @param {NS} ns
   * @param {string} division
   * @param {string} city
   */
  export async function hireMaxEmployees(ns, division, city) {
    const corp = ns.corporation;
    ns.print(`Hiring employees for ${division} (${city})`);

    const office = corp.getOffice(division, city);
    if (!office || !office.employees || typeof office.size !== 'number') {
      ns.print(`Office data not available or malformed for ${division} (${city})`);
      return;
    }

    while (office.employees.length < office.size) {
      corp.hireEmployee(division, city);
      // Refresh office data after hiring
      await ns.sleep(1); // Optional: allow game state to update
      const updatedOffice = corp.getOffice(division, city);
      if (!updatedOffice || !updatedOffice.employees) break;
      office.employees = updatedOffice.employees;
    }
  }

  /**
   * Function to upgrade list of upgrades upto a certain level
   *
   * @param {NS} ns
   * @param {Object<string, number>[]} upgrades
   * @returns {Promise<void>}
   */
  async function upgradeUpto(ns, upgrades) {
    const corp = ns.corporation;
    for (let upgrade of upgrades) {
      while (corp.getUpgradeLevel(upgrade.name) < upgrade.level) {
        await moneyFor(ns, corp.getUpgradeLevelCost, upgrade.name);
        corp.levelUpgrade(upgrade.name);
        ns.print(`Upgraded ${upgrade.name} to level ${corp.getUpgradeLevel(upgrade.name)}`);
      }
    }
  }

  /**
   * Function to buy materials upto a certain quantity
   *
   * @param {NS} ns
   * @param {string} division
   * @param {string} city
   * @param {Object<string, number>[]} materials
   * @returns {Promise<void>}
   */
  export async function buyMaterialsUpto(ns, division, city, materials) {
    const corp = ns.corporation;

    // Step 1: Disable Smart Supply temporarily
    const divisionData = corp.getDivision(division);
    const smartSupplyWasEnabled = divisionData.smartSupplyEnabled;

    // Step 2: Start buying materials
    for (const material of materials) {
      const mat = corp.getMaterial(division, city, material.name);
      const currentQty = mat?.stored ?? 0;
      const targetQty = material.qty * corp.getWarehouse(division, city).level;


      if (currentQty < targetQty * 0.95) {
        const rate = Math.max((targetQty - currentQty) / 10, 1);
        corp.buyMaterial(division, city, material.name, rate);
        corp.sellMaterial(division, city, material.name, 0, "MP");
        ns.print(`🛒 Buying ${material.name} in ${city} at rate ${rate.toFixed(2)} (current: ${currentQty}, target: ${targetQty})`);
      } else if (currentQty > targetQty * 1.05) {
        const rate = Math.max((currentQty - targetQty) / 10, 1);
        corp.sellMaterial(division, city, material.name, rate, "MP");
        corp.buyMaterial(division, city, material.name, 0);
        ns.print(`🛒 Selling ${material.name} in ${city} at rate ${rate.toFixed(2)} (current: ${currentQty}, target: ${targetQty})`);
      } else {
        corp.buyMaterial(division, city, material.name, 0);
        corp.sellMaterial(division, city, material.name, 0, "MP");
        ns.print(`✅ ${material.name} in ${city} is within target range (current: ${currentQty}, target: ${targetQty})`);
      }

    }

    // Step 3: Wait until each material reaches its target individually
    let ticks = 0;
    const completed = new Set();

    while (completed.size < materials.length) {
      for (const material of materials) {
        if (completed.has(material.name)) continue;

        const mat = corp.getMaterial(division, city, material.name);
        const currentQty = mat?.stored ?? 0;
        const targetQty = material.qty * corp.getWarehouse(division, city).level;

        ns.print(`🔍 ${material.name} in ${city}: ${currentQty.toFixed(2)} / ${targetQty}`);

        if (currentQty >= targetQty * 0.95 && currentQty <= targetQty * 1.05) {
          corp.buyMaterial(division, city, material.name, 0);
          corp.sellMaterial(division, city, material.name, 0, "MP");
          completed.add(material.name);
          ns.print(`✅ ${material.name} in ${city} reached target. Stopping transactions.`);
        }
      }

      ticks++; // ✅ This line prevents infinite loop

      if (ticks > 60000) {
        ns.print(`⚠️ Timeout: Adjusting materials in ${city} took too long. Stopping all transactions.`);
        for (const material of materials) {
          corp.buyMaterial(division, city, material.name, 0);
          corp.sellMaterial(division, city, material.name, 0, "MP");
        }
        break;
      }

      await ns.sleep(1000); // Optional: add delay to avoid CPU overload
    }
  }


  /**
   * Function to upgrade warehouse up to certain level
   *
   * @param {NS} ns
   * @param {string} division
   * @param {string} city
   * @param {number} level
   * @returns {Promise<void>}
   */
 export async function upgradeWarehouseUpto(ns, division, city, level) {
  const corp = ns.corporation;

  while (corp.getWarehouse(division, city).level < level) {
    const cost = corp.getUpgradeWarehouseCost(division, city);

    if (corp.getCorporation().funds < cost) {
      ns.print(`💰 Waiting for funds to upgrade warehouse in ${city} (need \$${ns.formatNumber(cost)})`);
      await moneyFor(ns, cost);
    }

    corp.upgradeWarehouse(division, city);
    const newLevel = corp.getWarehouse(division, city).level;
    ns.print(`📦 Upgraded warehouse in ${division} (${city}) to level ${newLevel}`);
  }
}


  /**
   * Function to hire AdVert up to certain level
   *
   * @param {NS} ns
   * @param {string} division
   * @param {number} level
   * @returns {Promise<void>}
   */
  async function hireAdVertUpto(ns, division, level) {
    const corp = ns.corporation;
    while (corp.getHireAdVertCount(division) < level) {
      await moneyFor(ns, corp.getHireAdVertCost, division);
      corp.hireAdVert(division);
      ns.print(`Hired AdVert in ${division} to level ${level}`);
    }
  }

  /**
   * Function to upgrade an office, hire maximum number of employees and assign them jobs
   *
   * @param {NS} ns
   * @param {string} division
   * @param {string} city
   * @param {number} size
   * @param {Object<string, number>[]} positions
   * @returns {Promise<void>}
   */
  async function upgradeOffice(ns, division, city, size, positions) {
    const corp = ns.corporation;
    const office = ns.corporation.getOffice(division, city);

    // Upgrade office to size if needed
    const upgradeAmount = size - office.size;
    ns.print(`Upgrading office in ${city} to size ${size}`);
    if (upgradeAmount >= 1) {
      ns.corporation.upgradeOfficeSize(division, city, upgradeAmount);
    }
    // Refresh office after upgrade
    let updatedOffice = ns.corporation.getOffice(division, city);

    // Hire employees until office is full
    let hireAttempts = 0;
    while (
      (!updatedOffice.employees || updatedOffice.employees.length < updatedOffice.size) &&
      hireAttempts < updatedOffice.size
    ) {
      const hired = ns.corporation.hireEmployee(division, city);
      if (!hired) {
        ns.print(`Warning: Failed to hire employee in ${city}`);
        break;
      }
      ns.print(`Hired employee in ${city}`);
      hireAttempts++;
      updatedOffice = ns.corporation.getOffice(division, city); // refresh after hire
    }

    // Reset all job assignments to 0
    const roles = ["Operations", "Engineer", "Management", "Business", "Research & Development"];
    for (const role of roles) {
      corp.setAutoJobAssignment(division, city, "Operations", 0);
      corp.setAutoJobAssignment(division, city, "Engineer", 0);
      corp.setAutoJobAssignment(division, city, "Management", 0);
      corp.setAutoJobAssignment(division, city, "Business", 0);
      corp.setAutoJobAssignment(division, city, "Research & Development", 0);
    }

    for (let p of positions) {
      ns.corporation.setAutoJobAssignment(division, city, p.job, p.num);
    }
    ns.print(`Assigned employees in ${city}`);
  }

  /**
   *
   * @param {NS} ns
   * @param division
   * @param city
   * @returns {Object<string, number>[]}
   */
  function getPositions(ns, division, city) {
    const corp = ns.corporation;
    const positions = {};
    const office = corp.getOffice(division, city);

    if (!office || !Array.isArray(office.employees)) {
      ns.print(`Warning: No employees found in ${division} (${city})`);
      return positions;
    }

    for (const employeeName of office.employees) {
      const employee = corp.getEmployee(division, city, employeeName);
      if (employee && employee.pos) {
        positions[employee.pos] = (positions[employee.pos] || 0) + 1;
      }
    }

    return positions;
  }


  /**
   * Function to wait for an investment offer of a certain amount
   *
   * @param {NS} ns
   * @param {number} amount
   * @param {number} round
   * @returns {Promise<void>}
   */
  async function investmentOffer(ns, amount, round = 5) {
    const corp = ns.corporation;
    if (corp.getInvestmentOffer().round > round) return;
    ns.print(`Waiting for investment offer of ${formatMoney(ns, amount)}`);
    // Wait for investment
    while (corp.getInvestmentOffer().funds < amount) {
      if (corp.getInvestmentOffer().round > round) {
        ns.print(`Already accepted investment offer at round ${corp.getInvestmentOffer().round}, ` +
          `or it was manually accepted now.`);
        return;
      }
      amount -= corp.getCorporation().revenue; // Take revenue into account
      // Pump in corp funds if we have hashes
      if (ns.hacknet.numHashes() >= ns.hacknet.hashCost('Sell for Corporation Funds')) {
        ns.hacknet.spendHashes('Sell for Corporation Funds');
        amount -= 1e9;
      }
      await ns.sleep(1000);
    }
    ns.print(`Accepted investment offer of ${formatMoney(ns, corp.getInvestmentOffer().funds)}`);
    corp.acceptInvestmentOffer();
  }

  /**
   * Function to start making a product
   *
   * @param {NS} ns
   * @param {string} division
   * @param {string} city
   * @param {string} name
   * @param {number} design
   * @param {number} marketing
   * @returns {Promise<void>}
   */
  async function makeProduct(ns, division, city, name, design = 0, marketing = 0) {
    const corp = ns.corporation;
    const products = corp.getDivision(division).products;
    const proposedVersion = parseVersion(name);
    let currentBestVersion = 0;
    for (let product of products) {
      let version = parseVersion(product);
      if (version > currentBestVersion) currentBestVersion = version;
    }
    if (proposedVersion > currentBestVersion) {
      await moneyForAmount(ns, design + marketing);
      corp.makeProduct(division, city, name, design, marketing);
      ns.print(`Started to make ${name} in ${division} (${city}) with ${formatMoney(ns, design)} for design and ${formatMoney(ns, marketing)} for marketing`);
    } else ns.print(`Already making/made ${name} in ${division} (${city})`);
  }

  /**
   * Function to get latest product version
   *
   * @param {NS} ns
   * @param {string} division
   * @return {number}
   */
  function getLatestVersion(ns, division) {
    const products = ns.corporation.getDivision(division).products;
    let latestVersion = 0;
    for (let product of products) {
      let version = parseVersion(product);
      if (version > latestVersion) latestVersion = version;
    }
    return latestVersion;
  }

  /**
   * Function to get earliest product version
   *
   * @param {NS} ns
   * @param {string} division
   * @returns {number}
   */
  function getEarliestVersion(ns, division) {
    const products = ns.corporation.getDivision(division).products;
    let earliestVersion = Number.MAX_SAFE_INTEGER;
    for (let product of products) {
      let version = parseVersion(product);
      if (version < earliestVersion) earliestVersion = version;
    }
    return earliestVersion;
  }

  /**
   * Function to parse product version from name
   *
   * @param {string} name
   * @returns {number}
   */
  function parseVersion(name) {
    let version = '';
    for (let i = 1; i <= name.length; i++) {
      let slice = name.slice(-i);
      if (!isNaN(slice)) version = slice;
      else if (version === '') throw new Error(`Product name must end with version number`);
      else return parseInt(version);
    }
  }

  /**
   * Function to expand industry
   *
   * @param {NS} ns
   * @param {string} industry
   * @param {string} division
   * @returns {Promise<void>}
   */
export async function expandIndustry(ns, industry, division) {
  const corp = ns.corporation;

  try {
    corp.getDivision(division);
    ns.tprint(`✅ Division '${division}' already exists.`);
  } catch {
    const startingCost = corp.getIndustryData(industry).startingCost;

    if (corp.getCorporation().funds < startingCost) {
      ns.tprint(`💰 Waiting for funds to expand to '${industry}' (need \$${ns.formatNumber(startingCost)})`);
      await moneyFor(ns, startingCost, industry);
    }

    corp.expandIndustry(industry, division);
    ns.tprint(`🌱 Division '${division}' created in '${industry}' industry (cost: \$${ns.formatNumber(startingCost)})`);
  }
}


  /**
   * Function to expand city
   *
   * @param {NS} ns
   * @param {string} division
   * @param {string} city
   * @returns {Promise<void>}
   */
  export async function expandCity(ns, division, city) {
    const corp = ns.corporation;

    if (!corp.getDivision(division).cities.includes(city)) {
      const cost = corp.getConstants().officeInitialCost;

      if (corp.getCorporation().funds < cost) {
        ns.tprint(`💰 Waiting for funds to expand to ${city} (need \$${ns.formatNumber(cost)})`);
        await moneyFor(ns, cost);
      }

      corp.expandCity(division, city);
      ns.tprint(`🌍 Expanded to ${city} for ${division} (cost: \$${ns.formatNumber(cost)})`);
    } else {
      ns.tprint(`✅ Already expanded to ${city} for ${division}`);
    }
  }


  /**
   * Function to purchase warehouse
   *
   * @param {NS} ns
   * @param {string} division
   * @param {string} city
   * @returns {Promise<void>}
   */
  export async function purchaseWarehouse(ns, division, city) {
    const corp = ns.corporation;

    if (!corp.hasWarehouse(division, city)) {
      const cost = corp.getConstants().warehouseInitialCost;

      if (corp.getCorporation().funds < cost) {
        ns.print(`💰 Waiting for funds to purchase warehouse in ${city} (need \$${ns.formatNumber(cost)})`);
        await moneyFor(ns, cost);
      }

      corp.purchaseWarehouse(division, city);
      ns.print(`🏬 Purchased warehouse in ${division} (${city}) for \$${ns.formatNumber(cost)}`);
    } else {
      ns.print(`✅ Warehouse already exists in ${city} for ${division}`);
    }
  }



  /**
   * Unlocks a corporation upgrade if not already unlocked.
   * @param {NS} ns - Netscript context
   * @param {string} upgrade - Name of the unlock upgrade (e.g. "Smart Supply")
   * @returns {boolean} - True if unlocked or already unlocked, false if failed
   */
  async function unlockUpgrade(ns, upgrade) {
    const corp = ns.corporation;

    if (corp.hasUnlock(upgrade)) {
      ns.print(`Already unlocked: ${upgrade}`);
      return true;
    }

    try {
      corp.purchaseUnlock(upgrade);
      ns.print(`Purchased unlock upgrade: ${upgrade}`);
      return true;
    } catch (err) {
      ns.print(`ERROR purchasing unlock upgrade '${upgrade}': ${err}`);
      return false;
    }
  }

  /**
   * Function to return important research
   *
   * @returns {Object<string>}
   */
  function getResearch() {
    return {
      lab: 'Hi-Tech R&D Laboratory',
      market1: 'Market-TA.I',
      market2: 'Market-TA.II',
      fulcrum: 'uPgrade: Fulcrum',
      capacity1: 'uPgrade: Capacity.I',
      capacity2: 'uPgrade: Capacity.II'
    };
  }
