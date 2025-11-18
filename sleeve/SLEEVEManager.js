/** @param {NS} ns **/
import { getSleeveInfo, assignRole, validateConfig } from './utils.js';
import { setupConfigFromArgs } from './setup.js';

export async function main(ns) {
  const args = ns.args;
  const useArgs = args.includes('--args');
  const setup = args.includes('--setup');
  const configPath = './config.json';

  let config;

  if (setup) {
    await setupConfigFromArgs(ns, args, configPath);
    ns.tprint(`✅ Config file created at ${configPath}`);
    return;
  }

  if (useArgs) {
    config = parseArgsToConfig(args);
  } else {
    try {
      config = JSON.parse(await ns.read(configPath));
    } catch (e) {
      ns.tprint(`❌ Failed to read config file: ${e}`);
      return;
    }
  }

  if (!validateConfig(ns, config)) {
    ns.tprint("❌ Invalid config. Aborting.");
    return;
  }

  const sleeves = getSleeveInfo(ns);

  for (let i = 0; i < sleeves.length; i++) {
    const shock = ns.sleeve.getSleeve(i).shock;
    const sleeveConfig = config[i];
    let role = typeof sleeveConfig === "string" ? sleeveConfig : sleeveConfig?.role ?? "synchronize";
    const params = typeof sleeveConfig === "object" ? sleeveConfig : {};
    if(shock !== 0 ) {
      ns.tprint(`shock: ${shock}. WARNING:Shock not Zero. setting role to Shock`)
      role = "shock"}
    try {
      await assignRole(ns, i, role, params);
    } catch (e) {
      ns.tprint(`⚠️ Sleeve ${i} failed role '${role}', falling back to synchronize.`);
      await assignRole(ns, i, "synchronize", {});
    }

  }
}

/**JSON CONFIG Params
  "factionWork": {"1": "faction", "2": "worktype"}
  "jobWork":     {"1": "company"}
  "bladeburner": {"1": "actionType", "2": "action"}
  "crime":       {"1": "crime"}
  "gym":         {"1": "stat", "2": "gym"}
  "uni":         {"1": "stat", "2": "uni"}
**/
 