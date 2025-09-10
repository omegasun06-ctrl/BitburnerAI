
/** @param {NS} ns **/
/** @require Singularity **/

export async function main(ns) {
    const moneyFocus = ns.args.includes("--money");

    const crimes = [
        { name: "Shoplift", karma: 0.1, money: 1500 },
        { name: "Rob store", karma: 0.5, money: 5000 },
        { name: "Mug someone", karma: 1.0, money: 7000 },
        { name: "Larceny", karma: 2.0, money: 12000 },
        { name: "Deal Drugs", karma: 3.0, money: 40000 },
        { name: "Bond Forgery", karma: 4.0, money: 60000 },
        { name: "Traffick Arms", karma: 5.0, money: 80000 },
        { name: "Homicide", karma: 10.0, money: 150000 },
        { name: "Grand Theft Auto", karma: 8.0, money: 120000 },
        { name: "Kidnap", karma: 6.0, money: 100000 },
        { name: "Assassination", karma: 15.0, money: 300000 },
        { name: "Heist", karma: 12.0, money: 250000 },
    ];

    function initializeKarmaHud() {
        const d = eval("document");
        let hudElement = d.getElementById("karma-display-1");
        if (hudElement !== null) return hudElement;

        const overview = d.getElementById("overview-extra-hook-0").parentElement.parentElement;
        const karmaTracker = overview.cloneNode(true);

        karmaTracker.querySelectorAll("p > p").forEach(e => e.parentElement.removeChild(e));
        karmaTracker.querySelectorAll("p").forEach((e, i) => e.id = `karma-display-${i}`);

        hudElement = karmaTracker.querySelector("#karma-display-1");
        karmaTracker.querySelectorAll("p")[0].innerText = "Karma";
        hudElement.innerText = "0.00";

        overview.parentElement.insertBefore(karmaTracker, overview.parentElement.childNodes[2]);
        return hudElement;
    }

    function updateKarmaHud(ns, hudElement) {
        const karma = ns.heart.break();
        hudElement.innerText = karma.toFixed(2);
    }

    function gangUnlockCheck(ns) {
        const karma = ns.heart.break();
        const stats = ns.getPlayer();
        const combatReady = ["strength", "defense", "dexterity", "agility"]
            .every(stat => stats[stat] >= 30);

        if (karma <= -54000 && combatReady) {
            ns.tprint("🚨 Gang unlock conditions met! You can now create a gang.");
        } else if (karma <= -50000) {
            ns.print(`⚠️ Karma is low (${karma.toFixed(2)}). Gang unlock approaching...`);
        }
    }

    async function trainCombatStats(ns) {
        const gymCity = "Sector-12";
        const gymName = "Powerhouse Gym";
        const statsToTrain = ["Strength", "Defense", "Dexterity", "Agility"];

        if (ns.getPlayer().city !== gymCity) {
            ns.singularity.travelToCity(gymCity);
        }

        for (const stat of statsToTrain) {
            ns.print(`Training ${stat} at ${gymName}...`);
            await ns.singularity.gymWorkout(gymName, stat, false);
            await ns.sleep(60000); // train for 1 minute per stat
        }
    }

    const hudElement = initializeKarmaHud();

    while (true) {
        let bestCrime = null;
        let bestScore = 0;

        for (const crime of crimes) {
            const chance = ns.singularity.getCrimeChance(crime.name);
            const reward = moneyFocus ? crime.money : crime.karma;
            const score = chance * reward;

            if (score > bestScore) {
                bestScore = score;
                bestCrime = crime.name;
            }
        }

        updateKarmaHud(ns, hudElement);
        gangUnlockCheck(ns);

        const chance = ns.singularity.getCrimeChance(bestCrime);
        if (chance < 0.5) {
            ns.print(`⚠️ Low success chance (${(chance * 100).toFixed(1)}%) for ${bestCrime}. Training combat stats...`);
            await trainCombatStats(ns);
            continue;
        }

        ns.print(`Committing: ${bestCrime} (Focus: ${moneyFocus ? "Money" : "Karma"})`);
        const time = ns.singularity.getCrimeStats(bestCrime).time;
        await ns.singularity.commitCrime(bestCrime, false);
        await ns.sleep(time + 100);
    }
}
