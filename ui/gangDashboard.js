/** @param {NS} ns **/
export async function renderGangDashboard(ns) {
    const gangInfo = ns.gang.getGangInformation();
    const members = ns.gang.getMemberNames();

    ns.tail();
    ns.clearLog();
    ns.disableLog("ALL");

    ns.print("=== 👥 Gang Dashboard ===");
    ns.print(`Gang: ${gangInfo.faction}`);
    ns.print(`Type: ${gangInfo.isHacking ? "Hacking" : "Combat"}`);
    ns.print(`Members: ${members.length}`);
    ns.print(`Respect Gain Rate: ${gangInfo.respectGainRate.toFixed(2)}`);
    ns.print(`Money Gain Rate: \$${gangInfo.moneyGainRate.toFixed(2)}`);
    ns.print(`Territory: ${(gangInfo.territory * 100).toFixed(2)}%`);
    ns.print(`Warfare: ${gangInfo.territoryWarfareEngaged ? "Engaged" : "Inactive"}`);
    ns.print(" ");

    // === Summary Stats ===
    let totalStats = { str: 0, def: 0, dex: 0, agi: 0, hack: 0 };
    let taskCounts = {};

    for (const member of members) {
        const stats = ns.gang.getMemberInformation(member);
        if (!stats) continue;

        totalStats.str += stats.str || 0;
        totalStats.def += stats.def || 0;
        totalStats.dex += stats.dex || 0;
        totalStats.agi += stats.agi || 0;
        totalStats.hack += stats.hack || 0;

        const task = stats.task || "Unknown";
        taskCounts[task] = (taskCounts[task] || 0) + 1;
    }

    const avg = (val) => (val / members.length).toFixed(1);

    ns.print("=== 📊 Member Summary ===");
    ns.print(`Avg STR: ${avg(totalStats.str)} | DEF: ${avg(totalStats.def)} | DEX: ${avg(totalStats.dex)} | AGI: ${avg(totalStats.agi)} | HACK: ${avg(totalStats.hack)}`);
    ns.print(" ");

    ns.print("=== 🧠 Task Breakdown ===");
    for (const [task, count] of Object.entries(taskCounts)) {
        ns.print(`${task}: ${count}`);
    }
}