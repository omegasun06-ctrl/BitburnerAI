import { getCities } from '/utils.js';
import { getActionData } from '/utils.js'; // Make sure this is included at the top
/** @param {NS} ns **/
export async function main(ns) {
  //ns.disableLog('ALL');
  const bb = ns.bladeburner;
  const focus = ns.args[0] ?? 'rep'; // Default to 'rep' if no argument is passed (rank, rep, money)
  const failureTracker = {};
  const blackOpThreshold = 0.95;
  const promptTimeout = 3000;
  let lastLookAround = 0;

  function getSkillsData() {
    return [
      "Blade's Intuition", "Cloak", "Short-Circuit", "Digital Observer", "Tracer",
      "Overclock", "Reaper", "Evasive System", "Datamancer", "Cyber's Edge",
      "Hands of Midas", "Hyperdrive"
    ];
  }

  function upgradeSkills() {
    const skills = getSkillsData();
    for (const name of skills) {
      const cost = bb.getSkillUpgradeCost(name);
      if (bb.getSkillPoints() >= cost) {
        bb.upgradeSkill(name);
      }
    }
  }

  async function trainStats(ns) {
    const statTargets = {
      Strength: 100,
      Defense: 100,
      Dexterity: 100,
      Agility: 100,
      Charisma: 100
    };

    async function trainStats(ns) {
      const statTargets = {
        Strength: 100,
        Defense: 100,
        Dexterity: 100,
        Agility: 100,
        Charisma: 100
      };

      const statCheck = () =>
        Object.entries(statTargets).every(([stat, target]) => {
          const current = stat === "Charisma"
            ? ns.getPlayer().charisma
            : ns.getPlayer()[stat.toLowerCase()];
          return current >= target;
        });

      if (statCheck()) {
        ns.tprint("✅ All stats already meet minimum thresholds. Skipping training.");
        return;
      }

      ns.tprint("📈 Starting stat training...");

      while (!statCheck()) {
        for (const [stat, target] of Object.entries(statTargets)) {
          const current = stat === "Charisma"
            ? ns.getPlayer().charisma
            : ns.getPlayer()[stat.toLowerCase()];

          if (current < target) {
            const actionType = stat === "Charisma" ? "Recruitment" : "Training";
            const started = ns.bladeburner.startAction(actionType, stat);
            if (started) {
              const time = ns.bladeburner.getActionTime(actionType, stat);
              ns.print(`Training ${stat} (${current} → ${target})`);
              await ns.sleep(Math.ceil(time / 1e3) * 1e3 + 100);
            }
          }
        }
        await ns.sleep(6000);
      }

      ns.tprint("✅ All stats trained to minimum thresholds. Proceeding to Bladeburner operations.");
    }
  }

  async function doAction(type, name) {
    const time = bb.getActionTime(type, name);
    const started = bb.startAction(type, name);
    if (started) {
      ns.print(`Executing ${type} - ${name}`);
      await ns.sleep(Math.ceil(time / 1e3) * 1e3 + 100);

      const [amin, amax] = bb.getActionEstimatedSuccessChance(type, name);
      if (amax < 1) {
        failureTracker[name] = (failureTracker[name] || 0) + 1;
      }
    }
  }


  function getBestAction(ns, bb, focus) {
    const actions = getActionData();

    return actions
      .map((a) => {
        const [amin, amax] = bb.getActionEstimatedSuccessChance(a.type, a.name);
        const time = bb.getActionTime(a.type, a.name);
        const failurePenalty = failureTracker[a.name] || 0;

        if (amax < 0.6 || failurePenalty > 10 || bb.getActionCountRemaining(a.type, a.name) === 0) return null;


        const level = a.type === 'General' ? 1 : bb.getActionCurrentLevel(a.type, a.name);
        const rewardMultiplier = Math.pow(a.rewardFac, level - 1);


        let gain;
        try {
          if (focus === 'money') {
            gain = bb.getActionMoneyGain(a.type, a.name);
          } else if (focus === 'rank') {
            gain = bb.getActionRankGain(a.type, a.name);
          } else {
            gain = bb.getActionRepGain(a.type, a.name);
          }
        } catch (err) {
          ns.print(`⚠️ Error getting gain for ${a.name}: ${err}`);
          gain = 0;
        }




        const score = (gain / time) / (1 + failurePenalty);

        ns.print(`Evaluating ${a.name}: gain=${gain.toFixed(2)}, score=${score.toFixed(2)}, failures=${failurePenalty}`);
        return { ...a, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)[0];
  }




  function switchCity(ns) {
    const cities = getCities();
    const currentCity = bb.getCity();
    const currentPop = bb.getCityEstimatedPopulation(currentCity);

    let bestCity = currentCity;
    let bestPop = currentPop;

    for (const city of cities) {
      const pop = bb.getCityEstimatedPopulation(city);
      if (pop > bestPop * 1.1) { // Only switch if population is 10% higher
        bestCity = city;
        bestPop = pop;
      }
    }

    if (bestCity !== currentCity) {
      bb.switchCity(bestCity);
      ns.print(`Switched from ${currentCity} to ${bestCity} due to higher population (${bestPop})`);
    }
  }



  async function handleBlackOps() {
    const ops = bb.getBlackOpNames();
    for (const name of ops) {
      const [amin, amax] = bb.getActionEstimatedSuccessChance("BlackOp", name);

      const remaining = bb.getActionCountRemaining("BlackOps", name);
      if (remaining > 0 && amax >= blackOpThreshold) {
        await doAction("BlackOps", name);
      }
    }
  }

  async function promptBitNodeCompletion() {
    const confirmed = await Promise.race([
      ns.prompt("Complete Operation Daedalus and finish Bitnode?"),
      ns.sleep(promptTimeout).then(() => false)
    ]);
    if (confirmed) {
      bb.completeOperation("Operation Daedalus");
    } else {
      ns.tprint("Bitnode completion skipped due to timeout.");
    }
  }
  await trainStats(ns);
  while (true) {
    upgradeSkills();


    const citySwitchInterval = 30 * 60 * 1000; // 30 minutes
    if (Date.now() - lastLookAround > citySwitchInterval) {
      switchCity(ns);
      lastLookAround = Date.now();
    }


    await handleBlackOps();

    const bestAction = getBestAction(ns, bb, focus);
    if (bestAction) {
      await doAction(bestAction.type, bestAction.name);
    } else {
      ns.print("No suitable action found. Resting...");
      await ns.sleep(6000);
    }

    await ns.sleep(6000);
  }
}
