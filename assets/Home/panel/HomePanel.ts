/**
 * 首页.
 */

import { GameDataCenter } from "../../Common/GameDataCenter";

const {ccclass, property} = cc._decorator;

@ccclass
export default class HomePanel extends cc.Component {

    @property({type: cc.Node})
    tip: cc.Node = null;

    @property({type: sp.Skeleton})
    player: sp.Skeleton = null;

    @property({type: sp.Skeleton})
    enemy: sp.Skeleton = null;

    @property({type: cc.Prefab, tooltip: "平行世界面板."})
    albumPanel: cc.Prefab = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.setAnimation();
    }

    // update (dt) {}

    /** 设置. */
    onClickedSetting() {
        this.onShowTip();
    }

    /** 平行世界. */
    onClickedAlbum() {
        const node = cc.instantiate(this.albumPanel);
        node.parent = this.node.parent;
    }

    /** 开始游戏. */
    onClickedStart() {
        cc.systemEvent.emit(GameDataCenter.EEventName.ON_GAME_START);
    }

    private onShowTip() {
        this.tip.stopAllActions();
        cc.tween(this.tip).to(0.3, { opacity: 255 }).delay(2).to(0.3, { opacity: 0 }).start();
    }

    private setAnimation() {
        this.enemy.paused = true;
        this.scheduleOnce(() => { this.enemy.paused = false; }, 0.4);
    }

}
