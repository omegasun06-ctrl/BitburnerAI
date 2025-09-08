/** @param {NS} ns */
import{
  servers64MB,
  servers32MB,
  servers16MB
} from "/old_scripts/arrayRepo.js";

export async function main(ns) {
    // Array of all servers that don't need any ports opened
    // to gain root access. These have 16 GB of RAM
    const servers0Port = ["sigma-cosmetics",
                        "joesguns",
                        "nectar-net",
                        "hong-fang-tea",
                        "harakiri-sushi"];

    // Array of all servers that only need 1 port opened
    // to gain root access. These have 32 GB of RAM
    const servers1Port = ["neo-net",
                        "zer0",
                        "max-hardware",
                        "iron-gym"];

    // Copy our scripts onto each server that requires 0 ports
    // to gain root access. Then use nuke() to gain admin access and
    // run the scripts.
    for (let i = 0; i < servers16MB.length; ++i) {
        const serv = servers16MB[i];

        ns.scp("/start/early-hack-template.js", serv);
        //ns.brutessh(serv);
       //ns.nuke(serv);
        ns.exec("/start/early-hack-template.js", serv, 6);
    }

    // Wait until we acquire the "BruteSSH.exe" program
    while (!ns.fileExists("BruteSSH.exe")) {
        await ns.sleep(60000);
    }

    // Copy our scripts onto each server that requires 1 port
    // to gain root access. Then use brutessh() and nuke()
    // to gain admin access and run the scripts.
    for (let i = 0; i < servers32MB.length; ++i) {
        const serv = servers32MB[i];

        ns.scp("/start/early-hack-template.js", serv);
       // ns.brutessh(serv);
        //ns.nuke(serv);
        ns.exec("/start/early-hack-template.js", serv, 12);   
    }
        for (let i = 0; i < servers64MB.length; ++i) {
        const serv = servers64MB[i];

        ns.scp("/start/early-hack-template.js", serv);
        //ns.brutessh(serv);
        //ns.nuke(serv);
        ns.exec("/start/early-hack-template.js", serv, 24);
        
    }
}