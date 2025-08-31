
/** @param {NS} ns **/
export async function main(ns) {
  const dir = ns.args[0];
  await ns.write(`${dir}/.keep`, "", "w"); // creates the folder by writing a dummy file
}
