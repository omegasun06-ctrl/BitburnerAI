import { getCities } from '/utils.js';
import { getActionData } from '/utils.js'; // Make sure this is included at the top
/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog('ALL');
  const bb = ns.bladeburner;
  const failureTracker = {};
  const blackOpThreshold = 0.95;
  const promptTimeout = 30000;
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


  function getBestAction(ns, bb) {
    const actions = getActionData();

    return actions
      .map((a) => {
        const [amin, amax] = bb.getActionEstimatedSuccessChance(a.type, a.name);
        const time = bb.getActionTime(a.type, a.name);
        const failurePenalty = failureTracker[a.name] || 0;

        if (amax < 0.6 || failurePenalty > 10 || bb.getActionCountRemaining(a.type, a.name) === 0) return null;


        const level = a.type === 'General' ? 1 : bb.getActionCurrentLevel(a.type, a.name);
        const rewardMultiplier = Math.pow(a.rewardFac, level - 1);

        const gain = a.rankGain * rewardMultiplier;
        const score = (gain * amax / time) / (1 + failurePenalty);

        return { ...a, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)[0];
  }



  function switchCity(ns) {
    const cities = getCities();
    let bestCity = bb.getCity();
    let bestPop = bb.getCityEstimatedPopulation(bestCity);

    for (const city of cities) {
      const pop = bb.getCityEstimatedPopulation(city);
      if (pop > bestPop) {
        bestCity = city;
        bestPop = pop;
      }
    }

    if (bb.getCity() !== bestCity) {
      bb.switchCity(bestCity);
      ns.print(`Switched to city: ${bestCity}`);
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

  while (true) {
    upgradeSkills();

    if (Date.now() - lastLookAround > 60 * 60 * 1000) {
      switchCity(ns);
      lastLookAround = Date.now();
    }

    await handleBlackOps();

    const bestAction = getBestAction(ns, bb);
    if (bestAction) {
      await doAction(bestAction.type, bestAction.name);
    } else {
      ns.print("No suitable action found. Resting...");
      await ns.sleep(1000);
    }

    await ns.sleep(100);
  }
}
