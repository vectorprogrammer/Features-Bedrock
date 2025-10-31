execute if score @s loop_timer matches 20 run function loop/reset_vaults
execute if score @s loop_timer matches 20 run function loop/replenish_ores
execute if score @s loop_timer matches 20 run function loop/replenish_loot
execute if score @s loop_timer matches 20 run scoreboard players set @s loop_timer 0
