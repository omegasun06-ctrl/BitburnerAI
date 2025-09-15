/** @param {NS} ns **/
import { getAllServers } from "/utils.js";

export async function main(ns) {
  const file = ns.args[0];
  if (!file) {
    ns.tprint("❌ Usage: run scp-to-all.js [filename]");
    return;
  }

  if (!ns.fileExists(file, "home")) {
    ns.tprint(`❌ File "${file}" does not exist on home.`);
    return;
  }

  const servers = getAllServers(ns);
  let failed = [];

  for (const server of servers) {
    if (server === "home") continue;

    await ns.scp(file, server, "home");

    if (!ns.fileExists(file, server)) {
      ns.print(`❌ Failed to copy ${file} to ${server}`);
      failed.push(server);
    } else {
      ns.print(`📦 Copied ${file} to ${server}`);
    }
  }

  if (failed.length > 0) {
    ns.tprint(`❌ SCP failed on ${failed.length} server(s): ${failed.join(", ")}`);
  } else {
    ns.tprint(`✅ Successfully copied "${file}" to all servers.`);
  }
}
