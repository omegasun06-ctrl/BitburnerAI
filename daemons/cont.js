/** @param {NS} ns */
export async function main(ns) {
  while( true ) {
    ns.exec("/contracts/contractor.js", "home", 1);
    await ns.sleep(600000);
  }

}