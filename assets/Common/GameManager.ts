/**
 * 游戏管理.
 */

import { GameDataCenter } from "./GameDataCenter";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GameManager extends cc.Component {

    @property({tooltip: "屏幕大小倍率.", displayName: "屏幕大小倍率"})
    screenRatio: number = 1.5;

    @property({tooltip: "物理调试绘制.", displayName: "开启物理调试绘制"})
    debugDrawFlags: boolean = false;

    @property({tooltip: "Loading时间.", displayName: "Loading时间"})
    duration: number = 10;

    @property({type: sp.Skeleton, tooltip: "加载."})
    loading: sp.Skeleton = null;

    @property({type: cc.Prefab, tooltip: "首页面板."})
    homePanel: cc.Prefab = null;

    @property({type: cc.Prefab, tooltip: "游戏页面板."})
    gamePanel: cc.Prefab = null;

    @property({type: cc.Prefab, tooltip: "结算页面板."})
    resultPanel: cc.Prefab = null;

    @property({type: cc.Camera, tooltip: "主相机."})
    mainCamera: cc.Camera = null;

    @property({type: cc.AudioClip, tooltip: "背景音乐."})
    bgmClip: cc.AudioClip = null;

    @property({type: [cc.Node], tooltip: "点集合."})
    pots: cc.Node[] = [];

    private _curPanel: cc.Node = null;
    private _resultPanel: cc.Node = null;

    onLoad () {
        console.log(`isBrowser: ${cc.sys.isBrowser}, isNative: ${cc.sys.isNative}, DESKTOP_BROWSER: ${cc.sys.platform === cc.sys.DESKTOP_BROWSER}`);
        if (cc.sys.isBrowser && !cc.sys.isNative && cc.sys.platform === cc.sys.DESKTOP_BROWSER) {
            cc.view.enableAutoFullScreen(false);
        }
        this.onOpenPhysicsManager();
    }

    start () {
        cc.systemEvent.on(GameDataCenter.EEventName.ON_GAME_START, this.onGameStart, this);
        cc.systemEvent.on(GameDataCenter.EEventName.ON_GAME_END, this.onGameEnd, this);
        cc.systemEvent.on(GameDataCenter.EEventName.ON_GAME_CONTINUE, this.onGameContinue, this);

        GameDataCenter.mainCamera = this.mainCamera;
        GameDataCenter.mapSize = cc.size(cc.view.getVisibleSize().width * this.screenRatio, cc.view.getVisibleSize().height * this.screenRatio);

        this.scheduleOnce(() => {
            this.loading.node.active = false;
            this.openHomePanel();
        }, this.duration);
        cc.audioEngine.play(this.bgmClip, true, 1.0);
        this.setLoadingAnimation();
    }

    // update (dt) {}

    /** 开启物理系统. */
    private async onOpenPhysicsManager() {
        const manager = cc.director.getPhysicsManager();
        manager.enabled = true;
        if (this.debugDrawFlags) manager.debugDrawFlags = 1;
        cc.PhysicsManager.POSITION_ITERATIONS = 8;
        cc.PhysicsManager.VELOCITY_ITERATIONS = 8;
    }

    /** 初始化首页. */
    private openHomePanel() {
        this._curPanel = cc.instantiate(this.homePanel);
        this._curPanel.parent = this.node;
    }

    /** 开始游戏. */
    private onGameStart() {
        this._curPanel && this._curPanel.destroy();
        this._curPanel = null;
        this._curPanel = cc.instantiate(this.gamePanel);
        this._curPanel.parent = this.node;
    }

    /** 游戏结束. */
    private onGameEnd() {
        if (this._resultPanel) { return; }
        // this._curPanel && this._curPanel.destroy();
        // this._curPanel = null;
        this._resultPanel = cc.instantiate(this.resultPanel);
        this._resultPanel.parent = this.node;
    }

    /** 继续游戏 */
    private onGameContinue() {
        this._curPanel && this._curPanel.destroy();
        this._curPanel = null;
        this._resultPanel && this._resultPanel.destroy();
        this._resultPanel = null;
        GameDataCenter.mainCamera.node.setPosition(cc.Vec2.ZERO);
        this.openHomePanel();
    }

    /** 加载中. */
    private setLoadingAnimation() {
        for (let i = 0, node: cc.Node, tween: cc.Tween; i < this.pots.length; ++i) {
            node = this.pots[i];
            tween = cc.tween(node).delay(i).call(() => {
                node.opacity = 255;
            });
            if (i === this.pots.length - 1) {
                tween.delay(1).call(() => {
                    this.pots.forEach(node => node.opacity = 1);
                }).delay(1).call(() => {
                    this.setLoadingAnimation();
                })
            }
            tween.start();
        }
    }

}
