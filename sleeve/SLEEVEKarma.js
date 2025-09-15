/** @param {NS} ns **/
export async function main(ns) {
  const targetKarma = -54000;
  const crime = "Homicide";
  const fallbackCrime = "Mug someone";
  const gangScript = "/gang/GANGManager.js";
  const hudElement = initializeKarmaHud();

  if (!ns.sleeve || typeof ns.sleeve.getNumSleeves !== "function") {
    ns.tprint("ERROR: Sleeves not available. Make sure BN8 or SF8 is unlocked.");
    return;
  }

  const numSleeves = ns.sleeve.getNumSleeves();

  while (ns.heart.break() > targetKarma) {
     updateKarmaHud(ns, hudElement);
    for (let i = 0; i < numSleeves; i++) {

      const sleeve = ns.sleeve.getSleeve(i);
      const successChance = sleeve.crimeSuccessRate;

      if (sleeve.strength < 50 || sleeve.dexterity < 50 || sleeve.agility < 50 || successChance < 0.5) {
        ns.sleeve.setToCommitCrime(i, fallbackCrime);
      } else {
        ns.sleeve.setToCommitCrime(i, crime);
      }
    }

    ns.clearLog();
    ns.print(`Current Karma: ${ns.heart.break().toFixed(0)} / ${targetKarma}`);
    await ns.sleep(10000);
  }

  // Karma threshold reached
  ns.tprint("✅ Karma goal reached! Attempting to create a gang...");

  if (!ns.gang.inGang()) {
    const success = ns.gang.createGang("Slum Snakes"); // Change faction if needed
    if (success) {
      ns.tprint("🎉 Gang created successfully!");
    } else {
      ns.tprint("⚠️ Failed to create gang. You may not be in the right city or faction.");
    }
  } else {
    ns.tprint("Already in a gang.");
  }

  // Launch gang manager script
  if (ns.fileExists(gangScript)) {
    ns.tprint(`🚀 Launching ${gangScript}`);
    ns.run(gangScript);
  } else {
    ns.tprint(`❌ Script ${gangScript} not found.`);
  }

  // Kill this script
  ns.tprint("🛑 Killing sleeveKarmaGrind.js");
  ns.scriptKill(ns.getScriptName(), ns.getHostname());
}

function initializeKarmaHud() {
        const d = eval("document");
        let hudElement = d.getElementById("karma-display-1");
        if (hudElement !== null) return hudElement;

        const overview = d.getElementById("overview-extra-hook-0").parentElement.parentElement;
        const karmaTracker = overview.cloneNode(true);

        karmaTracker.querySelectorAll("p > p").forEach(e => e.parentElement.removeChild(e));
        karmaTracker.querySelectorAll("p").forEach((e, i) => e.id = `karma-display-${i}`);

        hudElement = karmaTracker.querySelector("#karma-display-1");
        karmaTracker.querySelectorAll("p")[2].innerText = "Karma";
        hudElement.innerText = "0.00";

        overview.parentElement.insertBefore(karmaTracker, overview.parentElement.childNodes[0]);
        return hudElement;
    }

    function updateKarmaHud(ns, hudElement) {
        const karma = ns.heart.break();
        hudElement.innerText = karma.toFixed(2);
    }