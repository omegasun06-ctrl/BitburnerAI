/** @param {NS} ns */
import { servers64MB, 
servers32MB, 
servers16MB, 
serversLowMem, 
serversNoMem, 
//import { serversLocal } from '/daemons/yRepo.js';
 serversAll } from '/scripts/arrayRepo.js';
export async function main(ns) {
  ns.killall("home", 1);
  const args = ns.flags([["target", false]]); 
  // if no target find the one with the most avail money
  if (args.target || args._.length < 1) {
    var cash = 0;
    for (let i = 0; i < serversAll.length; i++) {
      const serv = serversAll[i];
    if (ns.getServerMoneyAvailable(serv) > cash) {
      	if (ns.hasRootAccess(serv) && ns.getServerRequiredHackingLevel(serv) <= ns.getHackingLevel()){
      cash = ns.getServerMoneyAvailable(serv);
      target = serv;
        }
    }
  }
    }
  
  else {
    var target = args._[0];
  }
  const serversLocal=ns.getPurchasedServers();
  for (let i = 0; i < serversLocal.length; ++i) {
    const serv = serversLocal[i];
    //ns.tprint(`servesr: ${serv}`)
    ns.killall(serv, 1);
    ns.scp("/daemons/hack.js", serv);
    ns.scp("/daemons/weaken.js", serv);
    ns.scp("/daemons/grow.js", serv);
    ns.scp("/utils.js", serv);

    const mem = ns.getServerMaxRam(serv);
    const scriptmem = ns.getScriptRam("/daemons/hack.js", "home");
    const threads = Math.floor(mem / scriptmem);

    ns.exec("/daemons/weaken.js", serv, Math.floor(threads / 3), target);
    ns.exec("/daemons/grow.js", serv, Math.floor(threads / 3), target);
    ns.exec("/daemons/hack.js", serv, Math.floor(threads / 3), target);

  }

  for (let i = 0; i < serversLowMem.length; ++i) {
    const serv = serversLowMem[i];
    const mem = ns.getServerMaxRam(serv);
    const scriptmem = ns.getScriptRam("/daemons/grow.js", "home");
    const threads = Math.floor(mem / scriptmem);

    ns.killall(serv, 1);
    ns.scp("/daemons/hack.js", serv);
    ns.scp("/daemons/weaken.js", serv);
    ns.scp("/daemons/grow.js", serv);
    ns.scp("/utils.js", serv);
    if (ns.fileExists("BruteSSH.exe", "home")) {
        ns.brutessh(serv);
    }
        if (ns.fileExists("FTPCrack.exe", "home")) {
        ns.ftpcrack(serv);
    }
    //ns.nuke(serv);


    ns.exec("/daemons/weaken.js", serv, Math.floor(threads / 2), target);
    ns.exec("/daemons/grow.js", serv, Math.floor(threads / 2), target);
  }


  // Copy our daemons  each server that requires 0 ports
  // to gain root access. Then use nuke() to gain admin access and
  // run the daemonsor (let i = 0; i < servers16MB.length; ++i) {
  for (let i = 0; i < servers16MB.length; ++i) {
    const serv = servers16MB[i];
    ns.killall(serv, 1);
    ns.scp("/daemons/hack.js", serv);
    ns.scp("/daemons/weaken.js", serv);
    ns.scp("/daemons/grow.js", serv);
    if (ns.fileExists("BruteSSH.exe", "home")) {
        ns.brutessh(serv);
    }
        if (ns.fileExists("FTPCrack.exe", "home")) {
        ns.ftpcrack(serv);
    }
    //ns.nuke(serv);
    ns.exec("/daemons/weaken.js", serv, 2, target);
    ns.exec("/daemons/grow.js", serv, 2, target);
    ns.exec("/daemons/hack.js", serv, 5, target);
    //ns.exec("/daemons/hack.js", serv, 8, target);
  }

  // Wait until we acquire the "BruteSSH.exe" program
  // Copy our daemons  each server that requires 1 port
  // to gain root access. Then use brutessh() and nuke()
  // to gain admin access and run the daemonsor (let i = 0; i < servers32MB.length; ++i) {
  for (let i = 0; i < servers32MB.length; ++i) {
    const serv = servers32MB[i];
    ns.killall(serv, 1);
    ns.scp("/daemons/hack.js", serv);
    ns.scp("/daemons/weaken.js", serv);
    ns.scp("/daemons/grow.js", serv);
    if (ns.fileExists("BruteSSH.exe", "home")) {
        ns.brutessh(serv);
    }
        if (ns.fileExists("FTPCrack.exe", "home")) {
        ns.ftpcrack(serv);
    }
    //ns.nuke(serv);
    ns.exec("/daemons/weaken.js", serv, 4, target);
    ns.exec("/daemons/grow.js", serv, 4, target);
    ns.exec("/daemons/hack.js", serv, 10, target);
    //ns.exec("/daemons/hack.js", serv, 17, target);
  }

  // Wait until we acquire the "FTPCrack.exe" program
  for (let i = 0; i < servers64MB.length; ++i) {
    const serv = servers64MB[i];
    // ns.tprint(serv);
    ns.killall(serv, 1);
    ns.scp("/daemons/hack.js", serv);
    ns.scp("/daemons/weaken.js", serv);
    ns.scp("/daemons/grow.js", serv);
    if (ns.fileExists("BruteSSH.exe", "home")) {
        ns.brutessh(serv);
    }
        if (ns.fileExists("FTPCrack.exe", "home")) {
        ns.ftpcrack(serv);
    }
    //ns.nuke(serv);
    //ns.exec("/daemons/weaken.js", serv, 8, target);
    //ns.exec("/daemons/grow.js", serv, 8, target);
    //ns.exec("/daemons/hack.js", serv, 20, target);
    ns.exec("/daemons/hack.js", serv, 350, target);
  }

  ns.exec("/scripts/hacking/MCP.js", "home", 1);
  ns.exec("/scripts/hacking/crawler.js", "home", 1);
  ns.exec("/hacking/batcher.js", "home", 1, target);
  //ns.exec("/stock-market/autopilot.js", "home", 1);
  //ns.exec("/daemons/weaken.js", "home", 700, target);
  //ns.exec("/daemons/grow.js", "home", 200, target);
  //ns.exec("/daemons/hack.js", "home", 700, target);
  //ns.exec("/factions/share.js", "home", 1);
}
