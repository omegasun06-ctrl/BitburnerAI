
// sleeve/roleRegistry.js
import { run as synchronize } from "./roles/synchronize.js";
import { run as crime } from "./roles/crime.js";
import { run as gym } from "./roles/gym.js";
import { run as uni } from "./roles/uni.js";
import { run as factionWork } from "./roles/factionWork.js";
import { run as bladeburner } from "./roles/bladeburner.js";
import { run as jobWork } from "./roles/jobWork.js";
import { run as gang } from "./roles/gang.js";
import { run as shock } from "./roles/shock.js";

export const roleRegistry = {
    synchronize,
    crime,
    gym,
    uni,
    factionWork,
    bladeburner,
    jobWork,
    gang,
    shock,
};
