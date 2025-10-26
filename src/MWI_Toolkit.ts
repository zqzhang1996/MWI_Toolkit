// ==UserScript==
// @name         MWI_Toolkit
// @namespace    http://tampermonkey.net/
// @version      5.0.0
// @description  MWI工具集
// @author       zqzhang1996
// @match        https://www.milkywayidle.com/*
// @match        https://test.milkywayidle.com/*
// @require      https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js
// @grant        none
// @run-at       document-body
// @license      MIT
// ==/UserScript==

// LZString 声明
declare const LZString: {
    decompressFromUTF16(compressed: string): string;
};

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
type I18nCategory = 'actionNames' | 'houseRoomNames' | 'itemNames';

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
    enhancementLevelTotalBonusMultiplierTable: Array<number>
}

/**
 * 物品详细信息
 */
interface ItemDetail {
    equipmentDetail?: EquipmentDetail;
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
 * 房间详细信息
 */
interface HouseRoomDetail {
    skillHrid: string;
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

    //#region ActionDetailPlus

    interface ItemCountComponent {
        itemHrid: string,
        missingCountSpan?: HTMLSpanElement | null,
        inventoryCountSpan?: HTMLSpanElement | null,
        inputCountSpan?: HTMLSpanElement | null,
        outputItemInput?: HTMLInputElement | null,
        count: number
    }

    class MWI_Toolkit_ActionDetailPlus {

        /**
         * 可加工的物品映射
         */
        static processableItemMap = {
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
            const { upgradeItemHrid, inputItems, outputItems } = this.calculateActionDetail();

            const upgradeItemComponent: ItemCountComponent = { itemHrid: '', count: 0 };
            if (upgradeItemHrid) {
                const missingCountContainer = document.querySelector('[class^="SkillActionDetail_upgradeItemSelectorInput"]')?.parentElement?.previousElementSibling as HTMLDivElement;
                if (missingCountContainer) {
                    const newTextSpan = document.createElement('span');
                    newTextSpan.textContent = missingCountContainer.textContent;
                    newTextSpan.style.height = window.getComputedStyle(document.querySelector('[class*="SkillActionDetail_levelRequirement"]')).height;
                    missingCountContainer.innerHTML = '';
                    missingCountContainer.appendChild(newTextSpan);

                    const missingCountComponent = document.createElement('div');
                    missingCountComponent.style.display = 'flex';
                    missingCountComponent.style.alignItems = 'flex-end';
                    missingCountComponent.style.flexDirection = 'column';

                    const missingCountSpan = document.createElement('span');
                    missingCountSpan.style.display = 'flex';
                    missingCountSpan.style.alignItems = 'center';
                    missingCountSpan.style.color = '#faa21e';
                    missingCountComponent.appendChild(missingCountSpan);

                    upgradeItemComponent.itemHrid = upgradeItemHrid;
                    upgradeItemComponent.missingCountSpan = missingCountSpan;
                    upgradeItemComponent.count = 1; // 升级物品固定需求1个

                    missingCountContainer.appendChild(missingCountComponent);
                }
            }

            // [{itemHrid, missingCountSpan, inventoryCountSpan, inputCountSpan, count}]
            const inputItemComponents = Array<ItemCountComponent>();
            if (inputItems) {
                const inputItemComponentContainer = document.querySelector('[class^="SkillActionDetail_itemRequirements"]') as HTMLDivElement;
                const missingCountContainer = inputItemComponentContainer?.parentElement?.previousElementSibling as HTMLDivElement;
                if (missingCountContainer) {
                    const newTextSpan = document.createElement('span');
                    newTextSpan.textContent = missingCountContainer.textContent;
                    newTextSpan.style.height = window.getComputedStyle(document.querySelector('[class*="SkillActionDetail_levelRequirement"]')).height;
                    missingCountContainer.innerHTML = '';
                    missingCountContainer.appendChild(newTextSpan);

                    const missingCountComponent = document.createElement('div');
                    missingCountComponent.style.display = 'flex';
                    missingCountComponent.style.alignItems = 'flex-end';
                    missingCountComponent.style.flexDirection = 'column';

                    const inventoryCountSpans = inputItemComponentContainer?.querySelectorAll('[class*="SkillActionDetail_inventoryCount"]') as NodeListOf<HTMLSpanElement>;
                    const inputCountSpans = inputItemComponentContainer?.querySelectorAll('[class*="SkillActionDetail_inputCount"]') as NodeListOf<HTMLSpanElement>;
                    const itemContainers = inputItemComponentContainer?.querySelectorAll('[class*="Item_itemContainer"]') as NodeListOf<HTMLDivElement>;
                    for (let i = 0; i < itemContainers.length; i++) {
                        inputCountSpans[i].style.color = '#E7E7E7';

                        const inputItemHrid = '/items/' + itemContainers[i].querySelector('svg use').getAttribute('href').split('#').pop();
                        const inputItemCount = inputItems.find(item => item.itemHrid === inputItemHrid)?.count || 0;
                        const missingCountSpan = document.createElement('span');
                        missingCountSpan.style.height = window.getComputedStyle(itemContainers[i]).height;
                        missingCountSpan.style.display = 'flex';
                        missingCountSpan.style.alignItems = 'center';
                        missingCountSpan.style.color = '#faa21e';
                        missingCountComponent.appendChild(missingCountSpan);
                        inputItemComponents.push({ itemHrid: inputItemHrid, missingCountSpan, inventoryCountSpan: inventoryCountSpans[i], inputCountSpan: inputCountSpans[i], count: inputItemCount });
                    }

                    missingCountContainer.appendChild(missingCountComponent);
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
                const { component, input } = this.createOutputItemComponent(outputItem.itemHrid);
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
                        component.missingCountSpan.textContent = '';
                        component.inventoryCountSpan.style.color = '';
                    }
                    else {
                        if (requiredCount > inventoryCount) {
                            component.missingCountSpan.textContent = MWI_Toolkit_Utils.formatNumber(requiredCount - inventoryCount);
                            component.inventoryCountSpan.style.color = '#f44336';
                        } else {
                            component.missingCountSpan.textContent = ' ';
                            component.inventoryCountSpan.style.color = '#E7E7E7';
                        }
                    }
                    component.inputCountSpan.textContent = '\u00A0/ ' + MWI_Toolkit_Utils.formatNumber(component.count * ((isNaN(skillActionTimes) ? 1 : skillActionTimes))) + '\u00A0';
                });
                if (upgradeItemComponent.missingCountSpan) {
                    if (isNaN(skillActionTimes)) { upgradeItemComponent.missingCountSpan.textContent = ''; }
                    else {
                        const requiredCount = upgradeItemComponent.count * skillActionTimes;
                        const inventoryCount = MWI_Toolkit_ItemsMap.getCount(upgradeItemComponent.itemHrid);

                        if (requiredCount > inventoryCount) {
                            upgradeItemComponent.missingCountSpan.textContent = MWI_Toolkit_Utils.formatNumber(requiredCount - inventoryCount);
                        } else {
                            upgradeItemComponent.missingCountSpan.textContent = ' ';
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

        static calculateActionDetail(): { upgradeItemHrid: string | null; inputItems: Array<ItemWithCount> | null; outputItems: Array<ItemWithCount> | null } {
            const actionDetail = this.getActionDetail();
            const actionType = this.getActionType();
            if (!actionDetail || !actionType) {
                console.warn('[MWI_Toolkit] 无法获取动作详情');
                return { upgradeItemHrid: null, inputItems: null, outputItems: null };
            }
            // console.log('MWI_Toolkit_ActionDetailPlus: 获取到动作详情', actionDetail);

            const upgradeItemHrid = actionDetail.upgradeItemHrid;
            const inputItems = actionDetail.inputItems ? JSON.parse(JSON.stringify(actionDetail.inputItems)) as Array<ItemWithCount> : null;
            const outputItems = actionDetail.outputItems ? JSON.parse(JSON.stringify(actionDetail.outputItems)) as Array<ItemWithCount> : Array<ItemWithCount>();

            const drinkSlots = this.getActionTypeDrinkSlots();
            const drinkConcentration = this.getDrinkConcentration();
            // console.log('MWI_Toolkit_ActionDetailPlus: 获取到茶列表', drinkSlots, drinkConcentration);

            // 检查采集数量加成
            const gatheringBuff = (drinkSlots?.some(itemHrid => itemHrid === '/items/gathering_tea') ? 0.15 * drinkConcentration : 0)
                + this.getEquipmentGatheringBuff() + this.getCommunityGatheringBuff();
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
                    const processedItemHrid = this.processableItemMap[dropItem.itemHrid];
                    if (processedItemHrid) {
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
            if (Object.values(MWI_Toolkit_ActionDetailPlus.processableItemMap).includes(itemHrid)) {
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
            input.addEventListener('focus', function () {
                setTimeout(() => {
                    input.select();
                }, 0);
            });
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.keyCode === 13) {
                    if (origInput) {
                        const event = new KeyboardEvent('keydown', {
                            bubbles: true,
                            cancelable: true,
                            key: 'Enter',
                            code: 'Enter',
                            keyCode: 13,
                            which: 13
                        });
                        origInput.dispatchEvent(event);
                    }
                }
            });
            component.appendChild(inputWrap);

            if (!Object.values(MWI_Toolkit_ActionDetailPlus.processableItemMap).includes(itemHrid)) {
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

        static getActionHrid(): string {
            const actionNameDiv = document.querySelector('[class^="SkillActionDetail_name"]') as HTMLDivElement;
            const actionName = actionNameDiv ? actionNameDiv.textContent : '';
            return MWI_Toolkit_I18n.getHridByName(actionName, 'actionNames', MWI_Toolkit.getGameLanguage());
        }

        static getActionDetail(): ActionDetail | null {
            const actionHrid = MWI_Toolkit_ActionDetailPlus.getActionHrid();
            return MWI_Toolkit.initClientData?.actionDetailMap?.[`${actionHrid}`];
        }

        static getActionType(): string | null {
            const actionDetail = MWI_Toolkit_ActionDetailPlus.getActionDetail();
            const actionType = actionDetail?.type?.split('/').pop() || '';
            // 仅支持八种常规类型
            if (['milking', 'foraging', 'woodcutting', 'cheesesmithing', 'crafting', 'tailoring', 'cooking', 'brewing'].includes(actionType)) {
                return actionType;
            }
            return null;
        }

        static getActionTypeDrinkSlots(): Array<string> {
            const actionType = MWI_Toolkit_ActionDetailPlus.getActionType();
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
        static getSortIndexByHrid(hrid: string): number {
            if (hrid.includes('/items/')) {
                return (MWI_Toolkit.initClientData?.itemDetailMap?.[hrid]?.sortIndex || 9999);
            }
            if (hrid.includes('/house_rooms/')) {
                return (MWI_Toolkit.initClientData?.houseRoomDetailMap?.[hrid]?.sortIndex || 0) - 9999;
            }
            return 9999;
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
         * @param lang 目标语言
         * @returns 本地化后的物品名称，如果找不到则返回原始HRID
         */
        static getItemName(itemHrid: string, lang: I18nLanguage): string {
            return MWI_Toolkit_I18n.getName(itemHrid, "itemNames", lang);
        }

        /**
         * 获取资源的本地化名称（通用方法）
         * @param hrid 资源的唯一标识符
         * @param category 资源分类（houseRoomNames, actionNames, itemNames）
         * @param lang 目标语言
         * @returns 本地化后的名称，如果找不到则返回原始HRID
         */
        static getName(hrid: string, category: I18nCategory, lang: I18nLanguage): string {
            if (!hrid || !category || !lang) { return hrid; }
            return MWI_Toolkit.gameObject?.props?.i18n?.options?.resources?.[lang]?.translation?.[category]?.[hrid] || hrid;
        }

        /**
         * 根据物品名称反查HRID
         * @param itemName 物品的本地化名称
         * @param lang 名称所属的语言
         * @returns 对应的物品HRID，如果找不到则返回null
         */
        static getItemHridByName(itemName: string, lang: I18nLanguage): string | null {
            return MWI_Toolkit_I18n.getHridByName(itemName, "itemNames", lang);
        }

        /**
         * 根据名称反查HRID（通用方法）
         * @param name 资源的本地化名称
         * @param category 资源分类（houseRoomNames, actionNames, itemNames）
         * @param lang 名称所属的语言
         * @returns 对应的HRID，如果找不到则返回null
         */
        static getHridByName(name: string, category: I18nCategory, lang: I18nLanguage): string | null {
            if (!name || !category || !lang) { return null; }
            return Object.entries(MWI_Toolkit.gameObject?.props?.i18n?.options?.resources?.[lang]?.translation?.[category] || {})
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
            MWI_Toolkit.waitForElement(() => {
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
            } catch (e) {
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
        static waitForElement(callback: () => void): void {
            const selector = '[class^="GamePage"]';
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