// ==UserScript==
// @name         MWI_Toolkit
// @namespace    http://tampermonkey.net/
// @version      5.0.4
// @description  MWI工具集
// @author       zqzhang1996
// @match        https://www.milkywayidle.com/*
// @match        https://test.milkywayidle.com/*
// @require      https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-body
// @license      MIT
// ==/UserScript==

// LZString 声明
declare const LZString: {
    decompressFromUTF16(compressed: string): string;
};

declare function GM_setValue(key: string, value: any): void;
declare function GM_getValue(key: string, defaultValue?: any): any;

/**
 * 支持的语言类型
 * zh: 简体中文
 * en: 英语
 */
type I18nLanguage = 'zh' | 'en';

/**
 * 国际化资源分类类型
 * 用于指定要查询的资源类型
 */
type I18nCategory =
    'actionNames' |
    'characterManagement' |
    'houseRoomNames' |
    'itemCategoryNames' |
    'itemNames';

/**
 * 国际化配置选项
 */
interface I18nOptions {
    resources: {
        [lang in I18nLanguage]: {
            translation: {
                [category in I18nCategory]: {
                    [hrid: string]: string;
                };
            };
        };
    };
}

/**
 * 游戏对象结构（从React组件实例中获取）
 */
interface GameObject {
    handleGoToAction(actionHrid: string, actionCount: number): void;
    language: I18nLanguage;
    props: {
        /** 国际化配置 */
        i18n: {
            options: I18nOptions;
        };
    };
    state: {
        actionTypeDrinkSlotsDict: {
            [actionType: string]: Array<{
                itemHrid: string;
            }>
        }
        communityBuffs: Array<{
            hrid: string;
            isDone: boolean;
            level: number;
        }>
        character: {
            id: number;
        }
        characterHouseRoomDict: {
            [houseRoomHrid: string]: {
                level: number;
            }
        }
    }
}

/**
 * 初始化客户端数据
 */
interface InitClientData {
    actionDetailMap: {
        [actionHrid: string]: ActionDetail;
    }
    itemDetailMap: {
        [itemHrid: string]: ItemDetail;
    }
    houseRoomDetailMap: {
        [houseRoomHrid: string]: HouseRoomDetail;
    }
    shopItemDetailMap: {
        [shopItemHrid: string]: ShopItemDetail;
    }
    enhancementLevelTotalBonusMultiplierTable: Array<number>
}

/**
 * 物品详细信息
 */
interface ItemDetail {
    categoryHrid: string;
    equipmentDetail?: EquipmentDetail;
    itemHrid: number;
    sortIndex: number;
}

interface EquipmentDetail {
    type: string;
    levelRequirement: Array<{
        skillHrid: string;
        level: number;
    }>
    combatStats: {
        [statName: string]: number;
    }
    noncombatStats: {
        [statName: string]: number;
    }
    combatEnhancementBonuses: {
        [statName: string]: number;
    }
    noncombatEnhancementBonuses: {
        [statName: string]: number;
    }
}

/**
 * 房屋详细信息
 */
interface HouseRoomDetail {
    hrid: string;
    skillHrid: string;
    upgradeCostsMap: {
        [level: number]: Array<ItemWithCount>;
    }
    sortIndex: number;
}

interface ShopItemDetail {
    hrid: string;
    category: string;
    itemHrid: string;
    costs: Array<ItemWithCount>;
    sortIndex: number;
}

/**
 * 物品及数量结构
 * 用于表示配方输入/输出、物品消耗等场景
 */
interface ItemWithCount {
    /** 物品的唯一标识符 */
    itemHrid: string;
    /** 物品数量 */
    count: number;
    /** 最小掉落数量 */
    minCount?: number;
    /** 最大掉落数量 */
    maxCount?: number;
}

/**
 * 物品掉落配置结构
 * 用于表示掉落表、奖励表等场景
 */
interface ItemDrop {
    /** 物品的唯一标识符 */
    itemHrid: string;
    /** 基础掉落率 */
    dropRate: number;
    /** 每难度等级增加的掉落率（可选） */
    dropRatePerDifficultyTier?: number;
    /** 最小掉落数量 */
    minCount: number;
    /** 最大掉落数量 */
    maxCount: number;
}

/**
 * 行动详细信息结构
 * 包含游戏中各种行动（采集、制造、战斗等）的完整配置信息
 */
interface ActionDetail {
    /** 行动的唯一标识符 */
    hrid: string;
    /** 行动功能类型 */
    function: string;
    /** 行动类型 */
    type: string;
    /** 行动分类 */
    category: string;
    /** 行动名称 */
    name: string;
    /** 最大难度等级 */
    maxDifficulty: number;
    /** 等级需求 */
    levelRequirement: {
        /** 所需技能的HRID */
        skillHrid: string;
        /** 所需技能等级 */
        level: number;
    }
    /** 基础耗时（纳秒，例如 16000000000 = 16秒） */
    baseTimeCost: number;
    /** 经验获取配置 */
    experienceGain: {
        /** 获取经验的技能HRID */
        skillHrid: string;
        /** 经验值 */
        value: number;
    }
    /** 普通掉落表（null表示无掉落） */
    dropTable: null | Array<ItemDrop>;
    /** 精华掉落表（null表示无精华掉落） */
    essenceDropTable: null | Array<ItemDrop>;
    /** 稀有掉落表（null表示无稀有掉落） */
    rareDropTable: null | Array<ItemDrop>;
    /** 升级所需物品的HRID（空字符串表示无） */
    upgradeItemHrid: string;
    /** 是否保留所有强化等级 */
    retainAllEnhancement: boolean;
    /** 输入物品列表（null表示无输入要求） */
    inputItems: null | Array<ItemWithCount>;
    /** 输出物品列表（null表示无输出） */
    outputItems: null | Array<ItemWithCount>;
    /** 战斗区域信息配置（null表示非战斗） */
    combatZoneInfo: null | CombatZoneInfo;
}

/**
 * 战斗区域信息结构
 * 包含普通战斗区域和地下城两种类型的配置
 */
interface CombatZoneInfo {
    /** 是否为地下城 */
    isDungeon: boolean;
    /** 非地下城战斗配置 */
    fightInfo: {
        /** 随机刷怪配置 */
        randomSpawnInfo: {
            /** 最大刷怪数量 */
            maxSpawnCount: number;
            /** 最大总强度 */
            maxTotalStrength: number;
            /** 刷怪列表（null表示无随机刷怪） */
            spawns: null | Array<MonsterSpawn>;
        };
        /** Boss刷怪配置（null表示无Boss） */
        bossSpawns: null | Array<MonsterSpawn>;
        /** 每个Boss需要的战斗次数 */
        battlesPerBoss: number;
    }
    /** 地下城战斗配置 */
    dungeonInfo: {
        /** 进入地下城所需钥匙的物品HRID */
        keyItemHrid: string;
        /** 奖励掉落表（null表示无奖励） */
        rewardDropTable: null | Array<ItemDrop>;
        /** 最大波数（0表示非地下城） */
        maxWaves: number;
        /** 按波数划分的随机刷怪配置映射（null表示无配置） */
        randomSpawnInfoMap: null | {
            [wave: string]: {
                maxSpawnCount: number;
                maxTotalStrength: number;
                spawns: Array<MonsterSpawn>;
            };
        };
        /** 按波数划分的固定刷怪配置映射（null表示无配置） */
        fixedSpawnsMap: null | {
            [wave: string]: Array<MonsterSpawn>;
        };
    }
    /** 最大队伍人数 */
    maxPartySize: number;
    /** Buff效果（当前为null） */
    buffs: null;
    /** 排序索引 */
    sortIndex: number;
}

/**
 * 怪物刷怪配置结构
 */
interface MonsterSpawn {
    /** 怪物的唯一标识符 */
    combatMonsterHrid: string;
    /** 难度等级 */
    difficultyTier: number;
    /** 刷怪概率 */
    rate: number;
    /** 强度值 */
    strength: number;
}

/**
 * 角色物品数据结构
 */
interface CharacterItem {
    /** 物品记录的唯一ID */
    id: number;
    /** 角色ID */
    characterID: number;
    /** 物品所在位置的HRID（如背包、装备栏等） */
    itemLocationHrid: string;
    /** 物品的唯一标识符 */
    itemHrid: string;
    /** 物品的强化等级 */
    enhancementLevel: number;
    /** 物品数量 */
    count: number;
    /** 离线时的物品数量 */
    offlineCount: number;
    /** 物品的哈希值，用于唯一标识 */
    hash: string;
    /** 创建时间（ISO 8601格式） */
    createdAt: string;
    /** 最后更新时间（ISO 8601格式） */
    updatedAt: string;
}

/**
 * 包含角色初始化数据的WebSocket消息
 */
interface InitCharacterData {
    /** 消息类型标识 */
    type: string;
    /** 角色拥有的所有物品 */
    characterItems: CharacterItem[];
}

/**
 * 包含物品变更数据的WebSocket消息
 */
interface ItemsUpdatedData {
    /** 消息类型标识 */
    type: string;
    /** 变更后的物品数据 */
    endCharacterItems: CharacterItem[];
}

(function (): void {
    'use strict';

    //#region Calculator

    class TargetItemCategory {
        constructor(categoryHrid: string, needCalc: boolean = true) {
            this.categoryHrid = categoryHrid;
            this.needCalc = needCalc;
        }
        categoryHrid: string;
        needCalc: boolean = true;
        categoryDetailsElement: HTMLDetailsElement = null;
        categorySummaryElement: HTMLElement = null;
        needCalcCheckbox: HTMLInputElement = null;
        updateDisplayElement() {
            this.categoryDetailsElement.style.background = this.needCalc ? '#0E4F32' : '#2c2e45';
            this.categorySummaryElement.style.background = this.needCalc ? '#147147' : '#393a5b';
            this.needCalcCheckbox.checked = this.needCalc;
        }
    }

    class DisplayItem implements ItemWithCount {
        constructor(itemHrid: string, count: number) {
            this.itemHrid = itemHrid;
            this.count = count;

            this.initDisplayProperties();
        }

        initDisplayProperties() {
            if (Object.values(MWI_Toolkit_ActionDetailPlus.processableItemList).includes(this.itemHrid)) {
                this.categoryHrid = '/item_categories/materials';
            } else {
                this.categoryHrid = MWI_Toolkit.initClientData?.itemDetailMap?.[this.itemHrid].categoryHrid;
            }
            this.displayName = MWI_Toolkit_I18n.getItemName(this.itemHrid);
            this.iconHref = MWI_Toolkit_Utils.getIconHrefByItemHrid(this.itemHrid);
            this.sortIndex = MWI_Toolkit_Utils.getSortIndexByItemHrid(this.itemHrid);
        }

        getOwnedCount(): number {
            return MWI_Toolkit_ItemsMap.getCount(this.itemHrid);
        }

        itemHrid: string;
        count: number;

        categoryHrid: string;
        iconHref: string;
        displayName: string;
        sortIndex: number;
    }

    class TargetItem extends DisplayItem {
        constructor(itemHrid: string, count: number, needCalc: boolean = true) {
            super(itemHrid, count);
            this.needCalc = needCalc;
        }
        needCalc: boolean = true;

        displayElement: HTMLDivElement = null;
        needCalcCheckbox: HTMLInputElement = null;
        ownedSpan: HTMLSpanElement = null;
        targetInput: HTMLInputElement = null;
        updateDisplayElement() {
            if (this.needCalcCheckbox) {
                this.needCalcCheckbox.checked = this.needCalc;
                this.displayElement.style.background = this.needCalc ? '' : '#2c2e45';
            }
            if (this.ownedSpan) {
                const newText = MWI_Toolkit_Utils.formatNumber(this.getOwnedCount());
                if (this.ownedSpan.textContent !== newText) { this.ownedSpan.textContent = newText; }
            }
            if (this.targetInput) {
                const newText = this.count.toString();
                if (this.targetInput.value.trim() === '' && this.count != 0) { this.targetInput.value = newText; }
            }
        }
        removeDisplayElement() {
            this.displayElement?.remove();
        }
    }

    class TargetHouseRoom extends TargetItem {
        constructor(houseRoomHrid: string, level: number, needCalc: boolean = true) {
            super(houseRoomHrid, level, needCalc);
        }

        initDisplayProperties() {
            this.categoryHrid = '/item_categories/house_rooms';
            this.displayName = MWI_Toolkit_I18n.getName(this.itemHrid, 'houseRoomNames');
            this.iconHref = MWI_Toolkit_Utils.getIconHrefByHouseRoomHrid(this.itemHrid);
            this.sortIndex = MWI_Toolkit_Utils.getSortIndexByHouseRoomHrid(this.itemHrid);
        }

        getOwnedCount(): number {
            return MWI_Toolkit.gameObject?.state?.characterHouseRoomDict?.[this.itemHrid]?.level || 0;
        }
    }

    class RequiredItem extends DisplayItem {
        constructor(itemHrid: string, count: number, equivalentCount: number) {
            super(itemHrid, count);
            this.equivalentCount = equivalentCount;
        }
        equivalentCount: number = 0;

        shortageDisplayElement: HTMLDivElement = null;
        requiredDisplayElement: HTMLDivElement = null;
        shortageSpan: HTMLSpanElement = null;
        ownedSpan: HTMLSpanElement = null;
        equivalentSpan: HTMLSpanElement = null;
        requiredSpan: HTMLSpanElement = null;
        requiredDiv: HTMLDivElement = null;
        getShortageCount(): number {
            return this.count - this.getOwnedCount() - this.equivalentCount;
        }
        updateDisplayElement() {
            const ownedCount = this.getOwnedCount();
            const shortageCount = this.getShortageCount();
            if (this.shortageSpan) {
                const newText = MWI_Toolkit_Utils.formatNumber(shortageCount);
                if (this.shortageSpan.textContent !== newText) { this.shortageSpan.textContent = newText; }
                this.shortageDisplayElement.style.display = shortageCount > 0 ? 'flex' : 'none';
            }
            if (this.equivalentSpan) {
                const newText = MWI_Toolkit_Utils.formatNumber(this.equivalentCount) + '+';
                if (this.equivalentSpan.textContent !== newText) { this.equivalentSpan.textContent = newText; }
                this.equivalentSpan.hidden = this.equivalentCount <= 0;
            }
            if (this.ownedSpan) {
                const newText = MWI_Toolkit_Utils.formatNumber(ownedCount) + '/';
                if (this.ownedSpan.textContent !== newText) { this.ownedSpan.textContent = newText; }
            }
            if (this.requiredSpan) {
                const newText = MWI_Toolkit_Utils.formatNumber(this.count);
                if (this.requiredSpan.textContent !== newText) { this.requiredSpan.textContent = newText; }
                this.requiredDiv.style.color = shortageCount > 0 ? '#f44336' : '#E7E7E7';
            }
        }
        removeDisplayElement() {
            this.shortageDisplayElement?.remove();
            this.requiredDisplayElement?.remove();
        }
    }

    class MWI_Toolkit_Calculator {
        static targetItemCategoryMap: Map<string, TargetItemCategory> = new Map();
        static targetItemsMap: Map<string, TargetItem> = new Map();
        static requiredItemsMap: Map<string, RequiredItem> = new Map();

        static tabButton: HTMLButtonElement | null = null;
        static tabPanel: HTMLDivElement | null = null;
        static targetItemDetailsMap: Map<string, HTMLDetailsElement> = new Map();
        static shortageItemDetailsMap: Map<string, HTMLDetailsElement> = new Map();
        static requiredItemDetailsMap: Map<string, HTMLDetailsElement> = new Map();

        static itemCategoryList: Array<string> = [
            '/item_categories/house_rooms',
            '/item_categories/currency',
            '/item_categories/loot',
            '/item_categories/key',
            '/item_categories/food',
            '/item_categories/drink',
            '/item_categories/ability_book',
            '/item_categories/equipment',
            '/item_categories/materials',
            '/item_categories/resource',
        ];

        static renderTimeout: number | null = null;

        static getStorageKey(characterID: number | null = null): string {
            if (!characterID) {
                characterID = MWI_Toolkit?.gameObject?.state?.character?.id;
            }
            return `MWI_Toolkit_Calculator_TargetItems_${characterID}`;
        }

        // 保存目标物品
        static saveTargetItems(): boolean {
            const storageKey = MWI_Toolkit_Calculator.getStorageKey();
            const storageKey_Category = storageKey.replace('TargetItems', 'TargetItemCategories');
            const dataToSave = [...MWI_Toolkit_Calculator.targetItemsMap.values()].map(item => ({
                itemHrid: item.itemHrid,
                count: item.count,
                needCalc: item.needCalc
            }));
            const dataToSave_Category = [...MWI_Toolkit_Calculator.targetItemCategoryMap.values()].map(category => ({
                categoryHrid: category.categoryHrid,
                needCalc: category.needCalc
            }));
            try {
                GM_setValue(storageKey, JSON.stringify(dataToSave));
                GM_setValue(storageKey_Category, JSON.stringify(dataToSave_Category));
                return true;
            } catch (error) {
                console.error('[MWI_Toolkit]' + error);
                return false;
            }
        }

        // 从特定角色ID加载数据
        static loadTargetItems(characterID: number | null = null) {
            const storageKey = MWI_Toolkit_Calculator.getStorageKey(characterID);
            const storageKey_Category = storageKey.replace('TargetItems', 'TargetItemCategories');
            try {
                const savedData = GM_getValue(storageKey, '[]');
                const savedData_Category = GM_getValue(storageKey_Category, '[]');
                const loadedItems = JSON.parse(savedData) as { itemHrid: string; count: number; needCalc: boolean; }[];
                const loadedCategories = JSON.parse(savedData_Category) as { categoryHrid: string; needCalc: boolean; }[];

                // 验证并转换为Item实例
                const validItemsMap: Map<string, TargetItem> = new Map(
                    loadedItems.map((item: { itemHrid: string; count: number; needCalc: boolean; }) => {
                        try {
                            if (item.itemHrid.includes('/items/')) {
                                return [item.itemHrid, new TargetItem(item.itemHrid, item.count, typeof item.needCalc === 'boolean' ? item.needCalc : true)] as [string, TargetItem];
                            }
                            if (item.itemHrid.includes('/house_rooms/')) {
                                return [item.itemHrid, new TargetHouseRoom(item.itemHrid, item.count, typeof item.needCalc === 'boolean' ? item.needCalc : true)] as [string, TargetHouseRoom];
                            }
                        } catch {
                            return null;
                        }
                    }).filter((item: [string, TargetItem] | null) => item !== null)
                );
                loadedCategories.forEach((category) => {
                    if (MWI_Toolkit_Calculator.targetItemCategoryMap.has(category.categoryHrid)) {
                        MWI_Toolkit_Calculator.targetItemCategoryMap.get(category.categoryHrid)!.needCalc = category.needCalc;
                    }
                    else {
                        MWI_Toolkit_Calculator.targetItemCategoryMap.set(category.categoryHrid, new TargetItemCategory(category.categoryHrid, category.needCalc));
                    }
                });

                if (validItemsMap.size > 0) {
                    MWI_Toolkit_Calculator.clearAllTargetItems();
                    MWI_Toolkit_Calculator.targetItemsMap = validItemsMap;
                    MWI_Toolkit_Calculator.renderItemsDisplay();

                    MWI_Toolkit_Calculator.saveTargetItems();
                }
            } catch (error) {
                console.error('[MWI_Toolkit]' + error);
            }
        }

        // 更新目标物品
        static updateTargetItem(itemHrid: string, count = 1): void {
            if (!itemHrid) return;

            const item = MWI_Toolkit_Calculator.targetItemsMap.get(itemHrid);
            if (item) {
                item.count = count;
            } else {
                // 添加新物品
                if (itemHrid.includes('/items/')) {
                    MWI_Toolkit_Calculator.targetItemsMap.set(itemHrid, new TargetItem(itemHrid, count));
                }
                if (itemHrid.includes('/house_rooms/')) {
                    MWI_Toolkit_Calculator.targetItemsMap.set(itemHrid, new TargetHouseRoom(itemHrid, count));
                }
            }
            MWI_Toolkit_Calculator.saveAndScheduleRender();
        }

        // 删除目标物品
        static removeTargetItem(itemHrid: string): void {
            if (!itemHrid) return;
            MWI_Toolkit_Calculator.targetItemsMap.get(itemHrid)?.removeDisplayElement();
            MWI_Toolkit_Calculator.targetItemsMap.delete(itemHrid);
            MWI_Toolkit_Calculator.saveAndScheduleRender();
        }

        // 清空目标物品
        static clearAllTargetItems(): void {
            MWI_Toolkit_Calculator.targetItemsMap.forEach(item => item.removeDisplayElement());
            MWI_Toolkit_Calculator.targetItemsMap.clear();
            MWI_Toolkit_Calculator.saveAndScheduleRender();
        }

        // 保存数据并计划渲染
        static saveAndScheduleRender(): void {
            // 保存数据到存储
            MWI_Toolkit_Calculator.saveTargetItems();
            MWI_Toolkit_Calculator.scheduleRender();
        }

        // 计划延迟渲染
        static scheduleRender(): void {
            // 清除之前的计时器
            if (MWI_Toolkit_Calculator.renderTimeout) {
                clearTimeout(MWI_Toolkit_Calculator.renderTimeout);
            }

            // 设置新的计时器
            MWI_Toolkit_Calculator.renderTimeout = setTimeout(() => {
                MWI_Toolkit_Calculator.renderItemsDisplay();
                MWI_Toolkit_Calculator.renderTimeout = null;
            }, 300); // 300ms 防抖延迟
        }

        // 递归计算所需材料
        static calculateRequiredItems(targetItem: ItemWithCount): Array<ItemWithCount> {
            if (targetItem.count === 0) return [];
            if (targetItem.itemHrid.includes('/house_rooms/')) {
                // 处理房屋房间逻辑
                return this.calculateRequiredItemsForHouseRoom(targetItem.itemHrid, targetItem.count);
            }
            let requiredItems = new Array<ItemWithCount>();

            requiredItems.push({ itemHrid: targetItem.itemHrid, count: targetItem.count });

            const actionTypes = ["cheesesmithing", "crafting", "tailoring", "cooking", "brewing"];
            const itemName = targetItem.itemHrid.split('/').pop();

            for (const actionType of actionTypes) {
                const actionHrid = `/actions/${actionType}/${itemName}`;
                if (MWI_Toolkit.initClientData?.actionDetailMap?.hasOwnProperty(actionHrid)) {
                    const actionDetail = MWI_Toolkit.initClientData?.actionDetailMap[actionHrid];
                    const upgradeItemHrid = actionDetail.upgradeItemHrid;
                    const inputItems = actionDetail.inputItems;

                    let outputCount = 1;
                    const outputItems = actionDetail.outputItems;
                    if (outputItems && outputItems.length > 0) {
                        const matchingOutput = outputItems.find(output => output.itemHrid === targetItem.itemHrid);
                        if (matchingOutput) {
                            outputCount = matchingOutput.count;
                        }
                    }

                    const actionTypeDrinkSlots = MWI_Toolkit_ActionDetailPlus.getActionTypeDrinkSlots(actionType);
                    // 检查工匠茶加成
                    let artisanBuff = 0;
                    if (actionTypeDrinkSlots?.some(itemHrid => itemHrid === '/items/artisan_tea')) {
                        artisanBuff = 0.1 * MWI_Toolkit_ActionDetailPlus.getDrinkConcentration();
                    }

                    // 检查美食茶加成
                    let gourmetBuff = 0;
                    if (actionTypeDrinkSlots?.some(itemHrid => itemHrid === '/items/gourmet_tea')) {
                        gourmetBuff = 0.12 * MWI_Toolkit_ActionDetailPlus.getDrinkConcentration();
                    }

                    // 递归计算输入材料
                    for (const input of inputItems) {
                        const adjustedCount = input.count * targetItem.count / outputCount / (1 + gourmetBuff) * (1 - artisanBuff);
                        requiredItems = MWI_Toolkit_Calculator.mergeItemArrays(requiredItems, MWI_Toolkit_Calculator.calculateRequiredItems({ itemHrid: input.itemHrid, count: adjustedCount }));
                    }

                    // 处理升级物品（不适用工匠茶加成）
                    if (upgradeItemHrid) {
                        requiredItems = MWI_Toolkit_Calculator.mergeItemArrays(requiredItems, MWI_Toolkit_Calculator.calculateRequiredItems({ itemHrid: upgradeItemHrid, count: targetItem.count / outputCount / (1 + gourmetBuff) }));
                    }

                    return requiredItems;
                }
            }

            // 添加地下城代币兑换材料计算
            if (requiredItems.length === 1) {
                const shopHrid = `/shop_items/${itemName}`;
                if (MWI_Toolkit.initClientData?.shopItemDetailMap?.hasOwnProperty(shopHrid)) {
                    const shopItemDetail = MWI_Toolkit.initClientData?.shopItemDetailMap[shopHrid];
                    if (shopItemDetail.category === "/shop_categories/dungeon") {
                        shopItemDetail.costs.forEach(cost => {
                            requiredItems.push({ itemHrid: cost.itemHrid, count: cost.count * targetItem.count });
                        });
                    }
                }
            }
            return requiredItems;
        }

        // 批量计算材料需求
        static batchCalculateRequiredItems(targetItems: Array<ItemWithCount>): Array<ItemWithCount> {
            let allRequiredItems = new Array<ItemWithCount>();

            for (const targetItem of targetItems) {
                const requiredItems = MWI_Toolkit_Calculator.calculateRequiredItems(targetItem);
                allRequiredItems = MWI_Toolkit_Calculator.mergeItemArrays(allRequiredItems, requiredItems);
            }

            return allRequiredItems;
        }

        // 计算房屋房间所需材料
        static calculateRequiredItemsForHouseRoom(targetHouseRoomHrid: string, targetHouseRoomLevel: number): Array<ItemWithCount> {
            let targetItems = Array<ItemWithCount>();
            const characterHouseRoomLevel = MWI_Toolkit.gameObject.state.characterHouseRoomDict?.[targetHouseRoomHrid]?.level || 0;
            const upgradeCostsMap = MWI_Toolkit.initClientData?.houseRoomDetailMap?.[targetHouseRoomHrid]?.upgradeCostsMap;

            for (let i = characterHouseRoomLevel + 1; i <= targetHouseRoomLevel && i <= 8; i++) {
                targetItems = targetItems.concat(upgradeCostsMap[i] || []);
            }

            return MWI_Toolkit_Calculator.batchCalculateRequiredItems(targetItems);
        }

        // 计算等效材料
        static calculateEquivalentItems(requiredItems: Array<ItemWithCount>): Array<ItemWithCount> {
            const ownedItems = new Array<ItemWithCount>();
            const ownedItemsNG = new Array<ItemWithCount>();
            for (const requiredItem of requiredItems) {
                const ownedCount = MWI_Toolkit_ItemsMap.getCount(requiredItem.itemHrid);
                // 负目标数量用于手动标记已有的等效物品
                const targetItemNG = MWI_Toolkit_Calculator.targetItemsMap.get(requiredItem.itemHrid);
                const targetCountNG = Math.min((targetItemNG?.needCalc && targetItemNG?.count) ? targetItemNG.count : 0, 0);
                // 这里count取required和owned-equivalent中的较小值，用于抵消需求
                ownedItems.push({ itemHrid: requiredItem.itemHrid, count: Math.min(requiredItem.count, ownedCount - targetCountNG) });
                ownedItemsNG.push({ itemHrid: requiredItem.itemHrid, count: Math.min(requiredItem.count, ownedCount) * -1 });
            }
            // 减掉原值得到等效值
            return MWI_Toolkit_Calculator.mergeItemArrays(MWI_Toolkit_Calculator.batchCalculateRequiredItems(ownedItems), ownedItemsNG);
        }

        // 合并材料数组并按排序顺序返回
        static mergeItemArrays(arr1: Array<ItemWithCount>, arr2: Array<ItemWithCount>): Array<ItemWithCount> {
            const map = new Map();
            for (const item of arr1.concat(arr2)) {
                if (map.has(item.itemHrid)) {
                    if (item.itemHrid.includes('/items/')) {
                        map.get(item.itemHrid).count += item.count;
                    }
                    if (item.itemHrid.includes('/house_rooms/')) {
                        map.get(item.itemHrid).count = Math.max(map.get(item.itemHrid).count, item.count);
                    }
                } else {
                    map.set(item.itemHrid, { itemHrid: item.itemHrid, count: item.count });
                }
            }
            // 排序
            return Array.from(map.values()).sort(
                (a, b) => MWI_Toolkit_Utils.getSortIndexByItemHrid(a.itemHrid) - MWI_Toolkit_Utils.getSortIndexByItemHrid(b.itemHrid)
            );
        }

        static initialize(): void {
            MWI_Toolkit_ItemsMap.itemsUpdatedCallbacks.push((enditemsMap) => {
                MWI_Toolkit_Calculator.scheduleRender();
            });
        }

        static initializeCalculatorUI(): void {
            MWI_Toolkit.waitForElement('[class^="CharacterManagement_tabsComponentContainer"] [class*="TabsComponent_tabsContainer"]', () => {
                MWI_Toolkit_Calculator.createCalculatorUI();
            });
        }

        // 初始化UI
        static createCalculatorUI(): void {
            // 已有标签页则不重复初始化
            if (document.querySelector('[class^="Toolkit_Calculator_Container"]')) { return; }

            // 获取容器
            const tabsContainer = document.querySelector('[class^="CharacterManagement_tabsComponentContainer"] [class*="TabsComponent_tabsContainer"]') as HTMLDivElement;
            const tabPanelsContainer = document.querySelector('[class^="CharacterManagement_tabsComponentContainer"] [class*="TabsComponent_tabPanelsContainer"]') as HTMLDivElement;

            if (!tabsContainer || !tabPanelsContainer) {
                console.error('[MWI_Toolkit_Calculator] 无法找到标签页容器');
                return;
            }

            MWI_Toolkit_Calculator.createCalculatorTab(tabsContainer, tabPanelsContainer);
            MWI_Toolkit_Calculator.targetItemsMap = new Map();
            MWI_Toolkit_Calculator.requiredItemsMap = new Map();
            // 加载保存数据
            MWI_Toolkit_Calculator.loadTargetItems();

            console.log('[MWI_Toolkit_Calculator] UI初始化完成');
        }

        // 创建MWI计算器标签页
        static createCalculatorTab(tabsContainer: HTMLDivElement, tabPanelsContainer: HTMLDivElement): void {
            // 新增"MWI计算器"按钮
            const oldTabButtons = tabsContainer.querySelectorAll("button");
            MWI_Toolkit_Calculator.tabButton = oldTabButtons[1].cloneNode(true) as HTMLButtonElement;
            MWI_Toolkit_Calculator.tabButton.children[0].textContent = (MWI_Toolkit.getGameLanguage() === 'zh') ? 'MWI计算器' : 'MWI_Calculator';
            oldTabButtons[0].parentElement.appendChild(MWI_Toolkit_Calculator.tabButton);

            // 新增MWI计算器tabPanel
            const oldTabPanels = tabPanelsContainer.querySelectorAll('[class*="TabPanel_tabPanel"]') as NodeListOf<HTMLDivElement>;
            MWI_Toolkit_Calculator.tabPanel = oldTabPanels[1].cloneNode(false) as HTMLDivElement;
            oldTabPanels[0].parentElement.appendChild(MWI_Toolkit_Calculator.tabPanel);

            MWI_Toolkit_Calculator.bindCalculatorTabEvents(oldTabButtons, oldTabPanels);

            // 创建计算器面板
            const calculatorPanel = MWI_Toolkit_Calculator.createCalculatorPanel();
            MWI_Toolkit_Calculator.tabPanel.appendChild(calculatorPanel);
        }

        // 绑定标签页事件
        static bindCalculatorTabEvents(oldTabButtons: NodeListOf<HTMLButtonElement>, oldTabPanels: NodeListOf<HTMLDivElement>): void {
            for (let i = 0; i < oldTabButtons.length; i++) {
                oldTabButtons[i].addEventListener('click', () => {
                    MWI_Toolkit_Calculator.tabPanel.hidden = true; // 强制隐藏
                    MWI_Toolkit_Calculator.tabPanel.classList.add('TabPanel_hidden__26UM3');
                    MWI_Toolkit_Calculator.tabButton.classList.remove('Mui-selected');
                    MWI_Toolkit_Calculator.tabButton.setAttribute('aria-selected', 'false');
                    MWI_Toolkit_Calculator.tabButton.tabIndex = -1;

                    oldTabButtons[i].classList.add('Mui-selected');
                    oldTabButtons[i].setAttribute('aria-selected', 'true');
                    oldTabButtons[i].tabIndex = 0;
                    oldTabPanels[i].classList.remove('TabPanel_hidden__26UM3');
                    oldTabPanels[i].hidden = false; // 显示目标
                }, true);
            }

            MWI_Toolkit_Calculator.tabButton.addEventListener('click', () => {
                oldTabButtons.forEach(btn => {
                    btn.classList.remove('Mui-selected');
                    btn.setAttribute('aria-selected', 'false');
                    btn.tabIndex = -1;
                });
                oldTabPanels.forEach(panel => {
                    panel.hidden = true; // 强制隐藏
                    panel.classList.add('TabPanel_hidden__26UM3');
                });

                MWI_Toolkit_Calculator.tabButton.classList.add('Mui-selected');
                MWI_Toolkit_Calculator.tabButton.setAttribute('aria-selected', 'true');
                MWI_Toolkit_Calculator.tabButton.tabIndex = 0;
                MWI_Toolkit_Calculator.tabPanel.classList.remove('TabPanel_hidden__26UM3');
                MWI_Toolkit_Calculator.tabPanel.hidden = false; // 显示目标
            }, true);
        }

        // 创建计算器面板
        static createCalculatorPanel(): HTMLDivElement {
            const calculatorPanel = document.createElement('div');
            calculatorPanel.className = 'Toolkit_Calculator_Container';

            // 创建物品搜索区域
            const addItemSection = MWI_Toolkit_Calculator.createAddItemSection();
            calculatorPanel.appendChild(addItemSection);

            // 左侧区域
            const leftDiv = document.createElement('div');
            leftDiv.style.display = 'inline-block';
            leftDiv.style.verticalAlign = 'top';
            leftDiv.style.width = '60%';
            leftDiv.style.padding = '0px 2px';
            MWI_Toolkit_Calculator.createItemDetailsMap(leftDiv, MWI_Toolkit_Calculator.targetItemDetailsMap);
            calculatorPanel.appendChild(leftDiv);

            MWI_Toolkit_Calculator.targetItemDetailsMap.forEach((details, categoryHrid) => {
                const summary = details.querySelector('summary');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.style.verticalAlign = 'middle';

                if (!MWI_Toolkit_Calculator.targetItemCategoryMap.has(categoryHrid)) {
                    MWI_Toolkit_Calculator.targetItemCategoryMap.set(categoryHrid, new TargetItemCategory(categoryHrid));
                }
                MWI_Toolkit_Calculator.targetItemCategoryMap.get(categoryHrid)!.categoryDetailsElement = details;
                MWI_Toolkit_Calculator.targetItemCategoryMap.get(categoryHrid)!.categorySummaryElement = summary;
                MWI_Toolkit_Calculator.targetItemCategoryMap.get(categoryHrid)!.needCalcCheckbox = checkbox;
                checkbox.checked = MWI_Toolkit_Calculator.targetItemCategoryMap.get(categoryHrid)!.needCalc;
                checkbox.addEventListener('change', () => {
                    MWI_Toolkit_Calculator.targetItemCategoryMap.get(categoryHrid)!.needCalc = checkbox.checked;
                    MWI_Toolkit_Calculator.saveAndScheduleRender();
                });
                summary.prepend(checkbox);
            });

            // 右侧区域
            const rightDiv = document.createElement('div');
            rightDiv.style.display = 'inline-block';
            rightDiv.style.verticalAlign = 'top';
            rightDiv.style.width = '40%';
            rightDiv.style.padding = '0px 2px';

            const shortageItemDetails = document.createElement('details');
            shortageItemDetails.style.background = '#902f10';
            shortageItemDetails.style.borderRadius = '4px';
            shortageItemDetails.style.padding = '2px';
            shortageItemDetails.open = true;
            const shortageSummary = document.createElement('summary');
            shortageSummary.textContent = MWI_Toolkit.getGameLanguage() === 'zh' ? '缺口' : 'Shortages';
            shortageSummary.style.background = '#af3914';
            shortageSummary.style.borderRadius = '4px';
            shortageSummary.style.fontSize = '14px';
            shortageSummary.style.padding = '2px 6px';
            shortageSummary.style.textAlign = 'left';
            shortageSummary.style.cursor = 'pointer';
            shortageItemDetails.appendChild(shortageSummary);
            MWI_Toolkit_Calculator.createItemDetailsMap(shortageItemDetails, MWI_Toolkit_Calculator.shortageItemDetailsMap);
            rightDiv.appendChild(shortageItemDetails);

            const requiredItemDetails = document.createElement('details');
            requiredItemDetails.style.background = '#0c385a';
            requiredItemDetails.style.borderRadius = '4px';
            requiredItemDetails.style.padding = '2px';
            const requiredSummary = document.createElement('summary');
            requiredSummary.textContent = MWI_Toolkit.getGameLanguage() === 'zh' ? '详情(等效+库存/需求)' : 'Status(Equivalent+Owned/Required)';
            requiredSummary.style.background = '#1770b3';
            requiredSummary.style.borderRadius = '4px';
            requiredSummary.style.fontSize = '14px';
            requiredSummary.style.padding = '2px 6px';
            requiredSummary.style.textAlign = 'left';
            requiredSummary.style.cursor = 'pointer';
            requiredItemDetails.appendChild(requiredSummary);
            MWI_Toolkit_Calculator.createItemDetailsMap(requiredItemDetails, MWI_Toolkit_Calculator.requiredItemDetailsMap);
            rightDiv.appendChild(requiredItemDetails);

            calculatorPanel.appendChild(rightDiv);

            return calculatorPanel;
        }

        // 创建物品分类区域
        static createItemDetailsMap(container: HTMLElement, ItemDetailsMap: Map<string, HTMLDetailsElement>): void {
            MWI_Toolkit_Calculator.itemCategoryList.forEach(categoryHrid => {
                const details = document.createElement('details');
                details.style.background = '#2c2e45';
                details.style.borderRadius = '4px';
                details.style.margin = '2px 0px';
                details.open = true;

                const summary = document.createElement('summary');
                summary.textContent = MWI_Toolkit_I18n.getName(categoryHrid, 'itemCategoryNames');
                summary.style.background = '#393a5b';
                summary.style.borderRadius = '4px';
                summary.style.fontSize = '14px';
                summary.style.padding = '2px 6px';
                summary.style.textAlign = 'left';
                summary.style.cursor = 'pointer';

                details.appendChild(summary);
                container.appendChild(details);

                ItemDetailsMap.set(categoryHrid, details);
            });
        }

        // 创建添加物品区域
        static createAddItemSection(): HTMLDivElement {
            const addItemSection = document.createElement('div');

            // 左侧60%：物品搜索区域
            const leftSection = document.createElement('div');
            leftSection.style.display = 'inline-block';
            leftSection.style.verticalAlign = 'top';
            leftSection.style.width = '60%';

            const searchContainer = MWI_Toolkit_Calculator.createItemSearchComponent();
            leftSection.appendChild(searchContainer);

            // 右侧40%：房屋选择区域
            const rightSection = document.createElement('div');
            rightSection.style.display = 'inline-block';
            rightSection.style.verticalAlign = 'top';
            rightSection.style.width = '40%';

            const houseContainer = MWI_Toolkit_Calculator.createHouseRoomSelectionComponent();
            rightSection.appendChild(houseContainer);

            addItemSection.appendChild(leftSection);
            addItemSection.appendChild(rightSection);

            return addItemSection;
        }

        // 创建物品搜索组件
        static createItemSearchComponent(): HTMLDivElement {
            const itemSearchComponent = document.createElement('div');
            itemSearchComponent.style.background = '#2c2e45';
            itemSearchComponent.style.border = 'none';
            itemSearchComponent.style.borderRadius = '4px';
            itemSearchComponent.style.padding = '4px';
            itemSearchComponent.style.margin = '2px';
            itemSearchComponent.style.display = 'flex';
            itemSearchComponent.style.position = 'relative';

            // 物品搜索输入框
            const itemSearchInput = document.createElement('input');
            itemSearchInput.type = 'text';
            itemSearchInput.placeholder = (MWI_Toolkit.getGameLanguage() === 'zh') ? '搜索物品名称...' : 'Search item name...';
            itemSearchInput.style.background = '#dde2f8';
            itemSearchInput.style.color = '#000000';
            itemSearchInput.style.border = 'none';
            itemSearchInput.style.borderRadius = '4px';
            itemSearchInput.style.padding = '4px';
            itemSearchInput.style.margin = '2px';
            itemSearchInput.style.minWidth = '40px';
            itemSearchInput.style.flex = '1';

            // 搜索结果下拉列表
            const searchResults = document.createElement('div');
            searchResults.style.background = '#2c2e45';
            searchResults.style.border = 'none';
            searchResults.style.borderRadius = '4px';
            searchResults.style.padding = '4px';
            searchResults.style.margin = '2px';
            searchResults.style.width = '200px';
            searchResults.style.maxHeight = '335px';
            searchResults.style.overflowY = 'auto';
            searchResults.style.zIndex = '1000';
            searchResults.style.display = 'none';
            searchResults.style.position = 'absolute';
            searchResults.style.left = '4px';
            searchResults.style.top = '32px';

            // 数量输入框
            const countInput = document.createElement('input');
            countInput.type = 'text';
            countInput.value = '1';
            countInput.placeholder = (MWI_Toolkit.getGameLanguage() === 'zh') ? '数量' : 'Count';
            countInput.style.background = '#dde2f8';
            countInput.style.color = '#000000';
            countInput.style.border = 'none';
            countInput.style.borderRadius = '4px';
            countInput.style.padding = '4px';
            countInput.style.margin = '2px';
            countInput.style.width = '60px';

            // 添加按钮
            const addButton = document.createElement('button');
            addButton.textContent = (MWI_Toolkit.getGameLanguage() === 'zh') ? '添加' : 'Add';
            addButton.style.background = '#4CAF50';
            addButton.style.color = '#FFFFFF';
            addButton.style.border = 'none';
            addButton.style.borderRadius = '4px';
            addButton.style.padding = '4px';
            addButton.style.margin = '2px';
            addButton.style.cursor = 'pointer';

            // 清空按钮
            const clearAllButton = document.createElement('button');
            clearAllButton.textContent = (MWI_Toolkit.getGameLanguage() === 'zh') ? '清空' : 'Clear';
            clearAllButton.style.background = '#f44336';
            clearAllButton.style.color = '#FFFFFF';
            clearAllButton.style.border = 'none';
            clearAllButton.style.borderRadius = '4px';
            clearAllButton.style.padding = '4px';
            clearAllButton.style.margin = '2px';
            clearAllButton.style.cursor = 'pointer';

            // 绑定搜索事件
            MWI_Toolkit_Calculator.bindItemSearchComponentEvents(itemSearchInput, countInput, searchResults, addButton, clearAllButton);

            itemSearchComponent.appendChild(itemSearchInput);
            itemSearchComponent.appendChild(countInput);
            itemSearchComponent.appendChild(addButton);
            itemSearchComponent.appendChild(clearAllButton);

            itemSearchComponent.appendChild(searchResults);

            return itemSearchComponent;
        }

        // 绑定搜索相关事件
        static bindItemSearchComponentEvents(itemSearchInput: HTMLInputElement, countInput: HTMLInputElement, searchResults: HTMLDivElement, addButton: HTMLButtonElement, clearAllButton: HTMLButtonElement): void {
            // 输入框获得焦点时全选内容
            itemSearchInput.addEventListener('focus', () => {
                setTimeout(() => {
                    itemSearchInput.select();
                }, 0);
            });

            // 搜索功能
            itemSearchInput.addEventListener('input', () => {
                const searchTerm = itemSearchInput.value.toLowerCase().trim();
                if (searchTerm.length < 2) {
                    searchResults.style.display = 'none';
                    return;
                }

                // 获取并过滤物品
                const itemDetailMap = MWI_Toolkit?.initClientData?.itemDetailMap;
                if (!itemDetailMap) return;

                const filteredItems = Object.keys(itemDetailMap)
                    .filter(itemHrid => {
                        return MWI_Toolkit_I18n.getItemName(itemHrid).toLowerCase().includes(searchTerm);
                    })
                    .sort((a, b) => {
                        const sortIndexA = MWI_Toolkit_Utils.getSortIndexByItemHrid(a);
                        const sortIndexB = MWI_Toolkit_Utils.getSortIndexByItemHrid(b);
                        return sortIndexA - sortIndexB;
                    });

                if (filteredItems.length === 0) {
                    searchResults.style.display = 'none';
                    return;
                }

                MWI_Toolkit_Calculator.populateSearchResults(searchResults, filteredItems, (itemHrid: string) => {
                    itemSearchInput.value = MWI_Toolkit_I18n.getItemName(itemHrid);
                    searchResults.style.display = 'none';
                });

                searchResults.style.display = 'block';
            });

            // 键盘操作
            itemSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    MWI_Toolkit_Calculator.addItemAndResetItemSearchComponent(itemSearchInput, countInput, searchResults);
                } else if (e.key === 'Escape') {
                    searchResults.style.display = 'none';
                }
            });

            // 输入框获得焦点时全选内容
            countInput.addEventListener('focus', () => {
                setTimeout(() => {
                    countInput.select();
                }, 0);
            });

            // 仅允许输入数字
            countInput.addEventListener('input', () => {
                // 只允许负号在首位，其余为数字
                countInput.value = countInput.value.replace(/(?!^)-|[^\d-]/g, '');
            });

            // 键盘操作
            countInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    MWI_Toolkit_Calculator.addItemAndResetItemSearchComponent(itemSearchInput, countInput, searchResults);
                } else if (e.key === 'Escape') {
                    searchResults.style.display = 'none';
                }
            });

            // 添加按钮事件
            addButton.addEventListener('click', () => {
                MWI_Toolkit_Calculator.addItemAndResetItemSearchComponent(itemSearchInput, countInput, searchResults);
            });

            // 清空按钮事件
            clearAllButton.addEventListener('click', () => {
                if (confirm((MWI_Toolkit.getGameLanguage() === 'zh') ? '确定要清空所有目标物品吗？' : 'Are you sure you want to clear all target items?')) {
                    // 通过事件处理器清空
                    MWI_Toolkit_Calculator.clearAllTargetItems();
                }
            });

            // 点击其他地方隐藏搜索结果
            document.addEventListener('click', () => {
                searchResults.style.display = 'none';
            });
        }

        // 填充搜索结果
        static populateSearchResults(searchResults: HTMLDivElement, filteredItems: string[], onItemSelect: (itemHrid: string) => void): void {
            searchResults.innerHTML = '';
            filteredItems.forEach((itemHrid, index) => {
                const resultItem = document.createElement('div');
                resultItem.style.borderBottom = '1px solid #98a7e9';
                resultItem.style.borderRadius = '4px';
                resultItem.style.padding = '4px';
                resultItem.style.alignItems = 'center';
                resultItem.style.display = 'flex';
                resultItem.style.cursor = 'pointer';

                if (index === 0) {
                    resultItem.style.background = '#4a4c6a';
                }

                // 物品图标
                const itemIcon = document.createElement('div');
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('width', '16px');
                svg.setAttribute('height', '16px');
                svg.style.display = 'block';
                const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
                use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', MWI_Toolkit_Utils.getIconHrefByItemHrid(itemHrid));
                svg.appendChild(use);
                itemIcon.appendChild(svg);

                // 物品名称
                const itemName = document.createElement('span');
                itemName.textContent = MWI_Toolkit_I18n.getItemName(itemHrid);
                itemName.style.marginLeft = '2px';

                resultItem.appendChild(itemIcon);
                resultItem.appendChild(itemName);

                // 悬停高亮
                resultItem.addEventListener('mouseenter', () => {
                    resultItem.style.background = '#4a4c6a';
                });
                resultItem.addEventListener('mouseleave', () => {
                    resultItem.style.background = 'transparent';
                });

                resultItem.addEventListener('click', () => onItemSelect(itemHrid));
                searchResults.appendChild(resultItem);
            });
        }

        // 添加物品并重置搜索组件（包含itemHrid获取和判空）
        static addItemAndResetItemSearchComponent(itemSearchInput: HTMLInputElement, countInput: HTMLInputElement, searchResults: HTMLDivElement): void {
            const InputValue = itemSearchInput.value.trim();
            // 如果InputValue是纯数字，则视为从特定角色加载数据
            if (/^\d+$/.test(InputValue)) {
                const characterID = parseInt(InputValue, 10);
                MWI_Toolkit_Calculator.loadTargetItems(characterID);
                return;
            }
            const itemHrid = MWI_Toolkit_I18n.getItemHridByName(InputValue);
            if (!itemHrid) return;
            const count = parseInt(countInput.value, 10) || 1;
            MWI_Toolkit_Calculator.updateTargetItem(itemHrid, count);
            itemSearchInput.value = '';
            countInput.value = '1';
            searchResults.style.display = 'none';
        }

        // 创建房屋选择区域
        static createHouseRoomSelectionComponent(): HTMLDivElement {
            const HouseRoomSelectionComponent = document.createElement('div');
            HouseRoomSelectionComponent.style.background = '#2c2e45';
            HouseRoomSelectionComponent.style.border = 'none';
            HouseRoomSelectionComponent.style.borderRadius = '4px';
            HouseRoomSelectionComponent.style.padding = '4px';
            HouseRoomSelectionComponent.style.margin = '2px';
            HouseRoomSelectionComponent.style.display = 'flex';

            // 下拉菜单
            const dropdown = MWI_Toolkit_Calculator.createHouseRoomTypeDropdown();

            // 等级输入框
            const levelInput = document.createElement('input');
            levelInput.type = 'number';
            levelInput.min = '1';
            levelInput.max = '8';
            levelInput.step = '1';
            levelInput.value = '1';
            levelInput.placeholder = (MWI_Toolkit.getGameLanguage() === 'zh') ? '等级' : 'Level';
            levelInput.style.background = '#dde2f8';
            levelInput.style.color = '#000000';
            levelInput.style.border = 'none';
            levelInput.style.borderRadius = '4px';
            levelInput.style.padding = '4px';
            levelInput.style.margin = '2px';
            levelInput.style.width = '35px';

            // 添加按钮
            const addListButton = document.createElement('button');
            addListButton.textContent = (MWI_Toolkit.getGameLanguage() === 'zh') ? '添加' : 'Add';
            addListButton.style.background = '#4CAF50';
            addListButton.style.color = '#FFFFFF';
            addListButton.style.border = 'none';
            addListButton.style.borderRadius = '4px';
            addListButton.style.padding = '4px';
            addListButton.style.margin = '2px';
            addListButton.style.width = '35px';
            addListButton.style.cursor = 'pointer';

            // 绑定事件
            MWI_Toolkit_Calculator.bindHouseRoomSelectionComponentEvents(dropdown, levelInput, addListButton);

            HouseRoomSelectionComponent.appendChild(dropdown);
            HouseRoomSelectionComponent.appendChild(levelInput);
            HouseRoomSelectionComponent.appendChild(addListButton);

            return HouseRoomSelectionComponent;
        }

        // 创建房屋类型下拉菜单
        static createHouseRoomTypeDropdown() {
            // 创建容器
            const dropdown = document.createElement('div');
            dropdown.style.display = 'flex';
            dropdown.style.minWidth = '20px';
            dropdown.style.flex = '1';
            dropdown.style.position = 'relative';

            // 选中项显示区
            const selected = document.createElement('div');
            selected.style.background = '#393a5b';
            selected.style.color = '#000000';
            selected.style.border = 'none';
            selected.style.borderRadius = '4px';
            selected.style.paddingLeft = '4px';
            selected.style.margin = '2px';
            selected.style.minWidth = '40px';
            selected.style.flex = '1';
            selected.style.cursor = 'pointer';
            selected.style.display = 'flex';
            selected.style.alignItems = 'center';

            // 下拉菜单列表
            const list = document.createElement('div');
            list.style.background = '#2c2e45';
            list.style.border = 'none';
            list.style.borderRadius = '4px';
            list.style.padding = '4px';
            list.style.margin = '2px';
            list.style.width = '150px';
            list.style.maxHeight = '335px';
            list.style.overflowY = 'auto';
            list.style.zIndex = '1000';
            list.style.display = 'none';
            list.style.position = 'absolute';
            list.style.left = '0px';
            list.style.top = '32px';

            const HouseRoomTypeOptions = MWI_Toolkit_Calculator.createHouseRoomTypeOptions(selected, dropdown);
            HouseRoomTypeOptions.forEach(optionItem => { list.appendChild(optionItem); });
            HouseRoomTypeOptions[0] && HouseRoomTypeOptions[0].click(); // 默认选中第一个

            dropdown.appendChild(selected);
            dropdown.appendChild(list);

            // 点击展开/收起
            selected.addEventListener('click', (e) => {
                e.stopPropagation();
                list.style.display = list.style.display === 'block' ? 'none' : 'block';
            });

            // 点击外部关闭
            document.addEventListener('click', () => {
                list.style.display = 'none';
            });

            return dropdown;
        }

        // 创建房屋类型选项
        static createHouseRoomTypeOptions(selected: HTMLDivElement, dropdown: HTMLDivElement): HTMLDivElement[] {
            const houseRoomDetailMap = MWI_Toolkit.initClientData?.houseRoomDetailMap;
            if (!houseRoomDetailMap) { return []; }

            return Object.values(houseRoomDetailMap)
                .sort((a, b) => (a.sortIndex ?? 9999) - (b.sortIndex ?? 9999))
                .map(houseRoomDetail => {
                    const optionItem = document.createElement('div');
                    optionItem.style.borderBottom = '1px solid #98a7e9';
                    optionItem.style.borderRadius = '4px';
                    optionItem.style.padding = '4px';
                    optionItem.style.alignItems = 'center';
                    optionItem.style.display = 'flex';
                    optionItem.style.cursor = 'pointer';

                    // 房屋房间图标
                    const houseRoomIcon = document.createElement('div');
                    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    svg.setAttribute('width', '16px');
                    svg.setAttribute('height', '16px');
                    svg.style.display = 'block';
                    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
                    use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', MWI_Toolkit_Utils.getIconHrefBySkillHrid(houseRoomDetail.skillHrid));
                    svg.appendChild(use);
                    houseRoomIcon.appendChild(svg);

                    // 房屋房间名称
                    const houseRoomName = document.createElement('span');
                    houseRoomName.textContent = MWI_Toolkit_I18n?.getName(houseRoomDetail.hrid, "houseRoomNames") || houseRoomDetail.hrid;
                    houseRoomName.style.marginLeft = '2px';
                    houseRoomName.style.whiteSpace = 'nowrap';
                    houseRoomName.style.overflow = 'hidden';

                    optionItem.appendChild(houseRoomIcon);
                    optionItem.appendChild(houseRoomName);
                    optionItem.addEventListener('click', () => {
                        selected.innerHTML = '';
                        const selectedIcon = houseRoomIcon.cloneNode(true) as HTMLDivElement;
                        selected.appendChild(selectedIcon);
                        const selectedName = houseRoomName.cloneNode(true) as HTMLSpanElement;
                        selectedName.style.color = '#FFFFFF';
                        selected.appendChild(selectedName);

                        dropdown.dataset.houseRoomHrid = houseRoomDetail.hrid;
                        optionItem.parentElement.style.display = 'none';
                    });

                    // 悬停高亮
                    optionItem.addEventListener('mouseenter', () => {
                        optionItem.style.background = '#4a4c6a';
                    });
                    optionItem.addEventListener('mouseleave', () => {
                        optionItem.style.background = 'transparent';
                    });

                    optionItem.dataset.houseRoomHrid = houseRoomDetail.hrid;
                    return optionItem;
                });
        }

        // 绑定房屋选择相关事件
        static bindHouseRoomSelectionComponentEvents(dropdown: HTMLDivElement, levelInput: HTMLInputElement, addListButton: HTMLButtonElement): void {
            // 输入框获得焦点时全选内容
            levelInput.addEventListener('focus', function () {
                setTimeout(() => {
                    levelInput.select();
                }, 0);
            });

            // 添加按钮事件
            addListButton.addEventListener('click', () => {
                const houseRoomHrid = dropdown.dataset.houseRoomHrid;
                const level = parseInt(levelInput.value) || 1;

                MWI_Toolkit_Calculator.updateTargetItem(houseRoomHrid, level);
            });
        }

        // 渲染物品列表
        static renderItemsDisplay() {
            MWI_Toolkit_Calculator.targetItemCategoryMap.forEach((category) => {
                category.updateDisplayElement();
            });

            // 这里只需要新增或更新，删除在targetItems变动时进行处理
            MWI_Toolkit_Calculator.itemCategoryList.forEach(categoryHrid => {
                const details = MWI_Toolkit_Calculator.targetItemDetailsMap.get(categoryHrid);
                let lastElement = details.querySelector('summary');
                let itemCount = 0;
                [...MWI_Toolkit_Calculator.targetItemsMap.values()]
                    .sort((a, b) => a.sortIndex - b.sortIndex)
                    .forEach(targetItem => {
                        if (targetItem.categoryHrid !== categoryHrid) { return; }
                        if (!targetItem.displayElement) {
                            MWI_Toolkit_Calculator.createTargetItemDisplayElement(targetItem);
                            lastElement.insertAdjacentElement('afterend', targetItem.displayElement);
                        }
                        targetItem.updateDisplayElement();
                        lastElement = targetItem.displayElement;
                        itemCount++;
                    });
                details.hidden = itemCount === 0;
            });

            const targetItemsToCalc: Array<ItemWithCount> = [...MWI_Toolkit_Calculator.targetItemsMap.values()]
                .sort((a, b) => a.sortIndex - b.sortIndex)
                .filter(item => item.needCalc && item.count > 0 && (MWI_Toolkit_Calculator.targetItemCategoryMap.get(item.categoryHrid)?.needCalc ?? true))
                .map<ItemWithCount>(item => ({ itemHrid: item.itemHrid, count: item.count }));

            // 计算需求物品显示数据
            // batchCalculateRequiredItems返回的requiredItems已经是有序的
            const requiredItems = MWI_Toolkit_Calculator.batchCalculateRequiredItems(targetItemsToCalc);
            const equivalentItems = MWI_Toolkit_Calculator.calculateEquivalentItems(requiredItems);

            // 移除不存在的物品
            [...MWI_Toolkit_Calculator.requiredItemsMap.keys()].forEach(itemHrid => {
                if (!requiredItems.find(ri => ri.itemHrid === itemHrid)) {
                    MWI_Toolkit_Calculator.requiredItemsMap.get(itemHrid)?.removeDisplayElement();
                    MWI_Toolkit_Calculator.requiredItemsMap.delete(itemHrid);
                }
            });

            requiredItems.forEach(requiredItem => {
                const equivalentCount = equivalentItems.find(ei => ei.itemHrid === requiredItem.itemHrid)?.count || 0;
                const item = MWI_Toolkit_Calculator.requiredItemsMap.get(requiredItem.itemHrid);
                if (item) {
                    item.count = requiredItem.count;
                    item.equivalentCount = equivalentCount;
                }
                else {
                    MWI_Toolkit_Calculator.requiredItemsMap.set(requiredItem.itemHrid, new RequiredItem(requiredItem.itemHrid, requiredItem.count, equivalentCount));
                }
            });

            MWI_Toolkit_Calculator.itemCategoryList.forEach(categoryHrid => {
                const shortageDetails = MWI_Toolkit_Calculator.shortageItemDetailsMap.get(categoryHrid);
                const requiredDetails = MWI_Toolkit_Calculator.requiredItemDetailsMap.get(categoryHrid);
                let lastShortageElement = shortageDetails.querySelector('summary');
                let lastRequiredElement = requiredDetails.querySelector('summary');
                let shortageItemCount = 0;
                let requiredItemCount = 0;
                [...MWI_Toolkit_Calculator.requiredItemsMap.values()]
                    .sort((a, b) => a.sortIndex - b.sortIndex)
                    .forEach(requiredItem => {
                        if (requiredItem.categoryHrid !== categoryHrid) { return; }
                        if (!requiredItem.shortageDisplayElement) {
                            MWI_Toolkit_Calculator.createShortageItemDisplayElement(requiredItem);
                            lastShortageElement.insertAdjacentElement('afterend', requiredItem.shortageDisplayElement);
                        }
                        if (!requiredItem.requiredDisplayElement) {
                            MWI_Toolkit_Calculator.createRequiredItemDisplayElement(requiredItem);
                            lastRequiredElement.insertAdjacentElement('afterend', requiredItem.requiredDisplayElement);
                        }
                        requiredItem.updateDisplayElement();
                        lastShortageElement = requiredItem.shortageDisplayElement;
                        lastRequiredElement = requiredItem.requiredDisplayElement;
                        shortageItemCount += requiredItem.getShortageCount() > 0 ? 1 : 0;
                        requiredItemCount++;
                    });
                shortageDetails.hidden = shortageItemCount === 0;
                requiredDetails.hidden = requiredItemCount === 0;
            });
        }

        // 创建物品容器（图标+名称）
        static createItemContainer(displayItem: DisplayItem): HTMLDivElement {
            const container = document.createElement('div');
            // container.style.background = '#393a5b';
            // container.style.border = '1px solid';
            // container.style.borderRadius = '4px';
            // container.style.height = '21px';
            container.style.minWidth = '40px';
            container.style.alignItems = 'center';
            container.style.display = 'flex';

            // 物品图标
            const iconContainer = document.createElement('div');
            iconContainer.style.marginLeft = '2px';
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '18px');
            svg.setAttribute('height', '18px');
            svg.style.display = 'block';
            const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', displayItem.iconHref);
            svg.appendChild(use);
            iconContainer.appendChild(svg);

            // 物品名称
            const displayNameDiv = document.createElement('div');
            displayNameDiv.textContent = displayItem.displayName;
            displayNameDiv.style.padding = "4px 1px";
            displayNameDiv.style.marginLeft = '2px';
            displayNameDiv.style.whiteSpace = 'nowrap';
            displayNameDiv.style.overflow = 'hidden';

            container.appendChild(iconContainer);
            container.appendChild(displayNameDiv);
            return container;
        }

        // 创建目标物品元素
        static createTargetItemDisplayElement(targetItem: TargetItem): void {
            const { container, itemContainer, rightDiv } = MWI_Toolkit_Calculator.createBaseItemDisplayItem(targetItem);

            const needCalcCheckbox = document.createElement('input');
            needCalcCheckbox.type = 'checkbox';
            container.prepend(needCalcCheckbox);

            needCalcCheckbox.addEventListener('change', () => {
                targetItem.needCalc = needCalcCheckbox.checked;
                MWI_Toolkit_Calculator.saveAndScheduleRender();
            });

            // 拥有数量
            const ownedSpan = document.createElement('span');
            ownedSpan.style.padding = '4px 1px';
            ownedSpan.style.marginLeft = '4px';

            // 斜杠分隔符
            const slash = document.createElement('span');
            slash.textContent = "/";
            slash.style.padding = '4px 1px';

            // 可编辑的需求数量输入框
            const targetInput = document.createElement('input');
            targetInput.type = 'text';
            targetInput.placeholder = '需求';
            targetInput.style.background = '#dde2f8';
            targetInput.style.color = '#000000';
            targetInput.style.border = 'none';
            targetInput.style.borderRadius = '4px';
            targetInput.style.padding = '4px';
            targetInput.style.margin = '2px';
            targetInput.style.width = '60px';

            // 绑定输入事件
            targetInput.addEventListener('input', function () {
                // 清理非数字字符
                this.value = this.value.replace(/(?!^)-|[^\d-]/g, '');
                const newCount = parseInt(this.value) || 0;
                MWI_Toolkit_Calculator.updateTargetItem(targetItem.itemHrid, newCount);
            });

            // 输入框获得焦点时全选内容
            targetInput.addEventListener('focus', function () {
                setTimeout(() => {
                    targetInput.select();
                }, 0);
            });

            // 删除按钮
            const removeButton = document.createElement('button');
            removeButton.style.background = '#f44336';
            removeButton.style.border = 'none';
            removeButton.style.borderRadius = '4px';
            removeButton.style.padding = '4px';
            removeButton.style.margin = '2px';
            removeButton.style.cursor = 'pointer';

            const removeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            removeSvg.setAttribute('width', '18px');
            removeSvg.setAttribute('height', '18px');
            removeSvg.style.display = 'block';
            const removeUse = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            removeUse.setAttributeNS('http://www.w3.org/1999/xlink', 'href', MWI_Toolkit_Utils.getIconHrefByMiscHrid('remove'));
            removeSvg.appendChild(removeUse);
            removeButton.appendChild(removeSvg);

            removeButton.addEventListener('click', () => {
                MWI_Toolkit_Calculator.removeTargetItem(targetItem.itemHrid);
            });

            rightDiv.appendChild(ownedSpan);
            rightDiv.appendChild(slash);
            rightDiv.appendChild(targetInput);
            rightDiv.appendChild(removeButton);

            targetItem.displayElement = container;
            targetItem.needCalcCheckbox = needCalcCheckbox;
            targetItem.ownedSpan = ownedSpan;
            targetItem.targetInput = targetInput;
        }

        // 创建缺口物品元素
        static createShortageItemDisplayElement(requiredItem: RequiredItem): void {
            const { container, itemContainer, rightDiv } = MWI_Toolkit_Calculator.createBaseItemDisplayItem(requiredItem);

            const shortageSpan = document.createElement('span');
            shortageSpan.style.background = '#393a5b';
            shortageSpan.style.borderRadius = '4px';
            shortageSpan.style.padding = '2px 6px';
            shortageSpan.style.marginLeft = '4px';
            shortageSpan.style.cursor = 'pointer';

            shortageSpan.addEventListener('click', (e) => {
                if (e.ctrlKey) {
                    MWI_Toolkit_Calculator.TryGotoActionDetailByRequiredItem(requiredItem);
                }
            });

            rightDiv.appendChild(shortageSpan);

            requiredItem.shortageDisplayElement = container;
            requiredItem.shortageSpan = shortageSpan;
        }

        // 创建需求物品元素
        static createRequiredItemDisplayElement(requiredItem: RequiredItem): void {
            const { container, itemContainer, rightDiv } = MWI_Toolkit_Calculator.createBaseItemDisplayItem(requiredItem);

            const RequiredCountDiv = document.createElement('div');
            RequiredCountDiv.style.padding = '4px 1px';
            RequiredCountDiv.style.marginLeft = '4px';

            const ownedSpan = document.createElement('span');
            const equivalentSpan = document.createElement('span');
            const requiredSpan = document.createElement('span');

            RequiredCountDiv.appendChild(equivalentSpan);
            RequiredCountDiv.appendChild(ownedSpan);
            RequiredCountDiv.appendChild(requiredSpan);

            rightDiv.appendChild(RequiredCountDiv);

            requiredItem.requiredDisplayElement = container;
            requiredItem.equivalentSpan = equivalentSpan;
            requiredItem.ownedSpan = ownedSpan;
            requiredItem.requiredSpan = requiredSpan;
            requiredItem.requiredDiv = RequiredCountDiv;
        }

        static createBaseItemDisplayItem(displayItem: DisplayItem): { container: HTMLDivElement, itemContainer: HTMLDivElement, rightDiv: HTMLDivElement } {
            const container = document.createElement('div');
            container.className = 'Toolkit_Calculator_Container';
            container.style.border = 'none';
            container.style.borderRadius = '4px';
            container.style.padding = '1px 4px';
            container.style.margin = '2px';
            container.style.display = 'flex';
            container.style.alignItems = 'center';

            const itemContainer = MWI_Toolkit_Calculator.createItemContainer(displayItem);
            container.appendChild(itemContainer)

            const leftDiv = document.createElement('div');
            leftDiv.style.flex = '1';
            container.appendChild(leftDiv);

            // 右侧内容
            const rightDiv = document.createElement('div');
            rightDiv.style.display = 'flex';

            container.appendChild(rightDiv);

            return { container, itemContainer, rightDiv }
        }

        // 尝试打开动作面板
        static TryGotoActionDetailByRequiredItem(requiredItem: RequiredItem): void {
            const actionHrid = MWI_Toolkit_ActionDetailPlus.getActionHrid(requiredItem.displayName)
                ?? MWI_Toolkit_ActionDetailPlus.processableActionList[requiredItem.itemHrid]
                ?? null;
            if (!actionHrid) { return; }
            const { upgradeItemHrid, inputItems, outputItems } = MWI_Toolkit_ActionDetailPlus.calculateActionDetail(actionHrid, true);
            const outputCount = outputItems.find(oi => oi.itemHrid === requiredItem.itemHrid)?.count || 1;
            if (outputCount === 1 || outputCount === 15) {
                const actionCount = Math.ceil(requiredItem.getShortageCount() / outputCount);
                MWI_Toolkit.gameObject.handleGoToAction(actionHrid, actionCount);
            }
            else {
                const actionCount = MWI_Toolkit_Calculator.getRequiredTrials99(outputCount, requiredItem.getShortageCount());
                MWI_Toolkit.gameObject.handleGoToAction(actionHrid, actionCount);
            }
        }

        static getRequiredTrials99(mu: number, target: number) {
            // 用拟合公式简化标准差
            // sigma ≈ 0.2912 * mu^1.032
            const sigma = 0.2912 * Math.pow(mu, 1.032);
            const z = 2.326; // 99%置信度
            // 解一元二次方程 n*mu - z*sigma*sqrt(n) - target = 0
            // x = sqrt(n) = (z*sigma + sqrt(z^2*sigma^2 + 4*mu*target)) / (2*mu)
            const x = (z * sigma + Math.sqrt(z * z * sigma * sigma + 4 * mu * target)) / (2 * mu);
            return Math.ceil(x * x);
        }
    }

    //#endregion

    //#region ActionDetailPlus

    class ItemCountComponent {
        itemHrid: string;
        shortageCountSpan?: HTMLSpanElement | null;
        inventoryCountSpan?: HTMLSpanElement | null;
        inputCountSpan?: HTMLSpanElement | null;
        outputItemInput?: HTMLInputElement | null;
        count: number;
    }

    class MWI_Toolkit_ActionDetailPlus {

        /**
         * 可加工的动作映射
         */
        static processableActionList = {
            "/items/milk": "/actions/milking/cow",
            "/items/verdant_milk": "/actions/milking/verdant_cow",
            "/items/azure_milk": "/actions/milking/azure_cow",
            "/items/burble_milk": "/actions/milking/burble_cow",
            "/items/crimson_milk": "/actions/milking/crimson_cow",
            "/items/rainbow_milk": "/actions/milking/unicow",
            "/items/holy_milk": "/actions/milking/holy_cow",
            "/items/log": "/actions/woodcutting/tree",
            "/items/birch_log": "/actions/woodcutting/birch_tree",
            "/items/cedar_log": "/actions/woodcutting/cedar_tree",
            "/items/purpleheart_log": "/actions/woodcutting/purpleheart_tree",
            "/items/ginkgo_log": "/actions/woodcutting/ginkgo_tree",
            "/items/redwood_log": "/actions/woodcutting/redwood_tree",
            "/items/arcane_log": "/actions/woodcutting/arcane_tree",
            "/items/cotton": "/actions/foraging/cotton",
            "/items/flax": "/actions/foraging/flax",
            "/items/bamboo_branch": "/actions/foraging/bamboo_branch",
            "/items/cocoon": "/actions/foraging/cocoon",
            "/items/radiant_fiber": "/actions/foraging/radiant_fiber"
        };

        /**
         * 可加工的物品映射
         */
        static processableItemList = {
            "/items/milk": "/items/cheese",
            "/items/verdant_milk": "/items/verdant_cheese",
            "/items/azure_milk": "/items/azure_cheese",
            "/items/burble_milk": "/items/burble_cheese",
            "/items/crimson_milk": "/items/crimson_cheese",
            "/items/rainbow_milk": "/items/rainbow_cheese",
            "/items/holy_milk": "/items/holy_cheese",
            "/items/log": "/items/lumber",
            "/items/birch_log": "/items/birch_lumber",
            "/items/cedar_log": "/items/cedar_lumber",
            "/items/purpleheart_log": "/items/purpleheart_lumber",
            "/items/ginkgo_log": "/items/ginkgo_lumber",
            "/items/redwood_log": "/items/redwood_lumber",
            "/items/arcane_log": "/items/arcane_lumber",
            "/items/cotton": "/items/cotton_fabric",
            "/items/flax": "/items/linen_fabric",
            "/items/bamboo_branch": "/items/bamboo_fabric",
            "/items/cocoon": "/items/silk_fabric",
            "/items/radiant_fiber": "/items/radiant_fabric"
        };

        /**
         * 监听页面变化
         */
        static initialize() {
            let lastPanel = null;
            const observer = new MutationObserver(() => {
                const panel = document.querySelector('[class^="SkillActionDetail_regularComponent"]');
                if (panel && panel !== lastPanel) {
                    lastPanel = panel;
                    setTimeout(() => {
                        MWI_Toolkit_ActionDetailPlus.enhanceSkillActionDetail();
                    }, 50);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }

        /**
         * 增强技能行动详情面板
         */
        static enhanceSkillActionDetail() {
            const actionName = MWI_Toolkit_ActionDetailPlus.getActionName();
            const actionHrid = MWI_Toolkit_ActionDetailPlus.getActionHrid(actionName);
            const { upgradeItemHrid, inputItems, outputItems } = MWI_Toolkit_ActionDetailPlus.calculateActionDetail(actionHrid);

            const upgradeItemComponent: ItemCountComponent = { itemHrid: '', count: 0 };
            if (upgradeItemHrid) {
                const shortageCountContainer = document.querySelector('[class^="SkillActionDetail_upgradeItemSelectorInput"]')?.parentElement?.previousElementSibling as HTMLDivElement;
                if (shortageCountContainer) {
                    const newTextSpan = document.createElement('span');
                    newTextSpan.textContent = shortageCountContainer.textContent;
                    newTextSpan.style.height = window.getComputedStyle(document.querySelector('[class*="SkillActionDetail_levelRequirement"]')).height;
                    shortageCountContainer.innerHTML = '';
                    shortageCountContainer.appendChild(newTextSpan);

                    const shortageCountComponent = document.createElement('div');
                    shortageCountComponent.style.display = 'flex';
                    shortageCountComponent.style.alignItems = 'flex-end';
                    shortageCountComponent.style.flexDirection = 'column';

                    const shortageCountSpan = document.createElement('span');
                    shortageCountSpan.style.display = 'flex';
                    shortageCountSpan.style.alignItems = 'center';
                    shortageCountSpan.style.color = '#faa21e';
                    shortageCountComponent.appendChild(shortageCountSpan);

                    upgradeItemComponent.itemHrid = upgradeItemHrid;
                    upgradeItemComponent.shortageCountSpan = shortageCountSpan;
                    upgradeItemComponent.count = 1; // 升级物品固定需求1个

                    shortageCountContainer.appendChild(shortageCountComponent);
                }
            }

            // [{itemHrid, shortageCountSpan, inventoryCountSpan, inputCountSpan, count}]
            const inputItemComponents = Array<ItemCountComponent>();
            if (inputItems) {
                const inputItemComponentContainer = document.querySelector('[class^="SkillActionDetail_itemRequirements"]') as HTMLDivElement;
                const shortageCountContainer = inputItemComponentContainer?.parentElement?.previousElementSibling as HTMLDivElement;
                if (shortageCountContainer) {
                    const newTextSpan = document.createElement('span');
                    newTextSpan.textContent = shortageCountContainer.textContent;
                    newTextSpan.style.height = window.getComputedStyle(document.querySelector('[class*="SkillActionDetail_levelRequirement"]')).height;
                    shortageCountContainer.innerHTML = '';
                    shortageCountContainer.appendChild(newTextSpan);

                    const shortageCountComponent = document.createElement('div');
                    shortageCountComponent.style.display = 'flex';
                    shortageCountComponent.style.alignItems = 'flex-end';
                    shortageCountComponent.style.flexDirection = 'column';

                    const inventoryCountSpans = inputItemComponentContainer?.querySelectorAll('[class*="SkillActionDetail_inventoryCount"]') as NodeListOf<HTMLSpanElement>;
                    const inputCountSpans = inputItemComponentContainer?.querySelectorAll('[class*="SkillActionDetail_inputCount"]') as NodeListOf<HTMLSpanElement>;
                    const itemContainers = inputItemComponentContainer?.querySelectorAll('[class*="Item_itemContainer"]') as NodeListOf<HTMLDivElement>;
                    for (let i = 0; i < itemContainers.length; i++) {
                        inputCountSpans[i].style.color = '#E7E7E7';

                        const inputItemHrid = '/items/' + itemContainers[i].querySelector('svg use').getAttribute('href').split('#').pop();
                        const inputItemCount = inputItems.find(item => item.itemHrid === inputItemHrid)?.count || 0;
                        const shortageCountSpan = document.createElement('span');
                        shortageCountSpan.style.height = window.getComputedStyle(itemContainers[i]).height;
                        shortageCountSpan.style.display = 'flex';
                        shortageCountSpan.style.alignItems = 'center';
                        shortageCountSpan.style.color = '#faa21e';
                        shortageCountComponent.appendChild(shortageCountSpan);
                        inputItemComponents.push({ itemHrid: inputItemHrid, shortageCountSpan: shortageCountSpan, inventoryCountSpan: inventoryCountSpans[i], inputCountSpan: inputCountSpans[i], count: inputItemCount });
                    }

                    shortageCountContainer.appendChild(shortageCountComponent);
                }
            }

            // [{itemHrid, input, count}]
            const outputItemComponents = Array<ItemCountComponent>();
            let lastOutputItemComponent = document.querySelector('[class^="SkillActionDetail_maxActionCountInput"]') as HTMLDivElement;
            const outputItemComponentContainer = lastOutputItemComponent.parentElement as HTMLDivElement;
            const skillActionTimeInput = lastOutputItemComponent.querySelector('input');
            const skillActionTimeButtons = lastOutputItemComponent.querySelectorAll('button');

            for (const outputItem of outputItems) {
                if (outputItem.count === 1 && outputItems.length === 1) break; // 仅有一个产出且数量为1时不创建额外输入框
                const { component, input } = MWI_Toolkit_ActionDetailPlus.createOutputItemComponent(outputItem.itemHrid);
                if (component && input) {
                    outputItemComponentContainer.insertBefore(component, lastOutputItemComponent.nextSibling);
                    outputItemComponents.push({ itemHrid: outputItem.itemHrid, outputItemInput: input, count: outputItem.count });
                    lastOutputItemComponent = component;
                }
            }

            // 联动
            let linking = false;
            function updateSkillActionDetail(e: Event) {
                if (linking) return;
                linking = true;
                const target = e.target as HTMLInputElement;
                const index = outputItemComponents.findIndex(component => component.outputItemInput === target);
                const targetValue = parseInt(target.value, 10);
                if (index !== -1) {
                    skillActionTimeInput.value = (isNaN(targetValue)) ? '∞' : Math.ceil(targetValue / outputItemComponents[index].count).toString();
                    MWI_Toolkit_Utils.reactInputTriggerHack(skillActionTimeInput);
                }
                const skillActionTimes = parseInt(skillActionTimeInput.value, 10);
                outputItemComponents.forEach(component => {
                    if (component.outputItemInput !== target) {
                        component.outputItemInput.value = (isNaN(skillActionTimes)) ? '∞' : Math.ceil(skillActionTimes * component.count).toString();
                    }
                });
                inputItemComponents.forEach(component => {
                    const inventoryCount = MWI_Toolkit_ItemsMap.getCount(component.itemHrid);
                    const requiredCount = component.count * skillActionTimes;
                    if (isNaN(skillActionTimes)) {
                        component.shortageCountSpan.textContent = '';
                        component.inventoryCountSpan.style.color = '';
                    }
                    else {
                        if (requiredCount > inventoryCount) {
                            component.shortageCountSpan.textContent = MWI_Toolkit_Utils.formatNumber(requiredCount - inventoryCount);
                            component.inventoryCountSpan.style.color = '#f44336';
                        } else {
                            component.shortageCountSpan.textContent = ' ';
                            component.inventoryCountSpan.style.color = '#E7E7E7';
                        }
                    }
                    component.inputCountSpan.textContent = '\u00A0/ ' + MWI_Toolkit_Utils.formatNumber(component.count * ((isNaN(skillActionTimes) ? 1 : skillActionTimes))) + '\u00A0';
                });
                if (upgradeItemComponent.shortageCountSpan) {
                    if (isNaN(skillActionTimes)) { upgradeItemComponent.shortageCountSpan.textContent = ''; }
                    else {
                        const requiredCount = upgradeItemComponent.count * skillActionTimes;
                        const inventoryCount = MWI_Toolkit_ItemsMap.getCount(upgradeItemComponent.itemHrid);

                        if (requiredCount > inventoryCount) {
                            upgradeItemComponent.shortageCountSpan.textContent = MWI_Toolkit_Utils.formatNumber(requiredCount - inventoryCount);
                        } else {
                            upgradeItemComponent.shortageCountSpan.textContent = ' ';
                        }
                    }
                }

                linking = false;
            }

            skillActionTimeInput.addEventListener('input', updateSkillActionDetail);
            outputItemComponents.forEach(component => {
                component.outputItemInput.addEventListener('input', updateSkillActionDetail);
            });
            skillActionTimeButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    setTimeout(() => {
                        skillActionTimeInput.dispatchEvent(new Event('input', { bubbles: false }));
                    }, 20);
                });
            });

            // 初次填充
            setTimeout(() => {
                skillActionTimeInput.dispatchEvent(new Event('input', { bubbles: false }));
            }, 20);
        }

        static calculateActionDetail(actionHrid: string, ignoreProcessingTea: boolean = false): { upgradeItemHrid: string | null; inputItems: Array<ItemWithCount> | null; outputItems: Array<ItemWithCount> | null } {
            const actionDetail = MWI_Toolkit_ActionDetailPlus.getActionDetail(actionHrid);
            const actionType = actionDetail?.type?.split('/').pop() || '';
            // 仅支持八种常规类型
            if (!actionDetail || !actionType || !['milking', 'foraging', 'woodcutting', 'cheesesmithing', 'crafting', 'tailoring', 'cooking', 'brewing'].includes(actionType)) {
                console.warn('[MWI_Toolkit] 无法获取动作详情' + MWI_Toolkit_ActionDetailPlus.getActionName());
                return { upgradeItemHrid: null, inputItems: null, outputItems: null };
            }
            // console.log('MWI_Toolkit_ActionDetailPlus: 获取到动作详情', actionDetail);

            const upgradeItemHrid = actionDetail.upgradeItemHrid;
            const inputItems = actionDetail.inputItems ? JSON.parse(JSON.stringify(actionDetail.inputItems)) as Array<ItemWithCount> : null;
            const outputItems = actionDetail.outputItems ? JSON.parse(JSON.stringify(actionDetail.outputItems)) as Array<ItemWithCount> : Array<ItemWithCount>();

            const drinkSlots = MWI_Toolkit_ActionDetailPlus.getActionTypeDrinkSlots(actionType);
            const drinkConcentration = MWI_Toolkit_ActionDetailPlus.getDrinkConcentration();
            // console.log('MWI_Toolkit_ActionDetailPlus: 获取到茶列表', drinkSlots, drinkConcentration);

            // 检查采集数量加成
            const gatheringBuff = (drinkSlots?.some(itemHrid => itemHrid === '/items/gathering_tea') ? 0.15 * drinkConcentration : 0)
                + MWI_Toolkit_ActionDetailPlus.getEquipmentGatheringBuff() + MWI_Toolkit_ActionDetailPlus.getCommunityGatheringBuff();
            // 检查加工茶加成
            const processingBuff = (drinkSlots?.some(itemHrid => itemHrid === '/items/processing_tea') ? 0.15 * drinkConcentration : 0);
            // 检查美食茶加成
            const gourmetBuff = (drinkSlots?.some(itemHrid => itemHrid === '/items/gourmet_tea') ? 0.12 * drinkConcentration : 0);
            // 检查工匠茶加成
            const artisanBuff = (drinkSlots?.some(itemHrid => itemHrid === '/items/artisan_tea') ? 0.1 * drinkConcentration : 0);

            if (['milking', 'foraging', 'woodcutting', /*'cheesesmithing', 'crafting', 'tailoring', 'cooking', 'brewing'*/].includes(actionType)) {
                const dropTable = actionDetail.dropTable;
                for (const dropItem of dropTable) {
                    const averageCount = dropItem.dropRate * (dropItem.minCount + dropItem.maxCount) / 2 * (1 + gatheringBuff);
                    const processedItemHrid = MWI_Toolkit_ActionDetailPlus.processableItemList[dropItem.itemHrid];
                    if (processedItemHrid && !ignoreProcessingTea) {
                        outputItems.push({ itemHrid: dropItem.itemHrid, count: averageCount * (1 - processingBuff), });
                        outputItems.push({ itemHrid: processedItemHrid, count: averageCount * (1 - processingBuff) / 2 / (1 - artisanBuff) + averageCount * processingBuff / 2, });
                    } else {
                        outputItems.push({ itemHrid: dropItem.itemHrid, count: averageCount, });
                    }
                }
            }
            if ([/*'milking', 'foraging', 'woodcutting', 'cheesesmithing', 'crafting', 'tailoring',*/ 'cooking', 'brewing'].includes(actionType)) {
                for (const outputItem of outputItems) { outputItem.count = outputItem.count * (1 + gourmetBuff); }
            }
            if ([/*'milking', 'foraging', 'woodcutting',*/ 'cheesesmithing', 'crafting', 'tailoring', 'cooking', 'brewing'].includes(actionType)) {
                for (const inputItem of inputItems) { inputItem.count = inputItem.count * (1 - artisanBuff); }
            }

            return { upgradeItemHrid, inputItems, outputItems };
        }

        /**
         * 创建output数量栏，返回 [{component, input}]
         * @param itemHrid 物品的唯一标识符
         * @returns { component: HTMLDivElement; input: HTMLInputElement } | null
         */
        static createOutputItemComponent(itemHrid: string): { component: HTMLDivElement; input: HTMLInputElement } | null {
            const origComponent = document.querySelector('[class^="SkillActionDetail_maxActionCountInput"]') as HTMLDivElement;
            if (!origComponent) return null;

            // 克隆外层div（不带子内容）
            const component = origComponent.cloneNode(false) as HTMLDivElement;

            const originalActionLabel = document.querySelector('[class^="SkillActionDetail_actionContainer"] [class^="SkillActionDetail_label"]') as HTMLDivElement;
            if (Object.values(MWI_Toolkit_ActionDetailPlus.processableItemList).includes(itemHrid)) {
                const tab = originalActionLabel.cloneNode(false) as HTMLDivElement;
                tab.style.width = window.getComputedStyle(originalActionLabel).width;
                tab.className = 'SkillActionDetail_tab';
                tab.textContent = '┗';
                component.appendChild(tab);
            }

            // 物品图标
            const itemIcon = document.createElement('div');
            itemIcon.style.width = window.getComputedStyle(originalActionLabel).width;
            itemIcon.style.height = window.getComputedStyle(originalActionLabel).height;
            itemIcon.style.marginRight = '2px';
            itemIcon.style.display = 'flex';
            itemIcon.style.alignItems = 'center';
            itemIcon.style.justifyContent = 'center';

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '20px');
            svg.setAttribute('height', '20px');
            svg.style.display = 'block';
            const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', MWI_Toolkit_Utils.getIconHrefByItemHrid(itemHrid));
            svg.appendChild(use);
            itemIcon.appendChild(svg);

            component.appendChild(itemIcon);

            // 输入框
            const origInputWrap = origComponent.querySelector('[class^="SkillActionDetail_input"]') as HTMLDivElement;
            const inputWrap = origInputWrap.cloneNode(true) as HTMLDivElement;
            const origInput = origInputWrap.querySelector('input');
            const input = inputWrap.querySelector('input');
            input.addEventListener('focus', () => {
                setTimeout(() => {
                    input.select();
                }, 0);
            });
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    if (origInput) {
                        origInput.dispatchEvent(event);
                    }
                }
            });
            component.appendChild(inputWrap);

            if (!Object.values(MWI_Toolkit_ActionDetailPlus.processableItemList).includes(itemHrid)) {
                // 快捷填充按钮
                const btns = [
                    { val: 1000, txt: '1k' },
                    { val: 2000, txt: '2k' },
                    { val: 5000, txt: '5k' }
                ];
                const origButtons = origComponent.querySelectorAll('button');
                const buttonClass = origButtons.length > 0 ? origButtons[0].className : '';

                btns.forEach(({ val, txt }) => {
                    const btn = document.createElement('button');
                    btn.className = buttonClass;
                    btn.textContent = txt;
                    btn.addEventListener('click', () => {
                        input.value = val.toString();
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                    });
                    component.appendChild(btn);
                });
            }

            return { component, input };
        }

        static getActionName(): string {
            const actionNameDiv = document.querySelector('[class^="SkillActionDetail_name"]') as HTMLDivElement;
            return actionNameDiv ? actionNameDiv.textContent : '';
        }

        static getActionHrid(actionName: string): string {
            return MWI_Toolkit_I18n.getHridByName(actionName, 'actionNames');
        }

        static getActionDetail(actionHrid: string): ActionDetail | null {
            return MWI_Toolkit.initClientData?.actionDetailMap?.[`${actionHrid}`];
        }

        static getActionTypeDrinkSlots(actionType: string): Array<string> {
            if (!actionType) { return []; }
            const drinkSlots: Array<string> = [];
            MWI_Toolkit.gameObject?.state?.actionTypeDrinkSlotsDict?.[`/action_types/${actionType}`].forEach(drink => {
                if (drink && drink.itemHrid) {
                    drinkSlots.push(drink.itemHrid);
                }
            });
            // 对三采添加对应的工匠茶数据用于计算加工数量
            const processActionType = { milking: 'cheesesmithing', foraging: 'tailoring', woodcutting: 'crafting' }[actionType] || null;
            if (processActionType) {
                const processDrinkSlots = MWI_Toolkit.gameObject?.state?.actionTypeDrinkSlotsDict?.[`/action_types/${processActionType}`];
                processDrinkSlots.forEach(drink => {
                    if (drink && drink.itemHrid == '/items/artisan_tea') {
                        drinkSlots.push(drink.itemHrid);
                    }
                });
            }
            return drinkSlots;
        }

        static getDrinkConcentration(): number {
            const enhancementLevel = MWI_Toolkit_ItemsMap.getMaxEnhancementLevel("/items/guzzling_pouch");
            if (enhancementLevel != -1) {
                return 1
                    + MWI_Toolkit.initClientData?.itemDetailMap?.[`/items/guzzling_pouch`].equipmentDetail.noncombatStats.drinkConcentration
                    + MWI_Toolkit.initClientData?.itemDetailMap?.[`/items/guzzling_pouch`].equipmentDetail.noncombatEnhancementBonuses.drinkConcentration
                    * MWI_Toolkit.initClientData?.enhancementLevelTotalBonusMultiplierTable[enhancementLevel];
            }
            return 1;
        }

        static getEquipmentGatheringBuff(): number {
            let equipmentGatheringBuff = 0;
            const philosophers_earrings_enhancementLevel = MWI_Toolkit_ItemsMap.getMaxEnhancementLevel("/items/philosophers_earrings");
            const earrings_of_gathering_enhancementLevel = MWI_Toolkit_ItemsMap.getMaxEnhancementLevel("/items/earrings_of_gathering");
            const philosophers_ring_enhancementLevel = MWI_Toolkit_ItemsMap.getMaxEnhancementLevel("/items/philosophers_ring");
            const ring_of_gathering_enhancementLevel = MWI_Toolkit_ItemsMap.getMaxEnhancementLevel("/items/ring_of_gathering");

            if (philosophers_earrings_enhancementLevel != -1) {
                equipmentGatheringBuff = equipmentGatheringBuff
                    + MWI_Toolkit.initClientData?.itemDetailMap?.[`/items/philosophers_earrings`].equipmentDetail.noncombatStats.gatheringQuantity
                    + MWI_Toolkit.initClientData?.itemDetailMap?.[`/items/philosophers_earrings`].equipmentDetail.noncombatEnhancementBonuses.gatheringQuantity
                    * MWI_Toolkit.initClientData?.enhancementLevelTotalBonusMultiplierTable[philosophers_earrings_enhancementLevel];
            } else if (earrings_of_gathering_enhancementLevel != -1) {
                equipmentGatheringBuff = equipmentGatheringBuff
                    + MWI_Toolkit.initClientData?.itemDetailMap?.[`/items/earrings_of_gathering`].equipmentDetail.noncombatStats.gatheringQuantity
                    + MWI_Toolkit.initClientData?.itemDetailMap?.[`/items/earrings_of_gathering`].equipmentDetail.noncombatEnhancementBonuses.gatheringQuantity
                    * MWI_Toolkit.initClientData?.enhancementLevelTotalBonusMultiplierTable[earrings_of_gathering_enhancementLevel];
            }

            if (philosophers_ring_enhancementLevel != -1) {
                equipmentGatheringBuff = equipmentGatheringBuff
                    + MWI_Toolkit.initClientData?.itemDetailMap?.[`/items/philosophers_ring`].equipmentDetail.noncombatStats.gatheringQuantity
                    + MWI_Toolkit.initClientData?.itemDetailMap?.[`/items/philosophers_ring`].equipmentDetail.noncombatEnhancementBonuses.gatheringQuantity
                    * MWI_Toolkit.initClientData?.enhancementLevelTotalBonusMultiplierTable[philosophers_ring_enhancementLevel];
            } else if (ring_of_gathering_enhancementLevel != -1) {
                equipmentGatheringBuff = equipmentGatheringBuff
                    + MWI_Toolkit.initClientData?.itemDetailMap?.[`/items/ring_of_gathering`].equipmentDetail.noncombatStats.gatheringQuantity
                    + MWI_Toolkit.initClientData?.itemDetailMap?.[`/items/ring_of_gathering`].equipmentDetail.noncombatEnhancementBonuses.gatheringQuantity
                    * MWI_Toolkit.initClientData?.enhancementLevelTotalBonusMultiplierTable[ring_of_gathering_enhancementLevel];
            }
            return equipmentGatheringBuff;
        }

        static getCommunityGatheringBuff(): number {
            const communityBuffs = MWI_Toolkit.gameObject?.state?.communityBuffs || [];
            for (const buff of communityBuffs) {
                if (buff.hrid === "/community_buff_types/gathering_quantity" && !buff.isDone) {
                    return buff.level * 0.005 + 0.195;
                }
            }
            return 0;
        }
    }

    //#endregion

    //#region Utils

    /**
     * 静态工具类
     */
    class MWI_Toolkit_Utils {
        /**
         * 格式化数字为字符串
         * @param num 要格式化的数字
         * @returns 格式化后的字符串
         */
        static formatNumber(num: number): string {
            // 类型和有效性检查
            if (!Number.isFinite(num)) {
                return '0';
            }

            // 确保非负数
            const normalizedNum = Math.max(0, num);

            // 小于1000：保留1位小数，但如果小数为0则只显示整数
            if (normalizedNum <= 999) {
                const fixed = normalizedNum.toFixed(1);
                return fixed.endsWith('.0') ? Math.round(normalizedNum).toString() : fixed;
            }

            // 小于100,000：向上取整
            if (normalizedNum <= 99_999) {
                return Math.ceil(normalizedNum).toString();
            }

            // 小于10,000,000：显示xxxK (100K~9999K)
            if (normalizedNum <= 9_999_999) {
                return `${Math.floor(normalizedNum / 1_000)}K`;
            }

            // 小于10,000,000,000：显示xxxM (100M~9999M)
            if (normalizedNum <= 9_999_999_999) {
                return `${Math.floor(normalizedNum / 1_000_000)}M`;
            }

            // 小于10,000,000,000,000：显示xxxB (100B~9999B)
            if (normalizedNum <= 9_999_999_999_999) {
                return `${Math.floor(normalizedNum / 1_000_000_000)}B`;
            }

            // 更大的数值显示NaN
            return 'NaN';
        }

        /**
         * 获取物品排序索引
         * @param hrid 物品的唯一标识符
         * @returns 物品的排序索引
         */
        static getSortIndexByItemHrid(hrid: string): number {
            return (MWI_Toolkit.initClientData?.itemDetailMap?.[hrid]?.sortIndex || 9999);
        }

        /**
         * 获取物品排序索引
         * @param hrid 物品的唯一标识符
         * @returns 物品的排序索引
         */
        static getSortIndexByHouseRoomHrid(hrid: string): number {
            return (MWI_Toolkit.initClientData?.houseRoomDetailMap?.[hrid]?.sortIndex || 0) - 9999;
        }

        /**
         * 获取物品图标的链接
         * @param itemHrid 物品的唯一标识符
         * @returns 物品图标的链接
         */
        static getIconHrefByItemHrid(itemHrid: string): string {
            return '/static/media/items_sprite.d4d08849.svg#' + (itemHrid.split('/').pop() || '');
        }

        /**
         * 获取技能图标的链接
         * @param skillHrid 技能的唯一标识符
         * @returns 技能图标的链接
         */
        static getIconHrefBySkillHrid(skillHrid: string): string {
            return '/static/media/skills_sprite.3bb4d936.svg#' + (skillHrid.split('/').pop() || '');
        }

        /**
         * 获取房屋图标的链接
         * @param houseRoomHrid 房屋的唯一标识符
         * @returns 房屋图标的链接
         */
        static getIconHrefByHouseRoomHrid(houseRoomHrid: string): string {
            return MWI_Toolkit_Utils.getIconHrefBySkillHrid(MWI_Toolkit.initClientData?.houseRoomDetailMap?.[houseRoomHrid]?.skillHrid || houseRoomHrid);
        }

        /**
         * 获取杂项图标的链接
         * @param hrid 杂项的唯一标识符
         * @returns 杂项图标的链接
         */
        static getIconHrefByMiscHrid(hrid: string): string {
            return '/static/media/misc_sprite.6fa5e97c.svg#' + (hrid.split('/').pop() || '');
        }

        /**
         * 触发React输入框的change事件
         * 通过操作React内部的_valueTracker来触发React的事件系统
         * @param inputElem HTML输入元素
         */
        static reactInputTriggerHack(inputElem: HTMLInputElement): void {
            const lastValue = inputElem.value;
            const event = new Event("input", { bubbles: true });

            // 添加自定义标记
            (event as any).simulated = true;

            // 访问React内部的value tracker
            const tracker = (inputElem as any)._valueTracker;
            if (tracker) {
                // 触发变更：设置为不同的值以触发React的change检测
                tracker.setValue(lastValue === '' ? ' ' : '');
            }

            inputElem.dispatchEvent(event);
        }
    }

    //#endregion

    //#region I18n

    /**
     * 国际化静态工具类实现
     * 提供游戏内物品和其他资源的多语言名称查询功能
     */
    class MWI_Toolkit_I18n {
        /**
         * 获取物品的本地化名称
         * @param itemHrid 物品的唯一标识符
         * @returns 本地化后的物品名称，如果找不到则返回原始HRID
         */
        static getItemName(itemHrid: string): string {
            return MWI_Toolkit_I18n.getName(itemHrid, "itemNames");
        }

        /**
         * 获取资源的本地化名称（通用方法）
         * @param hrid 资源的唯一标识符
         * @param category 资源分类（houseRoomNames, actionNames, itemNames）
         * @returns 本地化后的名称，如果找不到则返回原始HRID
         */
        static getName(hrid: string, category: I18nCategory): string {
            if (!hrid || !category) { return hrid; }
            // 特例自定义itemCategory名称
            if (hrid === '/item_categories/house_rooms') {
                return MWI_Toolkit?.getGameLanguage() === 'zh' ? '房屋' : 'House';
            }
            if (hrid === '/item_categories/materials') {
                return MWI_Toolkit?.getGameLanguage() === 'zh' ? '材料' : 'Materials';
            }
            return MWI_Toolkit.gameObject?.props?.i18n?.options?.resources?.[MWI_Toolkit?.getGameLanguage()]?.translation?.[category]?.[hrid] || hrid;
        }

        /**
         * 根据物品名称反查HRID
         * @param itemName 物品的本地化名称
         * @returns 对应的物品HRID，如果找不到则返回null
         */
        static getItemHridByName(itemName: string): string | null {
            return MWI_Toolkit_I18n.getHridByName(itemName, "itemNames");
        }

        /**
         * 根据名称反查HRID（通用方法）
         * @param name 资源的本地化名称
         * @param category 资源分类（houseRoomNames, actionNames, itemNames）
         * @returns 对应的HRID，如果找不到则返回null
         */
        static getHridByName(name: string, category: I18nCategory): string | null {
            if (!name || !category) { return null; }
            return Object.entries(MWI_Toolkit.gameObject?.props?.i18n?.options?.resources?.[MWI_Toolkit?.getGameLanguage()]?.translation?.[category] || {})
                .find(([, v]) => ((v as string) || '').toLowerCase() === name.toLowerCase().trim())?.[0] ?? null;
        }
    }

    //#endregion

    //#region ItemsMap

    /**
     * 物品映射管理类实现
     * 使用二级Map结构存储物品数据：itemHrid -> enhancementLevel -> count
     * 提供物品查询和事件监听功能
     */
    class MWI_Toolkit_ItemsMap {
        /** 物品数据映射表：itemHrid -> (enhancementLevel -> count) */
        static map: Map<string, Map<number, number>> = new Map();
        /** 物品更新事件的回调函数列表 */
        static itemsUpdatedCallbacks: ((items: CharacterItem[]) => void)[] = [];

        /**
         * 查询指定物品和强化等级的数量
         * @param itemHrid 物品的唯一标识符
         * @param enhancementLevel 强化等级，默认为0
         * @returns 物品数量，如果不存在则返回0
         */
        static getCount(itemHrid: string, enhancementLevel: number = 0): number {
            return MWI_Toolkit_ItemsMap.map.get(itemHrid)?.get(enhancementLevel) ?? 0;
        }

        /**
         * 查询指定物品的最大强化等级
         * @param itemHrid 物品的唯一标识符
         * @returns 最大强化等级，如果物品不存在或所有数量为0则返回-1
         */
        static getMaxEnhancementLevel(itemHrid: string): number {
            const m = MWI_Toolkit_ItemsMap.map.get(itemHrid);
            if (!m) { return -1; }
            let max = -1;
            for (const [level, count] of m) {
                if (count > 0 && level > max) {
                    max = level;
                }
            }
            return max;
        }

        /**
         * 更新物品数据
         * @param endCharacterItems 要更新的物品列表
         */
        static update(endCharacterItems: CharacterItem[]): void {
            if (!endCharacterItems) { return; }
            for (const item of endCharacterItems) {
                if (!MWI_Toolkit_ItemsMap.map.has(item.itemHrid)) {
                    MWI_Toolkit_ItemsMap.map.set(item.itemHrid, new Map());
                }
                MWI_Toolkit_ItemsMap.map.get(item.itemHrid)!.set(item.enhancementLevel, item.count);
            }
            MWI_Toolkit_ItemsMap.itemsUpdatedCallbacks.forEach(cb => {
                try {
                    cb(endCharacterItems);
                } catch (e) {
                    console.error('[MWI_Toolkit] Error in item updated callback:', e);
                }
            });
        }

        /**
         * 清空所有物品数据
         */
        static clear(): void {
            MWI_Toolkit_ItemsMap.map.clear();
        }
    }

    //#endregion

    //#region MWI_Toolkit

    /**
     * MWI工具包主类
     * 提供游戏数据抓取、国际化、物品管理等核心功能
     * 使用单例模式确保全局只有一个实例
     */
    class MWI_Toolkit {
        /** 初始化客户端数据（从localStorage获取） */
        static initClientData: InitClientData | null = null;
        /** 游戏对象实例（从React组件获取） */
        static gameObject: GameObject | null = null;
        /** 是否已初始化 */
        static initialized: boolean = false;

        static getGameLanguage(): I18nLanguage {
            return MWI_Toolkit.gameObject?.language || 'zh';
        }

        /**
         * 启动工具包
         * 等待游戏页面加载完成后进行初始化
         */
        static start(): void {
            MWI_Toolkit.setupWebSocketInterceptor();
            MWI_Toolkit.waitForElement('[class^="GamePage"]', () => {
                MWI_Toolkit.initialize();
            });
        }

        /**
         * 设置 WebSocket 消息拦截器
         * 通过劫持 MessageEvent.prototype.data 来拦截所有 WebSocket 消息
         */
        static setupWebSocketInterceptor(): void {
            const oriGet = Object.getOwnPropertyDescriptor(MessageEvent.prototype, "data")?.get;
            if (!oriGet) { return; }

            Object.defineProperty(MessageEvent.prototype, "data", {
                get: function (this: MessageEvent): any {
                    const socket = this.currentTarget as WebSocket;
                    // 只拦截游戏服务器的 WebSocket 消息
                    if (!(socket instanceof WebSocket) ||
                        (socket.url.indexOf("api.milkywayidle.com/ws") === -1 && socket.url.indexOf("api-test.milkywayidle.com/ws") === -1)) {
                        return oriGet.call(this);
                    }
                    const message = oriGet.call(this);
                    Object.defineProperty(this, "data", { value: message }); // 防止循环调用

                    MWI_Toolkit?.handleWebSocketMessage(message);

                    return message;
                }
            });
        }

        /**
         * 处理 WebSocket 消息
         * 解析消息并根据类型进行相应处理
         * @param message WebSocket 消息内容（JSON字符串）
         */
        static handleWebSocketMessage(message: string): void {
            try {
                const obj: unknown = JSON.parse(message);
                // 类型守卫：检查是否为对象
                if (!obj || typeof obj !== 'object') return;

                const msgObj = obj as Record<string, unknown>;

                // 处理角色初始化消息（使用双重断言）
                if (msgObj.type === "init_character_data" && Array.isArray(msgObj.characterItems)) {
                    MWI_Toolkit.handleInitCharacterData(obj as unknown as InitCharacterData);
                }
                // 处理物品变更消息（使用双重断言）
                else if (Array.isArray(msgObj.endCharacterItems)) {
                    MWI_Toolkit.handleEndCharacterItems(obj as unknown as ItemsUpdatedData);
                }
            } catch {
                // 忽略解析错误（非JSON消息或其他错误）
            }
        }

        /**
         * 处理角色初始化数据
         * 当切换角色或刷新页面时会收到此消息
         * @param data 角色初始化数据
         */
        static handleInitCharacterData(data: InitCharacterData): void {
            // 清空并初始化物品映射表
            MWI_Toolkit_ItemsMap.clear();
            MWI_Toolkit_ItemsMap.update(data.characterItems);

            if (!MWI_Toolkit.initialized) { return; }

            console.log("[MWI_Toolkit] 界面刷新");

            MWI_Toolkit_Calculator.initializeCalculatorUI();
            MWI_Toolkit.waitForElement('[class^="GamePage"]', () => {
                MWI_Toolkit.gameObject = MWI_Toolkit.getGameObject();
            });
        }

        /**
         * 处理物品变更数据
         * 当物品数量、强化等级等发生变化时会收到此消息
         * @param data 包含变更后物品数据的消息
         */
        static handleEndCharacterItems(data: ItemsUpdatedData): void {
            // 更新物品映射表
            MWI_Toolkit_ItemsMap.update(data.endCharacterItems);
        }

        /**
         * 等待指定的DOM元素出现
         * 使用 MutationObserver 监听DOM变化
         * @param callback 元素出现后执行的回调函数
         */
        static waitForElement(selector: string, callback: () => void): void {
            const el = document.querySelector(selector);
            if (el) {
                // 元素已存在，直接执行回调
                callback();
                return;
            }
            // 元素不存在，监听DOM变化
            const observer = new MutationObserver(() => {
                const el = document.querySelector(selector);
                if (el) {
                    observer.disconnect();
                    callback();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }

        /**
         * 初始化工具包
         * 获取游戏对象实例并设置初始化标志
         */
        static initialize(): void {
            MWI_Toolkit.gameObject = MWI_Toolkit.getGameObject();
            MWI_Toolkit.initClientData = MWI_Toolkit.getInitClientData();
            if (!MWI_Toolkit.gameObject || !MWI_Toolkit.initClientData) {
                console.error("[MWI_Toolkit] 初始化失败");
                return;
            }
            MWI_Toolkit.initialized = true;
            MWI_Toolkit_ActionDetailPlus.initialize();
            MWI_Toolkit_Calculator.initialize();
            console.log("[MWI_Toolkit] 已初始化");
            console.log(MWI_Toolkit.gameObject, MWI_Toolkit.initClientData);
        }

        /**
         * 从DOM元素获取React组件实例
         * 通过访问React内部的Fiber节点来获取组件实例
         * @returns React组件实例，如果未找到则返回null
         */
        static getGameObject(): GameObject | null {
            // (e => e?.[Object.keys(e).find(k => k.startsWith('__reactFiber$'))]?.return?.stateNode)(document.querySelector('[class^="GamePage"]'))
            const gamePageElement = document.querySelector('[class^="GamePage"]') as HTMLElement;
            if (!gamePageElement) return null;

            // 查找React Fiber的key（格式：__reactFiber$xxx）
            const reactKey = Object.keys(gamePageElement).find(k => k.startsWith('__reactFiber$'));
            if (!reactKey) return null;

            // 通过Fiber节点获取组件实例
            const fiber = (gamePageElement as any)[reactKey];
            return fiber?.return?.stateNode || null;
        }

        /**
         * 从localStorage获取初始化客户端数据
         * 数据以压缩的UTF-16字符串形式存储
         * @returns 初始化客户端数据对象，如果未找到则返回null
         */
        static getInitClientData(): InitClientData | null {
            const compressedData = localStorage.getItem("initClientData");
            if (compressedData) {
                const decompressedData = LZString.decompressFromUTF16(compressedData);
                return JSON.parse(decompressedData) as InitClientData;
            }
            return null;
        }
    }

    //#endregion

    // 防止重复加载
    if ((window as any).MWI_Toolkit_Started) { return; }
    (window as any).MWI_Toolkit_Started = true;

    // 启动工具包
    MWI_Toolkit.start();
})();