/** @param {NS} ns */
export async function main(ns) {
	let server = ns.args[0];
	ns.scp('/scripts/autoGrow.js', server);
	ns.scp('/scripts/autoHack.js', server);
	ns.scp('/scripts/autoWeaken.js', server);
  ns.scp('/scripts/autoShare.js', server);
}