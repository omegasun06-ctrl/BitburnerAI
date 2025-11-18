/** @param {NS} ns **/
export async function main(ns) {
    // --- Configuration ---
    const CHARGE_SERVER = "home"; 
    const CHARGE_SCRIPT = "/gift/GIFTHelper.js";
    const BASE_CHARGE_TIME = 1000; // Time the charging operation takes (1000ms base)
    
    // RAM for the HELPER SCRIPT (must be calculated when it runs as a batch)
    // The script must complete one full cycle before the manager re-runs it.
    const HELPER_BASE_RAM = ns.getScriptRam(CHARGE_SCRIPT); 

    if (HELPER_BASE_RAM === 0) {
        ns.tprint(`ERROR: Could not get RAM for ${CHARGE_SCRIPT}. Make sure it exists.`);
        return;
    }

    ns.disableLog('ALL');
    ns.tail();

    if (!ns.stanek.acceptGift) {
        ns.tprint("ERROR: Stanek's Gift not yet accepted. Run this script after installation.");
        return;
    }

    // --- Main Loop: Runs the *single* batch job ---
    while (true) {
        try {
            // Filter: Get only Stat Fragments (limit is non-null AND ID is < 25)
            let fragments = ns.stanek.activeFragments().filter(f => f.limit !== null && f.id < 100);
            
            if (fragments.length === 0) {
                ns.print("No Stat Fragments placed. Sleeping for 10 seconds.");
                await ns.sleep(10000);
                continue;
            }

            const serverMaxRam = ns.getServerMaxRam(CHARGE_SERVER);
            const serverUsedRam = ns.getServerUsedRam(CHARGE_SERVER);
            const availableRam = serverMaxRam - serverUsedRam;

            // Calculate threads using ALL available RAM for the single helper instance
            let threads = Math.floor(availableRam / HELPER_BASE_RAM);

            if (threads < fragments.length) {
                ns.print(`WARNING: Only ${threads} threads available, less than ${fragments.length} fragments. Charge will be slow.`);
            } else if (threads === 0) {
                ns.print("Not enough RAM to launch the batch charge helper. Waiting...");
                await ns.sleep(5000);
                continue;
            }

            // OPTIONAL: Sort fragments to ensure even charging distribution
            // Although threads are now batched, this ensures the lowest charged fragment is
            // prioritized within the helper's single execution loop.
            fragments.sort((a, b) => (a.charge + a.power) - (b.charge + b.power));
            
            // 1. Prepare the fragments list for execution (must be JSON stringified)
            const fragmentsJson = JSON.stringify(fragments.map(f => ({x: f.x, y: f.y})));

            ns.print(`Launching batch charge for ${fragments.length} fragments with ${threads} threads.`);

            // 2. Launch the helper script once, using ALL threads and passing the fragment list.
            const pid = ns.exec(
                CHARGE_SCRIPT, 
                CHARGE_SERVER, 
                threads, 
                fragmentsJson // Pass the JSON string as the single argument
            );

            if (pid === 0) {
                ns.print(`FATAL ERROR: Failed to launch batch charge script. PID: ${pid}`);
                await ns.sleep(5000);
                continue;
            }

            // 3. WAIT: The manager must wait for the helper script to run and finish.
            // The charge takes BASE_CHARGE_TIME (1000ms) for EACH fragment in the list.
            // Wait time is based on the number of fragments to allow the cycle to finish.
            const totalWaitTime = BASE_CHARGE_TIME * fragments.length;
            
            ns.print(`Batch initiated (PID: ${pid}). Waiting ${ns.tFormat(totalWaitTime)} for cycle to complete...`);
            await ns.sleep(totalWaitTime + 1000); // Add a 1s buffer.
            
            // OPTIONAL: Kill the script if it somehow ran longer than expected 
            // and the charging process is about to start over.
            if (ns.isRunning(pid, CHARGE_SERVER, fragmentsJson)) {
                 ns.kill(pid);
                 ns.print(`WARNING: Killed lingering charge script (PID: ${pid}).`);
            }

        } catch (e) {
            ns.print(`An error occurred: ${e.message}`);
            await ns.sleep(5000);
        }
    }
}