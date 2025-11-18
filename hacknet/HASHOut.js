/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("sleep");
    ns.disableLog("hacknet.spendHashes");

    while (true) {
        let sold = 0;
        while (ns.hacknet.spendHashes("Sell for Money")) {
            sold++;
        }

        if (sold > 0) {
            ns.print(`💸 Sold ${sold} batches of hashes for cash.`);
        }

        await ns.sleep(50); // Adjust if needed
    }
}
