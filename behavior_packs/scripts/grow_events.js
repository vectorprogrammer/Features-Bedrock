import { world, system, MinecraftBlockTypes, ItemStack, ItemCooldownComponent, BlockPermutation } from "@minecraft/server";
const PALE_OAK_SAPLING = "minecraft:pale_oak_sapling";
const CREAKING_HEART = "minecraft:creaking_heart";
const CHANCE_PERCENT = 0.02;
export function checkTreeGrowth() {
    world.afterEvents.structureGrow.subscribe((event) => {
        if (event.structureId === "minecraft:pale_oak_tree") {
            if (Math.random() < CHANCE_PERCENT) {
                const location = event.location;
                const dimension = event.dimension;
                const dropLoc = {
                    x: location.x + 0.5,
                    y: location.y + 0.5,
                    z: location.z + 0.5
                };
                
                dimension.spawnItem(new ItemStack(CREAKING_HEART, 1), dropLoc);
            }
        }
    });
}
