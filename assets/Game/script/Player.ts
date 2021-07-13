/**
 * 玩家.
 */

import { Rocker } from "../../Common/Rocker";
import { EGameState, GameDataCenter } from "../../Common/GameDataCenter";
import { Random } from "../../Common/Random";
import Prop from "./Prop";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Player extends cc.Component {

    @property({ tooltip: "移动速度.", displayName: "移动速度" })
    speed: number = 200;

    @property({ type: sp.Skeleton, tooltip: "动作动画." })
    skeleton: sp.Skeleton = null;

    @property({ type: cc.RigidBody, tooltip: "物理刚体." })
    rigidBody: cc.RigidBody = null;

    @property({ type: cc.PhysicsBoxCollider, tooltip: "物理包围盒." })
    boxCollider: cc.PhysicsBoxCollider = null;

    @property({ type: cc.PhysicsCircleCollider, tooltip: "物理包围盒." })
    circleCollider: cc.PhysicsCircleCollider = null;

    @property({ type: cc.AudioClip, tooltip: "冲刺音效." })
    sndSprintClip: cc.AudioClip = null;

    @property({ type: cc.AudioClip, tooltip: "走路音效." })
    sndRunClip: cc.AudioClip = null;

    @property({ type: cc.AudioClip, tooltip: "冲刺走路音效1." })
    sndSprintClip1: cc.AudioClip = null;

    @property({ type: cc.AudioClip, tooltip: "冲刺走路音效2." })
    sndSprintClip2: cc.AudioClip = null;

    @property({ type: cc.AudioClip, tooltip: "拍道具音效." })
    sndCatch: cc.AudioClip = null;

    @property({ type: cc.Node, tooltip: "击飞道具反馈提示节点" })
    hitPropTip: cc.Node = null;

    @property({ type: cc.Sprite, tooltip: "道具图片显示节点" })
    propIcon: cc.Sprite = null;

    @property({ type: cc.Sprite, tooltip: "提示节点" })
    tipNode: cc.Sprite = null;

    @property({ type: cc.SpriteFrame, tooltip: "道具图片数组" })
    propIconArr: cc.SpriteFrame[] = [];

    @property({ type: cc.SpriteFrame, tooltip: "反馈提示图片数组" })
    tipIconArr: cc.SpriteFrame[] = [];

    // @property({ type: cc.Node, tooltip: "道具击飞星星动画"})
    // starSpineNode: cc.Node = null;

    // LIFE-CYCLE CALLBACKS:

    private velocity: cc.Vec2 = cc.v2(0, 0);
    private curSpeed: number = 0;
    private isMove: boolean = false;
    private isSprint: boolean = false;
    private isSlip: boolean = false;
    private sndRunId: number = null;
    private sprintIndex: number = 0;

    private trackEntry: sp.spine.TrackEntry = null;

    onLoad() {
        this.onAddListener();
        GameDataCenter.playerNode = this.node;
    }

    start() {
        this.curSpeed = this.speed;
        this.playSkeletonAnimation("daiji", true);
        this.schedule(this.checkSkillOne, 10);
        this.schedule(this.checkSkillTwo, 10);
    }

    update(dt) {
        this.onAutoMove(dt);
        this.onSyncMainCameraPosition();
    }

    /** 添加事件监听. */
    private async onAddListener() {
        cc.systemEvent.on(Rocker.EEventNames.ROCKER_START, this.onRockerStart, this);
        cc.systemEvent.on(Rocker.EEventNames.ROCKER_MOVED, this.onRockerMove, this);
        cc.systemEvent.on(Rocker.EEventNames.ROCKER_ENDED, this.onRockerEnd, this);

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyboardDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyboardUp, this);
        cc.systemEvent.on(GameDataCenter.EEventName.UPDATE_GAME_STATE, this.onUpdateGameState, this);
        cc.systemEvent.on(GameDataCenter.EEventName.ON_PLAYER_SPRINT, this.onPlayerSprint, this);
        cc.systemEvent.on(GameDataCenter.EEventName.ON_PLAYER_DEBUFF, this.onAddDebuff, this);
    }

    /** 开始碰撞. */
    onBeginContact(contact: cc.PhysicsContact, self: cc.PhysicsCollider, other: cc.PhysicsCollider) {
        switch (other.node.group) {
            case "enemy":
                this.onColliderEnemy(contact, self, other);
                break;
            case "prop":
                this.onColliderProp(contact, self, other);
                break;
        }
    }

    /** 摇杆开始. */
    private onRockerStart(data: { location: cc.Vec2, position: cc.Vec2, direction: cc.Vec2 }) {
        this.onMoveEvent(data.direction);
    }

    /** 摇杆移动. */
    private onRockerMove(data: { location: cc.Vec2, position: cc.Vec2, direction: cc.Vec2 }) {
        this.onMoveEvent(data.direction);
    }

    /** 摇杆结束. */
    private onRockerEnd(data: { location: cc.Vec2, position: cc.Vec2, direction: cc.Vec2 }) {
        this.rigidBody.linearVelocity = this.velocity = cc.Vec2.ZERO;
        if (this.isMove) {
            this.playSkeletonAnimation("daiji", true);
            cc.audioEngine.stop(this.sndRunId);
        }
    }

    /** 键盘按下. */
    private onKeyboardDown(event: { keyCode: cc.macro.KEY; }) {
        switch (event.keyCode) {
            case cc.macro.KEY.w:
                this.velocity.y !== 1 && this.onMoveEvent(cc.v2(0, 1));
                break;
            case cc.macro.KEY.a:
                this.velocity.x !== -1 && this.onMoveEvent(cc.v2(-1, 0));
                break;
            case cc.macro.KEY.s:
                this.velocity.y !== -1 && this.onMoveEvent(cc.v2(0, -1));
                break;
            case cc.macro.KEY.d:
                this.velocity.x !== 1 && this.onMoveEvent(cc.v2(1, 0));
                break;
            case cc.macro.KEY.j:
                this.onPlayerSprint();
                break;
        }
    }

    /** 键盘松开. */
    private onKeyboardUp(event: { keyCode: cc.macro.KEY; }) {
        switch (event.keyCode) {
            case cc.macro.KEY.w:
            case cc.macro.KEY.s:
                this.velocity.y = 0;
                break;
            case cc.macro.KEY.a:
            case cc.macro.KEY.d:
                this.velocity.x = 0;
                break;
        }
        this.rigidBody.linearVelocity = this.velocity = cc.Vec2.ZERO;
        if (this.isMove && this.velocity.equals(cc.Vec2.ZERO)) {
            this.playSkeletonAnimation("daiji", true);
            cc.audioEngine.stop(this.sndRunId);
        }
    }

    /** 更新游戏状态. */
    private onUpdateGameState(state: EGameState) {
        switch (state) {
            case EGameState.START:
                this.isMove = true;
                break;
            case EGameState.PAUSE:
                this.isMove = false;
                this.rigidBody.linearVelocity = cc.Vec2.ZERO;
                break;
            case EGameState.RESUME:
                this.isMove = true;
                break;
            case EGameState.ENDED:
                this.isMove = this.isSprint = false;
                this.rigidBody.linearVelocity = cc.Vec2.ZERO;
                this.sndRunId && cc.audioEngine.stop(this.sndRunId);
                break;
        }
    }

    /** 冲刺按钮. */
    private onPlayerSprint() {
        if (this.isSprint) { return; }
        this.isSprint = true;
        this.curSpeed = this.speed * 1.5;
        this.playSkeletonAnimation("run1", true);
        this.scheduleOnce(this.onSprintEnd, 2);
        cc.audioEngine.play(this.sndSprintClip, false, 0.5);
        this.onPlaySpintSound();
    }

    /** 移动事件. */
    private onMoveEvent(direction: cc.Vec2) {
        this.velocity = direction.normalize();
        if (this.isSprint) {
            this.playSkeletonAnimation("run1", true);
        } else if (this.isMove) {
            this.onPlaySound(this.sndRunClip);
            this.playSkeletonAnimation("run", true);
        }
    }

    /** 播放skeleton动作动画. */
    private playSkeletonAnimation(name: string, loop: boolean = false) {
        if (this.trackEntry && this.trackEntry.animation.name === name) { return; }
        if (this.isSlip && (name !== "huadao" && name !== "paqi")) { return; }
        // chuan 喘气
        // daiji 待机
        // huadao 滑倒
        // pai1 左手拍(拾取道具时)
        // pai2 右手拍(拾取道具时)
        // paqi 爬起来
        // run 走
        // run1 冲刺(吃到道具/冲刺按钮)
        // if (name === "daiji") {
        //     name = ["daiji", "daiji1", "daiji2"][Random.randomNumber(0, 2)];
        // }
        this.trackEntry = this.skeleton.setAnimation(0, name, loop);
        this.skeleton.timeScale = 1;
        if (name === "run") {
            this.skeleton.timeScale = 3;
        } else if (name === "pai1") {
            this.skeleton.timeScale = 2;
        } else if (name === "paqi") {
            this.skeleton.timeScale = 1.5;
        }
    }

    /** 冲刺结束. */
    private onSprintEnd() {
        this.unschedule(this.onSprintEnd);
        this.isSprint = false;
        this.curSpeed = this.speed;
        this.sndRunId && cc.audioEngine.stop(this.sndRunId);
        if (this.isMove && !this.velocity.equals(cc.Vec2.ZERO)) {
            this.playSkeletonAnimation("run", true);
            this.onPlaySound(this.sndRunClip);
        } else {
            this.playSkeletonAnimation("daiji", true);
        }
    }

    /** 播放冲刺音效. */
    private onPlaySpintSound() {
        this.sndRunId && cc.audioEngine.stop(this.sndRunId);
        this.sndRunId = cc.audioEngine.play(this.sprintIndex === 0 ? this.sndSprintClip1 : this.sndSprintClip2, false, 0.5);
        cc.audioEngine.setFinishCallback(this.sndRunId, () => {
            this.sndRunId = null;
            if (this.isSprint) {
                if (this.sprintIndex === 0) {
                    this.sprintIndex = 1;
                } else {
                    this.sprintIndex = 0;
                }
                this.onPlaySpintSound();
            }
        });
    }

    /** 减益. */
    private onAddDebuff() {
        this.curSpeed = this.speed * 0.5;
        this.scheduleOnce(() => {
            this.curSpeed = this.speed;
        }, 3);
    }

    /** 碰撞道具. */
    onColliderProp(contact: cc.PhysicsContact, self: cc.PhysicsCollider, other: cc.PhysicsCollider) {
        if (self.tag > 0) { return; }
        // 香蕉皮: 踩道滑倒，渐隐消失.
        // 电视机: 不做处理.
        if (other.node.name === "prop_1") { // 漫画书.
            this.onAttackFly(other);
            this.showTipDialog(0);
        } else if (other.node.name === "prop_2") { // 旱冰鞋.
            this.onAttackFly(other);
            this.showTipDialog(1);
        } else if (other.node.name === "prop_3") { // 香蕉皮.
            this.isMove = false;
            this.isSlip = true;
            GameDataCenter.prop_3_count--;
            this.rigidBody.linearVelocity = cc.Vec2.ZERO;
            this.boxCollider.enabled = false;
            this.playSkeletonAnimation("huadao", false);
            let velocity = this.velocity;
            if (velocity.equals(cc.Vec2.ZERO)) velocity = cc.v2(Math.random(), Math.random()).normalize();
            other.node.getComponent(cc.RigidBody).linearVelocity = velocity.mul(this.speed + 3000);
            other.node.group = "default";
            other.sensor = true;
            other.apply();
            this.scheduleOnce(() => {
                this.playSkeletonAnimation("paqi", false);
            }, 0.8);
            this.scheduleOnce(() => {
                this.isMove = true;
                this.isSlip = false;
                this.boxCollider.enabled = true;
                if (this.isMove && !this.velocity.equals(cc.Vec2.ZERO)) {
                    this.playSkeletonAnimation("run", true);
                    this.onPlaySound(this.sndRunClip);
                } else {
                    this.playSkeletonAnimation("daiji", true);
                }
            }, 1.6);

            this.showTipDialog(2);
        } else if (other.node.name === "prop_4") { // 游戏机.
            this.onAttackFly(other);
            this.showTipDialog(3);
        } else if (other.node.name === "prop_5") { // 电视机.
            if (other.node.getComponent(Prop).videoCanUse) {
                cc.systemEvent.emit(GameDataCenter.EEventName.VIDEO_BLACK, 0);
            }
            this.showTipDialog(4);
        } else if (other.node.name === "prop_6") { // 篮球.
            this.onAttackFly(other);
            this.showTipDialog(5);
        } else if (other.node.name === "prop_7") { // 吉他.
            this.onAttackFly(other);
            this.showTipDialog(6);
        }
    }

    /**击飞道具生成最后的星星 */
    // loadStarSpine(other){
    //     let star = cc.instantiate(this.starSpineNode);
    //     star.active = true;
    //     star.parent = other.node.parent;
    //     star.setPosition(other.node.getPosition());
    //     star.getComponent(sp.Skeleton).setAnimation(0, "fly", false);
    //     console.log("star:", star);
    // }

    /**击飞道具提示反馈 */
    showTipDialog(index){
        this.propIcon.spriteFrame = this.propIconArr[index];
        this.tipNode.spriteFrame = this.tipIconArr[index];
        if(this.hitPropTip.opacity == 0){
            this.hitPropTip.opacity = 255;
        }

        // this.scheduleOnce(() => {
        cc.tween(this.hitPropTip)
            .delay(1.5)
            .to(0.3, { opacity: 0 })
            .start()
        // }, 2)
    }

    /** 击飞. */
    private onAttackFly(other: cc.PhysicsCollider) {
        // this.loadStarSpine(other);
        this.isMove = false;
        this.rigidBody.linearVelocity = cc.Vec2.ZERO;
        this.playSkeletonAnimation("pai1", false);
        this.scheduleOnce(() => {
            cc.audioEngine.play(this.sndCatch, false, 1.0);
            this.isMove = true;
            GameDataCenter.flee -= 5;
            try {
                other.node.group = "default";
                other.sensor = true;
                other.apply();
                let velocity = this.velocity;
                if (velocity.equals(cc.Vec2.ZERO)) velocity = cc.v2(Math.random(), Math.random()).normalize();
                other.node.getComponent(cc.RigidBody).linearVelocity = velocity.mul(this.speed + 3000);
            } catch (error) {}
            if (this.isMove && !this.velocity.equals(cc.Vec2.ZERO)) {
                this.playSkeletonAnimation("run", true);
                this.onPlaySound(this.sndRunClip);
            } else {
                this.playSkeletonAnimation("daiji", true);
            }
            cc.systemEvent.emit(GameDataCenter.EEventName.ON_PLAYER_ONDESTROY_PROP, other.node);
        }, 0.25);
    }

    /** 碰撞敌人. */
    onColliderEnemy(contact: cc.PhysicsContact, self: cc.PhysicsCollider, other: cc.PhysicsCollider) {
        if (other.tag > 0 || self.tag > 0) { return contact.disabled = true; }
        if (GameDataCenter.gameState >= EGameState.ENDED) { return; }
        GameDataCenter.isWin = true;
        GameDataCenter.gameState = EGameState.ENDED;
        this.playSkeletonAnimation("daiji", true);
        this.scheduleOnce(() => { this.rigidBody.type = cc.RigidBodyType.Static; }, 0);
    }

    /** 自动移动. */
    private onAutoMove(dt: number) {
        if (!this.isMove) { return; }
        let linearVelocity = this.velocity.mul(this.curSpeed);
        if ((linearVelocity.x > 0 && this.node.x + this.node.width / 2 > GameDataCenter.mapSize.width / 2) ||
            (linearVelocity.x < 0 && this.node.x - this.node.width / 2 < -GameDataCenter.mapSize.width / 2)) {
            linearVelocity.x = 0;
        }
        if ((linearVelocity.y > 0 && this.node.y + this.node.height > GameDataCenter.mapSize.height / 2) ||
            (linearVelocity.y < 0 && this.node.y < -GameDataCenter.mapSize.height / 2)) {
            linearVelocity.y = 0;
        }
        this.rigidBody.linearVelocity = linearVelocity;
        if (linearVelocity.x > 0) {
            this.skeleton.node.scaleX = 1;
        } else if (linearVelocity.x < 0) {
            this.skeleton.node.scaleX = -1;
        }
        this.node.zIndex = 1000 - this.node.y;
    }

    /** 同步相机位置. */
    private onSyncMainCameraPosition() {
        let newPos = this.node.position, size = cc.view.getVisibleSize();
        if (newPos.x - size.width / 2 < -GameDataCenter.mapSize.width / 2) {
            newPos.x = -(GameDataCenter.mapSize.width - size.width) / 2;
        } else if (newPos.x + size.width / 2 > GameDataCenter.mapSize.width / 2) {
            newPos.x = (GameDataCenter.mapSize.width - size.width) / 2;
        }
        if (newPos.y - size.height / 2 < -GameDataCenter.mapSize.height / 2) {
            newPos.y = -(GameDataCenter.mapSize.height - size.height) / 2;
        } else if (newPos.y + size.height / 2 > GameDataCenter.mapSize.height / 2) {
            newPos.y = (GameDataCenter.mapSize.height - size.height) / 2;
        }
        GameDataCenter.mainCamera.node.position = newPos;
    }

    /** 播放音效. */
    private async onPlaySound(clip: cc.AudioClip) {
        if (GameDataCenter.gameState >= EGameState.ENDED) { return; }
        if (this.isSprint || this.isSlip || !this.isMove) { return; }
        this.sndRunId = cc.audioEngine.play(clip, false, 1.0);
        cc.audioEngine.setFinishCallback(this.sndRunId, () => {
            this.sndRunId = null;
            this.onPlaySound(clip);
        });
    }

    /**
     * 增加孩子的移速
     */
    checkSkillOne() {
        if (GameDataCenter.flee > 50) { return; }
        if (GameDataCenter.gameState >= EGameState.ENDED) {
            this.unschedule(this.checkSkillOne);
        }

        let num = Math.random();
        if (num > 0.25) {
            cc.systemEvent.emit(GameDataCenter.EEventName.ENEMY_MOVE_FASTER);
        }
    }

    /**
     * 降低孩子的出逃值
     */
    checkSkillTwo() {
        if (GameDataCenter.flee < 50) { return; }
        if (GameDataCenter.gameState >= EGameState.ENDED) {
            this.unschedule(this.checkSkillOne);
        }

        let num = Math.random();
        if (num > 0.25) {
            cc.systemEvent.emit(GameDataCenter.EEventName.ENEMY_FLEE_SLOW_DOWN);
        }
    }
}
