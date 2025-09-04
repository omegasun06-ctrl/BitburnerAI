
/** @param {NS} ns **/
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

    while (true) {
        let bestCrime = null;
        let bestScore = 0;
        
         const karma = ns.heart.break();
        ns.clearPort(1); // optional: if you're using ports for HUD coordination
        ns.tail(); // optional: opens the script window
        ns.atExit(() => ns.clearLog()); // optional: clean exit

        // HUD line for Karma
        ns.print(`Karma: ${karma.toFixed(2)}`);
        ns.setTitle(`Karma: ${karma.toFixed(2)}`); // This sets the HUD line under CHA


        for (const crime of crimes) {
            const chance = ns.getCrimeChance(crime.name);
            const reward = moneyFocus ? crime.money : crime.karma;
            const score = chance * reward;

            if (score > bestScore) {
                bestScore = score;
                bestCrime = crime.name;
            }
        }

        if (bestCrime) {
            ns.tprint(`Committing: ${bestCrime} (Focus: ${moneyFocus ? "Money" : "Karma"})`);
            const time = ns.getCrimeStats(bestCrime).time;
            await ns.commitCrime(bestCrime);
            await ns.sleep(time + 100); // buffer
        } else {
            ns.tprint("No viable crimes found.");
            await ns.sleep(1000);
        }
    }
}
