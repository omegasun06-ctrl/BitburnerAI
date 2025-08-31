/** @param {NS} ns */
export async function main(ns) {
await ns.exec("/scripts/hacking/worm.js", "home", 1, "n00dles");
await ns.exec("/scripts/execute.js", "home", 1, "grow", "n00dles", "n00dles");
await ns.exec("/scripts/hacking/worm.js", "home", 1, "foodnstuff");
await ns.exec("/scripts/execute.js", "home", 1, "weaken", "foodnstuff", "foodnstuff");
}