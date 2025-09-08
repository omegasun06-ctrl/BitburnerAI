/** @param {NS} ns **/
export async function main(ns) {
    const args = ns.args;
    const focusEnabled = args.includes("--focus");
    const focusType = args.find(arg => ["HACKING", "COMBAT", "REP", "CHA"].includes(arg)) || null;

    const joinedFactions = ns.getPlayer().factions;
    const allFactions = ns.singularity.checkFactionInvitations();
    const factionAugments = {};
    const focusStats = {
        HACKING: ["hacking"],
        COMBAT: ["strength", "defense", "dexterity", "agility"],
        REP: ["rep"],
        CHA: ["charisma"]
    };

    function getFactionAugments(faction) {
        return ns.singularity.getAugmentationsFromFaction(faction).map(aug => ({
            name: aug,
            stats: ns.singularity.getAugmentationStats(aug),
            repReq: ns.singularity.getAugmentationRepReq(aug),
            cost: ns.singularity.getAugmentationPrice(aug)
        }));
    }

    function scoreAugment(aug) {
        if (!focusEnabled || !focusType) return 0;
        const stats = focusStats[focusType];
        return stats.reduce((sum, stat) => sum + (aug.stats[stat] || 0), 0) / aug.cost;
    }

    function bestWorkType(faction) {
        const types = ["Hacking", "Field", "Security"];
        let bestType = "Field";
        let bestGain = 0;
        for (const type of types) {
            const gain = ns.getFactionRepGain(faction, type);
            if (gain > bestGain) {
                bestGain = gain;
                bestType = type;
            }
        }
        return bestType;
    }

    for (const faction of allFactions) {
        if (joinedFactions.includes(faction)) continue;

        const augments = getFactionAugments(faction);
        factionAugments[faction] = augments;

        const score = augments.reduce((sum, aug) => sum + scoreAugment(aug), 0);
        if (focusEnabled && score === 0) continue;

        ns.tprint(`Joining faction: ${faction}`);
        ns.singularity.joinFaction(faction);

        const requiredCity = ns.getFactionRequiredCity(faction);
        if (requiredCity && ns.getPlayer().city !== requiredCity) {
            ns.singularity.travelToCity(requiredCity);
        }

        const workType = bestWorkType(faction);
        ns.singularity.workForFaction(faction, workType, false);
        ns.tprint(`Started working for ${faction} as ${workType}`);
    }
}
