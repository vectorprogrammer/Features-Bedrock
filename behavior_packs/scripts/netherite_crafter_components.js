import { BlockCustomComponent, system, world, ItemStack, Player, Container, Vector, BlockInventoryComponent } from '@minecraft/server';
import { Form, FormRejectReason } from '@minecraft/server-ui';

// Custom Item Identifiers
const NETHERITE_INGOT = "minecraft:netherite_ingot";
const STICK = "minecraft:stick";

// Define the custom UI ID used in RP/ui/_ui_defs.json
const CRAFTER_UI_ID = "ui_netherite_crafter";

// Recipe definitions: [Inputs, Output]
const ARMOR_RECIPES = {
    // Left side slots 0-3 (Helmet, Chestplate, Leggings, Boots)
    "H": { inputs: [{ item: NETHERITE_INGOT, count: 1 }], output: "minecraft:netherite_helmet" }, // Slot 0
    "C": { inputs: [{ item: NETHERITE_INGOT, count: 2 }], output: "minecraft:netherite_chestplate" }, // Slot 1
    "L": { inputs: [{ item: NETHERITE_INGOT, count: 1 }], output: "minecraft:netherite_leggings" }, // Slot 2
    "B": { inputs: [{ item: NETHERITE_INGOT, count: 1 }], output: "minecraft:netherite_boots" } // Slot 3
};

const TOOL_RECIPES = {
    // Right side slots 4-9 (Axe, Hoe, Pickaxe, Spear, Shovel, Sword)
    "A": { inputs: [{ item: NETHERITE_INGOT, count: 1 }, { item: STICK, count: 1 }], output: "minecraft:netherite_axe" }, // Slot 4
    "O": { inputs: [{ item: NETHERITE_INGOT, count: 1 }, { item: STICK, count: 1 }], output: "minecraft:netherite_hoe" }, // Slot 5
    "P": { inputs: [{ item: NETHERITE_INGOT, count: 1 }, { item: STICK, count: 1 }], output: "minecraft:netherite_pickaxe" }, // Slot 6
    "R": { inputs: [{ item: NETHERITE_INGOT, count: 1 }, { item: STICK, count: 1 }], output: "minecraft:netherite_spear" }, // Slot 7
    "S": { inputs: [{ item: NETHERITE_INGOT, count: 1 }, { item: STICK, count: 1 }], output: "minecraft:netherite_shovel" }, // Slot 8
    "W": { inputs: [{ item: NETHERITE_INGOT, count: 1 }, { item: STICK, count: 1 }], output: "minecraft:netherite_sword" } // Slot 9
};

// Map of all recipe slot indices to their recipe data and input/output slot indices
// The total inventory size must be 16 (4 armor + 6 tools) * (1 or 2 input + 1 output) = 10 input slots + 6 output slots = 16 slots.
// For simplicity, we'll map the UI slots to a single block container of size 16.

// UI Slot Mapping (Total 16 slots in the block's internal container)
// Armor (Left Side):
// Helmet: [Input 1 Slot 0] -> [Output Slot 4]
// Chestplate: [Input 2 Slot 1, Input 2 Slot 2] -> [Output Slot 5]
// Leggings: [Input 1 Slot 3] -> [Output Slot 6]
// Boots: [Input 1 Slot 7] -> [Output Slot 7]
//
// Tools (Right Side):
// Axe: [Input 2 Slot 8, Input 2 Slot 9] -> [Output Slot 10]
// ...and so on.
//
// This is overly complex. The UI uses a custom container, which simplifies the slot mapping, but we still need 16 slots total.
// Let's use 16 slots: Slots 0-9 are inputs, Slots 10-15 are outputs.

/**
 * @type {{
 * inputSlots: number[], 
 * outputSlot: number, 
 * recipeId: string, 
 * inputs: { item: string, count: number }[], 
 * outputItem: string 
 * }[]}
 */
const RECIPE_SLOTS_MAP = [
    // --- ARMOR (Left Side, 4 recipes) ---
    // 0: Helmet (1 Ingot -> Helmet)
    { recipeId: "H", inputs: ARMOR_RECIPES.H.inputs, outputItem: ARMOR_RECIPES.H.output, inputSlots: [0], outputSlot: 4 }, 
    // 1: Chestplate (2 Ingots -> Chestplate)
    { recipeId: "C", inputs: ARMOR_RECIPES.C.inputs, outputItem: ARMOR_RECIPES.C.output, inputSlots: [1, 2], outputSlot: 5 },
    // 2: Leggings (1 Ingot -> Leggings)
    { recipeId: "L", inputs: ARMOR_RECIPES.L.inputs, outputItem: ARMOR_RECIPES.L.output, inputSlots: [3], outputSlot: 6 },
    // 3: Boots (1 Ingot -> Boots)
    { recipeId: "B", inputs: ARMOR_RECIPES.B.inputs, outputItem: ARMOR_RECIPES.B.output, inputSlots: [7], outputSlot: 7 },

    // --- TOOLS (Right Side, 6 recipes) ---
    // 4: Axe (1 Ingot + 1 Stick -> Axe)
    { recipeId: "A", inputs: TOOL_RECIPES.A.inputs, outputItem: TOOL_RECIPES.A.output, inputSlots: [8, 9], outputSlot: 10 },
    // 5: Hoe (1 Ingot + 1 Stick -> Hoe)
    { recipeId: "O", inputs: TOOL_RECIPES.O.inputs, outputItem: TOOL_RECIPES.O.output, inputSlots: [11, 12], outputSlot: 11 },
    // 6: Pickaxe (1 Ingot + 1 Stick -> Pickaxe)
    { recipeId: "P", inputs: TOOL_RECIPES.P.inputs, outputItem: TOOL_RECIPES.P.output, inputSlots: [13, 14], outputSlot: 12 },
    
    const CRAFTING_MAP = [
        // ARMOR (Input slots 0-4, Output slots 16-19)
        // 0: Helmet (1 Ingot -> Helmet)
        { inputs: [{ slot: 0, item: NETHERITE_INGOT, count: 1 }], output: { slot: 16, item: ARMOR_RECIPES.H.output } },
        // 1: Chestplate (2 Ingots -> Chestplate)
        { inputs: [{ slot: 1, item: NETHERITE_INGOT, count: 1 }, { slot: 2, item: NETHERITE_INGOT, count: 1 }], output: { slot: 17, item: ARMOR_RECIPES.C.output } },
        // 2: Leggings (1 Ingot -> Leggings)
        { inputs: [{ slot: 3, item: NETHERITE_INGOT, count: 1 }], output: { slot: 18, item: ARMOR_RECIPES.L.output } },
        // 3: Boots (1 Ingot -> Boots)
        { inputs: [{ slot: 4, item: NETHERITE_INGOT, count: 1 }], output: { slot: 19, item: ARMOR_RECIPES.B.output } },

        // TOOLS (Input slots 5-15, Output slots 20-25)
        // 4: Axe (1 Ingot + 1 Stick -> Axe)
        { inputs: [{ slot: 5, item: NETHERITE_INGOT, count: 1 }, { slot: 6, item: STICK, count: 1 }], output: { slot: 20, item: TOOL_RECIPES.A.output } },
        // 5: Hoe (1 Ingot + 1 Stick -> Hoe)
        { inputs: [{ slot: 7, item: NETHERITE_INGOT, count: 1 }, { slot: 8, item: STICK, count: 1 }], output: { slot: 21, item: TOOL_RECIPES.O.output } },
        // 6: Pickaxe (1 Ingot + 1 Stick -> Pickaxe)
        { inputs: [{ slot: 9, item: NETHERITE_INGOT, count: 1 }, { slot: 10, item: STICK, count: 1 }], output: { slot: 22, item: TOOL_RECIPES.P.output } },
        // 7: Spear (1 Ingot + 1 Stick -> Trident)
        { inputs: [{ slot: 11, item: NETHERITE_INGOT, count: 1 }, { slot: 12, item: STICK, count: 1 }], output: { slot: 23, item: TOOL_RECIPES.R.output } },
        // 8: Shovel (1 Ingot + 1 Stick -> Shovel)
        { inputs: [{ slot: 13, item: NETHERITE_INGOT, count: 1 }, { slot: 14, item: STICK, count: 1 }], output: { slot: 24, item: TOOL_RECIPES.S.output } },
        // 9: Sword (1 Ingot + 1 Stick -> Sword)
        { inputs: [{ slot: 15, item: NETHERITE_INGOT, count: 1 }, { slot: 16, item: STICK, count: 1 }], output: { slot: 25, item: TOOL_RECIPES.W.output } }
    ]; // Total slots used: 17 inputs (0-16) + 10 outputs (16-25) -> Error in indexing.

    // Corrected 27 Slot Map (0-26):
    // Input Slots: 0-16 (17 slots used)
    // Output Slots: 17-26 (10 slots used)
    // 0: H Ingot -> 17
    // 1: C Ingot 1, 2: C Ingot 2 -> 18
    // 3: L Ingot -> 19
    // 4: B Ingot -> 20
    // 5: Axe Ingot, 6: Axe Stick -> 21
    // 7: Hoe Ingot, 8: Hoe Stick -> 22
    // 9: Pickaxe Ingot, 10: Pickaxe Stick -> 23
    // 11: Spear Ingot, 12: Spear Stick -> 24
    // 13: Shovel Ingot, 14: Shovel Stick -> 25
    // 15: Sword Ingot, 16: Sword Stick -> 26
    // Total 17 input slots + 10 output slots = 27 slots. Perfect for a single chest container.

    const FINAL_CRAFTING_MAP = [
        // Row 0: Helmet (Inputs: [0]) -> Output: [17]
        { inputs: [{ slot: 0, item: NETHERITE_INGOT, count: 1 }], output: { slot: 17, item: ARMOR_RECIPES.H.output } },
        // Row 1: Chestplate (Inputs: [1, 2]) -> Output: [18]
        { inputs: [{ slot: 1, item: NETHERITE_INGOT, count: 1 }, { slot: 2, item: NETHERITE_INGOT, count: 1 }], output: { slot: 18, item: ARMOR_RECIPES.C.output } },
        // Row 2: Leggings (Inputs: [3]) -> Output: [19]
        { inputs: [{ slot: 3, item: NETHERITE_INGOT, count: 1 }], output: { slot: 19, item: ARMOR_RECIPES.L.output } },
        // Row 3: Boots (Inputs: [4]) -> Output: [20]
        { inputs: [{ slot: 4, item: NETHERITE_INGOT, count: 1 }], output: { slot: 20, item: ARMOR_RECIPES.B.output } },

        // Row 4: Axe (Inputs: [5, 6]) -> Output: [21]
        { inputs: [{ slot: 5, item: NETHERITE_INGOT, count: 1 }, { slot: 6, item: STICK, count: 1 }], output: { slot: 21, item: TOOL_RECIPES.A.output } },
        // Row 5: Hoe (Inputs: [7, 8]) -> Output: [22]
        { inputs: [{ slot: 7, item: NETHERITE_INGOT, count: 1 }, { slot: 8, item: STICK, count: 1 }], output: { slot: 22, item: TOOL_RECIPES.O.output } },
        // Row 6: Pickaxe (Inputs: [9, 10]) -> Output: [23]
        { inputs: [{ slot: 9, item: NETHERITE_INGOT, count: 1 }, { slot: 10, item: STICK, count: 1 }], output: { slot: 23, item: TOOL_RECIPES.P.output } },
        // Row 7: Spear (Inputs: [11, 12]) -> Output: [24]
        { inputs: [{ slot: 11, item: NETHERITE_INGOT, count: 1 }, { slot: 12, item: STICK, count: 1 }], output: { slot: 24, item: TOOL_RECIPES.R.output } },
        // Row 8: Shovel (Inputs: [13, 14]) -> Output: [25]
        { inputs: [{ slot: 13, item: NETHERITE_INGOT, count: 1 }, { slot: 14, item: STICK, count: 1 }], output: { slot: 25, item: TOOL_RECIPES.S.output } },
        // Row 9: Sword (Inputs: [15, 16]) -> Output: [26]
        { inputs: [{ slot: 15, item: NETHERITE_INGOT, count: 1 }, { slot: 16, item: STICK, count: 1 }], output: { slot: 26, item: TOOL_RECIPES.W.output } }
    ];


/**
 * Custom component logic for the Netherite Crafter block.
 * Handles opening the UI and running the crafting recipes.
 */
export class NetheriteCrafterComponent {

    /**
     * @remarks
     * This function is called when a player interacts with the block.
     * @param {import('@minecraft/server').BlockComponentPlayerInteractEvent} event 
     */
    onInteract(event) {
        const { block, player } = event;
        
        // Use a Script Form to open the custom UI screen
        const crafterForm = new Form();
        
        // Send the player's ID and the block's coordinates to the UI screen for access
        // This is a common way to pass data to a custom UI element defined in the RP
        crafterForm.setTitle("Netherite Crafter");
        crafterForm.setCustomFormId(CRAFTER_UI_ID);
        crafterForm.setScriptData({
            block_x: block.x,
            block_y: block.y,
            block_z: block.z,
            player_id: player.id
        });

        player.showForm(crafterForm);
        
        // Prevents the block from being automatically activated by the player's main hand item
        event.cancel = true;
    }

    /**
     * @remarks
     * This function is called on a scheduled tick to check for recipes.
     * @param {import('@minecraft/server').BlockComponentTickEvent} event 
     */
    onTick(event) {
        const { block } = event;
        const inventory = block.getComponent("minecraft:inventory");
        if (!inventory) return;
        
        /** @type {Container} */
        const container = inventory.container;

        // Check every recipe row
        for (const recipe of FINAL_CRAFTING_MAP) {
            let canCraft = true;
            
            // 1. Check if all input materials are present
            for (const input of recipe.inputs) {
                const slot = container.getSlot(input.slot);
                if (!slot.hasItem() || slot.typeId !== input.item || slot.amount < input.count) {
                    canCraft = false;
                    break;
                }
            }
            
            // 2. Check if the output slot is empty or contains the same item and is not full
            const outputSlot = container.getSlot(recipe.output.slot);
            const outputStack = new ItemStack(recipe.output.item);
            
            if (outputSlot.hasItem()) {
                // If it has an item, it must match the result and not be at max stack size
                if (outputSlot.typeId !== recipe.output.item || outputSlot.amount >= outputStack.maxAmount) {
                    canCraft = false;
                }
            }

            // 3. If all checks pass, set the output item
            if (canCraft) {
                // If the output slot is empty, set the item
                if (!outputSlot.hasItem()) {
                    outputSlot.setItem(outputStack);
                } else {
                    // If it matches, just increment the count by 1
                    outputSlot.amount++;
                }
                
                // 4. Consume the input materials
                for (const input of recipe.inputs) {
                    const slot = container.getSlot(input.slot);
                    slot.amount -= input.count;
                }
            } else {
                // If the recipe is not craftable, clear the output slot if it holds the recipe output.
                // This prevents 'phantom' results from recipes that require item removal.
                if (outputSlot.typeId === recipe.output.item) {
                     // Note: We only clear if the recipe is uncraftable AND the output slot is not taken by a player.
                    // Since this is a custom container, the player needs to take the item for it to clear.
                    // For continuous crafting, we rely on the player taking the output. 
                    // To prevent ghost items, we ensure the output slot is empty if inputs are missing.
                    if (outputSlot.typeId === recipe.output.item && outputSlot.amount === 1) {
                         // Only clear if the user hasn't put anything in it and the recipe is wrong.
                         // But since players can put items in the output slot, this is risky.
                         // For simplicity and to match the vanilla 'Crafter' block behavior, 
                         // we'll rely on the player removing the item for the next craft.
                    }
                }
                // Optional: For this demonstration, we won't clear the output to let the player manually handle it.
            }
        }
    }
}
