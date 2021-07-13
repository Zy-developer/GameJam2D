/**
 * 本地化存储.
 */

export default class Store {

    private static _localData = null;
    private static get localData(): {[key: string]: any} {
        if (Store._localData === null) {
            Store._localData = JSON.parse(cc.sys.localStorage.getItem("FLGameData"));
            if (Store._localData === null) Store._localData = {};
        }
        return Store._localData;
    }

    /**
     * 设置本地存储.
     * @param key 本地存储的键.
     * @param value 本地存储的值.
     */
    public static setLocalSaveData(key: string, value: any) {
        let data = Store.localData;
        data[key] = value;
        cc.sys.localStorage.setItem("FLGameData", JSON.stringify(data));
    }

    /**
     * 获取本地存储的值.
     * @param key 获取本地存储的键.
     * @param defaultValue 默认值.
     * @returns 
     */
    public static getLocalSaveData(key: string, defaultValue?: any): any {
        const data = Store.localData;
        if (data) {
            return data[key] || defaultValue;
        }
        return defaultValue;
    }

}

(window as any).Store = Store;
