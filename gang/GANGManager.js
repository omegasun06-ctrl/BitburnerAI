import { renderGangDashboard } from "/ui/gangDashboard.js";

/** @param {NS} ns **/
export async function main(ns) {
  const warfareEnabled = true;

  while (true) {
    if (!ns.gang.inGang()) {
      ns.gang.createGang("Slum Snakes");
    }

    await manageGang(ns, warfareEnabled);
    await ns.sleep(5000);
  }
}
function calculateAvgWinChance(ns) {
  const gangInfo = ns.gang.getGangInformation();
  const otherGangs = ns.gang.getOtherGangInformation();

  let winChanceSum = 0;
  let gangCount = 0;

  for (const gang in otherGangs) {
    if (gang === gangInfo.faction) continue;
    const chance = ns.gang.getChanceToWinClash(gang);
    winChanceSum += chance;
    gangCount++;
  }

  return gangCount > 0 ? winChanceSum / gangCount : 0;
}

function determineGangGoal(ns) {
    const gangInfo = ns.gang.getGangInformation();
    const members = ns.gang.getMemberNames();
    const avgWinChance = calculateAvgWinChance(ns);
    const respect = gangInfo.respect;
    const moneyRate = gangInfo.moneyGainRate;
    const territory = gangInfo.territory;

    const avgStats = getAverageStats(ns, members);
    const avgCombatStat = (avgStats.str + avgStats.def + avgStats.dex + avgStats.agi) / 4;
    const avgHackStat = avgStats.hack;

    // Dynamic thresholds
    const respectThreshold = 10000 + members.length * 1000;
    const moneyThreshold = Math.max(5000, respect / 2);
    const territoryThreshold = 0.85 + (avgCombatStat / 1000);
    const winChanceThreshold = 0.5 + (avgCombatStat / 500);
    const trainingThreshold = 60;

    if (respect < respectThreshold || members.length < 6) return "Respect";
    if (moneyRate < moneyThreshold) return "Money";
    if (territory < territoryThreshold && avgWinChance > winChanceThreshold) return "Territory";
    if (avgCombatStat < trainingThreshold || avgHackStat < trainingThreshold) return "Training";

    return "Balanced";
}

async function manageGang(ns, warfareEnabled) {
  recruitMembers(ns);
  ascendMembers(ns);
  const goal = determineGangGoal(ns);
  assignOptimizedTasks(ns, goal);
  buySmartEquipment(ns);
  manageWarfare(ns, warfareEnabled);

  await renderGangDashboard(ns, goal);
}

function recruitMembers(ns) {
  while (ns.gang.canRecruitMember()) {
    const name = `Ganger-${Date.now()}`;
    ns.gang.recruitMember(name);
    ns.tprint(`Recruited: ${name}`);
  }
}

function ascendMembers(ns) {
  const members = ns.gang.getMemberNames();
  const goal = determineGangGoal(ns);

  for (const member of members) {
    const stats = ns.gang.getMemberInformation(member);
    const ascension = ns.gang.getAscensionResult(member);
    if (!ascension || !stats) continue;

    let threshold = 1.5;

    if (goal === "Training") {
      threshold = 1.2;
    } else if (goal === "Respect") {
      threshold = 1.3;
    } else if (goal === "Money") {
      threshold = 1.4;
    }

    if (Object.values(ascension).some(mult => mult > threshold)) {
      ns.gang.ascendMember(member);
      ns.tprint(`Ascended: ${member}`);
    }
  }
}


function getMemberAverageStat(stats) {
    const statValues = [stats.str, stats.def, stats.dex, stats.agi, stats.hack];
    const total = statValues.reduce((sum, val) => sum + val, 0);
    return total / statValues.length;
}


function assignOptimizedTasks(ns, goal) {
  const members = ns.gang.getMemberNames();
  const gangInfo = ns.gang.getGangInformation();
  const isHackingGang = gangInfo.isHacking;
  const tasks = ns.gang.getTaskNames();

  for (const member of members) {
    const stats = ns.gang.getMemberInformation(member);
    if (!stats) continue;


        const avgStat = getMemberAverageStat(stats);
        if (avgStat < 100) {
            const trainingTask = isHackingGang ? "Train Hacking" : "Train Combat";
            ns.gang.setMemberTask(member, trainingTask);
            ns.tprint(`${member} assigned to ${trainingTask} (Avg stat < 50)`);
            continue;
        }

    // Handle training goal directly
    if (goal === "Training") {
      const trainingTask = isHackingGang ? "Train Hacking" : "Train Combat";
      ns.gang.setMemberTask(member, trainingTask);
      ns.tprint(`${member} assigned to ${trainingTask} (Training goal)`);
      continue;
    }

    let bestTask = null;
    let bestScore = -Infinity;

    for (const task of tasks) {
      const t = ns.gang.getTaskStats(task);
      const statSum = isHackingGang ? stats.hack : stats.str + stats.def + stats.dex + stats.agi;
      let score = 0;

      if (goal === "Respect") {
        score = t.baseRespect * statSum;
      } else if (goal === "Money") {
        score = t.baseMoney * statSum;
      } else if (goal === "Territory") {
        score = t.baseTerritory * statSum;
      } else if (goal === "Balanced") {
        score = ((t.baseMoney + t.baseRespect + t.baseTerritory) / 3) * statSum;
      }

      ns.print(`${member} | Task: ${task} | Score: ${score.toFixed(2)} (Goal: ${goal})`);

      if (score > bestScore) {
        bestScore = score;
        bestTask = task;
      }
    }

    // Fallback if no task found
    if (!bestTask) {
      bestTask = isHackingGang ? "Train Hacking" : "Train Combat";
      ns.tprint(`${member} fallback to ${bestTask}`);
    } else {
      ns.tprint(`${member} assigned to ${bestTask} (Score: ${bestScore.toFixed(2)})`);
    }

    ns.gang.setMemberTask(member, bestTask);
  }
}


function buySmartEquipment(ns) {
  const members = ns.gang.getMemberNames();
  const equipment = ns.gang.getEquipmentNames();
  const goal = determineGangGoal(ns);

  for (const member of members) {
    for (const item of equipment) {
      const cost = ns.gang.getEquipmentCost(item);
      const stats = ns.gang.getEquipmentStats(item);
      const totalBoost = Object.values(stats).reduce((sum, val) => sum + val, 0);

      let priority = 0;

      if (goal === "Money") {
        priority = stats.hack || 0;
      } else if (goal === "Respect" || goal === "Territory") {
        priority = stats.str + stats.def + stats.dex + stats.agi;
      } else if (goal === "Training") {
        priority = totalBoost;
      }

      if (cost < ns.getPlayer().money * 0.05 && priority > 2) {
        ns.gang.purchaseEquipment(member, item);
      }
    }
  }
}

function manageWarfare(ns, enabled) {
  const goal = determineGangGoal(ns);
  if (!enabled || goal !== "Territory") {
    ns.gang.setTerritoryWarfare(false);
    return;
  }

  const gangInfo = ns.gang.getGangInformation();
  const otherGangs = ns.gang.getOtherGangInformation();

  let winChanceSum = 0;
  let gangCount = 0;

  for (const gang in otherGangs) {
    if (gang === gangInfo.faction) continue;
    const chance = ns.gang.getChanceToWinClash(gang);
    winChanceSum += chance;
    gangCount++;
  }

  const avgWinChance = winChanceSum / gangCount;
  const engage = gangInfo.territory < 0.95 && avgWinChance > 0.6;
  ns.gang.setTerritoryWarfare(engage);
}


function getAverageStats(ns, members) {
    const totalStats = {
        str: 0,
        def: 0,
        dex: 0,
        agi: 0,
        hack: 0
    };

    let count = 0;
    for (const member of members) {
        const stats = ns.gang.getMemberInformation(member);
        if (!stats) continue;

        totalStats.str += stats.str;
        totalStats.def += stats.def;
        totalStats.dex += stats.dex;
        totalStats.agi += stats.agi;
        totalStats.hack += stats.hack;
        count++;
    }

    if (count === 0) {
        return { str: 0, def: 0, dex: 0, agi: 0, hack: 0 };
    }

    return {
        str: totalStats.str / count,
        def: totalStats.def / count,
        dex: totalStats.dex / count,
        agi: totalStats.agi / count,
        hack: totalStats.hack / count
    };
}
