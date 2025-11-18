/** @param {NS} ns **/
export async function main(ns) {
    // The single argument is now a JSON string containing the array of fragments to charge.
    const fragmentsJson = ns.args[0];

    if (!fragmentsJson) {
        // This should not happen if the manager script is correct.
        ns.tprint("ERROR: stanekChargeHelper.js received no arguments.");
        return;
    }

    let fragments;
    try {
        fragments = JSON.parse(fragmentsJson);
    } catch (e) {
        ns.tprint(`ERROR: Failed to parse fragment JSON: ${e.message}`);
        return;
    }

    if (!Array.isArray(fragments) || fragments.length === 0) {
        return;
    }
    
    // In a single, highly-threaded script, repeatedly charge the fragments in a loop
    // to keep the charge jobs submitted with minimum overhead.
    while (true) {
        for (const frag of fragments) {
            try {
                // ns.stanek.chargeFragment uses ALL threads this script was launched with.
                // The threads parameter is not passed here, it's inherent to the script's execution.
                await ns.stanek.chargeFragment(frag.x, frag.y);
            } catch (e) {
                // A warning, but the script should not die since it's iterating.
                // We rely on the manager to ensure only valid Stat Fragments are sent.
                // ns.print(`Charge failed for (${frag.x}, ${frag.y}): ${e.message}`);
            }
        }
        
        // This inner loop runs through all fragments and completes a full charge cycle.
        // We can break the 'while(true)' loop and exit, allowing the manager to restart.
        break; 
    }
}