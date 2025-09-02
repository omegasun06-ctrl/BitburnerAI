import { renderGangDashboard } from "/ui/gangDashboard.js";

/** @param {NS} ns **/
export async function main(ns) {
    const warfareEnabled = true;

    while (true) {
        if (!ns.gang.inGang()) {
            ns.gang.createGang("Slum Snakes");
        }

        await manageGang(ns, warfareEnabled);
        await ns.sleep(5000);
    }
}

async function manageGang(ns, warfareEnabled) {
    recruitMembers(ns);
    ascendMembers(ns);
    assignTasks(ns);
    buyEquipment(ns);
    manageWarfare(ns, warfareEnabled);
    trackEfficiency(ns);
    await renderGangDashboard(ns);
}

function recruitMembers(ns) {
    while (ns.gang.canRecruitMember()) {
        const name = `Ganger-${Date.now()}`;
        ns.gang.recruitMember(name);
        ns.tprint(`Recruited: ${name}`);
    }
}

function ascendMembers(ns) {
    const members = ns.gang.getMemberNames();
    for (const member of members) {
        const ascension = ns.gang.getAscensionResult(member);
        if (ascension && Object.values(ascension).some(mult => mult > 1.5)) {
            ns.gang.ascendMember(member);
            ns.tprint(`Ascended: ${member}`);
        }
    }
}

function assignTasks(ns) {
    const members = ns.gang.getMemberNames();
    const gangInfo = ns.gang.getGangInformation();
    const isHackingGang = gangInfo.isHacking;

    const moneyFocus = gangInfo.moneyGainRate < 1000;
    const respectFocus = gangInfo.respectGainRate < 50;

    for (const member of members) {
        const stats = ns.gang.getMemberInformation(member);
        let task = "Train Combat";

        if (isHackingGang) {
            if (stats.hack < 50) {
                task = "Train Hacking";
            } else if (moneyFocus) {
                task = "Money Laundering";
            } else if (respectFocus) {
                task = "Cyberterrorism";
            } else {
                task = "Ethical Hacking";
            }
        } else {
            if (stats.str < 50 || stats.def < 50 || stats.dex < 50 || stats.agi < 50) {
                task = "Train Combat";
            } else if (moneyFocus) {
                task = "Mug People";
            } else if (respectFocus) {
                task = "Terrorism";
            } else {
                task = "Human Trafficking";
            }
        }

        ns.gang.setMemberTask(member, task);
    }
}

function buyEquipment(ns) {
    const members = ns.gang.getMemberNames();
    const equipment = ns.gang.getEquipmentNames();

    for (const member of members) {
        for (const item of equipment) {
            const cost = ns.gang.getEquipmentCost(item);
            if (ns.getPlayer().money > cost) {
                ns.gang.purchaseEquipment(member, item);
            }
        }
    }
}

function manageWarfare(ns, enabled) {
    if (!enabled) {
        ns.gang.setTerritoryWarfare(false);
        return;
    }

    const gangInfo = ns.gang.getGangInformation();
    const otherGangs = ns.gang.getOtherGangInformation();

    let winChanceSum = 0;
    let gangCount = 0;

    for (const gang in otherGangs) {
        if (gang === gangInfo.faction) continue;
        const chance = ns.gang.getChanceToWinClash(gang);
        winChanceSum += chance;
        gangCount++;
    }

    const avgWinChance = winChanceSum / gangCount;
    ns.gang.setTerritoryWarfare(avgWinChance > 0.6);
}

function trackEfficiency(ns) {
    const gangInfo = ns.gang.getGangInformation();
    ns.clearLog();
    ns.print(`Respect Gain Rate: ${gangInfo.respectGainRate.toFixed(2)}`);
    ns.print(`Money Gain Rate: \$${gangInfo.moneyGainRate.toFixed(2)}`);
    ns.print(`Territory: ${(gangInfo.territory * 100).toFixed(2)}%`);
}