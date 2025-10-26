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

// 声明 LZString 类型
declare const LZString: {
    decompressFromUTF16(compressed: string): string;
};

//#region 类型定义

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
    }
}

//#region ActionDetail

/**
 * 动作类型定义
 */
type ActionType =
    '/action_types/milking' |
    '/action_types/foraging' |
    '/action_types/woodcutting' |
    '/action_types/cheesesmithing' |
    '/action_types/crafting' |
    '/action_types/tailoring' |
    '/action_types/cooking' |
    '/action_types/brewing' |
    '/action_types/alchemy' |
    '/action_types/enhancing' |
    '/action_types/combat';

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

//#endregion

//#region InitClientData

interface InitClientData {
    /** 物品详细信息映射 */
    itemDetailMap: {
        [itemHrid: string]: ItemDetail;
    };
    houseRoomDetailMap: {
        [houseRoomHrid: string]: HouseRoomDetail;
    }
}

interface ItemDetail {
    sortIndex: number;
}

interface HouseRoomDetail {
    skillHrid: string;
    sortIndex: number;
}

//#endregion

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
 * 角色初始化数据（从WebSocket接收）
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

// --------------------------------------------- 接口前置声明，用于解决循环依赖 ---------------------------------------------
/**
 * MWI工具包主接口
 */
interface IMWI_Toolkit {
    /** 游戏对象实例（从React组件获取） */
    gameObject: GameObject | null;
    /** 国际化工具实例 */
    i18n: IMWI_Toolkit_I18n;
    /** 物品映射管理实例 */
    itemsMap: IMWI_Toolkit_ItemsMap;
    /** 切换角色时的回调函数列表 */
    switchCharacterCallbacks: (() => void)[];
    /** 是否已初始化 */
    initialized: boolean;
}

/**
 * 国际化工具接口
 * 提供多语言名称查询和反向查询功能
 */
interface IMWI_Toolkit_I18n {
    /** 根据物品HRID获取指定语言的物品名称 */
    getItemName(itemHrid: string, lang: I18nLanguage): string;
    /** 根据HRID和资源分类获取指定语言的名称 */
    getName(hrid: string, category: I18nCategory, lang: I18nLanguage): string;
    /** 根据物品名称获取对应的HRID */
    getItemHridByName(itemName: string, lang: I18nLanguage): string | null;
    /** 根据名称和资源分类获取对应的HRID */
    getHridByName(name: string, category: I18nCategory, lang: I18nLanguage): string | null;
}

/**
 * 物品映射管理接口
 * 管理角色物品数据，提供查询和事件监听功能
 */
interface IMWI_Toolkit_ItemsMap {
    /** 查询指定物品和强化等级的数量 */
    getCount(itemHrid: string, enhancementLevel?: number): number;
    /** 查询指定物品的最大强化等级 */
    getMaxEnhancementLevel(itemHrid: string): number;
    /** 更新物品数据 */
    update(endCharacterItems: CharacterItem[]): void;
    /** 清空所有物品数据 */
    clear(): void;
    /** 注册物品更新回调函数 */
    onItemsUpdated(callback: (items: CharacterItem[]) => void): void;
    /** 移除物品更新回调函数 */
    offItemsUpdated(callback: (items: CharacterItem[]) => void): void;
    /** 触发物品更新事件 */
    triggerItemsUpdatedEvent(endCharacterItems: CharacterItem[]): void;
}

//#endregion

/**
 * MWI工具包主类的前置声明
 */
declare class MWI_Toolkit implements IMWI_Toolkit {
    /** 单例实例 */
    static Instance: MWI_Toolkit;
    initClientData: InitClientData | null;
    gameObject: GameObject | null;
    i18n: IMWI_Toolkit_I18n;
    itemsMap: IMWI_Toolkit_ItemsMap;
    switchCharacterCallbacks: (() => void)[];
    initialized: boolean;
}


(function (): void {
    'use strict';

    class MWI_Toolkit_Utils {
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

        // 获取物品排序索引
        static getSortIndexByHrid(hrid: string): number {
            if (hrid.includes('/items/')) {
                return (MWI_Toolkit.Instance?.initClientData?.itemDetailMap?.[hrid]?.sortIndex || 9999);
            }
            if (hrid.includes('/house_rooms/')) {
                return (MWI_Toolkit.Instance?.initClientData?.houseRoomDetailMap?.[hrid]?.sortIndex || 0) - 9999;
            }
            return 9999;
        }

        static getIconHrefByItemHrid(itemHrid: string): string {
            return '/static/media/items_sprite.d4d08849.svg#' + itemHrid.split('/').pop();
        }

        static getIconHrefBySkillHrid(skillHrid: string): string {
            return '/static/media/skills_sprite.3bb4d936.svg#' + skillHrid.split('/').pop();
        }

        static getIconHrefByHouseRoomHrid(houseRoomHrid: string): string {
            return MWI_Toolkit_Utils.getIconHrefBySkillHrid(MWI_Toolkit.Instance?.initClientData?.houseRoomDetailMap?.[houseRoomHrid]?.skillHrid || houseRoomHrid);
        }

        static getIconHrefByMiscHrid(hrid: string): string {
            return '/static/media/misc_sprite.6fa5e97c.svg#' + hrid.split('/').pop();
        }

        static getItemDisplayName(itemHrid: string): string {
            return MWI_Toolkit.Instance?.i18n?.getItemName(itemHrid, MWI_Toolkit.Instance?.gameObject?.language || 'zh');
        }

        static getHouseRoomDisplayName(houseRoomHrid: string): string {
            return MWI_Toolkit.Instance?.i18n?.getName(houseRoomHrid, "houseRoomNames", MWI_Toolkit.Instance?.gameObject?.language || 'zh');
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

    /**
     * 国际化工具类实现
     * 提供游戏内物品和其他资源的多语言名称查询功能
     */
    class MWI_Toolkit_I18n implements IMWI_Toolkit_I18n {
        /**
         * 获取物品的本地化名称
         * @param itemHrid 物品的唯一标识符
         * @param lang 目标语言
         * @returns 本地化后的物品名称，如果找不到则返回原始HRID
         */
        getItemName(itemHrid: string, lang: I18nLanguage): string {
            return this.getName(itemHrid, "itemNames", lang);
        }

        /**
         * 获取资源的本地化名称（通用方法）
         * @param hrid 资源的唯一标识符
         * @param category 资源分类（houseRoomNames, actionNames, itemNames）
         * @param lang 目标语言
         * @returns 本地化后的名称，如果找不到则返回原始HRID
         */
        getName(hrid: string, category: I18nCategory, lang: I18nLanguage): string {
            if (!hrid || !category || !lang) { return hrid; }
            return MWI_Toolkit.Instance?.gameObject?.props?.i18n?.options?.resources?.[lang]?.translation?.[category]?.[hrid] || hrid;
        }

        /**
         * 根据物品名称反查HRID
         * @param itemName 物品的本地化名称
         * @param lang 名称所属的语言
         * @returns 对应的物品HRID，如果找不到则返回null
         */
        getItemHridByName(itemName: string, lang: I18nLanguage): string | null {
            return this.getHridByName(itemName, "itemNames", lang);
        }

        /**
         * 根据名称反查HRID（通用方法）
         * @param name 资源的本地化名称
         * @param category 资源分类（houseRoomNames, actionNames, itemNames）
         * @param lang 名称所属的语言
         * @returns 对应的HRID，如果找不到则返回null
         */
        getHridByName(name: string, category: I18nCategory, lang: I18nLanguage): string | null {
            if (!name || !category || !lang) { return null; }
            return Object.entries(MWI_Toolkit.Instance?.gameObject?.props?.i18n?.options?.resources?.[lang]?.translation?.[category] || {})
                .find(([, v]) => ((v as string) || '').toLowerCase() === name.toLowerCase().trim())?.[0] ?? null;
        }
    }

    /**
     * 物品映射管理类实现
     * 使用二级Map结构存储物品数据：itemHrid -> enhancementLevel -> count
     * 提供物品查询和事件监听功能
     */
    class MWI_Toolkit_ItemsMap implements IMWI_Toolkit_ItemsMap {
        /** 物品数据映射表：itemHrid -> (enhancementLevel -> count) */
        private map: Map<string, Map<number, number>>;
        /** 物品更新事件的回调函数列表 */
        private itemsUpdatedCallbacks: ((items: CharacterItem[]) => void)[];

        constructor() {
            this.map = new Map();
            this.itemsUpdatedCallbacks = [];
        }

        /**
         * 查询指定物品和强化等级的数量
         * @param itemHrid 物品的唯一标识符
         * @param enhancementLevel 强化等级，默认为0
         * @returns 物品数量，如果不存在则返回0
         */
        getCount(itemHrid: string, enhancementLevel: number = 0): number {
            return this.map.get(itemHrid)?.get(enhancementLevel) ?? 0;
        }

        /**
         * 查询指定物品的最大强化等级
         * @param itemHrid 物品的唯一标识符
         * @returns 最大强化等级，如果物品不存在或所有数量为0则返回-1
         */
        getMaxEnhancementLevel(itemHrid: string): number {
            const m = this.map.get(itemHrid);
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
        update(endCharacterItems: CharacterItem[]): void {
            if (!endCharacterItems) { return; }
            for (const item of endCharacterItems) {
                if (!this.map.has(item.itemHrid)) {
                    this.map.set(item.itemHrid, new Map());
                }
                this.map.get(item.itemHrid)!.set(item.enhancementLevel, item.count);
            }
        }

        /**
         * 清空所有物品数据
         */
        clear(): void {
            this.map.clear();
        }

        /**
         * 注册物品更新回调函数
         * @param callback 当物品数据更新时调用的回调函数
         */
        onItemsUpdated(callback: (items: CharacterItem[]) => void): void {
            if (typeof callback === 'function') {
                this.itemsUpdatedCallbacks.push(callback);
            }
        }

        /**
         * 移除物品更新回调函数
         * @param callback 要移除的回调函数
         */
        offItemsUpdated(callback: (items: CharacterItem[]) => void): void {
            const index = this.itemsUpdatedCallbacks.indexOf(callback);
            if (index > -1) {
                this.itemsUpdatedCallbacks.splice(index, 1);
            }
        }

        /**
         * 触发物品更新事件
         * 执行所有已注册的回调函数
         * @param endCharacterItems 更新的物品数据
         */
        triggerItemsUpdatedEvent(endCharacterItems: CharacterItem[]): void {
            this.itemsUpdatedCallbacks.forEach(cb => {
                try {
                    cb(endCharacterItems);
                } catch (e) {
                    console.error('Error in item updated callback:', e);
                }
            });
        }
    }

    /**
     * MWI工具包主类
     * 提供游戏数据抓取、国际化、物品管理等核心功能
     * 使用单例模式确保全局只有一个实例
     */
    class MWI_Toolkit implements IMWI_Toolkit {
        /** 单例实例 */
        static Instance: MWI_Toolkit;

        /** 初始化客户端数据（从localStorage获取） */
        initClientData: InitClientData | null = null;
        /** 游戏对象实例（从React组件获取） */
        gameObject: GameObject | null = null;
        /** 国际化工具实例 */
        i18n: IMWI_Toolkit_I18n = new MWI_Toolkit_I18n();
        /** 物品映射管理实例 */
        itemsMap: IMWI_Toolkit_ItemsMap = new MWI_Toolkit_ItemsMap();
        /** 切换角色时的回调函数列表 */
        switchCharacterCallbacks: (() => void)[] = [];
        /** 是否已初始化 */
        initialized: boolean = false;

        constructor() {
            // 实现单例模式
            if (MWI_Toolkit.Instance) { return MWI_Toolkit.Instance; }
            MWI_Toolkit.Instance = this;
            this.setupWebSocketInterceptor();
        }

        /**
         * 设置 WebSocket 消息拦截器
         * 通过劫持 MessageEvent.prototype.data 来拦截所有 WebSocket 消息
         */
        private setupWebSocketInterceptor(): void {
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

                    MWI_Toolkit.Instance?.handleWebSocketMessage(message);

                    return message;
                }
            });
        }

        /**
         * 处理 WebSocket 消息
         * 解析消息并根据类型进行相应处理
         * @param message WebSocket 消息内容（JSON字符串）
         */
        private handleWebSocketMessage(message: string): void {
            try {
                const obj: unknown = JSON.parse(message);
                // 类型守卫：检查是否为对象
                if (!obj || typeof obj !== 'object') return;

                const msgObj = obj as Record<string, unknown>;

                // 处理角色初始化消息（使用双重断言）
                if (msgObj.type === "init_character_data" && Array.isArray(msgObj.characterItems)) {
                    this.handleInitCharacterData(obj as unknown as InitCharacterData);
                }
                // 处理物品变更消息（使用双重断言）
                else if (Array.isArray(msgObj.endCharacterItems)) {
                    this.handleEndCharacterItems(obj as unknown as ItemsUpdatedData);
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
        private handleInitCharacterData(data: InitCharacterData): void {
            // 清空并初始化物品映射表
            this.itemsMap.clear();
            this.itemsMap.update(data.characterItems);

            // 触发所有切换角色回调函数
            this.switchCharacterCallbacks.forEach((callback: () => void) => {
                try {
                    callback();
                } catch (error) {
                    console.error('Error in switchCharacterCallbacks:', error);
                }
            });
        }

        /**
         * 处理物品变更数据
         * 当物品数量、强化等级等发生变化时会收到此消息
         * @param data 包含变更后物品数据的消息
         */
        private handleEndCharacterItems(data: ItemsUpdatedData): void {
            // 更新物品映射表
            this.itemsMap.update(data.endCharacterItems);
            // 触发物品更新事件，通知所有监听者
            this.itemsMap.triggerItemsUpdatedEvent(data.endCharacterItems);
        }

        /**
         * 初始化工具包
         * 获取游戏对象实例并设置初始化标志
         */
        initialize(): void {
            this.gameObject = this.getGameObject();
            this.initClientData = this.getInitClientData();
            if (!this.gameObject || this.initClientData) {
                console.error("[MWI_Toolkit] 初始化失败");
                return;
            }
            console.log("[MWI_Toolkit] 已初始化");
            console.log(this.gameObject, this.initClientData);
            this.initialized = true;
        }

        /**
         * 从DOM元素获取React组件实例
         * 通过访问React内部的Fiber节点来获取组件实例
         * @returns React组件实例，如果未找到则返回null
         */
        private getGameObject(): GameObject | null {
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

        private getInitClientData(): InitClientData | null {
            const compressedData = localStorage.getItem("initClientData");
            if (compressedData) {
                const decompressedData = LZString.decompressFromUTF16(compressedData);
                return JSON.parse(decompressedData) as InitClientData;
            }
            return null;
        }

        /**
         * 启动工具包
         * 等待游戏页面加载完成后进行初始化
         */
        start(): void {
            this.waitForElement(() => {
                this.initialize();
            });
        }

        /**
         * 等待指定的DOM元素出现
         * 使用 MutationObserver 监听DOM变化
         * @param callback 元素出现后执行的回调函数
         */
        private waitForElement(callback: () => void): void {
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
    }

    // 防止重复初始化
    if ((window as any).MWI_Toolkit) { return; }

    // 创建工具包实例并挂载到全局 window 对象
    (window as any).MWI_Toolkit = new MWI_Toolkit();

    // 启动工具包
    MWI_Toolkit.Instance?.start();
})();