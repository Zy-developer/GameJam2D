/**
 * 支援.
 */

import { EGameState, GameDataCenter } from "../../Common/GameDataCenter";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Support extends cc.Component {

    @property({tooltip: "移动速度.", displayName: "移动速度"})
    speed: number = 200;

    @property({type: sp.Skeleton, tooltip: "动作动画."})
    skeleton: sp.Skeleton = null;

    @property({type: cc.RigidBody, tooltip: "物理刚体."})
    rigidBody: cc.RigidBody = null;

    @property({type: cc.PhysicsBoxCollider, tooltip: "物理包围盒."})
    boxCollider: cc.PhysicsBoxCollider = null;

    // LIFE-CYCLE CALLBACKS:

    private velocity: cc.Vec2 = cc.v2(0, 0);
    private curSpeed: number = 0;
    private isMove: boolean = true;

    private trackEntry: sp.spine.TrackEntry = null;

    onLoad () {
        cc.systemEvent.on(GameDataCenter.EEventName.UPDATE_GAME_STATE, this.updateGameState, this);
    }

    start () {
        this.curSpeed = this.speed;
        this.initPosition();
    }

    update (dt) {
        this.onAutoMove();
    }

    /** 初始化坐标. */
    private initPosition() {
        this.node.setPosition(cc.v2(-1000, 550));
        const targetPos = cc.v2(GameDataCenter.mainCamera.node.x - cc.view.getVisibleSize().width / 2 + this.node.width, GameDataCenter.mainCamera.node.y);
        const duration = Math.abs(targetPos.sub(cc.v2(this.node.position)).mag()) / this.curSpeed;
        cc.tween(this.node).to(duration, { x: targetPos.x, y: targetPos.y }).call(() => {
            this.boxCollider.enabled = true;
            this.setVelocity();
            this.schedule(this.setVelocity, 3);
            this.scheduleOnce(this.onGoAway, 15);
        }).start();
        this.playSkeletonAnimation("run", true);
    }

    /** 开始碰撞. */
    onBeginContact(contact: cc.PhysicsContact, self: cc.PhysicsCollider, other: cc.PhysicsCollider) {
        switch (other.node.group) {
            case "enemy":
                this.onColliderEnemy(self, other);
                break;
            case "prop":
                this.onColliderProp(self, other);
                break;
        }
    }

    private updateGameState(state: EGameState) {
        if (state === EGameState.ENDED) {
            this.isMove = false;
            this.rigidBody.linearVelocity = this.velocity = cc.Vec2.ZERO;
            this.node.stopAllActions();
        }
    }

    /** 播放skeleton动作动画. */
    private playSkeletonAnimation(name: string, loop: boolean = false) {
        if (this.trackEntry && this.trackEntry.animation.name === name) { return; }
        // chuan 喘气
        // daiji 待机
        // huadao 滑倒
        // pai1 左手拍(拾取道具时)
        // pai2 右手拍(拾取道具时)
        // paqi 爬起来
        // run 走
        // run1 冲刺(吃到道具/冲刺按钮)
        this.trackEntry = this.skeleton.setAnimation(0, name, loop);
        this.skeleton.timeScale = 1;
        if (name === "run") {
            this.skeleton.timeScale = 3;
        }
    }

    /** 碰撞敌人. */
    private onColliderEnemy(self: cc.PhysicsCollider, other: cc.PhysicsCollider) {
        if (other.tag > 0) { return; }
        this.isMove = false;
        GameDataCenter.isWin = true;
        this.rigidBody.linearVelocity = this.velocity = cc.Vec2.ZERO;
        this.node.stopAllActions();
        GameDataCenter.gameState = EGameState.ENDED;
        this.playSkeletonAnimation("daiji", true);
    }

    /** 碰撞道具. */
    private onColliderProp(self: cc.PhysicsCollider, other: cc.PhysicsCollider) {
        
    }

    /** 设置速度. */
    private setVelocity() {
        for (let i = 0, node: cc.Node; i < this.node.parent.childrenCount; ++i) {
            node = this.node.parent.children[i];
            if (node.group === "enemy") {
                this.velocity = cc.v2(node.position.sub(this.node.position).normalize());
                break;
            }
        }
    }

    /** 移动. */
    private onAutoMove() {
        if (!this.isMove) { return; }
        this.rigidBody.linearVelocity = this.velocity.mul(this.curSpeed);
        if (this.velocity.x > 0) {
            this.skeleton.node.scaleX = 1;
        } else if (this.velocity.x < 0) {
            this.skeleton.node.scaleX = -1;
        }
    }

    /** 支援离场. */
    private onGoAway() {
        this.unschedule(this.setVelocity);
        this.isMove = false;
        this.rigidBody.linearVelocity = this.velocity = cc.Vec2.ZERO;
        const targetPos = cc.v2(1000, -550);
        const duration = Math.abs(targetPos.sub(cc.v2(this.node.position)).mag()) / this.curSpeed;
        cc.tween(this.node).to(duration, { x: targetPos.x, y: targetPos.y }).call(() => {
            this.node.destroy();
        }).start();
    }

}
