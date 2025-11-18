/** @param {NS} ns **/
export async function main(ns) {

  let targetRam = 0;
  const initRam = parseInt(ns.args[0]);
  if (initRam > 30 )
  {targetRam = initRam}
  else
  {targetRam = Math.pow(2, initRam)}
  
  if (isNaN(targetRam) || targetRam <= 0) {
    ns.tprint("ERROR: Please provide a valid RAM value as the first argument.");
    return;
  }

  const targetCount = ns.args.length > 1 ? parseInt(ns.args[1]) : 0;
  if (ns.args.length > 1 && (isNaN(targetCount) || targetCount < 0)) {
    ns.tprint("ERROR: Second argument must be a non-negative number (or omitted).");
    return;
  }


  function getLowestRamServer(servers) {
    return servers.reduce((lowest, current) => {
      return ns.getServerMaxRam(current) < ns.getServerMaxRam(lowest) ? current : lowest;
    }, servers[0]);
  }

  function getNextServerName(existing) {
    let i = 0;
    while (existing.includes(`${i}-pserv`)) {
      i++;
    }
    return `${i}-pserv`;
  }
let pservers = ns.getPurchasedServers();
const maxServers = ns.getPurchasedServerLimit();
  const costPerServer = ns.getPurchasedServerCost(targetRam);
  let created = 0;
  let totalCost = 0;

ns.tprint(`Target RAM: ${targetRam}GB`);
ns.tprint(`Cost per server: \$${ns.formatNumber(costPerServer)}`);

// RAM breakdown
const ramCounts = {};
let upgradeNeeded = 0;

for (const server of pservers) {
    const ram = ns.getServerMaxRam(server);
    ramCounts[ram] = (ramCounts[ram] || 0) + 1;
    if (ram < targetRam) upgradeNeeded++;
}

const breakdown = Object.keys(ramCounts)
  .sort((a, b) => b - a)
  .map(ram => {
    const exp = Math.log2(Number(ram));
    return `${ram}:${ramCounts[ram]} (${exp})`;
  })
  .join("  ");

ns.tprint(`📊 Current Servers: ${breakdown}  # servers to be upgraded: ${upgradeNeeded}`);

  while (true) {
    pservers = ns.getPurchasedServers();

    // Stop if we've created enough servers
    if (targetCount > 0 && created >= targetCount) break;

    // Can we buy a new server?
    if (pservers.length < maxServers) {
      if (ns.getServerMoneyAvailable("home") >= costPerServer) {
        const name = getNextServerName(pservers);
        ns.purchaseServer(name, targetRam);
        created++;
        totalCost += costPerServer;
      } else {
        if (targetCount > 0) {
          ns.tprint("Not enough money to continue purchasing.");
          break;
        } else {
          await ns.sleep(5000); // Wait and retry
          continue;
        }
      }
    } else {
      // Replace lowest RAM server if needed
     
const lowest = getLowestRamServer(pservers);
const lowestRam = ns.getServerMaxRam(lowest);

if (lowestRam < targetRam) {
    if (ns.getServerMoneyAvailable("home") >= costPerServer) {
        ns.killall(lowest);
        ns.deleteServer(lowest);
        const name = getNextServerName(pservers.filter(s => s !== lowest));
        ns.purchaseServer(name, targetRam);
        created++;
        totalCost += costPerServer;
    } else {
        if (targetCount > 0) {
            ns.tprint("Not enough money to continue replacing.");
            break;
        } else {
            await ns.sleep(5000); // Wait and retry
            continue;
        }
    }
} else {
    break;
}

    }

    await ns.sleep(100);
  }

  ns.tprint(`\n✅ Summary:`);
  ns.tprint(`Servers purchased: ${created}`);
  ns.tprint(`Total cost: \$${ns.formatNumber(totalCost)}`);
}