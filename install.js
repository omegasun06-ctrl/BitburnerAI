/** @param {NS} ns **/
export async function main(ns) {
  ns.tprint("🧹 Killing all scripts...");
  ns.killall();

  await ns.sleep(1000); // Give time for scripts to terminate

  ns.tprint("💾 Running HASHout and CASHout scripts...");
  ns.run("/hacknet/HASHout.js", 1);
  ns.run("/stock-manager/CASHout.js", 1);

  await ns.sleep(2000); // Let those scripts initialize

  ns.tprint("🧬 Installing augmentations...");
  ns.run("/sing/augments/purchase.js", 1, "--install");
}