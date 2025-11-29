import { world, system, BlockPermutation } from "@minecraft/server";
const RESPAWN_TIME_TICKS = 48000; 
const REGENERATING_ORES = [
    "minecraft:ancient_debris",
    "minecraft:glowstone",
    "minecraft:gold_ore",
    "minecraft:deepslate_gold_ore",
    "minecraft:nether_gold_ore",
    "minecraft:emerald_ore",
    "minecraft:deepslate_emerald_ore",
    "minecraft:diamond_ore",
    "minecraft:deepslate_diamond_ore",
    "minecraft:iron_ore",
    "minecraft:deepslate_iron_ore",
    "minecraft:coal_ore",
    "minecraft:deepslate_coal_ore",
    "minecraft:redstone_ore",
    "minecraft:deepslate_redstone_ore",
    "minecraft:lapis_ore",
    "minecraft:deepslate_lapis_ore"
];
const TEMPORARY_BLOCK_ID = "minecraft:cobblestone";
const blocksToRegenerate = [];
function isRegeneratingOre(blockId) {
    return REGENERATING_ORES.includes(blockId);
}
function storeForRegeneration(block) {
    const respawnTick = system.currentTick + RESPAWN_TIME_TICKS;
    const existingIndex = blocksToRegenerate.findIndex(b => 
        b.x === block.x && 
        b.y === block.y && 
        b.z === block.z && 
        b.dimensionId === block.dimension.id
    );

    if (existingIndex !== -1) {
        blocksToRegenerate[existingIndex].respawnTick = respawnTick;
        return;
    }
    blocksToRegenerate.push({
        x: block.x,
        y: block.y,
        z: block.z,
        dimensionId: block.dimension.id,
        originalBlockId: block.typeId, // Store the original ore ID
        respawnTick: respawnTick
    });
}
function regenerationLoop() {
    const currentTick = system.currentTick;
    for (let i = blocksToRegenerate.length - 1; i >= 0; i--) {
        const data = blocksToRegenerate[i];
        if (currentTick >= data.respawnTick) {
            try {
                const dimension = world.getDimension(data.dimensionId);
                const block = dimension.getBlock({ x: data.x, y: data.y, z: data.z });
                if (block && block.typeId === TEMPORARY_BLOCK_ID) {
                    const originalPermutation = BlockPermutation.resolve(data.originalBlockId);
                    block.setPermutation(originalPermutation);
                    blocksToRegenerate.splice(i, 1);
                } else if (block && isRegeneratingOre(block.typeId)) {
                    blocksToRegenerate.splice(i, 1);
                }

            } catch (e) {
                console.error(`Error regenerating block at ${data.x}, ${data.y}, ${data.z}: ${e}`);
                blocksToRegenerate.splice(i, 1);
            }
        }
    }
}
function onBeforeBlockBreak(event) {
    const { block } = event;
    if (isRegeneratingOre(block.typeId)) {
        storeForRegeneration(block);
        event.cancel = true;
        system.run(() => {
            const currentBlock = block.dimension.getBlock(block.location);
            if (currentBlock.typeId === block.typeId) {
                block.setPermutation(BlockPermutation.resolve(TEMPORARY_BLOCK_ID));
            }
        });
        system.run(() => {
            block.dimension.spawnItem(block.getItemStack(), block.center());
        });
    }
}
function initialize() {
    world.beforeEvents.playerBreakBlock.subscribe(onBeforeBlockBreak);

    // Set up the recurring loop for regeneration check (runs every tick)
    system.runInterval(regenerationLoop);
}
initialize();
