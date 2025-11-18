
/**
 *
 * @returns {Object<string>}
 */
export function getScripts() {
  return {
    upgradeHomeRam: '/utils.js',
    upgradeHomeCores: '/utils.js',
    joinFactions: '/utils.js',
    hack: '/daemons/hack.js',
    grow: '/daemons/grow.js',
    weaken: '/daemons/weaken.js',
    prime: '/hacking/prime-target.js',
    intelligence: '/tools/intelligence-farm.js',
    batcher: '/hacking/batcher.js',
    backdoor: '/hacking/backdoor.js',
    share: '/daemons/share.js',
    utils: 'utils.js',
    hack: '/hacking/HACKManager.js',
    gang: '/gang/GANGManager.js',
    corp: '/utils.js',
    bladeburner: '/blade/BLADEManager.js',
    stock: '/stock-market/STOCKManager.js',
    hacknet: '/hacknet/HNManager.js',
    sleeve: '/sleeve/SLEEVEManager.js',
    stanek: '/utils.js'
  };
}

/**
 *
 * @returns {string[]}
 */
export function getManagerScripts() {
  const scripts = getScripts();
  return [
    scripts.gang,
    //scripts.corp,
    scripts.bladeburner,
    scripts.stock,
    scripts.hacknet,
    scripts.sleeve,
    //scripts.stanek,
    scripts.hack
  ];
}

/**
 *
 * @returns {string[]}
 */
export function scriptsToCopy() {
  return Object.values(getScripts());
}

/**
 *
 * @returns {Object<Object>}
 */
function getOrganisations() {
  return {
    'ECorp': {
      location: 'Aevum',
      stockSymbol: 'ECP',
      server: 'ecorp',
      faction: 'ECorp',
      company: 'ECorp',
      factionWorkTypes: ['Hacking', 'Field', 'Security'],
      companyPositions: ['Business', 'IT', 'Security', 'Software']
    },
    'MegaCorp': {
      location: 'Sector-12',
      stockSymbol: 'MGCP',
      server: 'megacorp',
      faction: 'MegaCorp',
      company: 'MegaCorp',
      factionWorkTypes: ['Hacking', 'Field', 'Security'],
      companyPositions: ['Business', 'IT', 'Security', 'Software']
    },
    'Blade Industries': {
      location: 'Sector-12',
      stockSymbol: 'BLD',
      server: 'blade',
      faction: 'Blade Industries',
      company: 'Blade Industries',
      factionWorkTypes: ['Hacking', 'Field', 'Security'],
      companyPositions: ['Business', 'IT', 'Security', 'Software']
    },
    'Clarke Incorporated': {
      location: 'Aevum',
      stockSymbol: 'CLRK',
      server: 'clarkinc',
      faction: 'Clarke Incorporated',
      company: 'Clarke Incorporated',
      factionWorkTypes: ['Hacking', 'Field', 'Security'],
      companyPositions: ['Business', 'IT', 'Security', 'Software']
    },
    'OmniTek Incorporated': {
      location: 'Volhaven',
      stockSymbol: 'OMTK',
      server: 'omnitek',
      faction: 'OmniTek Incorporated',
      company: 'OmniTek Incorporated',
      factionWorkTypes: ['Hacking', 'Field', 'Security'],
      companyPositions: ['Business', 'IT', 'Security', 'Software']
    },
    'Four Sigma': {
      location: 'Sector-12',
      stockSymbol: 'FSIG',
      server: '4sigma',
      faction: 'Four Sigma',
      company: 'Four Sigma',
      factionWorkTypes: ['Hacking', 'Field', 'Security'],
      companyPositions: ['Business', 'IT', 'Security', 'Software']
    },
    'KuaiGong International': {
      location: 'Chongqing',
      stockSymbol: 'KGI',
      server: 'kuai-gong',
      faction: 'KuaiGong International',
      company: 'KuaiGong International',
      factionWorkTypes: ['Hacking', 'Field', 'Security'],
      companyPositions: ['Business', 'IT', 'Security', 'Software']
    },
    'Fulcrum Technologies': {
      location: 'Aevum',
      stockSymbol: 'FLCM',
      server: 'fulcrumtech',
      company: 'Fulcrum Technologies',
      companyPositions: ['Business', 'IT', 'Software']
    },
    'Storm Technologies': {
      location: 'Ishima',
      stockSymbol: 'STM',
      server: 'stormtech',
      company: 'Storm Technologies',
      companyPositions: ['Business', 'IT', 'Software Consultant', 'Software']
    },
    'DefComm': {
      location: 'New Tokyo',
      stockSymbol: 'DCOMM',
      server: 'defcomm',
      company: 'DefComm',
      companyPositions: ['IT', 'Software Consultant', 'Software']
    },
    'Helios Labs': {
      location: 'Volhaven',
      stockSymbol: 'HLS',
      server: 'helios',
      company: 'Helios Labs',
      companyPositions: ['IT', 'Software Consultant', 'Software']
    },
    'VitaLife': {
      location: 'New Tokyo',
      stockSymbol: 'VITA',
      server: 'vitalife',
      company: 'VitaLife',
      companyPositions: ['Business', 'IT', 'Software Consultant', 'Software']
    },
    'Icarus Microsystems': {
      location: 'Sector-12',
      stockSymbol: 'ICRS',
      server: 'icarus',
      company: 'Icarus Microsystems',
      companyPositions: ['Business', 'IT', 'Software Consultant', 'Software']
    },
    'Universal Energy': {
      location: 'Sector-12',
      stockSymbol: 'UNV',
      server: 'univ-energy',
      company: 'Universal Energy',
      companyPositions: ['Business', 'IT', 'Software Consultant', 'Software']
    },
    'AeroCorp': {
      location: 'Aevum',
      stockSymbol: 'AERO',
      server: 'aerocorp',
      company: 'AeroCorp',
      companyPositions: ['IT', 'Security', 'Software']
    },
    'Omnia Cybersystems': {
      location: 'Volhaven',
      stockSymbol: 'OMN',
      server: 'omnia',
      company: 'Omnia Cybersystems',
      companyPositions: ['IT', 'Security', 'Software']
    },
    'Solaris Space Systems': {
      location: 'Chongqing',
      stockSymbol: 'SLRS',
      server: 'solaris',
      company: 'Solaris Space Systems',
      companyPositions: ['IT', 'Security', 'Software']
    },
    'Global Pharmaceuticals': {
      location: 'New Tokyo',
      stockSymbol: 'GPH',
      server: 'global-pharm',
      company: 'Global Pharmaceuticals',
      companyPositions: ['Business', 'IT', 'Security', 'Software Consultant', 'Software']
    },
    'Nova Medical': {
      location: 'Ishima',
      stockSymbol: 'NVMD',
      server: 'nova-med',
      company: 'Nova Medical',
      companyPositions: ['Business', 'IT', 'Security', 'Software Consultant', 'Software']
    },
    'Watchdog Security': {
      location: 'Aevum',
      stockSymbol: 'WDS',
      company: 'Watchdog Security',
      companyPositions: ['Agent', 'IT', 'Security', 'Software Consultant', 'Software']
    },
    'LexoCorp': {
      location: 'Volhaven',
      stockSymbol: 'LXO',
      server: 'lexo-corp',
      company: 'LexoCorp',
      companyPositions: ['Business', 'IT', 'Security', 'Software Consultant', 'Software']
    },
    'Rho Construction': {
      location: 'Aevum',
      stockSymbol: 'RHOC',
      server: 'rho-construction',
      company: 'Rho Construction',
      companyPositions: ['Business', 'Software']
    },
    'Alpha Enterprises': {
      location: 'Sector-12',
      stockSymbol: 'APHE',
      server: 'alpha-ent',
      company: 'Alpha Enterprises',
      companyPositions: ['Business', 'Software Consultant', 'Software']
    },
    'SysCore Securities': {
      location: 'Volhaven',
      stockSymbol: 'SYSC',
      server: 'syscore',
      company: 'SysCore Securities',
      companyPositions: ['IT', 'Software']
    },
    'CompuTek': {
      location: 'Volhaven',
      stockSymbol: 'CTK',
      server: 'comptek',
      company: 'CompuTek',
      companyPositions: ['IT', 'Software']
    },
    'NetLink Technologies': {
      location: 'Aevum',
      stockSymbol: 'NTLK',
      server: 'netlink',
      company: 'NetLink Technologies',
      companyPositions: ['IT', 'Software']
    },
    'Omega Software': {
      location: 'Ishima',
      stockSymbol: 'OMGA',
      server: 'omega-net',
      company: 'Omega Software',
      companyPositions: ['IT', 'Software Consultant', 'Software']
    },
    'FoodNStuff': {
      location: 'Sector-12',
      stockSymbol: 'FNS',
      server: 'foodnstuff',
      company: 'FoodNStuff',
      companyPositions: ['Employee', 'part-time Employee']
    },
    'Sigma Cosmetics': { stockSymbol: 'SGC', server: 'sigma-cosmetics' },
    'Joe\'s Guns': {
      location: 'Sector-12',
      stockSymbol: 'JGN',
      server: 'joesguns',
      company: 'Joe\'s Guns',
      companyPositions: ['Employee', 'part-time Employee']
    },
    'Catalyst Ventures': { stockSymbol: 'CTYS', server: 'catalyst' },
    'Microdyne Technologies': { stockSymbol: 'MDYN', server: 'microdyne' },
    'Titan Laboratories': { stockSymbol: 'TITN', server: 'titan-labs' },
    'CyberSec': { server: 'CSEC', faction: 'CyberSec', factionWorkTypes: ['Hacking'] },
    'The Runners': { server: 'run4theh111z', faction: 'BitRunners', factionWorkTypes: ['Hacking'] },
    'Bachman & Associates': {
      location: 'Aevum',
      server: 'b-and-a',
      faction: 'Bachman & Associates',
      company: 'Bachman & Associates',
      factionWorkTypes: ['Hacking', 'Field', 'Security'],
      companyPositions: ['Business', 'IT', 'Security', 'Software']
    },
    'Fulcrum Secret Technologies': {
      server: 'fulcrumassets',
      faction: 'Fulcrum Secret Technologies',
      factionWorkTypes: ['Hacking', 'Security']
    },
    'NiteSec': { server: 'avmnite-02h', faction: 'NiteSec', factionWorkTypes: ['Hacking'], gang: true },
    'I.I.I.I': { server: 'I.I.I.I', faction: 'The Black Hand', factionWorkTypes: ['Hacking', 'Field'], gang: true },
    'Slum Snakes': { faction: 'Slum Snakes', factionWorkTypes: ['Field', 'Security'], gang: true },
    'Tetrads': { faction: 'Tetrads', factionWorkTypes: ['Field', 'Security'], gang: true },
    'Speakers for the Dead': {
      faction: 'Speakers for the Dead',
      factionWorkTypes: ['Hacking', 'Field', 'Security'],
      gang: true
    },
    '.': { server: '.', faction: 'The Dark Army', factionWorkTypes: ['Hacking', 'Field'], gang: true },
    'The Syndicate': { faction: 'The Syndicate', factionWorkTypes: ['Hacking', 'Field', 'Security'], gang: true },
    'Rothman University': { location: 'Sector-12', server: 'rothman-uni', university: 'Rothman University' },
    'ZB Institute of Technology': {
      location: 'Volhaven',
      server: 'zb-institute',
      university: 'ZB Institute of Technology'
    },
    'Summit University': { location: 'Aevum', server: 'summit-university', university: 'Summit University' },
    'Crush Fitness': { location: 'Aevum', server: 'crush-fitness', gym: 'Crush Fitness Gym' },
    'Millenium Fitness Network': { location: 'Volhaven', server: 'millenium-fitness', gym: 'Millenium Fitness Gym' },
    'Iron Gym Network': { location: 'Sector-12', server: 'iron-gym', gym: 'Iron Gym' },
    'Powerhouse Fitness': { location: 'Sector-12', server: 'powerhouse-fitness', gym: 'Powerhouse Gym' },
    'Snap Fitness': { location: 'Aevum', server: 'snap-fitness', gym: 'Snap Fitness Gym' },
    'Silhouette': { faction: 'Silhouette', factionWorkTypes: ['Hacking', 'Field'] },
    'Tian Di Hui': { faction: 'Tian Di Hui', factionWorkTypes: ['Hacking', 'Security'] },
    'Netburners': { faction: 'Netburners', factionWorkTypes: ['Hacking'] },
    'Aevum': {
      location: 'Aevum',
      faction: 'Aevum',
      factionWorkTypes: ['Hacking', 'Field', 'Security'],
      city: true
    },
    'Sector-12': {
      location: 'Sector-12',
      faction: 'Sector-12',
      factionWorkTypes: ['Hacking', 'Field', 'Security'],
      city: true
    },
    'Chongqing': {
      location: 'Chongqing',
      faction: 'Chongqing',
      factionWorkTypes: ['Hacking', 'Field', 'Security'],
      city: true
    },
    'New Tokyo': {
      location: 'New Tokyo',
      faction: 'New Tokyo',
      factionWorkTypes: ['Hacking', 'Field', 'Security'],
      city: true
    },
    'Ishima': {
      location: 'Ishima',
      faction: 'Ishima',
      factionWorkTypes: ['Hacking', 'Field', 'Security'],
      city: true
    },
    'Volhaven': {
      location: 'Volhaven',
      faction: 'Volhaven',
      factionWorkTypes: ['Hacking', 'Field', 'Security'],
      city: true
    },
    'NWO': {
      location: 'Volhaven',
      server: 'nwo',
      faction: 'NWO',
      company: 'NWO',
      factionWorkTypes: ['Hacking', 'Field', 'Security'],
      companyPositions: ['Business', 'IT', 'Security', 'Software']
    },
    'Delta One': {
      location: 'Sector-12',
      server: 'deltaone',
      company: 'Delta One',
      companyPositions: ['IT', 'Security', 'Software']
    },
    'Central Intelligence Agency': {
      location: 'Sector-12',
      company: 'Central Intelligence Agency',
      companyPositions: ['Agent', 'IT', 'Security', 'Software']
    },
    'National Security Agency': {
      location: 'Sector-12',
      company: 'National Security Agency',
      companyPositions: ['Agent', 'IT', 'Security', 'Software']
    },
    'Aevum Police Headquarters': {
      location: 'Aevum', server: 'aevum-police',
      company: 'Aevum Police Headquarters',
      companyPositions: ['Security', 'Software']
    },
    'Carmichael Security': {
      location: 'Sector-12',
      company: 'Carmichael Security',
      companyPositions: ['Agent', 'IT', 'Security', 'Software Consultant', 'Software']
    },
    'Galactic Cybersystems': {
      location: 'Aevum', server: 'galactic-cyber',
      company: 'Galactic Cybersystems',
      companyPositions: ['Business', 'IT', 'Software Consultant', 'Software']
    },
    'Noodle Bar': {
      location: 'New Tokyo', server: 'n00dles',
      company: 'Noodle Bar',
      companyPositions: ['Waiter', 'part-time Waiter']
    },
    'InfoComm': { server: 'infocomm' },
    'Taiyang Digital': { server: 'taiyang-digital' },
    'ZB Defense Industries': { server: 'zb-def' },
    'Applied Energetics': { server: 'applied-energetics' },
    'Zeus Medical': { server: 'zeus-med' },
    'UnitaLife Group': { server: 'unitalife' },
    'The Hub': { server: 'the-hub' },
    'Johnson Orthopedics': { server: 'johnson-ortho' },
    'ZER0 Nightclub': { server: 'zero' },
    'Nectar Nightclub Network': { server: 'nectar-net' },
    'Neo Nightclub Network': { server: 'neo-net' },
    'Silver Helix': { server: 'silver-helix' },
    'HongFang Teahouse': { server: 'hong-fang-tea' },
    'HaraKiri Sushi Bar Network': { server: 'harakiri-sushi' },
    'Phantasy Club': { server: 'phantasy' },
    'Max Hardware Store': { server: 'max-hardware' },
    'Helios': { server: 'The-Cave' },
    'w0r1d_d43m0n': { server: 'w0r1d_d43m0n' },
    'The Covenant': { faction: 'The Covenant', factionWorkTypes: ['Hacking', 'Field'] },
    'Daedalus': { faction: 'Daedalus', factionWorkTypes: ['Hacking', 'Field'] },
    'Illuminati': { faction: 'Illuminati', factionWorkTypes: ['Hacking', 'Field'] },
    'Iker Molina Casino': { location: 'Aevum' },
    'Sector-12 City Hall': { location: 'Sector-12' },
    'Arcade': { location: 'New Tokyo' },
    '0x6C1': { location: 'Ishima' },
    'Hospital': { general: true },
    'The Slums': { general: true },
    'Travel Agency': { general: true },
    'World Stock Exchange': { general: true },
    'Bladeburners': { location: 'Sector-12', faction: 'Bladeburners' },
    'Church of the Machine God': { location: 'Chongqing', faction: 'Church of the Machine God' },
    'Shadows of Anarchy': { faction: 'Shadows of Anarchy' }
  };
}

/**
 *
 * @return {string[]}
 */
export function getFactions() {
  return Object.values(getOrganisations()).filter(v => v.faction).map(v => v.faction);
}

/**
 *
 * @return {string[]}
 */
export function getCompanies() {
  return Object.values(getOrganisations()).filter(v => v.company).map(v => v.company);
}

/**
 *
 * @return {string[]}
 */
export function getGangs() {
  return Object.values(getOrganisations()).filter(v => v.gang).map(v => v.faction);
}

/**
 *
 * @returns {string[]}
 */
export function getCities() {
  return Object.values(getOrganisations()).filter(v => v.city).map(v => v.location);
}

/**
 *
 * @return {string[]}
 */
export function getGyms() {
  return Object.values(getOrganisations()).filter(v => v.gym).map(v => v.gym);
}

/**
 *
 * @return {string[]}
 */
export function getUniversities() {
  return Object.values(getOrganisations()).filter(v => v.university).map(v => v.university);
}

/**
 *
 * @param {string} faction
 * @returns {string[]}
 */
export function getFactionWorktypes(faction) {
  return Object.values(getOrganisations()).find(v => v.faction === faction).factionWorkTypes;
}

/**
 *
 * @param {string} faction
 * @returns {string[]}
 */
export function getCompanyPositions(company) {
  return Object.values(getOrganisations()).find(v => v.company === company).companyPositions;
}

/**
 *
 * @param {string} symbol
 * @returns {string}
 */
export function symbolToServer(symbol) {
  for (const v of Object.values(getOrganisations())) if (v.stockSymbol === symbol) return v.server;
}

/**
 *
 * @param {string} gym
 * @return {string}
 */
export function getGymLocation(gym) {
  for (const v of Object.values(getOrganisations())) if (v.gym === gym) return v.location;
}

/**
 *
 * @param {string} university
 * @return {string}
 */
export function getUniversityLocation(university) {
  for (const v of Object.values(getOrganisations())) if (v.university === university) return v.location;
}

/**
 *
 * @return {string[]}
 */
export function getCrimes() {
  return ['shoplift', 'rob', 'mug', 'larceny', 'drugs', 'bond', 'traffic', 'homicide', 'grand', 'kidnap',
    'assassinate', 'heist'];
}
/** @param {NS} ns */
/**
 *
 * @returns {Object<string, number>[]}
 */
export function getCracks() {
  return [
    { name: 'BruteSSH.exe', level: 50, cost: 500000 },
    { name: 'FTPCrack.exe', level: 100 },
    { name: 'relaySMTP.exe', level: 300 },
    { name: 'HTTPWorm.exe', level: 400 },
    { name: 'SQLInject.exe', level: 800 }
  ];
}

/**
 *
 * @returns {string[]}
 */
export function getUsefulPrograms() {
  return ['ServerProfiler.exe', 'AutoLink.exe', 'DeepscanV1.exe', 'DeepscanV2.exe'];
}

/**
 *
 * @param {NS} ns
 * @param {string} server
 * @returns {boolean}
 */
export function promptScriptRunning(ns, server) {
  for (const script of getPromptScripts()) if (ns.scriptRunning(script, server)) return true;
  return false;
}

/**
 *
 * @returns {string[]}
 */
function getPromptScripts() {
  const scripts = getScripts();
  return [
    scripts.joinFactions,
    scripts.upgradeHomeRam,
    scripts.upgradeHomeCores,
    '/augmentations/install.js',
    '/augmentations/purchase.js',
    '/build/script-remover.js'
  ];
}

/**
 *
 * @param {NS} ns
 * @param {string} script
 * @param {string} server
 * @returns {boolean}
 */
export function enoughRam(ns, script, server = ns.getHostname(), threads = 1) {
  return ns.getScriptRam(script, server) * threads <= getFreeRam(ns, server);
}


export function formatNumber(ns, n) {
  return isNaN(n) ? 'NaN' : ns.formatNumber(n, 3); // 3 decimal places
}

export function formatMoney(ns, n) {
  return isNaN(n) ? 'NaN' : ns.formatNumber(n, 3); // Add $ manually
}

export function formatRam(ns, b) {
  return isNaN(b) ? 'NaN' : ns.formatRam(b); // ns.formatRam is correct
}

export function formatPercentage(n, round = 2) {
  return isNaN(n) ? 'NaN%' : (n * 100).toFixed(round);
}

export function formatTime(ns, t, milliPrecision = false) {
  return isNaN(t) ? 'NaN' : ns.tFormat(t, milliPrecision);
}