execute at @e[type=minecraft:trial_vault,c=1] unless entity @a[r=3] run tag @s add used_vault_block
execute at @e[type=minecraft:ominous_trial_vault,c=1] unless entity @a[r=3] run tag @s add used_ominous_vault_block
execute at @e[type=minecraft:trial_vault,tag=used_vault_block] run fill ~ ~ ~ ~ ~ ~ air 0 replace minecraft:trial_vault 0
execute at @e[type=minecraft:trial_vault,tag=used_vault_block] run setblock ~ ~ ~ minecraft:trial_vault 0
execute at @e[type=minecraft:trial_vault,tag=used_vault_block] run tag @s remove used_vault_block
execute at @e[type=minecraft:ominous_trial_vault,tag=used_ominous_vault_block] run fill ~ ~ ~ ~ ~ ~ air 0 replace minecraft:ominous_trial_vault 0
execute at @e[type=minecraft:ominous_trial_vault,tag=used_ominous_vault_block] run setblock ~ ~ ~ minecraft:ominous_trial_vault 0
execute at @e[type=minecraft:ominous_trial_vault,tag=used_ominous_vault_block] run tag @s remove used_ominous_vault_block
