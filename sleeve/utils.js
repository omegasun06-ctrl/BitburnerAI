/** @param {NS} ns **/
export function validateConfig(ns, config) {
    const validRoles = [
        'synchronize',
        'crime',
        'gym',
        'uni',
        'factionWork',
        'bladeburner',
        'jobWork',
        'shock',
        'gang'
    ];

    return Object.entries(config).every(([id, entry]) => {
        if (isNaN(id)) return false;
        if (typeof entry === "string") return validRoles.includes(entry);
        if (typeof entry === "object" && entry.role) return validRoles.includes(entry.role);
        return false;
    });
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
export async function assignRole(ns, sleeveNum, role, params) {
    const roleFn = roleRegistry[role];
    if (!roleFn) {
        ns.tprint(`❌ Role '${role}' not found in registry.`);
        return;
    }

    try {
        await roleFn(ns, sleeveNum, params);
    } catch (err) {
        ns.tprint(`❌ Error running role '${role}' for sleeve ${sleeveNum}: ${err}`);
    }
}

