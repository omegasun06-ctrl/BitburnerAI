/** @param {NS} ns **/
export async function main(ns) {
  //kill script

  const scriptName = ns.getScriptName();
  const host = ns.getHostname();
  const currentPid = ns.pid;

  // Get all running scripts on this host
  const runningScripts = ns.ps(host);

  for (const script of runningScripts) {
    if (script.filename === scriptName && script.pid !== currentPid) {
      ns.scriptKill(script.filename, host);
      ns.tprint(`Killed duplicate script with PID ${script.pid}`);
    }
  }

  const combatStats = ["strength", "defense", "dexterity", "agility"];
  const targetStat = 100;

  while (true) {
    let stats = combatStats.map(stat => ns.getPlayer().skills[stat]);
    // Train each stat individually at the gym
    const gym = "Powerhouse Gym";
    const city = "Sector-12";
    const statNames = ["Strength", "Defense", "Dexterity", "Agility"];


    for (let i = 0; i < combatStats.length; i++) {
      const statKey = combatStats[i];
      const statDisplayName = statNames[i];
      const currentValue = ns.getPlayer().skills[statKey];

      if (currentValue < targetStat) {
        ns.print(`Training ${statDisplayName} (${currentValue} → ${targetStat})`);
        ns.singularity.travelToCity(city);
        ns.singularity.gymWorkout(gym, statDisplayName, false);
        await ns.sleep(1000);
        break; // Exit the for-loop to re-evaluate stats after training
      }
    }



    // All combat stats are 100, try to join Bladeburners
    const player = ns.getPlayer();
    const allStatsMaxed = player.strength >= 100 &&
      player.defense >= 100 &&
      player.dexterity >= 100 &&
      player.agility >= 100;
    ns.print(allStatsMaxed);
    if (allStatsMaxed && !ns.bladeburner.inBladeburner()) {
      const factions = player.factions;
      if (factions.includes("Bladeburners")) {
        ns.singularity.joinFaction("Bladeburners");
        ns.tprint("Joined Bladeburners!");

        const pid = ns.run("/tools/qq.js", "home", "/blade/BLADEManager.js", 1);
        if (pid === 0) {
          ns.tprint("❌ Failed to start Manager. Check RAM or script path.");
        } else {
          ns.tprint(`🚀 Launcher started with PID ${pid}`);
          break;          // Exit loop once joined
        }


      } else {
        ns.tprint("Bladeburners faction not yet available. Keep training or check requirements.");
      }
    }
    await ns.sleep(30000)
  }
}
