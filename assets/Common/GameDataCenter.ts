/**
 * 游戏数据中心.
 */

import Store from "./Store";

/** 游戏状态. */
export enum EGameState {
    /** 无. */
    NONE = 0,
    /** 游戏开始. */
    START,
    /** 游戏暂停. */
    PAUSE,
    /** 游戏恢复. */
    RESUME,
    /** 游戏结束. */
    ENDED,
    /** 游戏跳转. */
    JUMP,
}

export class GameDataCenter {

    public static EEventName = {
        /** 更新游戏状态. */
        UPDATE_GAME_STATE: "UPDATE_GAME_STATE",
        /** 更新叛逆值. */
        UPDATE_GAME_FLEE: "UPDATE_GAME_FLEE",
        /** 玩家冲刺. */
        ON_PLAYER_SPRINT: "ON_PLAYER_SPRINT",
        /** 玩家减益buff. */
        ON_PLAYER_DEBUFF: "ON_PLAYER_DEBUFF",
        /** 玩家拍飞道具. */
        ON_PLAYER_ONDESTROY_PROP: "ON_PLAYER_ONDESTROY_PROP",
        /** 更新敌人吃到的道具. */
        UPDATE_GAME_ENEMYEATPROP: "UPDATE_GAME_ENEMYEATPROP",

        /** 伙伴召唤技能，增加孩子移速 */
        ENEMY_MOVE_FASTER: "ENEMY_MOVE_FASTER",
        /** 良心发现技能，降低孩子出逃值的增长 */
        ENEMY_FLEE_SLOW_DOWN: "ENEMY_FLEE_SLOW_DOWN",

        /** 开始游戏. */
        ON_GAME_START: "ON_GAME_START",
        /** 游戏结束. */
        ON_GAME_END: "ON_GAME_END",
        /** 继续游戏. */
        ON_GAME_CONTINUE: "ON_GAME_CONTINUE",

        /**电视机不可传送 */
        VIDEO_BLACK: "VIDEO_BLACK",
    };

    /** 主相机. */
    public static mainCamera: cc.Camera = null;
    /** 地图大小. */
    public static mapSize: cc.Size = null;

    /** 玩家(家长). */
    public static playerNode: cc.Node = null;
    /** 敌人(熊孩子). */
    public static enemyNodes: cc.Node[] = [];

    /** 游戏是否胜利. */
    public static isWin: boolean = false;
    /**香蕉道具的上限 */
    public static prop_3_count = 0;
    //电视机数组节点
    public static videoNodeArr = [];
    //当前的电视机数组位置标识
    public static videoPosIndex = 0;
    //电视机变换数组
    public static videoPosArr = [
        [cc.v2(0, -270), cc.v2(700, 55)],
        [cc.v2(-400, -160), cc.v2(700, 330)],
        [cc.v2(-10, -250), cc.v2(-635, 220)],
    ]

    private static _gameLevel: number = null;
    /** 游戏关卡数. */
    public static set gameLevel(v: number) {
        GameDataCenter._gameLevel = v;
        Store.setLocalSaveData("GJGameLevel", v);
    }
    public static get gameLevel() {
        if (GameDataCenter._gameLevel === null) {
            GameDataCenter.gameLevel = Store.getLocalSaveData("GJGameLevel", 1);
        }
        return GameDataCenter._gameLevel;
    }

    private static _gameState: number = null;
    /** 游戏状态. */
    public static set gameState(v: EGameState) {
        GameDataCenter._gameState = v;
        cc.systemEvent.emit(GameDataCenter.EEventName.UPDATE_GAME_STATE, v);
    }
    public static get gameState(): EGameState {
        if (GameDataCenter._gameState === null) {
            GameDataCenter.gameState = EGameState.NONE;
        }
        return GameDataCenter._gameState;
    }
    private static _flee: number = null;
    /** 出逃值. */
    public static set flee(v: EGameState) {
        GameDataCenter._flee = v;
        cc.systemEvent.emit(GameDataCenter.EEventName.UPDATE_GAME_FLEE, v);
    }
    public static get flee(): EGameState {
        if (GameDataCenter._flee === null) {
            GameDataCenter.flee = 0;
        }
        return GameDataCenter._flee;
    }

    private static _enemyEatProp: number = null;
    /** 敌人吃到的道具. */
    public static set enemyEatProp(v: any) {
        GameDataCenter._enemyEatProp = v;
        cc.systemEvent.emit(GameDataCenter.EEventName.UPDATE_GAME_ENEMYEATPROP, v);
    }
    public static get enemyEatProp(): any {
        if (GameDataCenter._enemyEatProp === null) {
            GameDataCenter.enemyEatProp = {
                prop_1: 0,
                prop_2: 0,
                prop_3: 0,
                prop_4: 0,
                prop_5: 0,
                prop_6: 0,
                prop_7: 0,
            };
        }
        return GameDataCenter._enemyEatProp;
    }

}

(window as any).GameDataCenter = GameDataCenter;
