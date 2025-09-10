
/** @param {NS} ns **/
/** @require Singularity **/
export async function main(ns) {
  //0. kill all current running scripts on home.
  ns.killall();
   // 1. Run the crawler script
  ns.run("/old_scripts/hacking/crawler.js");
  // 1. If hacking level low, connect to foodnstuff and nuke it
  if (ns.getHackingLevel() <= 20) {
    {
      ns.run("/daemon/hack.js", 100, "foodnstuff")
    }
  }

  // 2. If cash >= 200k, buy TOR router
  if (ns.getPlayer().money >= 200000 && !ns.singularity.purchaseTor()) {
    ns.singularity.purchaseTor();
  }
  // 3. Buy available hacking programs if affordable
  const programs = [
    "BruteSSH.exe",
    "FTPCrack.exe",
    "relaySMTP.exe",
    "HTTPWorm.exe",
    "SQLInject.exe",
    "DeepScanV2.exe",
    "AutoLink.exe",
    "Formulas.exe"
  ];
  for (const prog of programs) {
    if (!ns.fileExists(prog, "home") && ns.getPlayer().money >= 500000) {
      ns.singularity.purchaseProgram(prog);
    }
  }
  

  // 5. If karma > -54000 then run crime manager
  if (ns.heart.break() > -54000) {
    ns.run("/sing/crime/CRIMEManager.js");
  }
  else {
    if (ns.gang.inGang()) {
      ns.run("/gang/GANGManager.js");
    }
  }
  // 6. Run the job manager if hacking is hjigh enoug
  if (ns.getHackingLevel() >= 225 && ns.gang.inGang()) {
    ns.run('/sing/jobs/JOBManager.js', 1, 'NWO', 'IT');
  }
  // 7. Run the bladeManager
  if (ns.bladeburner.inBladeburner()) {
    ns.run('/blade/BLADEManager.js');
  }
  // 8. If stock APIs are unlocked start stock manager
  if (ns.stock.hasWSEAccount() && ns.stock.hasTIXAPIAccess()) {
    ns.run("/stock-market/STOCKManager.js");
  }

  // 9. Buy the maximum HOME RAM it can
  let ramUpgradeCost = ns.singularity.getUpgradeHomeRamCost();
  while (ns.getPlayer().money >= ramUpgradeCost) {
    ns.singularity.upgradeHomeRam();
    ramUpgradeCost = ns.singularity.getUpgradeHomeRamCost();
  }

  // 10. Run the player server startup with argument 2
  ns.run("/player/buy_pserv.js", 1, 2);
  // 11. Run Player Server manager
  ns.run("/player/PSManager.js");


  // 12. Run hacknet Manager
  if (ns.hacknet.numNodes() === 0 ){
  ns.run("/old_scripts/autoNet.js", 1, 5, 25, 1, 1)
  }
  ns.run("/hacknet/HNManager.js");
  
  // 13. Run hack manager
  if (ns.fileExists("Formulas.exe", "home")) {
    ns.run("/hacking/HACKManager_dev.js", 1, "--usePlanner");
  }
  else {
    ns.run("/hacking/HACKManager_dev.js");
  }
}