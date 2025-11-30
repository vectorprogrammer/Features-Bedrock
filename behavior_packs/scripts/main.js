import { world } from "@minecraft/server";
import "./pale_oak_growth_drops";
import "./ore_regeneration";
import "./netherite_crafter_components";
world.afterEvents.worldIntialize.subscribe(()=>{
    world.sendMessage("Scripting API initalized");
});
