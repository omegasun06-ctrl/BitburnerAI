/** @param {NS} ns **/
export async function main(ns) {
    const focus = ns.args[0] ? ns.args[0].toUpperCase() : "HACKING";
    const silent = ns.args.includes("--silent");
    const threshold = 5.0;

    const multipliers = ns.getBitNodeMultipliers();
    const costMultiplier = multipliers.AugmentationCost;

    const owned = ns.singularity.getOwnedAugmentations(true);
    const factions = ns.getPlayer().factions;
    let purchasable = [];

    for (const faction of factions) {
        const augs = ns.singularity.getAugmentationsFromFaction(faction);
        for (const aug of augs) {
            if (owned.includes(aug)) continue;
            const repReq = ns.singularity.getAugmentationRepReq(aug);
            const cost = ns.singularity.getAugmentationPrice(aug);
            const rep = ns.getFactionRep(faction);
            if (rep >= repReq && ns.getPlayer().money >= cost) {
                let score = 0;
                const stats = ns.singularity.getAugmentationStats(aug);
                if (focus === "HACKING") score = stats.hacking + stats.hacking_exp;
                else if (focus === "COMBAT") score = stats.strength + stats.defense + stats.dexterity + stats.agility;
                else if (focus === "CHA") score = stats.charisma + stats.charisma_exp;
                else if (focus === "REP") score = stats.faction_rep;
                const value = score / cost;
                purchasable.push({ aug, faction, cost, value });
            }
        }
    }

    purchasable.sort((a, b) => b.value - a.value);

    for (const { aug, faction, cost } of purchasable) {
        if (!silent) {
            const confirm = await ns.prompt(`Purchase ${aug} from ${faction} for ${ns.formatNumber(cost)}?`);
            if (!confirm) continue;
        }
        ns.singularity.purchaseAugmentation(faction, aug);
    }

    // NeuroFlux Governor dump
    const governor = "NeuroFlux Governor";
    let bestFaction = null;
    let bestRep = 0;
    for (const faction of factions) {
        const augs = ns.singularity.getAugmentationsFromFaction(faction);
        if (augs.includes(governor)) {
            const rep = ns.getFactionRep(faction);
            if (rep > bestRep) {
                bestRep = rep;
                bestFaction = faction;
            }
        }
    }

    if (bestFaction) {
        while (true) {
            const cost = ns.singularity.getAugmentationPrice(governor);
            const repReq = ns.singularity.getAugmentationRepReq(governor);
            const rep = ns.getFactionRep(bestFaction);
            if (rep < repReq || ns.getPlayer().money < cost) break;
            ns.singularity.purchaseAugmentation(bestFaction, governor);
            await ns.sleep(100);
        }
    }

    const pending = ns.singularity.getOwnedAugmentations(false);
    if (pending.length > 0 && costMultiplier >= threshold) {
        ns.tprint("Installing augmentations and rebooting...");
        ns.singularity.installAugmentations("bitnode_startup.js");
    } else {
        ns.tprint("Not installing yet. Waiting for cost multiplier threshold.");
    }
}
