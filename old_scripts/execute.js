
/** @param {NS} ns **/
function get_action(ns, host) {
  let actions = ns.ps(host);
  if (actions.length === 0) {
    ns.print(host, " has no scripts.");
    return null;
  }
  return actions[0].filename.replace("/scripts/", "").replace(".js", "");
}

/** @param {NS} ns **/
function validate(ns, action, server, host) {
  if (ns.getServer(host) == null) {
    ns.tprint(host + " does not exist. Exiting.");
    ns.exit();
  }

  if (ns.getServer(server) == null) {
    ns.tprint(server + " does not exist. Exiting.");
    ns.exit();
  }

  if (get_action(ns, host) === action) {
    ns.print(host + " is already executing action " + action);
    ns.exit();
  }
}

/** @param {NS} ns **/
export async function main(ns) {
  let action = ns.args[0];
  let server = ns.args[1]; // target server
  let host = ns.args[2];   // host to run scripts
  if (host == null) {
    host = server;
  }

  let script = "";
  if (action === "hack") {
    script = "/scripts/autoHack.js";
  } else if (action === "grow") {
    script = "/scripts/autoGrow.js";
  } else if (action === "weaken") {
    script = "/scripts/autoWeaken.js";
  } else {
    ns.tprint("Script unrecognized. Exiting.");
    ns.exit();
  }

  validate(ns, action, server, host);

  //ns.killall(host);
  await ns.scp([script], host);


  const scriptRam = ns.getScriptRam(script, "home");
  if (!scriptRam || isNaN(scriptRam)) {
    ns.print(`❌ Could not determine RAM usage for ${script} from home`);
    ns.exit();
  }


  const maxRam = ns.getServerMaxRam(host);
  const usedRam = ns.getServerUsedRam(host);
  const buffer = 2; // Reserve 2GB buffer
  const availableRam = Math.max(0, maxRam - usedRam - buffer);

  if (availableRam < scriptRam) {
    ns.print(`❌ ${host} cannot run ${script}. Not enough RAM (needs ${scriptRam} GB, has ${availableRam.toFixed(2)} GB).`);
    ns.exit();
  }

  const threads = Math.floor(availableRam / scriptRam);


  const pid = ns.exec(script, host, threads, server);
  if (pid === 0) {
    await ns.sleep(500);
    ns.exec(script, host, threads, server);
  }

  ns.print(`${action} executed on ${host} targeting ${server} with ${threads} threads`);
}
