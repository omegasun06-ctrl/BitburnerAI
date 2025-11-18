import { getCities } from '/extendedUtils.js';
import { getActionData } from '/utils.js'; // Make sure this is included at the top
/** @param {NS} ns **/
const failureTracker = {};
// === Safety thresholds ===
const HP_HOSP_PCT = 0.12;   // auto-hospitalize below 12% if Singularity available
const HP_WARN_PCT = 0.25;   // below this, avoid high-risk ops
const HP_ABS_FALLBACK = 20;     // if max HP unknown, don’t risk ops below 20 HP
const STAM_LOW_PCT = 0.55;   // below this, prefer safe actions (Field Analysis, Training)
const MIN_CONTRACT = 0.80;   // min effective chance for contracts
const MIN_OPERATION = 0.90;   // min effective chance for operations
const MIN_BLACKOP = 0.95;   // min effective chance for BlackOps
const CHAOS_HIGH = 10;     // above this, prioritize Diplomacy

export async function main(ns) {
  //ns.disableLog('ALL');
  const bb = ns.bladeburner;
  const focus = ns.args[0] ?? 'rep'; // Default to 'rep' if no argument is passed (rank, rep, money)

  const promptTimeout = 3000;
  let lastLookAround = 0;
  await trainStats(ns);
  while (true) {
    await upgradeSkills(ns);
    //HP Check - auto-Hospitalization
    const hp = getHpStatus(ns);
    if (hp.ok && hp.pct < HP_HOSP_PCT && ns.getPlayer().hasOwnProperty("hp")) {
      if (ns.singularity && ns.singularity.hospitalize) {
        ns.print("🏥 Auto-hospitalizing due to low HP.");
        ns.singularity.hospitalize();
        await ns.sleep(3000);
        continue;
      }
    }

    const citySwitchInterval = 30 * 60 * 1000; // 30 minutes
    if (Date.now() - lastLookAround > citySwitchInterval) {
      await switchCity(ns);
      lastLookAround = Date.now();
    }


    await handleBlackOps(ns, bb);
    //handle chaos

    const chaos = bb.getCityChaos(ns.bladeburner.getCity());
    if (chaos > CHAOS_HIGH) {
      ns.print("🕊️ High chaos detected. Running Diplomacy.");
      await doAction(ns, "General", "Diplomacy");
      continue;
    }


    if (focus === "money") {
      const didCustomPlan = await customMoneyPlan(ns);
      if (didCustomPlan) continue;
    }
    else {
      const bestAction = await getBestAction(ns, focus);

      const stamPct = bb.getStamina()[0] / bb.getStamina()[1];
      if (stamPct < STAM_LOW_PCT) {
        ns.print("⚠️ Low stamina. Running Field Analysis.");
        await doAction(ns, "General", "Field Analysis");
        continue;
      }
      else if (bestAction) {
        await doAction(ns, bestAction.type, bestAction.name);
      }
      else {
        ns.print("No suitable action found. Running Field Analysis as fallback.");
        await doAction(ns, "General", "Field Analysis");
        continue;
      }

    }

    await ns.sleep(6000);
  }
}


/** Conservative stamina penalty curve.
 *  Up to 55%: scale down linearly to 0. At 100%: full strength.
 *  Based on community guidance that penalties start to bite around ~50%. */
function staminaPenaltyFactor(stamPct) {
  const FLOOR = 0.55;               // start penalizing below this
  if (stamPct >= 1) return 1;
  if (stamPct >= FLOOR) return 0.85 + 0.15 * (stamPct - FLOOR) / (1 - FLOOR);
  // Below FLOOR, drop to 0 at ~20% stamina
  const MIN_FLOOR = 0.20;
  if (stamPct <= MIN_FLOOR) return 0;
  return 0.50 * (stamPct - MIN_FLOOR) / (FLOOR - MIN_FLOOR); // 0→0.5 linearly
}

/** Defensive HP gauge that supports both old/new player objects.
 *  Returns {pct, cur, max, ok}, where ok=false if we can’t infer percentage. */
function getHpStatus(ns) {
  const p = ns.getPlayer(); // includes hp & mults per API
  // Newer builds: p.hp may be {current,max}; some builds expose numeric hp
  let cur, max;
  if (p?.hp && typeof p.hp === 'object' && 'current' in p.hp && 'max' in p.hp) {
    cur = Number(p.hp.current); max = Number(p.hp.max);
  } else if (typeof p?.hp === 'number') {
    // If only a number, we can treat it as current HP; no reliable max
    cur = Number(p.hp); max = NaN;
  }
  const pct = (Number.isFinite(max) && max > 0) ? cur / max : NaN;
  return { pct, cur, max, ok: Number.isFinite(pct) };
}

/** Compute a conservative effective success chance for an action. */
function effectiveChance(ns, type, name, stamPct) {
  const [minC, maxC] = ns.bladeburner.getActionEstimatedSuccessChance(type, name);
  const base = Math.max(0, Math.min(1, (minC + maxC) / 2)); // mean
  return base * staminaPenaltyFactor(stamPct);
}

async function customMoneyPlan(ns) {
  const bb = ns.bladeburner;
  const player = ns.getPlayer();

  const combatStatsOk =
    player.strength >= 100 &&
    player.defense >= 100 &&
    player.dexterity >= 100 &&
    player.agility >= 100;

  const [curStam, maxStam] = bb.getStamina();
  const stamPct = curStam / maxStam;

  if (!combatStatsOk) {
    ns.tprint("📉 Combat stats below 100. Starting training...");
    const stats = ["Strength", "Defense", "Dexterity", "Agility"];
    for (const stat of stats) {
      const current = player[stat.toLowerCase()];
      if (current < 100) {
        const started = bb.startAction("Training", stat);
        if (started) {
          const time = bb.getActionTime("Training", stat);
          ns.print(`Training ${stat} (${current} → 100)`);
          await ns.sleep(Math.ceil(time / 1000) * 1000 + 100);
        }
      }
    }
    return true;
  }

  if (stamPct < 0.5) {
    ns.print("⚠️ Low stamina. Running Field Analysis.");
    const started = bb.startAction("General", "Field Analysis");
    if (started) {
      const time = bb.getActionTime("General", "Field Analysis");
      await ns.sleep(Math.ceil(time / 1000) * 1000 + 100);
    }
    return true;
  }

  const action = "Tracking";
  const type = "Contract";
  const [amin, amax] = bb.getActionEstimatedSuccessChance(type, action);
  const remaining = bb.getActionCountRemaining(type, action);

  if (remaining === 0 || amin < 0.6) {
    ns.print(`⚠️ '${action}' not viable (remaining=${remaining}, success=${amin} to ${amax}).`);
    return false;
  }

  const started = bb.startAction(type, action);
  if (started) {
    const time = bb.getActionTime(type, action);
    ns.print(`💰 Executing '${action}' for money focus.`);
    await ns.sleep(Math.ceil(time / 1000) * 1000 + 100);
    return true;
  }

  ns.print(`❌ Failed to start '${action}'.`);
  return false;
}

function getSkillsData() {
  return [
    "Blade's Intuition", "Cloak", "Short-Circuit", "Digital Observer", "Tracer",
    "Overclock", "Reaper", "Evasive System", "Datamancer", "Cyber's Edge",
    "Hands of Midas", "Hyperdrive"
  ];
}


async function upgradeSkills(ns) {
  const bb = ns.bladeburner;
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


  async function statCheck() {
    let allOk = true;
    for (const [stat, target] of Object.entries(statTargets)) {
      const current = stat === "Charisma"
        ? ns.getPlayer().charisma
        : ns.getPlayer()[stat.toLowerCase()];
      if (current < target) {
        ns.print(`⛔ ${stat} is below target: ${current} < ${target}`);
        allOk = false;
      }
    }
    return allOk;
  }


  if (await statCheck()) {
    ns.tprint("✅ All stats already meet minimum thresholds. Skipping training.");
    return;
  }

  ns.tprint("📈 Starting stat training...");

  while (true) {
    if (await statCheck()) break;

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




async function doAction(ns, type, name) {
  const bb = ns.bladeburner;
  if (!type || !name) {
    ns.print(`❌ Invalid action: type='${type}', name='${name}'`);
    return;
  }

  const remaining = bb.getActionCountRemaining(type, name);
  if (remaining === 0 && type !== "General") {
    ns.print(`⛔ Skipping '${type} - ${name}' due to 0 remaining.`);
    return;
  }

  const time = bb.getActionTime(type, name);
  const started = bb.startAction(type, name);
  if (started) {
    ns.print(`🚀 Executing ${type} - ${name}`);
    await ns.sleep(Math.ceil(time / 1e3) * 1e3 + 100);
    const [amin, amax] = bb.getActionEstimatedSuccessChance(type, name);
    if (amin < 1) {
      failureTracker[name] = (failureTracker[name] ?? 0) + 1;
    }
  } else {
    ns.print(`❌ Failed to start '${type} - ${name}'`);
  }
}


async function getBestAction(ns, focus) {
  const bb = ns.bladeburner;
  const actions = await getActionData();

  actions.forEach(a => {
    if (!a || !a.name || !a.type) {
      ns.print(`⚠️ Invalid action data: ${JSON.stringify(a)}`);
    }
  });


  return actions
    .filter(a => a && a.name && a.type) // Filter out invalid entries
    .map((a) => {
      const [amin, amax] = bb.getActionEstimatedSuccessChance(a.type, a.name);
      const time = bb.getActionTime(a.type, a.name);
      const failurePenalty = failureTracker[a.name] || 0;


      const remaining = bb.getActionCountRemaining(a.type, a.name);
      if (remaining < 2 || amin < 0.7 || failurePenalty > 10) return null;



      const level = a.type === 'General' ? 1 : bb.getActionCurrentLevel(a.type, a.name);
      const rewardMultiplier = Math.pow(a.rewardFac, level - 1);


      let gain;

      try {
        if (focus === 'rank') {
          gain = bb.getActionRankGain(a.type, a.name);
        } else {
          gain = bb.getActionRepGain(a.type, a.name);
        }
      }

      catch (err) {
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




async function switchCity(ns) {
  const bb = ns.bladeburner;
  const cities = await getCities();
  const currentCity = bb.getCity();
  const currentPop = bb.getCityEstimatedPopulation(currentCity);
  let bestCity = currentCity;
  let bestPop = currentPop;
  for (const city of cities) {
    const pop = bb.getCityEstimatedPopulation(city);
    if (pop > bestPop * 1.1) {
      bestCity = city;
      bestPop = pop;
    }
  }
  if (bestCity !== currentCity) {
    bb.switchCity(bestCity);
    ns.print(`Switched from ${currentCity} to ${bestCity} due to higher population (${bestPop})`);
  }
}


async function handleBlackOps(ns, bb) {
  const ops = bb.getBlackOpNames();
  for (const name of ops) {
    const [amin, amax] = bb.getActionEstimatedSuccessChance("BlackOp", name);
    const remaining = bb.getActionCountRemaining("BlackOp", name);
    if (remaining > 0 && amin >= MIN_BLACKOP) {
      await doAction(ns, "BlackOp", name);
      if (name === "Operation Daedalus") {
        await promptBitNodeCompletion(ns);
      }
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