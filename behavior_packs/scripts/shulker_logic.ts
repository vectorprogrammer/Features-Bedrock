import {
    world,
    MinecraftDimensionTypes,
    BlockPermutation,
    Player,
    EntityDieAfterEvent,
    ItemStack,
    Items,
    EnchantmentTypes
} from '@minecraft/server';

// --- CONFIGURATION ---
const SHULKER_RESPAWN_CHANCE_PER_TICK = 0.005; // ~10% chance every 20 ticks (1 second) in the check loop
const RESPAWN_BLOCK_ID = "minecraft:purpur_block";
const SHULKER_ID = "minecraft:shulker";

// For Tipped Arrow of Levitation:
// Levitation is Potion ID 25. The data value for tipped arrows is Potion ID + 1.
// However, the Script API uses the built-in Item data/auxiliary value, which corresponds to the potion type.
const ARROW_ITEM_ID = "minecraft:tipped_arrow";
// Levitation effect ID in Bedrock is 25. We set the aux value to this for the tipped arrow.
const LEVITATION_POTION_ID = 25; 

// --- DROP CALCULATION ---

/**
 * Calculates the drop count based on the Looting level, respecting your required ranges.
 * @param lootingLevel The level of the Looting enchantment on the killer's weapon (0-3).
 * @returns The final number of arrows to drop.
 */
function calculateDropCount(lootingLevel: number): number {
    let minDrop = 0;
    let maxDrop: number;

    // Define max drop based on your requirements:
    // Base (Looting 0): 0-3
    // Looting I (Level 1): 0-5
    // Looting II (Level 2): 0-7
    // Looting III (Level 3): 0-10
    
    switch (lootingLevel) {
        case 0:
            maxDrop = 3;
            break;
        case 1:
            maxDrop = 5;
            break;
        case 2:
            maxDrop = 7;
            break;
        case 3:
            maxDrop = 10;
            break;
        default:
            // For levels higher than 3 (if ever possible)
            maxDrop = 10;
            break;
    }

    // Generate a random number between minDrop (0) and maxDrop (inclusive)
    return Math.floor(Math.random() * (maxDrop + 1));
}

// --- ENTITY DIE EVENT: CUSTOM LOOT DROP ---
world.afterEvents.entityDie.subscribe((event: EntityDieAfterEvent) => {
    const deadEntity = event.deadEntity;
    const damageSource = event.damageSource;

    // 1. Check if the dead entity is a Shulker
    if (deadEntity.typeId !== SHULKER_ID) return;

    // 2. Check if it was killed by a player
    const killer = damageSource.damagingEntity;
    if (!(killer instanceof Player)) return;

    // 3. Get the Looting level from the killer's main hand item
    let lootingLevel = 0;
    try {
        const inventory = killer.getComponent("minecraft:inventory");
        const mainHand = inventory?.getInventory()?.getItem(killer.selectedSlot);

        if (mainHand) {
            // Check for the 'minecraft:enchantments' component on the item stack
            const enchantmentComponent = mainHand.getComponent("minecraft:enchantments");
            
            if (enchantmentComponent) {
                // Get the Looting enchantment
                const lootingEnchantment = enchantmentComponent.enchantments.getEnchantment(EnchantmentTypes.looting);
                
                // Set the level, defaulting to 0 if the enchantment is not present
                lootingLevel = lootingEnchantment?.level ?? 0;
            }
        }
    } catch (e) {
        console.error("Error checking killer's item for Looting:", e);
        // Continue with lootingLevel = 0 if there's an error
    }
    
    // 4. Calculate the drop amount
    const dropCount = calculateDropCount(lootingLevel);
    
    if (dropCount > 0) {
        // 5. Create the Levitation Tipped Arrow ItemStack
        const levitationArrow = new ItemStack(Items.get(ARROW_ITEM_ID), dropCount);
        
        // Set the auxiliary value to the Levitation Potion ID (25).
        levitationArrow.setAuxiliaryValue(LEVITATION_POTION_ID);
        
        // 6. Drop the item at the Shulker's location (Ensuring item drops at the entity's location)
        deadEntity.dimension.spawnItem(levitationArrow, deadEntity.location);
    }
});

// --- SHULKER RESPAWN LOGIC ---
const END_DIMENSION = world.getDimension(MinecraftDimensionTypes.theEnd);
const PURPUR_BLOCK_PERM = BlockPermutation.resolve(RESPAWN_BLOCK_ID);

/**
 * Checks a random block near a player in the End dimension for respawning Shulkers.
 * It's run frequently via the tick event.
 */
function checkForShulkerRespawn() {
    const players = world.getPlayers();
    
    for (const player of players) {
        // 1. Only check players in the End dimension
        if (player.dimension.id !== MinecraftDimensionTypes.theEnd) continue;

        // 2. Roll a die to see if we should attempt a respawn this tick near this player
        if (Math.random() > SHULKER_RESPAWN_CHANCE_PER_TICK) continue;

        // 3. Choose a random location near the player to check (within a safe End City height)
        const checkRange = 20; // Check within a 20 block radius
        const x = player.location.x + (Math.random() - 0.5) * 2 * checkRange;
        const y = Math.max(40, Math.min(100, player.location.y + (Math.random() - 0.5) * 2 * checkRange)); // Typical End City height
        const z = player.location.z + (Math.random() - 0.5) * 2 * checkRange;

        const checkLocation = { x: Math.floor(x), y: Math.floor(y), z: Math.floor(z) };
        
        try {
            const block = END_DIMENSION.getBlock(checkLocation);
            
            // 4. Check if the block is a Purpur Block
            if (block && block.permutation.matches(PURPUR_BLOCK_PERM)) {
                
                // 5. Check if the block above is air/empty (necessary for spawn)
                const blockAbove = END_DIMENSION.getBlock({x: checkLocation.x, y: checkLocation.y + 1, z: checkLocation.z});
                if (blockAbove && blockAbove.typeId === "minecraft:air") {
                    
                    // 6. Check for existing shulkers nearby to prevent clustering
                    const nearbyShulkers = END_DIMENSION.getEntities({
                        type: SHULKER_ID,
                        location: checkLocation,
                        maxDistance: 8 // Check for shulkers within an 8-block radius
                    });
                    
                    if (nearbyShulkers.length === 0) {
                        // 7. Respawn the Shulker
                        // Shulkers stick to the side, spawning them at the center of the block works fine.
                        END_DIMENSION.spawnEntity(SHULKER_ID, {
                            x: checkLocation.x + 0.5,
                            y: checkLocation.y + 0.5,
                            z: checkLocation.z + 0.5
                        });
                        console.log("Shulker respawned at:", checkLocation);
                    }
                }
            }
        } catch (e) {
            // This usually happens if the random location is in an unloaded chunk
            // Console.error is commented out to avoid excessive console spam
            // console.error("Error during Shulker respawn check:", e); 
        }
    }
}


// Run the respawn check every 20 ticks (1 second)
world.afterEvents.tick.subscribe((event) => {
    // Only perform the heavy checks periodically
    if (event.currentTick % 20 === 0) { 
        checkForShulkerRespawn();
    }
});
