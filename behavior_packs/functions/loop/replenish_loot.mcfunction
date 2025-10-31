execute as @e[type=armor_stand,tag=trial_dispenser_loot] at @s unless entity @a[r=5] run loot replace block ~ ~ ~ container from loot "dispenser/trial_chamber_trap"
execute as @e[type=armor_stand,tag=ancient_city_loot] at @s unless entity @a[r=5] run loot replace block ~ ~ ~ container from loot "chests/ancient_city"
execute as @e[type=armor_stand,tag=jungle_temple_dispenser] at @s unless entity @a[r=5] run loot replace block ~ ~ ~ container from loot "dispenser/jungle_temple_dispenser"
# For non dispenser loot, must add the other loots for the chests
