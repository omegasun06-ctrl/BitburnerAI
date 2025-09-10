/** @param {NS} ns **/
export async function main(ns) {
    const sfLevels = {};
    const sfCount = ns.getOwnedSourceFiles().length;

    // Collect Source File levels
    for (const sf of ns.getOwnedSourceFiles()) {
        sfLevels[sf.n] = sf.lvl;
    }

    const hackingLevel = ns.getHackingLevel();
    const hasSF4 = sfLevels[4] >= 1;
    const hasSF10 = sfLevels[10] >= 1;
    const hasSF8 = sfLevels[8] >= 1;
    const hasSF6 = sfLevels[6] >= 1;
    const hasSF2 = sfLevels[2] >= 1;

    ns.tprint("📊 Your Source Files:");
    for (const [sf, lvl] of Object.entries(sfLevels)) {
        ns.tprint(`  SF${sf}: Level ${lvl}`);
    }

    ns.tprint("\n🧠 Recommended Next BitNode:");

    // Decision logic
    if (!sfLevels[4]) {
        ns.tprint("➡️ BitNode-4 (The Singularity): Unlock automation features.");
    } else if (!sfLevels[10]) {
        ns.tprint("➡️ BitNode-10 (Digital Carbon): Unlock Stanek’s Gift for stat boosts.");
    } else if (!sfLevels[8]) {
        ns.tprint("➡️ BitNode-8 (Ghost of Wall Street): Unlock stock market automation.");
    } else if (!sfLevels[6]) {
        ns.tprint("➡️ BitNode-6 (Bladeburner): Unlock Bladeburner API for automation.");
    } else if (!sfLevels[9]) {
        ns.tprint("➡️ BitNode-9 (Daedalus): Unlock multi-augmentation installs.");
    } else {
        ns.tprint("✅ You’ve unlocked most key Source Files. Consider leveling up SF4, SF10, or tackling challenge nodes like BN-11, BN-12, or BN-13.");
    }

    ns.tprint("\n💡 Tip: Use SF4 + SF10 for powerful automation and stat scaling.");
}
