/** @param {NS} ns **/
export async function main(ns) {
  const logPrefix = "log_masterControl_";
  const otherLogs = ["batch_manager.txt", "stock_profit_log.txt", "trade-log.txt"];
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logFile = `/logs/${logPrefix}${timestamp}.txt`;
  const autoMode = ns.args.includes("--auto");

  // Custom logger
  async function logBoth(message) {
    ns.print(message);
    await ns.write(logFile, `${message}\n`, "a");
  }

  // Clean up old logs
  
const logDir = "/logs/";
const allLogs = ns.ls("home", logDir).filter(f => f.startsWith(`${logDir}${logPrefix}`) && f.endsWith(".txt"));
allLogs.sort().reverse(); // newest first
const logsToDelete = allLogs.slice(3); // keep 3 newest

for (const oldLog of logsToDelete) {
  ns.rm(oldLog);
  await logBoth(`🗑️ Deleted old log: ${oldLog}`);
}

  // Create new log file
  await ns.write(logFile, `📝 Log started at ${new Date().toISOString()}\n`, "w");

  await initialize(ns, autoMode, logBoth);
  await logBoth("✅ Master Control Program finished.");
}

async function initialize(ns, autoMode, logBoth) {
  const managers = [
    { prompt: "Start Stock Market Manager?", path: "/stock-market/STOCKManager.js", name: "Stock Market Manager" },
    { prompt: "Start PServ Manager?", path: "/player/PSManager.js", name: "PServ Manager" },
    //{ prompt: "Start HackNet manager?", path: "/hacknet/HNManager.js", name: "HackNet Manager" },
    { prompt: "Start Hack manager?", path: "/hacking/HACKManager_dev.js", name: "Hack Manager" },
    { prompt: "Start Faction Share?", path: "/factions/share.js", name: "Faction Share" }
  ];

  const runningScripts = ns.ps("home");

  for (const mgr of managers) {
    const alreadyRunning = runningScripts.find(p => p.filename === mgr.path);
    let shouldRun = autoMode || await ns.prompt(mgr.prompt);

    if (shouldRun) {
      if (alreadyRunning) {
        if (autoMode || await ns.prompt(`${mgr.name} is already running. Kill and restart?`)) {
          ns.kill(alreadyRunning.pid);
          await logBoth(`🛑 Killed existing ${mgr.name} (PID: ${alreadyRunning.pid})`);
        } else {
          await logBoth(`⏭️ Skipped ${mgr.name} (already running)`);
          continue;
        }
      }
      const pid = ns.exec(mgr.path, "home", 1);
      await logBoth(`🚀 Started ${mgr.name} (PID: ${pid})`);
    } else {
      await logBoth(`❌ Skipped ${mgr.name} (user declined)`);
    }
  }

}
