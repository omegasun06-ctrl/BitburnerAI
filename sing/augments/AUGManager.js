/** @param {NS} ns **/
/** @require Singularity **/
export async function main(ns) {
    const focus = ns.args[0] ? ns.args[0].toUpperCase() : "HACKING";
    const silent = ns.args.includes("--silent");
    const threshold = 10000.0;

    const owned = ns.singularity.getOwnedAugmentations(true);
    const factions = ns.getPlayer().factions;
    let purchasable = [];

    // Helper: Get score based on focus
    function getFocusScore(stats, focus) {
        const relevantStats = {
            HACKING: ['hacking', 'hacking_exp'],
            COMBAT: ['strength', 'defense', 'dexterity', 'agility'],
            CHA: ['charisma', 'charisma_exp'],
            REP: ['faction_rep']
        };

        return relevantStats[focus]
            .map(stat => stats[stat] && stats[stat] > 1.0 ? (stats[stat] - 1) * 100 : 0)
            .reduce((a, b) => a + b, 0);
    }

    // Collect all purchasable augmentations
    for (const faction of factions) {
        const augs = ns.singularity.getAugmentationsFromFaction(faction);
        for (const aug of augs) {
            if (owned.includes(aug)) continue;

            const repReq = ns.singularity.getAugmentationRepReq(aug);
            const cost = ns.singularity.getAugmentationPrice(aug);
            const rep = ns.singularity.getFactionRep(faction);
            const stats = ns.singularity.getAugmentationStats(aug);

            const score = getFocusScore(stats, focus);
            if (score === 0) continue; // skip irrelevant augments

            if (rep >= repReq && ns.getPlayer().money >= cost) {
                const value = cost > 0 ? score / cost : 0;
                purchasable.push({ aug, faction, cost, value, stats });
            }
        }
    }

    // Purchase loop with dynamic re-sorting
    while (purchasable.length > 0) {
    purchasable.sort((a, b) => b.value - a.value);
    const { aug, faction, cost, stats } = purchasable[0];

    if (ns.getPlayer().money < cost) {
        ns.tprint(`Stopping: Not enough money for ${aug} (${ns.formatNumber(cost)}).`);
        break;
    }

    purchasable.shift(); // remove from list

    if (!silent) {
        const statSummary = Object.entries(stats)
            .filter(([_, val]) => val > 1.0)
            .map(([key, val]) => ({ key, boost: (val - 1) * 100 }))
            .sort((a, b) => b.boost - a.boost)
            .map(({ key, boost }) => `${key}: +${boost.toFixed(1)}%`)
            .join(", ");

        const confirm = await ns.prompt(
            `Purchase ${aug} from ${faction} for ${ns.formatNumber(cost)}?\nStats: ${statSummary}`
        );
        if (!confirm) continue;
    }

    ns.singularity.purchaseAugmentation(faction, aug);

    // Recalculate costs and scores for remaining augs
    for (const item of purchasable) {
        const newCost = ns.singularity.getAugmentationPrice(item.aug);
        const newScore = getFocusScore(item.stats, focus);
        item.cost = newCost;
        item.value = newCost > 0 ? newScore / newCost : 0;
    }
}

    // NeuroFlux Governor logic
    const governor = "NeuroFlux Governor";
    let bestFaction = null;
    let bestRep = 0;

    for (const faction of factions) {
        const augs = ns.singularity.getAugmentationsFromFaction(faction);
        if (augs.includes(governor)) {
            const rep = ns.singularity.getFactionRep(faction);
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
            const rep = ns.singularity.getFactionRep(bestFaction);
            if (rep < repReq || ns.getPlayer().money < cost) break;

            if (!silent) ns.tprint(`Purchasing ${governor} from ${bestFaction} for ${ns.formatNumber(cost)}`);
            ns.singularity.purchaseAugmentation(bestFaction, governor);
            await ns.sleep(100);
        }
    }

    // Install augmentations if threshold met
    const pending = ns.singularity.getOwnedAugmentations(false);
    let costMultiplier = 0;
    let multiplierSamples = 0;

    for (const aug of pending) {
        const base = ns.singularity.getAugmentationBasePrice(aug);
        const price = ns.singularity.getAugmentationPrice(aug);
        if (base > 0) {
            costMultiplier += price / base;
            multiplierSamples++;
        }
    }

    costMultiplier = multiplierSamples > 0 ? (costMultiplier / multiplierSamples) * 100 : 0;

    if (pending.length > 0 && costMultiplier >= threshold) {
        ns.tprint("Installing augmentations and rebooting...");
        ns.singularity.installAugmentations("/sing/autostart.js");
    } else {
        ns.tprint("Not installing yet. Waiting for cost multiplier threshold.");
    }
}