/** @param {NS} ns **/
export async function setupConfigFromArgs(ns, args, path) {
    const config = {};
    for (let i = 0; i < args.length; i++) {
        if (!isNaN(args[i])) {
            const sleeveNum = parseInt(args[i]);
            const role = args[i + 1];
            config[sleeveNum] = role;
            i++;
        }
    }
    await ns.write(path, JSON.stringify(config, null, 2), 'w');
}
