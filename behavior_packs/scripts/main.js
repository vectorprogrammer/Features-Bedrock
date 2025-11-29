import { world, system } from "@minecraft/server";
import { checkTreeGrowth } from "./creaking_heart.js";

const TICK_RATE = 20; // 20 ticks per second

system.runInterval(() => {
}, TICK_RATE);
world.afterEvents.blockChange.subscribe((event) => {
    checkTreeGrowth(event);
});
