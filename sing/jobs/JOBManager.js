/** @param {NS} ns **/
/** @require Singularity **/

export async function main(ns) {
  const company = ns.args[0];
  const fieldFlag = ns.args[1];
  const customField = fieldFlag;

  if (!company) {
    ns.tprint("Usage: run JOBManager.js [company] [Software|IT|Research]");
    return;
  }

  const jobCities = {
    "MegaCorp": "Sector-12",
    "Blade Industries": "Sector-12",
    "Four Sigma": "Sector-12",
    "KuaiGong International": "Chongqing",
    "NWO": "Volhaven",
    "OmniTek Incorporated": "Sector-12",
    "ECorp": "Sector-12",
    "Fulcrum Technologies": "Aevum",
    "Storm Technologies": "Ishima",
    "Global Pharmaceuticals": "New Tokyo",
  };

  const defaultFields = {
    "MegaCorp": "Software",
    "Blade Industries": "Software",
    "Four Sigma": "Software",
    "KuaiGong International": "Software",
    "NWO": "Software",
    "OmniTek Incorporated": "Software",
    "ECorp": "IT",
    "Fulcrum Technologies": "Software",
    "Storm Technologies": "Software",
    "Global Pharmaceuticals": "Research"
  };

  const city = jobCities[company];
  const field = customField || defaultFields[company];

  if (!city || !field) {
    ns.tprint(`Unknown company or field: ${company}`);
    return;
  }

  // Travel only if needed
  if (ns.getPlayer().city !== city) {
    const cost = ns.singularity.getTravelCost(city);
    if (ns.getPlayer().money >= cost) {
      ns.singularity.travelToCity(city);
      ns.toast(`Traveled to ${city} for ${company}`, "info");
    } else {
      ns.tprint(`Not enough money to travel to ${city}. Need \$${cost}`);
      return;
    }
  }

  while (true) {
    const currentJob = ns.getPlayer().jobs[company] || null;

    // Stop current work before applying
    ns.singularity.stopAction();

    const applied = ns.singularity.applyToCompany(company, field);

    if (applied) {
      ns.toast(`Promotion! Applied to ${field} job at ${company}`, "success");
    } else if (!currentJob) {
      ns.toast("No qualified job found. Training...", "warning");
      await trainToNextJob(ns, company, field);
    }

    // Start working for the company (focus = false)
    if (ns.singularity.workForCompany(company, false)) {
      ns.toast(`Working for ${company} to gain company reputation`, "info");
    } else {
      ns.toast(`Already working for ${company}`, "info");
    }

    await ns.sleep(60000); // Wait 1 minute before checking again
  }
}

async function trainToNextJob(ns, company, field) {
  const positions = ns.singularity.getCompanyPositions(company);
  const currentJob = ns.getPlayer().jobs[company] || null;
  const player = ns.getPlayer();

  let nextJob = null;

  for (const job of positions) {
    if (job === currentJob) continue;
    const info = ns.singularity.getCompanyPositionInfo(company, job);
    if (info.field !== field) continue;

    const reqs = info.requiredSkills;
    if (player.hacking < reqs.hacking || player.charisma < reqs.charisma) {
      nextJob = job;
      break;
    }
  }

  if (!nextJob) {
    ns.toast("No higher job found to train for", "info");
    return;
  }

  const reqs = ns.singularity.getCompanyPositionInfo(company, nextJob).requiredSkills;

  // Train only what’s needed
  if (player.hacking < reqs.hacking) {
    ns.singularity.universityCourse("Rothman University", "Algorithms", true);
    ns.toast(`Training Hacking for ${nextJob}`, "info");
  } else if (player.charisma < reqs.charisma) {
    ns.singularity.universityCourse("ZB Institute of Technology", "Leadership", true);
    ns.toast(`Training Charisma for ${nextJob}`, "info");
  } else {
    ns.toast(`Stats sufficient for ${nextJob}`, "info");
  }

  await ns.sleep(60000); // Train for 1 minute
}