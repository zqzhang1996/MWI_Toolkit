**海外源:** [GitHub](https://github.com/zqzhang1996/MWI_Toolkit) | [GreasyFork](https://greasyfork.org/en/scripts/552330)

**Gitee镜像:** [项目地址](https://gitee.com/zqzhang1996/MWI_Toolkit) | [直链下载](https://gitee.com/zqzhang1996/MWI_Toolkit/raw/main/MWI_Toolkit.user.js)

### 本地编译
```bash
cmd /c npm run build
```

# 中文说明

## 动作面板提供增强模块
>为前八个专业的动作面板提供增强功能（炼金支持正在考虑中）

1. **目标数量输入**
   - 为所有单次产出数量大于1的动作添加目标数量输入框，与动作次数输入框实时联动
   - 对于使用加工茶的动作，提供额外输入框显示最终获得的加工产物数量

2. **原料需求追踪**
   - 自动计算并显示所需原料数量，与动作输入实时同步。当库存不足时，缺口数量将以橙色高亮显示

3. **计算细节**
   - 社区采集加成基于打开动作面板时的等级计算，不考虑执行过程中加成失效或升级
   - 茶效果基于实时配置计算，不考虑使用配装切换茶的情况
   - 暴饮之囊、采集首饰、贤者首饰只要拥有即视为启用，强化等级取最高，贤者首饰优先级高于采集首饰

## MWI计算器模块
0. **计算器界面**
   - 在配装标签页右侧新增`MWI计算器`标签页
   - 仅适配桌面版布局，因宽度限制暂不支持移动端窄屏界面

1. **物品需求管理**
   - 通过顶部搜索功能按数量添加物品至需求列表，或选择房屋并按等级添加
   - 可以对单个物品或整个物品分类勾选是否进行计算，参与计算的物品背景显示为绿色
   - 需求列表按角色独立保存，页面刷新后数据不会丢失
   - 支持跨角色复制需求清单：在搜索框输入目标角色ID（游戏网址中的数字）并点击添加，适合管理多个IC角色的玩家
   - 可以添加数量为负的物品来手动抵消需求
   >如添加-1个`灵魂猎手弩`，则计算`裂空之弩`时即使库存中没有+0的`灵魂猎手弩`也会按拥有一个来计算，用于使用已有的带有强化等级的装备进行升级，或计划购买而非亲自制作该物品的场景

2. **库存状态总览**
   - 左侧面板实时显示当前库存/目标数量，房屋显示当前等级/目标等级，数据实时更新
   - 带有强化等级的物品不计入库存数据，也不参与计算，如有需求请添加对应的负数物品来抵消需求

3. **材料缺口分析**
   - 右侧缺口显示面板基于当前库存从源头计算所有缺口材料的数量，需要对制作配方有基本了解，从最基础的原材料开始逐步处理
   - 缺口数量实时更新，跟随库存变化动态调整
   - 已满足需求的物品自动隐藏，保持界面简洁
   - 按住`Ctrl`（MAC中为`Command`）点击缺口数字可以跳转到对应的动作面板并填写所需的动作次数，对于产出数量随机的动作会额外增加一定的动作数量，保证行动队列结束后尽可能满足需求

4. **计算详情查看**
   - 右侧详情显示面板显示 (净值/需求) 的格式
   - 净值为库存数量扣除计划消耗量后剩余的数量，当存在缺口时显示为负值
   - 需求为从零完成需求列表所需的物品数量
   - 通过详情面板可以观察每个项目的具体进度情况，或者在存在社区buff时确认库存相对短缺的资源类型，用于规划行动队列

# English Description

## Action Panel Enhancement Module
>Enhances the action panel for the first eight professions (alchemy support is under consideration)

1. **Target Quantity Input**
   - Adds a target quantity input field for all actions that produce more than 1 item per execution, automatically syncing with the action count field
   - For actions involving processed tea, provides an additional input field showing the final number of processed items you'll receive

2. **Material Requirements Tracking**
   - Automatically calculates and displays the required material quantities, updating in real time with action input. When inventory is insufficient, the shortage amount is highlighted in orange

3. **Calculation Details**
   - Community gathering buffs are calculated based on the level when the action panel opens, not considering buff expiration or level up during execution
   - Tea effects are calculated based on real-time configuration, not considering switching tea via loadout
   - Guzzling Pouch, Gathering Jewelry, and Philosopher's Jewelry are considered enabled if owned. The highest enhancement level is used, and Philosopher's Jewelry takes priority over Gathering Jewelry

## MWI Calculator Module
0. **Calculator Interface**
   - Adds a `MWI_Calculator` tab to the right of the loadout tab
   - Only supports desktop layout; mobile/narrow screen is not supported due to width limitations

1. **Item Requirement Management**
   - Add items to the requirement list by quantity using the top search function, or select houses and add by level
   - You can check whether to include a single item or an entire category in the calculation; included items are highlighted in green
   - Requirement lists are saved per character and persist after page refresh
   - Supports copying requirement lists across characters: enter the target character ID (the number in the game URL) in the search box and click add, suitable for players managing multiple IC characters
   - You can add items with negative quantities to manually offset requirements
   >For example, adding -1 `Soul Hunter Crossbow` will make the calculator treat it as if you have one when calculating `Sundering Crossbow`, even if you don't have a +0 one in inventory. This is useful for upgrading existing enhanced equipment or planning to buy rather than craft an item

2. **Inventory Overview**
   - The left panel shows current inventory/target quantity, and houses show current level/target level, data updates in real time
   - Items with enhancement levels are not counted in inventory data or calculations. If needed, add corresponding negative items to offset

3. **Material Shortages Analysis**
   - The right Shortages panel calculates all missing materials from scratch based on current inventory, requiring basic knowledge of crafting recipes. Start with the most basic raw materials
   - Shortages quantities update in real time, dynamically adjusting with inventory changes
   - Items that meet requirements are automatically hidden to keep the interface clean
   - Hold `Ctrl` (on MAC use `Command`) and click the shortages number to jump to the corresponding action panel and fill in the required action count. For actions with random output, extra actions are added to ensure requirements are met after the queue ends

4. **Calculation Details View**
   - The right Status panel displays Net/Required format for each item
   - Net means the remaining quantity after subtracting planned consumption from inventory; if there is a shortage, it will be negative
   - Required means the total amount needed to fulfill the requirement list from zero
   - The Status panel lets you observe the progress of each item, or check which resources are relatively short when community buffs are present, to help plan your action queue