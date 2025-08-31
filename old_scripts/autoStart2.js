/** @param {NS} ns */
export async function main(ns) {
//  const serversAll = ns.exec("/hacking/bestTarget.js", "home", 1);
 // var cash = 0;
 // var target = ns.exec("/hacking/bestTarget.js", "home", 1);
 // for (let i = 0; i < serversAll.length; i++) {
 //   const serv = serversAll[i];
 //   ns.tprint(serv);
 //   if (ns.getServerMoneyAvailable(serv) > cash) {
 //     if (ns.hasRootAccess(serv) && ns.getServerRequiredHackingLevel(serv) <= ns.getHackingLevel()) {
 //       cash = ns.getServerMoneyAvailable(serv);
  //      target = serv;
 //     }
  //  }
 // }
  const localServers = ns.getPurchasedServers();
  //const target = ns.exec("/hacking/bestTarget.js", "home", 1);
  //ns.tprint("target: "+target);
  const target = "omega-net";
if(target.length > 3) {
  for (let i = 0; i < localServers.length; ++i) {
    const serv = localServers[i];
    //ns.tprint(`servesr: ${serv}`)
    ns.killall(serv, 1);
    ns.scp("/daemons/hack.js", serv);
    ns.scp("/daemons/weaken.js", serv);
    ns.scp("/daemons/grow.js", serv);
    ns.scp("/hacking/batcher.js", serv);
    ns.scp("/utils.js", serv);

   // const mem = ns.getServerMaxRam(serv);
   // const scriptmem = ns.getScriptRam("/scripts/autoGrow.js", "home");
   // const threads = Math.floor(mem / scriptmem);

    ns.exec("/hacking/batcher.js", serv, 1, target);
  }
}
  //ns.exec("/stock-market/autopilot.js", "home", 1);

}