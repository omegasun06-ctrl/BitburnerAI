
const BACKDOOR_SERVS = ["CSEC", "avmnite-02h", "I.I.I.I", "run4theh111z"]
const DISABLED_LOGS = ["scan", "run", 'getServerRequiredHackingLevel', 'getHackingLevel', "getServerNumPortsRequired", "fileExists", "hasRootAccess"]


/** @param {NS} ns */
function disable_logs(ns) {
	for (let log of DISABLED_LOGS) {
		ns.disableLog(log)
	}
}

/** @param {NS} ns */
function run_hacks(ns, server, hacks_dict) {
	let hacks = 0
	for (let hack in hacks_dict) {
		if (hacks_dict[hack]) {
			hacks += 1
			switch (hack) {
				case "brute": ns.brutessh(server); break;
				case "ftp": ns.ftpcrack(server); break;
				case "http": ns.httpworm(server); break;
				case "sql": ns.sqlinject(server); break;
				case "smtp": ns.relaysmtp(server); break;
			}
		}
	}
	return hacks
}


/** @param {NS} ns */
export async function main(ns) {
	disable_logs(ns)
	let hacks_dict = {
		"brute": ns.fileExists("BruteSSH.exe"),
		"ftp": ns.fileExists("FTPCrack.exe"),
		"http": ns.fileExists("HTTPWorm.exe"),
		"sql": ns.fileExists("SQLInject.exe"),
		"smtp": ns.fileExists("relaySMTP.exe"),
	}
let hackCount = 0;
for (let hack in hacks_dict) {
		if (hacks_dict[hack]) {
       ns.print(hack+" exists.")
        hackCount += 1
      }
      }
      ns.print("hackCount: "+hackCount)
  
	let server = ns.args[0]

	// Running assumption that hacking level is high enough. This is checked in crawler.js
	ns.print(server, " hacking level:", ns.getServerRequiredHackingLevel(server)," Player Hacking: ", ns.getHackingLevel())
	let req_ports = ns.getServerNumPortsRequired(server)
	if (req_ports <= hackCount && !ns.hasRootAccess(server)) {
    run_hacks(ns, server, hacks_dict)
	     ns.nuke(server)
       	if (ns.hasRootAccess(server)) {
	    	ns.toast(server + " has been hacked")
	  // ----Singularity Required----
		if (BACKDOOR_SERVS.includes(server))
			ns.exec("/sing/tools/backdoor.js", "home", 1, server)
	}
    }
  else if (ns.hasRootAccess(server)) {
    ns.exit()
  }
  else
    {
			ns.print(server + " can not hack. not enough ports open")
			ns.exit()
    }
   

} 


