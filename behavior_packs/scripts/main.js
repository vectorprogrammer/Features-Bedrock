import { system, world, BlockComponentRegistry } from "@minecraft/server";
import "./pale_oak_growth_drops";
import "./ore_regeneration";
import {NetheriteCrafterComponent} from "./netherite_crafter_components";
world.afterEvents.worldIntialize.subscribe(()=>{
    world.sendMessage("Scripting API fully initalized");
})
const CUSTOM_COMPONENT_ID = "convertedjava:netherite_crafter_script:crafter_component"
system.beforeEvents.worldInitalize.subscribe(initEvent => {
    try {
        initEvent.blockComponentRegistry.registerCustomComponent(CUSTOM_COMPONENT_ID, new NetheriteCrafterComponent())
        world.sendMessage("Scripting API first step initialized.");
    } catch (e) {
        world.sendMessage("Scripting API first step unsuccessful. Continuing...");
    }
}
