/** @param {NS} ns **/
export async function main(ns) {
  const corp = ns.corporation;

  const division = ns.args[0] || "Chemical";
  const cities = corp.getDivision(division).cities;

let level = ns.corporation.getUpgradeLevel("Smart Storage");
//  Agriculture 
// let materials = [ 
//     { name: 'Hardware', qty: 100+100*(level/10) },
//     { name: 'AI Cores', qty: 135+135*(level/10) },
//     { name: 'Real Estate', qty: 8500+8500*(level/10) },
//     { name: 'Robots', qty: 22+22*(level/10) }
//   ];

//Chemical
let materials = [ 
    { name: 'Hardware', qty: 80+80*(level/10) },
    { name: 'AI Cores', qty: 100+100*(level/10) },
    { name: 'Real Estate', qty: 7500+7500*(level/10) },
    { name: 'Robots', qty: 18+18*(level/10) }
  ];

//Tabacoo
  // let materials = [
  //   { name: 'Hardware', qty: 0},
  //   { name: 'AI Cores', qty: 150+150*(level/10)  },
  //   { name: 'Real Estate', qty: 3000+3000*(level/10)  },
  //   { name: 'Robots', qty: 50+50*(level/10)  }
  // ]
//Food
  // let materials = [
  //   { name: 'Hardware', qty: 25+25*(level/10)},
  //   { name: 'AI Cores', qty: 300+300*(level/10)  },
  //   { name: 'Real Estate', qty: 1000+1000*(level/10)  },
  //   { name: 'Robots', qty: 60+60*(level/10)  }
  // ]

//Water
// let materials = [ 
//     { name: 'AI Cores', qty: 100+100*(level/10) },
//     { name: 'Real Estate', qty: 6500+6500*(level/10) },
//     { name: 'Robots', qty: 30+30*(level/10) }
//   ];

  const retryCities = [];

  for (const city of cities) {
    if(city !== "Aevum"){
    const success = await adjustCityMaterials(ns, corp, division, city, materials);
    if (!success) retryCities.push(city);
    }
  }

  // Retry timed-out cities once
  if (retryCities.length > 0) {
    ns.tprint(`🔁 Retrying timed-out cities: ${retryCities.join(", ")}`);
    for (const city of retryCities) {
      const success = await adjustCityMaterials(ns, corp, division, city, materials);
      if (!success) {
        ns.tprint(`❌ ${city} failed again. Skipping.`);
      }
    }
  }


  ns.tprint(`🎉 All cities processed for division: ${division}`);
}

async function adjustCityMaterials(ns, corp, division, city, materials) {
  ns.tprint(`🌆 Starting material adjustment in ${city}`);
  let ticks = 0;
  const maxTicks = 60000;
  const completed = new Set();

  while (completed.size < materials.length) {
    for (const material of materials) {
      if (completed.has(material.name)) continue;

      const warehouseLevel = corp.getWarehouse(division, city).level;
      const targetQty = material.qty * warehouseLevel;
      const mat = corp.getMaterial(division, city, material.name);
      const currentQty = mat?.stored ?? 0;

      if (currentQty < targetQty * 0.95) {
        const rate = Math.max((targetQty - currentQty) / 10, 1);
        corp.buyMaterial(division, city, material.name, rate);
        corp.sellMaterial(division, city, material.name, 0, "MP");
        ns.tprint(`🛒 Buying ${material.name} in ${city} at rate ${rate.toFixed(2)} (current: ${currentQty.toFixed(2)}, target: ${targetQty})`);
      } else if (currentQty > targetQty * 1.05) {
        const rate = Math.max((currentQty - targetQty) / 10, 1);
        corp.sellMaterial(division, city, material.name, rate, "MP");
        corp.buyMaterial(division, city, material.name, 0);
        ns.tprint(`🛒 Selling ${material.name} in ${city} at rate ${rate.toFixed(2)} (current: ${currentQty.toFixed(2)}, target: ${targetQty})`);
      } else {
        corp.buyMaterial(division, city, material.name, 0);
        corp.sellMaterial(division, city, material.name, 0, "MP");
        completed.add(material.name);
        ns.tprint(`✅ ${material.name} in ${city} is within target range (current: ${currentQty.toFixed(2)}, target: ${targetQty})`);
      }
    }

    ticks++;
    if (ticks > maxTicks) {
      ns.tprint(`⚠️ Timeout: Material adjustment in ${city} took too long.`);
      return false;
    }

    await ns.sleep(1000);
  }

  ns.tprint(`🏁 Finished adjusting materials in ${city}`);
  return true;
}
