/** @param {NS} ns **/
export async function main(ns) {
  //ns.disableLog("ALL");


  let maxPayoffTime = 3600;
  if (ns.getPlayer().money > 1e9) maxPayoffTime = 1800; // 30 min if rich
  else if (ns.getPlayer().money < 1e6) maxPayoffTime = 300; // 5 min if poor

  const sleepTime = 5000; // ms
  const hasFormulas = ns.fileExists("Formulas.exe", "home");

  while (true) {
    let upgradeOptions = [];

    const nodeCount = ns.hacknet.numNodes();

    // Check new node purchase
    const newNodeCost = ns.hacknet.getPurchaseNodeCost();
    const newNodeGain = hasFormulas ? estimateNewNodeProductionFormulas(ns) : estimateNewNodeProductionApprox(ns);
    const newNodeROI = newNodeCost / newNodeGain;
    ns.print(`🆕 New node ROI: ${newNodeROI.toFixed(2)}s | Cost: \$${ns.formatNumber(newNodeCost)} | Gain: ${newNodeGain.toFixed(2)}`);

    if (newNodeROI < maxPayoffTime) {
      ns.print(`📊 Upgrade option: ${up.type} on node ${i ?? 'new'} | Cost: \$${ns.formatNumber(up.cost)} | Gain: ${up.gain.toFixed(2)} | ROI: ${roi.toFixed(2)}s`);
      upgradeOptions.push({ type: "new-node", cost: newNodeCost, roi: newNodeROI });
    }

    // Check upgrades for each node
    for (let i = 0; i < nodeCount; i++) {
      const stats = ns.hacknet.getNodeStats(i);
      ns.print(`🔍 Checking upgrades for node ${i}`);

      const upgrades = [
        { type: "level", cost: ns.hacknet.getLevelUpgradeCost(i, 1), gain: hasFormulas ? estimateGainFormulas(ns, stats, "level") : estimateGainApprox(stats, "level") },
        { type: "ram", cost: ns.hacknet.getRamUpgradeCost(i, 1), gain: hasFormulas ? estimateGainFormulas(ns, stats, "ram") : estimateGainApprox(stats, "ram") },
        { type: "core", cost: ns.hacknet.getCoreUpgradeCost(i, 1), gain: hasFormulas ? estimateGainFormulas(ns, stats, "core") : estimateGainApprox(stats, "core") },
      ];

      for (const up of upgrades) {
        ns.print(`📊 ${up.type} upgrade | Cost: \$${ns.formatNumber(up.cost)} | Gain: ${up.gain.toFixed(2)} | ROI: ${(up.cost / up.gain).toFixed(2)}s`);
        ns.print(`⚙️ Current maxPayoffTime threshold: ${maxPayoffTime}s`);
        const roi = up.cost / up.gain;
        if (roi < maxPayoffTime) {
          upgradeOptions.push({ type: up.type, node: i, cost: up.cost, roi });
        }
      }
    }


    // Execute best upgrade if ROI is acceptable
    // Execute all upgrades with acceptable ROI and sufficient funds
    upgradeOptions.sort((a, b) => a.roi - b.roi);

    let anyUpgrade = false;
    for (const upgrade of upgradeOptions) {

      if (ns.getPlayer().money < upgrade.cost) continue;

      let units = 1;

      // Estimate how many units we can afford and that meet ROI threshold
      if (upgrade.type !== "new-node") {
        const stats = ns.hacknet.getNodeStats(upgrade.node);
        const maxUnits = 10; // You can tune this higher if you want

        for (let u = 2; u <= maxUnits; u++) {

          let cost, gain;
          switch (upgrade.type) {
            case "level":
              cost = ns.hacknet.getLevelUpgradeCost(upgrade.node, u);
              gain = hasFormulas ? estimateGainFormulas(ns, stats, "level", u) : estimateGainApprox(stats, "level", u);
              break;
            case "ram":
              cost = ns.hacknet.getRamUpgradeCost(upgrade.node, u);
              gain = hasFormulas ? estimateGainFormulas(ns, stats, "ram", u) : estimateGainApprox(stats, "ram", u);
              break;
            case "core":
              cost = ns.hacknet.getCoreUpgradeCost(upgrade.node, u);
              gain = hasFormulas ? estimateGainFormulas(ns, stats, "core", u) : estimateGainApprox(stats, "core", u);
              break;
          }

          const roi = cost / gain;
          if (roi < maxPayoffTime && ns.getPlayer().money >= cost) {
            units = u;
            ns.print(`🔁 Bulk upgrade planned: ${upgrade.type} on node ${upgrade.node} x${units}`);
          }
          if (roi >= maxPayoffTime) {
            ns.print(`⛔ Skipping ${upgrade.type} x${u} on node ${upgrade.node} — ROI ${roi.toFixed(2)}s exceeds threshold`);
          }
          if (ns.getPlayer().money < cost) {
            ns.print(`💸 Skipping ${upgrade.type} x${u} on node ${upgrade.node} — insufficient funds`);
          }
          if (!anyUpgrade) {
            ns.print("⏳ No profitable upgrades found or insufficient funds.");
          }
          else {

            break;
          }
        }
      }

      // Apply upgrade
      switch (upgrade.type) {
        case "new-node":
          ns.hacknet.purchaseNode();
          ns.tprint(`🆕 Purchased new Hacknet node for \$${ns.formatNumber(upgrade.cost)} (ROI: ${upgrade.roi.toFixed(2)}s)`);
          break;
        case "level":
          ns.hacknet.upgradeLevel(upgrade.node, units);
          ns.tprint(`⬆️ Upgraded level of node ${upgrade.node} by ${units} for \$${ns.formatNumber(ns.hacknet.getLevelUpgradeCost(upgrade.node, units))}`);
          break;
        case "ram":
          ns.hacknet.upgradeRam(upgrade.node, units);
          ns.tprint(`🧠 Upgraded RAM of node ${upgrade.node} by ${units} for \$${ns.formatNumber(ns.hacknet.getRamUpgradeCost(upgrade.node, units))}`);
          break;
        case "core":
          ns.hacknet.upgradeCore(upgrade.node, units);
          ns.tprint(`💪 Upgraded cores of node ${upgrade.node} by ${units} for \$${ns.formatNumber(ns.hacknet.getCoreUpgradeCost(upgrade.node, units))}`);
          break;
      }
    }


    ns.print(`🔄 Tick complete. Checked ${upgradeOptions.length} upgrade options.`);
    await ns.sleep(sleepTime);
  }


  // --- Estimation Functions ---

  function estimateGainFormulas(ns, stats, type, units = 1) {
    const baseProd = ns.formulas.hacknetNodes.moneyGainRate(stats.level, stats.ram, stats.cores);
    let newStats = { ...stats };

    switch (type) {
      case "level":
        newStats.level += units;
        break;
      case "ram":
        newStats.ram *= Math.pow(2, units);
        break;
      case "core":
        newStats.cores += units;
        break;
    }

    const newProd = ns.formulas.hacknetNodes.moneyGainRate(newStats.level, newStats.ram, newStats.cores);
    return newProd - baseProd;
  }


  function estimateNewNodeProductionFormulas(ns) {
    return ns.formulas.hacknetNodes.moneyGainRate(1, 1, 1);
  }

  function estimateGainApprox(stats, type, units = 1) {
    const baseProd = stats.production;
    let newStats = { ...stats };

    switch (type) {
      case "level":
        newStats.level += units;
        break;
      case "ram":
        newStats.ram *= Math.pow(2, units);
        break;
      case "core":
        newStats.cores += units;
        break;
    }

    const levelFactor = 1 + (newStats.level - stats.level) * 0.01;
    const ramFactor = newStats.ram / stats.ram;
    const coreFactor = 1 + (newStats.cores - stats.cores) * 0.05;

    const newProd = baseProd * levelFactor * ramFactor * coreFactor;
    return newProd - baseProd;
  }


  function estimateNewNodeProductionApprox(ns) {
    const nodeCount = ns.hacknet.numNodes();
    if (nodeCount === 0) return 1;
    let total = 0;
    for (let i = 0; i < nodeCount; i++) {
      total += ns.hacknet.getNodeStats(i).production;
    }
    return total / nodeCount;
  }
}