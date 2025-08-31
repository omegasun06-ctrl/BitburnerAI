/** @param {NS} ns */
export async function main(ns) {
    // Array of all servers that don't need any ports opened
    // to gain root access. These have 16 GB of RAM
    const servers0Port = ["sigma-cosmetics",
                        "joesguns",
                        "nectar-net",
                        "hong-fang-tea",
                        "harakiri-sushi","foodnstuff"];

    // Array of all servers that only need 1 port opened
    // to gain root access. These have 32 GB of RAM
    const servers1Port = ["neo-net",
                        "zer0",
                        "max-hardware",
                        "iron-gym"];
    const target = "zer0"

    // Copy our scripts onto each server that requires 0 ports
    // to gain root access. Then use nuke() to gain admin access and
    // run the scripts.
    for (let i = 0; i < servers0Port.length; ++i) {
        const serv = servers0Port[i];
        ns.killall(serv, 1);
        ns.scp("/scripts/autoGrow.js", serv);
        ns.scp("/scripts/autoWeaken.js", serv);
        ns.scp("/scripts/autoHack.js", serv);
        ns.nuke(serv);
        ns.exec("/scripts/autoWeaken.js", serv, 2, target);
        ns.exec("/scripts/autoGrow.js", serv, 2, target);
        ns.exec("/scripts/autoHack.js", serv, 4, target);
    }

    // Wait until we acquire the "BruteSSH.exe" program
    while (!ns.fileExists("BruteSSH.exe")) {
        await ns.sleep(60000);
    }

    // Copy our scripts onto each server that requires 1 port
    // to gain root access. Then use brutessh() and nuke()
    // to gain admin access and run the scripts.
    for (let i = 0; i < servers1Port.length; ++i) {
        const serv = servers1Port[i];
        ns.killall(serv, 1);
        ns.scp("/scripts/autoGrow.js", serv);
        ns.scp("/scripts/autoWeaken.js", serv);
        ns.scp("/scripts/autoHack.js", serv);
        ns.brutessh(serv);
        ns.nuke(serv);
        ns.exec("/scripts/autoWeaken.js", serv, 4, target);
        ns.exec("/scripts/autoGrow.js", serv, 4, target);
        ns.exec("/scripts/autoHack.js", serv, 9, target);
    }

if(ns.fileExists("FTPcrack.exe")){ns.exec("/scripts/autoStart.js");}

}