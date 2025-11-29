import { world, system, BlockPermutation } from "@minecraft/server";
const PALE_OAK_SAPLING = "minecraft:pale_oak_sapling";
const CREAKING_HEART_ITEM = "minecraft:creaking_heart"; 
const DROP_CHANCE = 0.02; 
world.afterEvents.blockPlace.subscribe(event => {
    if (event.block.typeId === PALE_OAK_SAPLING) {
        // Schedule a check for next tick to see if it instantly grew
        system.run(() => checkSaplingGrowth(event.block.location));
    }
});

world.afterEvents.blockChange.subscribe(event => {
    if (event.dimension.getBlock(event.block.location)?.typeId !== PALE_OAK_SAPLING && 
        event.dimension.getBlock(event.block.location)?.typeId !== "minecraft:air" &&
        world.getDimension(event.dimension.id).getBlock(event.block.location)?.typeId !== PALE_OAK_SAPLING) {
        system.run(() => checkSaplingGrowth(event.block.location));
    }
});
function checkSaplingGrowth(location) {
    try {
        const block = world.getDimension("overworld").getBlock(location);
        if (block && block.typeId === PALE_OAK_SAPLING) {
            return; 
        }
        const randomValue = Math.random();

        if (randomValue < DROP_CHANCE) {
            world.getDimension("overworld").spawnItem(CREAKING_HEART_ITEM, location);
            world.sendMessage(`§a[Pale Oak] §eA Creaking Heart dropped at ${location.x}, ${location.y}, ${location.z}!`);
        }
        
    } catch (error) {
        console.error(`Error in checkSaplingGrowth: ${error}`);
    }
}
