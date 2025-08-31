/** @param {NS} ns */
export async function main(ns) {
   
   while (1 == 1) {
   let mem = Math.floor(ns.getServerMaxRam-ns.getServerUsedRam-2.5);
   await ns.share(mem);
   }

}