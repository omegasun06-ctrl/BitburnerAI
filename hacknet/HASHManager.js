/** @param {NS} ns **/
export async function main(ns) {
  const corpEnabled = ns.corporation.hasCorporation();
  const bladeEnabled = ns.bladeburner.inBladeburner();
  const strategy = ns.args[0] || "balanced"; // Set strategy via argument or default to balanced
  // Options: "money", "rep", "training", "corp", "blade", "balanced"
  

  const upgrades = [
    // Money
    {
      name: "Sell for Money",
      fn: ns.hacknet.spendHashes,
      args: ["Sell for Money", 1],
      cost: () => ns.hacknet.hashCost("Sell for Money", 1, true),
      category: "money"
    },
    {
      name: "Sell for Corporation Funds",
      fn: ns.hacknet.spendHashes,
      args: ["Sell for Corporation Funds"],
      cost: () => ns.hacknet.hashCost("Sell for Corporation Funds"),
      category: "",
      condition: () => corpEnabled
    },
    {
      name: "Sell for Corporation Scientific Research",
      fn: ns.hacknet.spendHashes,
      args: ["Sell for Corporation Scientific Research"],
      cost: () => ns.hacknet.hashCost("Sell for Corporation Scientific Research"),
      category: "",
      condition: () => corpEnabled
    },

    // Corporation Focus - Dynamic Choice
    {
      name: "corp",
      fn: () => {
        const fundsCost = ns.hacknet.hashCost("Sell for Corporation Funds");
        const researchCost = ns.hacknet.hashCost("Sell for Corporation Scientific Research");
        const hashes = ns.hacknet.numHashes();

        // Alternate between funds and research if both are affordable
        if (hashes >= fundsCost && hashes >= researchCost) {
          const choice = Math.random() < 0.5 ? "Sell for Corporation Funds" : "Sell for Corporation Scientific Research";
          return ns.hacknet.spendHashes(choice);
        }

        // Fallback to whichever is affordable
        if (hashes >= researchCost) return ns.hacknet.spendHashes("Sell for Corporation Scientific Research");
        if (hashes >= fundsCost) return ns.hacknet.spendHashes("Sell for Corporation Funds");

        return false;
      },
      args: [],
      cost: () => Math.min(
        ns.hacknet.hashCost("Sell for Corporation Funds"),
        ns.hacknet.hashCost("Sell for Corporation Scientific Research")
      ),
      category: "corp",
      condition: () => corpEnabled
    },

    // Reputation
    {
      name: "Reduce Faction Rep Requirements",
      fn: ns.hacknet.spendHashes,
      args: ["Reduce Faction Rep Requirements"],
      cost: () => ns.hacknet.hashCost("Reduce Faction Rep Requirements"),
      category: "rep"
    },
    {
      name: "Reduce Company Rep Requirements",
      fn: ns.hacknet.spendHashes,
      args: ["Reduce Company Rep Requirements"],
      cost: () => ns.hacknet.hashCost("Reduce Company Rep Requirements"),
      category: "rep"
    },

    // Training
    {
      name: "Improve Studying",
      fn: ns.hacknet.spendHashes,
      args: ["Improve Studying"],
      cost: () => ns.hacknet.hashCost("Improve Studying"),
      category: "training"
    },
    {
      name: "Improve Gym Training",
      fn: ns.hacknet.spendHashes,
      args: ["Improve Gym Training"],
      cost: () => ns.hacknet.hashCost("Improve Gym Training"),
      category: "training"
    },

    // Bladeburner
    {
      name: "Exchange for Bladeburner Rank",
      fn: ns.hacknet.spendHashes,
      args: ["Exchange for Bladeburner Rank"],
      cost: () => ns.hacknet.hashCost("Exchange for Bladeburner Rank"),
      category: "blade",
      condition: () => bladeEnabled
    },
    {
      name: "Exchange for Bladeburner SP",
      fn: ns.hacknet.spendHashes,
      args: ["Exchange for Bladeburner SP"],
      cost: () => ns.hacknet.hashCost("Exchange for Bladeburner SP"),
      category: "blade",
      condition: () => bladeEnabled
    },
    {
      name: "Generate Bladeburner Contract",
      fn: ns.hacknet.spendHashes,
      args: ["Generate Bladeburner Contract"],
      cost: () => ns.hacknet.hashCost("Generate Bladeburner Contract"),
      category: "blade",
      condition: () => bladeEnabled
    },

    // Misc
    {
      name: "Generate Coding Contract",
      fn: ns.hacknet.spendHashes,
      args: ["Generate Coding Contract"],
      cost: () => ns.hacknet.hashCost("Generate Coding Contract"),
      category: "money"
    }
  ];

  function filterByStrategy(upgrades, strategy) {
    if (strategy === "balanced") return upgrades;
    return upgrades.filter(u => u.category === strategy || u.category === "misc");
  }


while (true) {
    const hashes = ns.hacknet.numHashes();
    const maxHashes = ns.hacknet.hashCapacity();
    const hashRatio = hashes / maxHashes;

    const filtered = filterByStrategy(upgrades, strategy)
        .filter(u => !u.condition || u.condition())
        .sort((a, b) => a.cost() - b.cost()); // Cheapest first

    let spent = false;

    for (const upgrade of filtered) {
        const cost = upgrade.cost();
        if (hashes >= cost) {
            const success = upgrade.fn(...upgrade.args);
            if (success) {
                ns.print(`✅ Spent hashes on: ${upgrade.name} (${cost} hashes)`);
                spent = true;
                break; // Spend one upgrade per loop
            } else {
                ns.print(`❌ Failed to spend hashes on: ${upgrade.name}`);
            }
        }
    }

// Safety check: dump hashes if near capacity and nothing was spent
if (!spent && hashRatio >= 0.9) {
    let dumped = false;
    const dumpTarget = strategy === "corp" ? "Sell for Corporation Funds" : "Sell for Money";

    while (ns.hacknet.spendHashes(dumpTarget)) {
        dumped = true;
    }

    if (dumped) {
        ns.print(`⚠️ Safety triggered: Dumped hashes into "${dumpTarget}" (${hashes}/${maxHashes})`);
    } else {
        ns.print(`⚠️ Safety triggered but failed to spend hashes on "${dumpTarget}"`);
    }
}


    await ns.sleep(500);
}

}
