/**
 * 敌人(熊孩子).
 */

import { EGameState, GameDataCenter } from "../../Common/GameDataCenter";
import { Random } from "../../Common/Random";
import Prop from "./Prop";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Enemy extends cc.Component {

    // LIFE-CYCLE CALLBACKS:
    @property({ type: cc.RigidBody, tooltip: "AI刚体" })
    body: cc.RigidBody = null;
    @property({ type: cc.Prefab, tooltip: "香蕉预制体"})
    prop_3: cc.Prefab = null;
    @property({ type: sp.Skeleton, tooltip: "spine"})
    spine: sp.Skeleton = null;
    @property({ type: sp.Skeleton, tooltip: "吃道具的蓝圈动画"})
    circleSpine: sp.Skeleton = null;


    public moveSpeed = 300;
    public baseSpeed = 300;
    //随机的移动方向
    public velocity = cc.v2(0, 0);
    //是否已经进入加速
    public isRush = false;
    //加速的持续时间
    public keepRushTime = 5;
    //加速比例
    private rushRitio = 2;

    //第一次开始位置随机
    private firstMove = false;

    //是否被抓
    private isCatch = false;

    //是否正在朝着一个道具前进
    private isMoveToProp = false;

    //游戏页，道具父节点
    private map = null;

    //怒气值增长标识
    private flag = 0;

    //传送门冷却
    private isPortal = false;
    //进入传送门
    private isInPortal = false;

    //进入传送门前的方向
    private lastDis = cc.v2(0, 0);

    //AI前20秒的保护机制
    private _protectCount = null;

    private set protectCount(v) {
        this._protectCount = v;
        // cc.warn("this._protectCount:", this._protectCount);
    }

    private get protectCount(){
        return this._protectCount;
    }
    //总的保护机制次数
    private protectTotleCount = 2;
    //叛逆值增长比例
    private fleeAddRatio = 1;

    onLoad () {
        cc.systemEvent.on(GameDataCenter.EEventName.UPDATE_GAME_STATE, this.onGameStartEvent, this);
        cc.systemEvent.on(GameDataCenter.EEventName.ENEMY_MOVE_FASTER, this.onMoveFasterEvent, this);

        this.protectTotleCount = Random.randomNumber(1, 8);
        // console.log("总的保护次数 this.protectTotleCount：", this.protectTotleCount);
    }

    start() {
        this.body.syncPosition(false);
        // this.playStay();
    }

    update(dt) {
        this.onCheckMove(dt);
        this.flag++;
        if (this.flag == 60 && GameDataCenter.flee < 100) {
            this.addFlee(2);
            this.flag = 0;
        }
    }

    /** 开始碰撞. */
    onBeginContact(contact: cc.PhysicsContact, self: cc.PhysicsCollider, other: cc.PhysicsCollider) {
        // if (other.tag == 5) {  //AI不与香蕉皮碰撞
        //     contact.disabled = true;
        // }

        if (other.node.group == "player" && self.tag == 1) {
            this.onSensorCollider(self, other);
        }

        if (self.tag == 0) {
            switch (other.node.group) {
                case "player":
                    this.onColliderPlayer(self, other);
                    break;
                case "prop":
                    this.onColliderProp(contact, self, other);
                    break;
                case "obstacle":
                    if(this.isMoveToProp){return;}
                    this.onColliderObstacle();
                    break;
            }
        }
    }

    randomPos(updateTime) {
        let time = updateTime;
        this.countPos();
        this.schedule(this.countPos, time);
    }

    countPos() {
        if (this.isCatch) { return; }
        if (this.isMoveToProp == true) { return; }
        let dis = GameDataCenter.playerNode.getPosition().sub(this.node.getPosition()).mag();
        //进入玩家抓捕范围内，才随机位置。 距离玩家远则不修改位置
        if (this.firstMove && dis > 400) {
            return;
        }

        this.firstMove = true;
        // console.log("AI随机位置修改成功");
        this.velocity = cc.v2(Math.random(), Math.random()).normalize();
        //判断玩家在AI的右边
        if (this.node.x <= GameDataCenter.playerNode.x) {
            // if (dis < 400) {
            this.velocity.x = -Math.abs(this.velocity.x);
            //判断玩家在AI的上方
            if (this.node.y <= GameDataCenter.playerNode.y) {
                this.velocity.y = -Math.abs(this.velocity.y);
            } else {
                this.velocity.y = Math.abs(this.velocity.y);
            }
            // }
        } else {
            //判断玩家在AI的左边
            // if (dis < 400) {
            this.velocity.x = Math.abs(this.velocity.x);

            if (this.node.y <= GameDataCenter.playerNode.y) {
                this.velocity.y = -Math.abs(this.velocity.y);
            } else {
                this.velocity.y = Math.abs(this.velocity.y);
            }
            // }
        }

        this.body.linearVelocity = this.velocity.mul(this.moveSpeed);
    }

    /** 移动、边界判定. */
    private onCheckMove(dt: number) {
        if (this.isCatch) {
            // console.log("移动、边界判定 1111");
            return;
        }
        if (this.isInPortal) {
            // console.log("移动、边界判定 2222");
            return;
        }

        let linearVelocity = this.velocity.mul(this.moveSpeed);

        if ((linearVelocity.x > 0 && this.node.x + this.node.width / 2 > GameDataCenter.mapSize.width / 2) ||
            (linearVelocity.x < 0 && this.node.x - this.node.width / 2 < -GameDataCenter.mapSize.width / 2)) {
            //左右边界碰撞
            // linearVelocity.x = -linearVelocity.x;
            this.borderChangeDir(0);
        }
        if ((linearVelocity.y > 0 && this.node.y + this.node.height > GameDataCenter.mapSize.height / 2) ||
            (linearVelocity.y < 0 && this.node.y <= -GameDataCenter.mapSize.height / 2)) {
            //上下边界碰撞
            // linearVelocity.y = -linearVelocity.y;
            this.borderChangeDir(1);
        }

        this.body.linearVelocity = linearVelocity;
        //角色转向
        if (linearVelocity.x > 0) {
            this.spine.node.scaleX = 1;
        } else if (linearVelocity.x < 0) {
            this.spine.node.scaleX = -1;
        }
        this.node.zIndex = 1000 - this.node.y;
    }

    /**
     * 边界改变移动方向
     * @param dir 0是左右边界碰撞、1是上下边界碰撞
     */
    borderChangeDir(dir) {
        let playerPos = GameDataCenter.playerNode.getPosition();
        // console.log("playerPos:", playerPos.x, playerPos.y);
        // let dis = cc.v2(this.node.position.sub(GameDataCenter.playerNode.position)).mag();
        let dis = GameDataCenter.playerNode.getPosition().sub(this.node.getPosition()).mag();

        // console.log("dis:", dis);

        if (dis < 400) {
            if (dir) {
                this.velocity.y = -this.velocity.y;
                // this.velocity = this.velocity.mul(-1);
                if (this.node.x < GameDataCenter.playerNode.x) {
                    this.velocity.x = -Math.random()
                } else {
                    this.velocity.x = Math.random()
                }
            } else {
                this.velocity.x = -this.velocity.x;
                if (this.node.y < GameDataCenter.playerNode.y) {
                    this.velocity.y = -Math.random();
                } else {
                    this.velocity.y = Math.random();
                }
            }
        } else {
            //玩家处于AI的左边
            if (dir) { //上下碰撞
                this.velocity.y = -this.velocity.y;
                if (this.node.x < GameDataCenter.playerNode.x) {
                    this.velocity.x = -Math.random() + Math.random() * 0.8;
                } else {
                    this.velocity.x = Math.random() - Math.random() * 0.8;
                }
            } else {
                //左右碰撞
                this.velocity.x = -this.velocity.x;
                //玩家处于AI的右侧
                if (this.node.y < GameDataCenter.playerNode.y) {
                    this.velocity.y = -Math.random() + Math.random() * 0.8;
                } else {
                    this.velocity.y = Math.random() - Math.random() * 0.8;
                }
            }
        }

        this.velocity = this.velocity.normalize();
        this.isMoveToProp = false;
        this.scheduleOnce(()=>{
            this.checkProps();
        }, 1)
    }

    onSensorCollider(self, other) {
        //玩家碰撞盒tag
        if (other.tag == 0) {
            //判断加速
            this.checkAIRush();
        }
    }

    onColliderPlayer(self, other) {
        if (other.tag == 0) {
            this.velocity = cc.v2(0, 0);
            this.body.linearVelocity = cc.v2(0, 0)
            this.isCatch = true;
        }
    }

    onColliderProp(contact, self, other: cc.PhysicsCollider) {
        if (other.tag == 3) {  //AI不与香蕉皮碰撞
            contact.disabled = true;
            return;
        }

        this.isMoveToProp = false;
        // this.countPos();
        // console.log("敌人触碰道具 other.node.name:", other.node.name);
        // if (other.tag == 1 || other.tag == 2 || other.tag == 4 || other.tag == 6 || other.tag == 7) {
            // GameDataCenter.enemyEatProp[other.node.name]++;
        // }

        let data = JSON.parse(JSON.stringify(GameDataCenter.enemyEatProp));
        data[other.node.name]++;
        GameDataCenter.enemyEatProp = data;

        switch (other.tag) {
            case 1:
                //加速
                this.addFlee(-5);
                this.onPropRushState();
                other.node.destroy();
                this.playerColliderSpine();
                break;
            case 2:
                this.addFlee(5);
                this.onPropRushState();
                other.node.destroy();
                this.playerColliderSpine();
                break;
            case 6: //篮球
            case 7: //吉他
                this.onPropRushState();
                this.addFlee(-5);
                other.node.destroy();
                this.playerColliderSpine();
                break;
            case 5: //电视机传送门
                contact.disabled = true;
                this.onPortalCollider(contact, self, other);
                break;
            case 4:  //游戏手柄
                this.onPropRushState();
                this.addFlee(5);
                other.node.destroy();
                cc.systemEvent.emit(GameDataCenter.EEventName.ON_PLAYER_DEBUFF);
                // this.circleSpine.setAnimation(0, "daoju", false)
                this.playerColliderSpine();
                break;
        }

        this.countPos();
        // console.log("onColliderProp, 吃掉道具，重新计算方向");
    }
    //AI碰撞道具的动画
    playerColliderSpine(){
        this.circleSpine.node.active = true;
        this.circleSpine.setAnimation(0, "daoju", false);
    }

    //碰撞障碍物切换方向
    onColliderObstacle() {
        //判断玩家在AI的右边
        if (this.node.x <= GameDataCenter.playerNode.x) {
            // if (dis < 400) {
            this.velocity.x = -Math.abs(this.velocity.x);
            //判断玩家在AI的上方
            if (this.node.y <= GameDataCenter.playerNode.y) {
                this.velocity.y = -Math.abs(this.velocity.y);
            } else {
                this.velocity.y = Math.abs(this.velocity.y);
            }
            // }
        } else {
            //判断玩家在AI的左边
            // if (dis < 400) {
            this.velocity.x = Math.abs(this.velocity.x);

            if (this.node.y <= GameDataCenter.playerNode.y) {
                this.velocity.y = -Math.abs(this.velocity.y);
            } else {
                this.velocity.y = Math.abs(this.velocity.y);
            }
            // }
        }

        this.body.linearVelocity = this.velocity.mul(this.moveSpeed);
        //继续朝着目标道具前进
        if(this.isMoveToProp){
            this.scheduleOnce(()=>{
                // console.log("重新追道具=====");
                this.checkProps();
            }, 1)
        }
    }

    //进入玩家的抓捕范围，AI进入加速状态
    checkAIRush() {
        if (this.protectCount > this.protectTotleCount) { 
            // console.log("checkAIRush.return");
            return;
        }
        if (this.isRush) {
            if (this.protectCount < this.protectTotleCount) {
                this.velocity = this.velocity.mul(-1);
                this.protectCount++;
                // console.log("加速状态中触发保护机制，反向取反");
            }

            return;
        }

        // console.log("常规状态下触发保护机制");
        
        this.protectCount++;
        this.isRush = true;
        this.spine.setAnimation(0, "run1", true);
        //方向取反
        this.velocity = this.velocity.mul(-1);
        if(this.moveSpeed < this.baseSpeed){
            this.moveSpeed = Math.floor(this.baseSpeed * this.rushRitio);
            this.scheduleOnce(this.stopRushState, this.keepRushTime);
        }else{
            //已经处于道具的加速状态之中
            this.moveSpeed = Math.floor(this.baseSpeed * this.rushRitio);
            this.scheduleOnce(this.stopRushState, this.keepRushTime);
        }

        //判定是否可以扔香蕉
        if (GameDataCenter.prop_3_count < 3) {
            let banana = cc.instantiate(this.prop_3);
            banana.parent = this.node.parent;
            banana.setPosition(this.node.getPosition());

            GameDataCenter.prop_3_count++;
        }
    }

    //停止加速
    stopRushState() {
        this.isRush = false;
        this.moveSpeed = Math.floor(this.moveSpeed / this.rushRitio);
        this.spine.setAnimation(0, "run", true);
    }

    //道具检测、并追逐
    checkProps() {
        // console.log("checkProps", GameDataCenter.gameState, "this.isMoveToProp:", this.isMoveToProp);
        if (GameDataCenter.gameState >= EGameState.ENDED) {
            this.unschedule(this.checkProps);
        }

        if (this.isMoveToProp) {
            // console.log("000");
            return;
        }
        for (let i = 0; i < this.map.childrenCount; i++) {
            //电视机不在AI追的目标内
            if (this.map.children[i].group == "prop" && this.map.children[i].name != "prop_5" && this.map.children[i].name != "prop_3") {

                if(!cc.isValid(this.map.children[i])){
                    // console.log("1111111");
                    return;
                }

                if (this.map.children[i].getComponent(Prop) != null && !this.map.children[i].getComponent(Prop).isTarget) {
                    // console.log("追逐道具", this.map.children[i].name, "位置：", this.map.children[i].x, this.map.children[i].y);
                    
                    this.map.children[i].getComponent(Prop).isTarget = true;
                    this.isMoveToProp = true;
                    // let dir = this.node.getPosition().sub(this.map.children[i].getPosition()).normalize();
                    let dir = this.map.children[i].getPosition().sub(this.node.getPosition()).normalize();

                    // console.log("dir：", dir.x, dir.y);
                    this.velocity = dir;
                    this.body.linearVelocity = this.velocity.mul(this.moveSpeed);
                }
            }
        }
    }

    //道具加速
    onPropRushState() {
        this.node.group = "default";
        if (!this.isRush) {
            this.moveSpeed = Math.floor(this.baseSpeed * this.rushRitio);
            // this.body.linearVelocity = this.velocity.mul(this.moveSpeed);
            this.spine.setAnimation(0, "run1", true);
            // console.log("敌人道具加速", this.moveSpeed);
        }

        this.scheduleOnce(() => {
            this.node.group = "enemy";
            //如果处于被捕的保护加速中，则不在加速
            if (!this.isRush && this.moveSpeed > this.baseSpeed) {
                this.moveSpeed = Math.floor(this.moveSpeed / this.rushRitio);
                // this.body.linearVelocity = this.velocity.mul(this.moveSpeed);
                this.spine.setAnimation(0, "run", true);
                // console.log("AI加速消失", this.moveSpeed, "this.body.linearVelocity:", this.body.linearVelocity.x, this.body.linearVelocity.y);
            }
        }, 2)
    }

    //叛逆值增长事件
    addFlee(num){
        GameDataCenter.flee += (num * this.fleeAddRatio);
        if(GameDataCenter.flee > 100){
            GameDataCenter.flee = 100;
        }
    }

    //香蕉道具释放的判定
    checkLoadBanana(){
        let time = Random.randomNumber(2, 3);
        const func = this.loadBanana.bind(this);
        this.schedule(func, time);
        // this.unschedule(func);
    }

    //生成香蕉道具
    loadBanana(){
        //达到上限
        if (GameDataCenter.prop_3_count >= 2) {
            return;
        }

        let banana = cc.instantiate(this.prop_3);
        banana.parent = this.node.parent;
        banana.setPosition(this.node.getPosition());
        GameDataCenter.prop_3_count++;
    }

    //触碰电视机，传送
    onPortalCollider(contact, self, other) {
        if(!other.node.getComponent(Prop).videoCanUse){
            return;
        }
        if (this.isPortal) {
            return;
        }
        this.isPortal = true;
        this.isInPortal = true;
        this.spine.setAnimation(0, "tiao1", false);
        cc.systemEvent.emit(GameDataCenter.EEventName.VIDEO_BLACK, 1);
        //避免其他的逻辑问题
        this.node.group = "default";

        let index = GameDataCenter.videoNodeArr.indexOf(other.node);
        let otherIndex = 0;
        if (index == 0) {
            otherIndex = 1;
        }

        // console.log("碰撞的传送门位置标识：", index, "otherIndex:", otherIndex);
        //延迟显示跳跃动画
        this.scheduleOnce(() => {
            this.node.setPosition(GameDataCenter.videoNodeArr[otherIndex].getPosition());
            // this.node.group = "enemy";
            this.spine.setAnimation(0, "tiao2", false);
            this.spine.addAnimation(0, "run", true);
            //电视机数组清空
            // this.scheduleOnce(() => {
            //     for (let i = 0; i < 2; i++) {
            //         GameDataCenter.videoNodeArr[i].destroy();
            //     }

            //     GameDataCenter.videoNodeArr = [];
            // }, 1)
            //可在此触发传送门
            this.scheduleOnce(() => {
                this.isPortal = false;
            }, 3)

            //可以开始移动
            this.scheduleOnce(()=>{
                this.isInPortal = false;
            }, 0.33)
        }, 0.35)

        this.scheduleOnce(()=>{
            this.node.group = "enemy";
        }, 2)
    }

    playStay() {
        let index = Random.randomNumber(0, 2);
        switch (index) {
            case 0:
                this.spine.setAnimation(0, "daiji", true);
                break;
            case 1:
                this.spine.setAnimation(0, "daiji1", true);
                break;
            case 2:
                this.spine.setAnimation(0, "daiji2", true);
                break;
        }
    }
    //游戏开始，状态初始化
    onGameStartEvent() {
        if (GameDataCenter.gameState == EGameState.START) {
            this.spine.setAnimation(0, "run", true);
            let time = 3;
            this.randomPos(time);
            this.map = this.node.parent;
            this.schedule(this.checkProps, 3);
            this.checkLoadBanana();
            // this.scheduleOnce(()=>{
            //     //取消保护机制
            //     this.protectCount = 3;
            //     console.log("取消保护机制========");
            // }, 20)
        } else if (GameDataCenter.gameState >= EGameState.ENDED) {
            this.body.linearVelocity = this.velocity = cc.Vec2.ZERO;
            
        }
    }

    /**
     * 追逐道具被销毁，直接修改位置
     * @param targetNode 追逐的目标道具
     */
    onPropDestroyEvent(targetNode: cc.Node){
        if (!targetNode.getComponent("Prop").isTarget) { return; }
        if(!this.isMoveToProp){return;}
        //不再追目标道具
        this.isMoveToProp = false;
        this.countPos();
    }

    //增加移速10%，持续5秒
    onMoveFasterEvent(){
        if(this.moveSpeed <= this.baseSpeed){
            this.moveSpeed *= 1.1;

            this.scheduleOnce(()=>{
                this.moveSpeed = this.baseSpeed;
            }, 5)
        }
    }

    //降低叛逆值增长速度,持续5秒
    onReduceFleeEvent(){
        this.fleeAddRatio = 0.7;
        this.scheduleOnce(()=>{
            this.fleeAddRatio = 1;
        }, 5)
    }
}
