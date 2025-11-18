/** @param {NS} ns */
export async function main(ns) {
  // Nuke all servers with 0 required ports and get a list of all servers.
  const allServers = ns.scan("home");
  const hackableServers = [];
  const visited = new Set(["home"]);

  while (allServers.length > 0) {
    const server = allServers.shift();
    if (visited.has(server)) {
      continue;
    }
    visited.add(server);
    
    // Check if the server requires 0 ports and we can nuke it
    if (ns.getServerNumPortsRequired(server) === 0 && !ns.hasRootAccess(server)) {
      ns.nuke(server);
      ns.tprint(`INFO: Nuked ${server}`);
    }

    // Add server to list if we have root access
    if (ns.hasRootAccess(server)) {
      hackableServers.push(server);
    }
    
    // Add new servers to the list to scan
    for (const newServer of ns.scan(server)) {
      if (!visited.has(newServer)) {
        allServers.push(newServer);
      }
    }
  }

  // Calculate and run as many hack scripts as possible
  const hackScript = "daemons/hack.js";
  const serverToHack = "foodnstuff";
  
  if (ns.fileExists(hackScript) && ns.hasRootAccess(serverToHack)) {
    const hackRam = ns.getScriptRam(hackScript);
    const availableRam = ns.getServerMaxRam("home") - ns.getServerUsedRam("home");
    const threads = Math.floor(availableRam / hackRam);

    if (threads > 0) {
      ns.tprint(`INFO: Running ${hackScript} on ${serverToHack} with ${threads} threads.`);
      ns.exec(hackScript, "home", threads, serverToHack);
    } else {
      ns.tprint(`WARN: Not enough RAM to run ${hackScript}. Available RAM: ${availableRam}GB, Script RAM: ${hackRam}GB.`);
    }
  } else {
    ns.tprint(`ERROR: Script ${hackScript} or target ${serverToHack} not found or not hackable.`);
  }

  // Run HACKManager.js
  const hackManagerScript = "/hacking/HACKManager.js";
  if (ns.fileExists(hackManagerScript)) {
    ns.tprint(`INFO: Executing ${hackManagerScript}.`);
    ns.exec(hackManagerScript, "home");
  } else {
    ns.tprint(`ERROR: ${hackManagerScript} not found.`);
  }

  // Train strength and join factions
  while (ns.getPlayer().strength < 100) {
    const currentStr = ns.getPlayer().strength;
    ns.tprint(`INFO: Training strength. Current: ${currentStr}`);
    
    // Start training at Powerhouse Gym if not already training
    if (ns.singularity.isBusy() && ns.singularity.getCurrentlyTraining().type !== "gym") {
      ns.singularity.stopAction();
    }
    if (!ns.singularity.isBusy()) {
      ns.singularity.gymWorkout("Powerhouse Gym", "strength", false);
    }
    
    // Join factions as they become available
    const factions = ["CyberSec", "Tian Di Hui", "Netburners"]; // Example factions
    for (const faction of factions) {
      if (ns.joinFaction(faction)) {
        ns.tprint(`SUCCESS: Joined faction ${faction}.`);
      }
    }

    await ns.sleep(60000); // Check every minute
  }

  // Commit homicide until karma is -54,000
  while (ns.heart.break() > -54000) {
    ns.tprint(`INFO: Committing homicide. Current Karma: ${ns.heart.break()}`);
    // The ns.commitCrime function is for crime. ns.heart.break() is a direct function for karma.
    // To train combat, you'd use ns.commitCrime with a crime like "Homicide".
    // Let's use the correct function to train crime.
    if (!ns.singularity.isBusy()) {
      ns.singularity.commitCrime("Homicide", true);
    }
    await ns.sleep(60000); // Check every minute
  }
}