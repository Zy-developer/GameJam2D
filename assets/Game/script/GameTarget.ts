/**
 * 游戏目标.
 */

import { GameDataCenter } from "../../Common/GameDataCenter";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GameTarget extends cc.Component {

    @property({type: cc.Layout})
    layout: cc.Layout = null;

    @property({type: [cc.Label]})
    numLabels: cc.Label[] = [];

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        cc.systemEvent.on(GameDataCenter.EEventName.UPDATE_GAME_ENEMYEATPROP, this.updateGameEnemyEatProp, this);
        this.updateGameEnemyEatProp();
    }

    // update (dt) {}

    private updateGameEnemyEatProp() {
        const keys = ["prop_1", "prop_4", "prop_7", "prop_2", "prop_6"];
        let numLabel: cc.Label = this.numLabels[0], curValue = 0;
        for (let i = 0, label: cc.Label, value: number; i < this.numLabels.length; ++i) {
            label = this.numLabels[i];
            value = GameDataCenter.enemyEatProp[keys[i]];
            label.string = `:${value}`;
            // label.node.parent.zIndex = 100 - value;
            label.node.color = cc.Color.BLACK;
            if (value > curValue) {
                numLabel = label;
            }
        }
        // numLabel.node.color = cc.Color.RED;
        this.layout.updateLayout();
    }

}
