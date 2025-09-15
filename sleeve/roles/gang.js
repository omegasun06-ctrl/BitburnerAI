/** @param {NS} ns **/
export async function run(ns, sleeveNum) {
  const targetKarma = -54000;
  const crime = "Homicide";
  const fallbackCrime = "Mug someone";
  const gangScript = "/gang/GANGManager.js";

  if (!ns.sleeve || typeof ns.sleeve.getNumSleeves !== "function") {
    ns.tprint("ERROR: Sleeves not available. Make sure BN8 or SF8 is unlocked.");
    return;
  }

  const numSleeves = ns.sleeve.getNumSleeves();

  // Only sleeve 0 handles gang creation and launching the manager
  if (sleeveNum === 0) {
    while (ns.heart.break() > targetKarma) {
      for (let i = 0; i < numSleeves; i++) {
        const sleeve = ns.sleeve.getSleeve(i);
        const successChance = sleeve.crimeSuccessRate;

        if (
          sleeve.strength < 50 ||
          sleeve.dexterity < 50 ||
          sleeve.agility < 50 ||
          successChance < 0.5
        ) {
          ns.sleeve.setToCommitCrime(i, fallbackCrime);
        } else {
          ns.sleeve.setToCommitCrime(i, crime);
        }
      }

      await ns.sleep(10000);
    }

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

    if (ns.fileExists(gangScript)) {
      ns.tprint(`🚀 Launching ${gangScript}`);
      ns.run(gangScript);
    } else {
      ns.tprint(`❌ Script ${gangScript} not found.`);
    }
  }
}
