/** @param {NS} ns **/
export function validateConfig(ns, config) {
    
const validRoles = [
    'synchronize',
    'crime',
    'gym',
    'uni',
    'factionWork',
    'bladeburner',
    'jobwork',
    'shock',
    'gang'
];
 // Add more as needed
    return Object.entries(config).every(([id, role]) =>
        !isNaN(id) && validRoles.includes(role)
    );
}

/** @param {NS} ns **/
export function getSleeveInfo(ns) {
    const sleeves = [];
    for (let i = 0; i < ns.sleeve.getNumSleeves(); i++) {
        sleeves.push(ns.sleeve.getSleeve(i));
    }
    return sleeves;
}


import { roleRegistry } from "./roleRegistry.js";
/** @param {NS} ns **/
export async function assignRole(ns, sleeveNum, role) {
    const roleFn = roleRegistry[role];
    if (!roleFn) {
        ns.tprint(`❌ Role '${role}' not found in registry.`);
        return;
    }

    try {
        await roleFn(ns, sleeveNum);
    } catch (err) {
        ns.tprint(`❌ Error running role '${role}' for sleeve ${sleeveNum}: ${err}`);
    }
}

