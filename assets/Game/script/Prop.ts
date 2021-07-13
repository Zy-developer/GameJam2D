/**
 * 道具.
 */

import { GameDataCenter } from "../../Common/GameDataCenter";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Prop extends cc.Component {

    // LIFE-CYCLE CALLBACKS:
    // @property({ type: })

    public isTarget = false;
    
    //电视机是否可传送
    public videoCanUse = true;

    onLoad () {
        cc.systemEvent.on(GameDataCenter.EEventName.VIDEO_BLACK, this.onBlackEvent, this);
    }

    start () {
        this.node.zIndex = 1000 - this.node.y;
    }

    // update (dt) {}

    /**
     * 判定电视机是使用后关闭，还是直接关闭
     * @param index 1是AI使用后关闭， 0是玩家关闭
     */
    onBlackEvent(index) {
        if (this.node.name == "prop_5") {
            this.videoCanUse = false;
            this.node.getChildByName("light").active = false;
            this.node.getChildByName("spine").active = true;
            this.node.getChildByName("spine").getComponent(sp.Skeleton).setAnimation(0, "tv", false);
            this.scheduleOnce(()=>{
                this.node.getChildByName("spine").active = false;
            }, 0.33)
            //5秒后恢复传送
            this.scheduleOnce(() => {
                this.videoCanUse = true;
                this.node.getChildByName("light").active = true;
            }, 5)
        }
    }

    // onLightEvent() {
    //     if (this.node.name == "prop_5") {
    //         this.videoCanUse = false;
    //         this.node.getChildByName("light").active = true;
    //     }
    // }
}
