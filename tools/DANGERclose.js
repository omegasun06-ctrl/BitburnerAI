/** @param {NS} ns **/
export async function main(ns) {
    const home = "home";

    const confirmation = await ns.prompt(
        "⚠️ WARNING: This script will permanently delete all .js, .ns, .txt, and .script files from your home directory, including contents of subdirectories. Are you sure you want to proceed?",
        { type: "boolean" }
    );

    if (!confirmation) {
        ns.tprint("Operation cancelled by user.");
        return;
    }

    // Delete all files
    const files = ns.ls(home);
    for (const file of files) {
        if (file.endsWith(".js") || file.endsWith(".ns") || file.endsWith(".txt") || file.endsWith(".script")) {
            ns.rm(file, home);
            ns.tprint(`Deleted file: ${file}`);
        }
    }

    // Delete all directories
    for (const file of files) {
        if (file.includes("/")) {
            const dir = file.split("/")[0];
            const dirFiles = ns.ls(home, dir);
            for (const f of dirFiles) {
                ns.rm(f, home);
            }
            ns.tprint(`Deleted directory contents: ${dir}`);
        }
    }

    ns.tprint("✅ Cleanup complete.");
}