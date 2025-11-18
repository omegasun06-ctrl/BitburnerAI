/**
 *
 * @param {NS} ns
 * @param {string} name
 * @returns {boolean}
 */
export function isUsefulPrograms(ns, name) {
	return ignore(name) &&
		( 	// Useful programs augmentations
			name === 'CashRoot Starter Kit' || // Starting money and programs
			name === 'BitRunners Neurolink' || // Programs
			name === 'PCMatrix' // Programs
		);
}

/**
 *
 * @param {NS} ns
 * @param {string} name
 * @returns {boolean}
 */
export function isUsefulFaction(ns, name) {
	const stats = ns.singularity.getAugmentationStats(name);
	return ignore(name) && stats.faction_rep; // Useful faction augmentations
}

/**
 *
 * @param {NS} ns
 * @param {string} name
 * @returns {boolean}
 */
export function isUsefulFocus(ns, name) {
	return ignore(name) &&
		( 	// Useful focus augmentations
			name === 'Neuroreceptor Management Implant' || // No simultaneous penalty
			name === 'The Blade\'s Simulacrum' // Bladeburner and working
		);

}

/**
 *
 * @param {NS} ns
 * @param {string} name
 * @returns {boolean}
 */
export function isUsefulHacking(ns, name) {
	const stats = ns.singularity.getAugmentationStats(name);
	return ignore(name) &&
		( 	// Useful hacking augmentations
			stats.hacking > 1||
			stats.hacking_exp > 1||
			stats.hacking_chance > 1||
			stats.hacking_speed > 1||
			stats.hacking_money > 1||
			stats.hacking_grow > 1
		);
}

/**
 *
 * @param {NS} ns
 * @param {string} name
 * @returns {boolean}
 */
export function isUsefulHackingSkill(ns, name) {
	const stats = ns.singularity.getAugmentationStats(name);
	return ignore(name) &&
		( 	// Useful hacking skill augmentations
			stats.hacking > 1 ||
			stats.hacking_exp > 1
		);
}

/**
 *
 * @param {NS} ns
 * @param {string} name
 * @returns {boolean}
 */

export function isUsefulCombat(ns, name) {
    const stats = ns.singularity.getAugmentationStats(name);
    return ignore(name) &&
        (
            stats.agility_exp > 1 ||
            stats.agility > 1 ||
            stats.defense_exp > 1 ||
            stats.defense > 1 ||
            stats.dexterity_exp > 1 ||
            stats.dexterity > 1 ||
            stats.strength_exp > 1 ||
            stats.strength > 1
        );
}


/**
 *
 * @param {NS} ns
 * @param {string} name
 * @returns {boolean}
 */
export function isUsefulCrime(ns, name) {
	const stats = ns.singularity.getAugmentationStats(name);
	return ignore(name) &&
		( 	// Useful crime augmentations
			stats.crime_money > 1 ||
			stats.crime_success > 1
		);
}

/**
 *
 * @param {NS} ns
 * @param {string} name
 * @returns {boolean}
 */
export function isUsefulCompany(ns, name) {
	const stats = ns.singularity.getAugmentationStats(name);
	return ignore(name) &&
		( 	// Useful company augmentations
			stats.charisma_exp > 1||
			stats.charisma > 1||
			stats.company_rep > 1||
			stats.work_money > 1
		);
}

/**
 *
 * @param {NS} ns
 * @param {string} name
 * @returns {boolean}
 */
export function isUsefulHacknet(ns, name) {
	const stats = ns.singularity.getAugmentationStats(name);
	return ignore(name) &&
		( 	// Useful hacknet augmentations
			stats.hacknet_node_core_cost ||
			stats.hacknet_node_level_cost ||
			stats.hacknet_node_money ||
			stats.hacknet_node_purchase_cost ||
			stats.hacknet_node_ram_cost
		);
}

/**
 *
 * @param {NS} ns
 * @param {string} name
 * @returns {boolean}
 */
export function isUsefulBladeburner(ns, name) {
	const stats = ns.singularity.getAugmentationStats(name);
	return ignore(name) &&
		( 	// Useful bladeburner augmentations
			stats.bladeburner_analysis ||
			stats.bladeburner_max_stamina ||
			stats.bladeburner_stamina_gain ||
			stats.bladeburner_success_chance
		);
}

/**
 *
 * @param {NS} ns
 * @param {string} name
 * @returns {boolean}
 */
export function isUsefulInfiltration(ns, name) {
	return ignore(name) && name.includes('SoA');
}

/**
 *
 * @param {NS} ns
 * @param {string} name
 * @returns {boolean}
 */
export function isZeroCost(ns, name) {
	if (ns.singularity.getAugmentationPrice(name) === 0) return true;
}

/**
 *
 * @param {string} name
 * @return {boolean}
 */
function ignore(name) {
	return name !== 'NeuroFlux Governor' && !name.includes('Stanek\'s Gift');
}

/**
 *
 * @param {NS} ns
 * @param {function} criteria
 * @param {string} name
 * @returns {boolean}
 */
export function isUseful(ns, criteria, name) {
	for (const criterion of criteria) if (criterion(ns, name)) return true;
	return false;
}

