/**
 * 结算页.
 */

import { GameDataCenter } from "../../Common/GameDataCenter";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ResultPanel extends cc.Component {

    @property({ type: cc.Sprite, tooltip: "标题." })
    title: cc.Sprite = null;

    @property({ type: [cc.SpriteFrame], tooltip: "标题." })
    sfTitles: cc.SpriteFrame[] = [];

    @property({ type: cc.Sprite, tooltip: "内容." })
    text: cc.Sprite = null;

    @property({ type: [cc.SpriteFrame], tooltip: "内容." })
    sfTexts: cc.SpriteFrame[] = [];

    @property({ type: sp.Skeleton, tooltip: "内容." })
    skeleton: sp.Skeleton = null;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start() {
        this.title.node.parent.scale = 0;
        cc.tween(this.title.node.parent).to(0.3, { scale: 1 }).start();
        const index = GameDataCenter.isWin ? 0 : 1;
        this.title.spriteFrame = this.sfTitles[index];

        // console.log("GameDataCenter.flee:", GameDataCenter.flee, "GameDataCenter.enemyEatPro:", GameDataCenter.enemyEatProp);

        if (!GameDataCenter.isWin) { // 叛逆少年.
            this.text.spriteFrame = this.sfTexts[5];
            this.skeleton.setAnimation(0, "dark", true);
        } else if (GameDataCenter.enemyEatProp.prop_4 >= 4 && GameDataCenter.flee < 80) { // 电竞.
            this.text.spriteFrame = this.sfTexts[3];
            this.skeleton.setAnimation(0, "game", true);
        } else if (GameDataCenter.enemyEatProp.prop_7 >= 4 && GameDataCenter.flee < 80) { // 吉他.
            this.text.spriteFrame = this.sfTexts[2];
            this.skeleton.setAnimation(0, "rock", true);
        } else if (GameDataCenter.enemyEatProp.prop_6 >= 4 && GameDataCenter.flee < 80) { // 篮球.
            this.text.spriteFrame = this.sfTexts[1];
            this.skeleton.setAnimation(0, "ball", true);
        } else if (GameDataCenter.flee < 50 && GameDataCenter.enemyEatProp.prop_7 >= 2 && GameDataCenter.enemyEatProp.prop_6 >= 2) { // 学霸.
            this.skeleton.setAnimation(0, "doctor", true);
            this.text.spriteFrame = this.sfTexts[6];
        } else if (GameDataCenter.enemyEatProp.prop_1 >= 3) { // 漫画家.
            this.text.spriteFrame = this.sfTexts[4];
            this.skeleton.setAnimation(0, "cartoonist", true);
        } else { // 普通人.
            this.text.spriteFrame = this.sfTexts[0];
            this.skeleton.setAnimation(0, "work", true);
        }
    }

    // update (dt) {}

    /** 继续游戏. */
    onClickedContinue() {
        cc.systemEvent.emit(GameDataCenter.EEventName.ON_GAME_CONTINUE);
    }

}
