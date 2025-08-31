
/** @param {NS} ns **/
export async function main(ns) {
    const servers = ns.getPurchasedServers();

    for (const server of servers) {
        const ram = ns.getServerMaxRam(server);

        if (ram < 8) {
            ns.deleteServer(server);
            ns.tprint(`Deleted ${server} (RAM: ${ram}GB)`);
        }
    }
}
