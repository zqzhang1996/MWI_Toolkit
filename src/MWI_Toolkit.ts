// ==UserScript==
// @name         MWI_Toolkit
// @namespace    http://tampermonkey.net/
// @version      4.4.0
// @description  提供全局i18n数据和数据抓取能力，供其他脚本调用
// @author       zqzhang1996
// @match        https://www.milkywayidle.com/*
// @match        https://test.milkywayidle.com/*
// @grant        none
// @run-at       document-body
// @license      MIT
// ==/UserScript==

// 类型定义
interface CharacterItem {
    itemHrid: string;
    enhancementLevel: number;
    count: number;
}

interface I18nOptions {
    resources: {
        [lang: string]: {
            translation: {
                [fieldName: string]: {
                    [hrid: string]: string;
                };
            };
        };
    };
}

interface GameObjectProps {
    i18n: {
        options: I18nOptions;
    };
}

interface GameObject {
    props: GameObjectProps;
}

interface InitCharacterData {
    type: string;
    characterItems: CharacterItem[];
}

interface MessageWithEndItems {
    endCharacterItems: CharacterItem[];
}

(function (): void {
    'use strict';

    class MWI_Toolkit_I18n {
        getItemName(itemHrid: string, lang: string): string {
            return this.getName(itemHrid, "itemNames", lang);
        }

        getName(hrid: string, fieldName: string, lang: string): string {
            if (!hrid || !fieldName || !lang) { return hrid; }
            return (MWI_Toolkit as any)?.Instance?.gameObject?.props?.i18n?.options?.resources?.[lang]?.translation?.[fieldName]?.[hrid] || hrid;
        }

        getItemHridByName(itemName: string, lang: string): string | null {
            return this.getHridByName(itemName, "itemNames", lang);
        }

        getHridByName(name: string, fieldName: string, lang: string): string | null {
            if (!name || !fieldName || !lang) { return null; }
            return Object.entries((MWI_Toolkit as any)?.Instance?.gameObject?.props?.i18n?.options?.resources?.[lang]?.translation?.[fieldName] || {})
                .find(([, v]) => ((v as string) || '').toLowerCase() === name.toLowerCase().trim())?.[0] ?? null;
        }
    }

    class MWI_Toolkit_ItemsMap {
        private map: Map<string, Map<number, number>>;
        private itemsUpdatedCallbacks: ((items: CharacterItem[]) => void)[];

        constructor() {
            // 使用itemHrid作为key，value为enhancementLevel->count的map
            this.map = new Map();
            this.itemsUpdatedCallbacks = [];
        }

        // 查询物品数量，enhancementLevel默认为0
        getCount(itemHrid: string, enhancementLevel: number = 0): number {
            return this.map.get(itemHrid)?.get(enhancementLevel) ?? 0;
        }

        // 查询物品的最大enhancementLevel等级，忽略count为0的项，找不到时返回-1
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

        update(endCharacterItems: CharacterItem[]): void {
            if (!endCharacterItems) { return; }
            for (const item of endCharacterItems) {
                if (!this.map.has(item.itemHrid)) { 
                    this.map.set(item.itemHrid, new Map()); 
                }
                this.map.get(item.itemHrid)!.set(item.enhancementLevel, item.count);
            }
        }

        clear(): void {
            this.map.clear();
        }

        // 注册物品更新回调函数
        onItemsUpdated(callback: (items: CharacterItem[]) => void): void {
            if (typeof callback === 'function') {
                this.itemsUpdatedCallbacks.push(callback);
            }
        }

        // 移除物品更新回调函数
        offItemsUpdated(callback: (items: CharacterItem[]) => void): void {
            const index = this.itemsUpdatedCallbacks.indexOf(callback);
            if (index > -1) {
                this.itemsUpdatedCallbacks.splice(index, 1);
            }
        }

        // 触发物品变更事件（兼容外部调用）
        triggerItemUpdatedEvent(endCharacterItems: CharacterItem[]): void {
            this.itemsUpdatedCallbacks.forEach(cb => {
                try { 
                    cb(endCharacterItems); 
                } catch (e) { 
                    console.error('Error in item updated callback:', e); 
                }
            });
        }
    }

    class MWI_Toolkit {
        static Instance: MWI_Toolkit;
        
        gameObject: GameObject | null = null;
        i18n: MWI_Toolkit_I18n = new MWI_Toolkit_I18n();
        itemsMap: MWI_Toolkit_ItemsMap = new MWI_Toolkit_ItemsMap();
        switchCharacterCallbacks: (() => void)[] = [];
        initialized: boolean = false;
        init_character_data?: InitCharacterData;
        init_client_data?: any;

        constructor() {
            if (MWI_Toolkit.Instance) { return MWI_Toolkit.Instance; }
            MWI_Toolkit.Instance = this;
        }

        initialize(): void {
            const gamePageElement = document.querySelector('[class^="GamePage"]') as HTMLElement;
            this.gameObject = this.getReactInstance(gamePageElement);
            this.initialized = true;
        }

        private getReactInstance(element: HTMLElement): GameObject | null {
            if (!element) return null;
            
            const reactKey = Object.keys(element).find(k => k.startsWith('__reactFiber$'));
            if (!reactKey) return null;
            
            const fiber = (element as any)[reactKey];
            return fiber?.return?.stateNode || null;
        }

        start(): void {
            this.waitForElement(() => {
                this.initialize();
            });
        }

        // 等待DOM元素出现
        private waitForElement(callback: () => void): void {
            const selector = '[class^="GamePage"]';
            const el = document.querySelector(selector);
            if (el) {
                callback();
                return;
            }
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

    if ((window as any).MWI_Toolkit) { return; }
    // 创建并启动应用程序实例
    (window as any).MWI_Toolkit = new MWI_Toolkit();
    (window as any).MWI_Toolkit.start();

    // WebSocket 消息拦截
    const oriGet = Object.getOwnPropertyDescriptor(MessageEvent.prototype, "data")?.get;
    if (oriGet) {
        Object.defineProperty(MessageEvent.prototype, "data", {
            get: function (this: MessageEvent): any {
                const socket = this.currentTarget as WebSocket;
                if (!(socket instanceof WebSocket) ||
                    (socket.url.indexOf("api.milkywayidle.com/ws") === -1 && socket.url.indexOf("api-test.milkywayidle.com/ws") === -1)) {
                    return oriGet.call(this);
                }
                const message = oriGet.call(this);
                Object.defineProperty(this, "data", { value: message }); // Anti-loop
                try {
                    const obj = JSON.parse(message);
                    if (obj && obj.type === "init_character_data") {
                        console.log("[MWI_Toolkit] 捕获到 init_character_data 消息，更新角色数据和物品数据");
                        (window as any).MWI_Toolkit.init_character_data = obj as InitCharacterData;
                        const compressedData = localStorage.getItem("initClientData");
                        if (compressedData) {
                            const decompressedData = (window as any).LZString.decompressFromUTF16(compressedData);
                            (window as any).MWI_Toolkit.init_client_data = JSON.parse(decompressedData);
                        }
                        // 清空并初始化物品map
                        (window as any).MWI_Toolkit.itemsMap.clear();
                        (window as any).MWI_Toolkit.itemsMap.update(obj.characterItems);
                        (window as any).MWI_Toolkit.switchCharacterCallbacks.forEach((callback: () => void) => {
                            try {
                                callback();
                            } catch (error) {
                                console.error('Error in switchCharacterCallbacks:', error);
                            }
                        });
                    }
                    else if (obj && obj.endCharacterItems) {
                        // 更新物品map
                        (window as any).MWI_Toolkit.itemsMap.update((obj as MessageWithEndItems).endCharacterItems);
                        // 直接使用endCharacterItems触发物品变更事件
                        (window as any).MWI_Toolkit.itemsMap.triggerItemUpdatedEvent((obj as MessageWithEndItems).endCharacterItems);
                    }
                } catch (e) { 
                    // 忽略解析错误
                }
                return message;
            }
        });
    }
})();