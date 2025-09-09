/** @param {NS} ns */
  export const servers64MB = 
  ["silver-helix"
  ];

  export const servers32MB = 
  ["neo-net",
    "zer0",
    "max-hardware",
    "phantasy",
    "omega-net",
    "iron-gym",
    "avmnite-02h"];

  export const servers16MB = 
  ["foodnstuff",
    "sigma-cosmetics",
    "joesguns",
    "nectar-net",
    "hong-fang-tea",
    "harakiri-sushi"];

  export const serversLowMem = 
  ["n00dles",
  "the-hub"];

  export const serversNoMem = 
  ["crush-fitness"];

  export const zeroHack = ["n00dles",
    "foodnstuff",
    "sigma-cosmetics",
    "joesguns",
    "nectar-net",
    "hong-fang-tea",
    "harakiri-sushi"
  ]

  //export const serversLocal = [ns.getPurchasedServers()];

  export const serversAll = servers64MB.concat(servers32MB.concat(servers16MB.concat(serversLowMem.concat(serversNoMem))));


