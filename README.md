# 🧠 Bitburner + Copilot: Vibe Coding Journey

Welcome to the **BitburnerAI** repository! This repo is a personal coding playground where I explore and grow my **vibe coding skills** using **Bitburner** and **Copilot(Chat GPT4 and Chat GPT5)**. All scripts and tools here are generated through interactive sessions with the custom **Bitburner JavaScript Expert Agent** I configured in copilot.

## 🎯 Goals

- Master **Bitburner scripting** to automate and optimize in-game progress.
- Use **GitHub Copilot** to enhance coding fluency and creativity.
- Build a personal library of reusable, well-documented scripts.
- Learn by doing — through experimentation, iteration, and gameplay-driven development. 

## 🛠️ What's Inside

- Bitburner automation scripts (hacking, growing, weakening, etc.)
- Strategy tools for server mapping, income optimization, and faction progression.
- VS Code integration tips and setup guides.
- Copilot-assisted code snippets and refactors.

## 🚀 Setup Guidance

- Clone the repository:
   git clone https://github.com/omegasun06-ctrl/BitburnerAI.git

- load scripts into bitburner using your favorite method.

- run MASTER.js to start script managers.

        - HACKManager.js - primes the best available target and then launches grow, weaken, and hack batches on the target onced primed from home and player servers. non player servers act as support servers and grow/weaken to help offset hacks. Also handles launching worm on servers to root as they become accessible and copies all needed scripts.
        
        - STOCKManager.js - automates stocks for both pre and post formula use. post formula is much more accurate. requires WSE APIs to work.
        
        - PSManager.js - automates player server purchases and upgrades. upgrades player servers as money is available
        
        - HNManager.js - automates the purchase and upgrade of the HackNet based on time to repay the upgrade. works best with formulas.exe unlocked but aproximates prior.


- Other useful scripts
  
        - /tools/qq.js - queues a script to run once enough memory is available. "run qq.js <server> <scripts> <threads> <scripts arg1> ......"
        - /tools/connectTo.js - gives the connection command toa server. "run connectTo.js the-hub"
        - /tools/DANGERclose.js - deletes ALL files home. use with EXTREME CAUTION. helpful to clear scripts before a push from IDE. I mostly use it when doing significant script organization. 
        - /contracts/contractor.js - searchs accessible servers for contracts and automatically completes them. "run /contracts/contractor.js"
        - /factions/share.js - starts the faction share manager that will run daemons on each server to share all available memory.
        
