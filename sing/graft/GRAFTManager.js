/** @param {NS} ns **/
export async function main(ns) {
  const graftLocation = "New Tokyo";
  const buffer = 10000;
  const waitTime = 60000; // 1 minute wait if nothing is affordable or available

  if (!ns.singularity.travelToCity(graftLocation)) {
    ns.tprint(`Failed to travel to ${graftLocation}.`);
    return;
  }

  while (true) {
    const graftable = ns.grafting.getGraftableAugmentations();

    if (graftable.length === 0) {
      ns.print("No augmentations available for grafting.");
      await ns.sleep(waitTime);
      continue;
    }

    // Sort by cost descending
    graftable.sort((a, b) => ns.grafting.getAugmentationGraftPrice(b) - ns.grafting.getAugmentationGraftPrice(a));

    let graftedThisLoop = false;

    for (const aug of graftable) {
      const cost = ns.grafting.getAugmentationGraftPrice(aug);
      const time = ns.grafting.getAugmentationGraftTime(aug);
      const prereqs = ns.singularity.getAugmentationPrereq(aug);
      const owned = ns.singularity.getOwnedAugmentations(true); // include installed

      // Check if all prerequisites are met
      const hasPrereqs = prereqs.every(p => owned.includes(p));
      if (!hasPrereqs) {
        ns.print(`Missing prerequisites for ${aug}: ${prereqs.filter(p => !owned.includes(p)).join(", ")}`);
        continue;
      }

      // Check if affordable
      if (ns.getPlayer().money < cost) {
        ns.print(`Can't afford ${aug}. Required: \$${cost}`);
        continue;
      }

      // Graft augmentation
      ns.tprint(`Grafting ${aug} for \$${cost} (Time: ${(time / 1000 / 60).toFixed(2)} min)`);
      await ns.grafting.graftAugmentation(aug, false);
      await ns.sleep(time*1.03 + buffer);
      graftedThisLoop = true;
      break; // Re-evaluate after each graft
    }

    if (!graftedThisLoop) {
      ns.tprint("No affordable or eligible augmentations. Waiting...");
      await ns.sleep(waitTime);
    }
  }
}