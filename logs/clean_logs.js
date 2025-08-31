
/** @param {NS} ns **/
export async function main(ns) {
    for (const f of ns.ls("home", "/logs")) {
        if (f.endsWith(".txt")) ns.rm(f);
    }
}
