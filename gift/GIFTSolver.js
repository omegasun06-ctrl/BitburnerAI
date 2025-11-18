/** @param {NS} ns **/
export async function main(ns) {
  ns.disableLog('ALL');

  const focus = (ns.args[0] || "HACK").toUpperCase();

  // Starter Layouts for 5x5 Grid (BN13.1)
  const OPTIMAL_LAYOUTS = {
    "HACK": [
      // Fragment 1: Hacking: Grow Power (L-shape)
      { id: 7, x: 0, y: 0, rot: 0 },
      // Fragment 2: Hacking: Hack Power (|-shape)
      { id: 6, x: 1, y: 0, rot: 0 },
      // Fragment 5: Hacking: HGW Speed (-|-shape)
      { id: 5, x: 4, y: 0, rot: 3 },
      // Boost Fragment 107 (cross-shape)
      { id: 107, x: 2, y: 1, rot: 0 },
      // Fragment 1: Hacking: Hack EXP(Z-shape)
      { id: 1, x: 0, y: 2, rot: 0 },
      // Fragment 0: Hacking: Hack EXP(Z-shape)
      { id: 0, x: 3, y: 3, rot: 0 },
      // Fragment 25: REP: Company/Faction(L-shape)
      { id: 25, x: 0, y: 3, rot: 0 }
    ],
    "CRIME": [
      // Fragment 2: Agility (L-shape)
      { id: 28, x: 3, y: 3, rot: 0 },
      // Fragment 5: Defense (L-shape)
      { id: 16, x: 1, y: 0, rot: 0 },
      // Fragment 5: Defense (L-shape)
      { id: 14, x: 4, y: 0, rot: 1 },
      // Fragment 5: Defense (L-shape)
      { id: 12, x: 0, y: 1, rot: 0 },
      // Fragment 25: Booster (Cross-shape)
      { id: 102, x: 0, y: 3, rot: 0 },
      // Fragment 25: Booster (Cross-shape)
      { id: 100, x: 2, y: 1, rot: 0 }
    ],
    "COMBAT": [
      // Fragment : Dexterity (L-shape)
      { id: 14, x: 3, y: 1, rot: 1 },
      // Fragment : Agility (L-shape)
      { id: 12, x: 4, y: 0, rot: 1 },
      // Fragment : Strength (Cross-shape)
      { id: 16, x: 2, y: 1, rot: 0 },
      // Fragment : Defense (Cross-shape)
      { id: 10, x: 1, y: 2, rot: 0 },
      // Fragment : Booster (L-shape)
      { id: 102, x: 0, y: 0, rot: 0 },
      // Fragment : Booster (Abnormal L-shape)
      { id: 101, x: 2, y: 3, rot: 0 }
    ]
  };

  if (!OPTIMAL_LAYOUTS[focus]) {
    ns.tprint(`ERROR: Focus "${focus}" not found. Available: ${Object.keys(OPTIMAL_LAYOUTS).join(", ")}`);
    return;
  }

  const layout = OPTIMAL_LAYOUTS[focus];

  ns.tprint(`Attempting to set Stanek's Gift to focus: ${focus}...`);

  // 1. CLEAR THE GRID - WARNING: This resets all charge levels!
  ns.stanek.clearGift();
  ns.tprint("Grid cleared. All fragment charges reset.");

  // 2. PLACE FRAGMENTS
  let boosterCount = 0;
  for (const frag of layout) {
    try {
      if (frag.id >= 25) {
        // Handle Booster Fragments (ID 25+)
        if (boosterCount >= ns.stanek.getNumFragments(frag.id)) {
          ns.tprint(`WARNING: Ran out of Booster Fragment ID ${frag.id}. Stopping placement.`);
          break;
        }
        boosterCount++;
      }

      const success = ns.stanek.placeFragment(frag.x, frag.y, frag.id, frag.rot);
      if (success) {
        ns.tprint(`SUCCESS: Placed Fragment ID ${frag.id} at (${frag.x}, ${frag.y}) with rotation ${frag.rot}.`);
      } else {
        ns.tprint(`FAILURE: Could not place Fragment ID ${frag.id} at (${frag.x}, ${frag.y}). Check coordinates, grid size, and overlap.`);
        // If a placement fails, stop to prevent further errors
        return;
      }
    } catch (e) {
      ns.tprint(`FATAL ERROR during placement: ${e.message}`);
      return;
    }
  }

  ns.tprint(`\n--- Placement Complete for ${focus} ---`);
  ns.tprint(`**IMPORTANT:** Now run your stanekManager.js script to begin charging the new layout!`);
}