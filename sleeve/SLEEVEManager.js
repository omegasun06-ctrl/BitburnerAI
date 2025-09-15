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
        const role = config[i] || 'synchronize';
        try {
            await assignRole(ns, i, role);
        } catch (e) {
            ns.tprint(`⚠️ Sleeve ${i} failed role '${role}', falling back to synchronize.`);
            await assignRole(ns, i, 'synchronize');
        }
    }
}
