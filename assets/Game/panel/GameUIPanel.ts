/**
 * 游戏页.
 */

import { EGameState, GameDataCenter } from "../../Common/GameDataCenter";
import GameManager from "../../Common/GameManager";
import { Random } from "../../Common/Random";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GameUIPanel extends cc.Component {

    @property({type: cc.Node, tooltip: "游戏地图."})
    map: cc.Node = null;

    @property({type: cc.ProgressBar, tooltip: "叛逆进度条."})
    rebelBar: cc.ProgressBar = null;

    @property({type: cc.Node, tooltip: "头像."})
    avater: cc.Node = null;

    @property({type: cc.Label, tooltip: "倒计时Label."})
    countDownLabel: cc.Label = null;

    @property({type: cc.Button, tooltip: "冲刺按钮."})
    btnSprint: cc.Button = null;

    @property({type: cc.ProgressBar, tooltip: "冲刺进度条."})
    sprintBar: cc.ProgressBar = null;

    @property({type: cc.Label, tooltip: "冲刺倒计时Label."})
    sprintLabel: cc.Label = null;

    @property({type: cc.Node, tooltip: "出逃横幅背景."})
    fleeBg: cc.Node = null;

    @property({type: cc.Node, tooltip: "出逃横幅icon."})
    fleeIcon: cc.Node = null;

    @property({type: cc.Prefab, tooltip: "支援."})
    prefabSupport: cc.Prefab = null;

    @property({type: [cc.Node], tooltip: "预制集合-墙壁."})
    walls: cc.Node[] = [];

    @property({type: [cc.Prefab], tooltip: "预制集合-敌人(熊孩子)."})
    prefabEnemys: cc.Prefab[] = [];

    @property({type: [cc.Prefab], tooltip: "预制集合-障碍物."})
    prefabObstacles: cc.Prefab[] = [];

    @property({ type: [cc.Prefab], tooltip: "预制集合-道具." })
    prefabProps: cc.Prefab[] = [];

    @property({ type: cc.AudioClip, tooltip: "电视传送音效"})
    videoClip: cc.AudioClip = null;

    @property({ type: cc.AudioClip, tooltip: "电视机关音效"})
    videoOff: cc.AudioClip = null;

    @property({ type: cc.Node, tooltip: "男子出现提示"})
    doubleCatchTip: cc.Node = null;
    // LIFE-CYCLE CALLBACKS:

    // @property({ type: cc.Prefab, tooltip: "电视机预制体" })
    // videoPre: cc.Prefab = null;

    /** 游戏倒计时. */
    private countDown: number = 60;
    private updateCountDownFunc: Function = null;

    /**道具数组标识 */
    public propArr = [0, 1, 2, 3, 4];

    onLoad () {
        this.onAddListener();
        this.loadVideos();
        // this.schedule(this.reloadVideos.bind(this), 10);

        GameDataCenter.prop_3_count = 0;

        this.propArr = Random.shuffle(this.propArr);
        // console.log("重组后的道具数组:", this.propArr);

        cc.systemEvent.on(GameDataCenter.EEventName.VIDEO_BLACK, this.onPlayerVideoClip, this);
    }

    start () {
        this.setGameCountDown();
        this.map.width = GameDataCenter.mapSize.width;
        this.map.height = GameDataCenter.mapSize.height;
        this.walls[0].x = -GameDataCenter.mapSize.width / 2 - 5;
        this.walls[1].x = GameDataCenter.mapSize.width / 2 + 5;
        this.walls[2].y = GameDataCenter.mapSize.height / 2 + 5;
        this.walls[3].y = -GameDataCenter.mapSize.height / 2 - 5;

        this.scheduleOnce(this.loadSupport, Random.randomNumber(30, 40));
        this.onCreateEnemy();
        this.initGameData();
        this.schedule(this.loadProps, 3);
        this.loadProps();
    }

    // update (dt) {}

    /** 冲刺. */
    onClickedSprint() {
        cc.systemEvent.emit(GameDataCenter.EEventName.ON_PLAYER_SPRINT);
        this.btnSprint.interactable = false;
        this.sprintBar.progress = 1;
        let sprintCd = 5;
        this.sprintLabel.node.active = true;
        this.sprintLabel.string = `${sprintCd}:`;
        cc.tween(this.sprintBar).to(sprintCd, { progress: 0 }).call(() => {
            this.btnSprint.interactable = true;
        }).start();
        cc.tween(this.sprintLabel.node).delay(1).call(() => {
            --sprintCd;
            this.sprintLabel.string = `${sprintCd}:`;
            if (sprintCd === 0) {
                this.sprintLabel.node.active = false;
            }
        }).union().repeat(sprintCd).start();
    }

    /** 添加事件监听. */
    private async onAddListener() {
        cc.systemEvent.on(GameDataCenter.EEventName.UPDATE_GAME_STATE, this.onUpdateGameState, this);
        cc.systemEvent.on(GameDataCenter.EEventName.UPDATE_GAME_FLEE, this.onUpdateFlee, this);
        cc.systemEvent.on(GameDataCenter.EEventName.ON_PLAYER_DEBUFF, this.onPlayerDebuff, this);
    }

    /** 初始化游戏数据. */
    private initGameData() {
        this.countDownLabel.string = `${this.countDown}:`;
        GameDataCenter.isWin = false;
        // GameDataCenter.gameState = EGameState.NONE;
        GameDataCenter.gameState = EGameState.START;
        GameDataCenter.flee = 0;
        GameDataCenter.mainCamera.node.setPosition(cc.Vec2.ZERO);
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

    /** 出逃横幅背景. */
    private onFleeAnimation() {
        cc.tween(this.fleeBg)
        .to(0.4, { x: 0 }, { easing: cc.easing.sineIn })
        .delay(1.4)
        .to(0.6, { x: -1500 }, { easing: cc.easing.sineOut })
        .start();

        cc.tween(this.fleeIcon)
        .to(0.6, { x: -340 }, { easing: cc.easing.sineIn })
        .delay(1)
        .to(0.4, { x: -1500 }, { easing: cc.easing.sineOut })
        .call(() => {
            // GameDataCenter.gameState = EGameState.START;
        }).start();
    }

    /** 更新游戏状态. */
    private onUpdateGameState(state: EGameState) {
        switch (state) {
            case EGameState.ENDED:
                this.onGameEnd();
                break;
            case EGameState.JUMP:
                this.onGameJump();
                break;
        }
    }

    /** 更新叛逆值. */
    private onUpdateFlee(flee: number) {
        const progress = flee / 100;
        cc.tween(this.rebelBar).to(0.3, { progress: progress }).start();
        cc.tween(this.avater).to(0.3, { x: (progress * this.rebelBar.node.width) - this.rebelBar.node.width / 2 }).start();
    }

    /** 玩家减益buff */
    private onPlayerDebuff() {
        this.sprintBar.progress = 1;
        this.btnSprint.interactable = false;
        this.scheduleOnce(() => {
            this.sprintBar.progress = 0;
            this.btnSprint.interactable = true;
        }, 3);
    }

    /** 游戏结束. */
    private onGameEnd() {
        this.unschedule(this.loadProps);
        this.unschedule(this.loadSupport);
        this.unschedule(this.updateCountDownFunc);
        this.scheduleOnce(() => {
            GameDataCenter.gameState = EGameState.JUMP;
        }, 0.3);
    }

    /** 游戏跳转. */
    private onGameJump() {
        cc.systemEvent.emit(GameDataCenter.EEventName.ON_GAME_END);
    }

    /** 游戏倒计时. */
    private async setGameCountDown() {
        this.updateCountDownFunc = this.updateCountDown.bind(this);
        this.schedule(this.updateCountDownFunc, 1);
    }

    /** 更新游戏倒计时. */
    private async updateCountDown() {
        --this.countDown;
        if (this.countDown === 5) {
            this.onFleeAnimation();
        } else if (this.countDown <= 0) {
            this.unschedule(this.updateCountDownFunc);
            GameDataCenter.gameState = EGameState.ENDED;
        }
        this.countDownLabel.string = `${this.countDown}:`;
    }

    /** 游戏支援. */
    private async loadSupport() {
        const node = cc.instantiate(this.prefabSupport);
        node.parent = this.map;

        let offsetX = cc.view.getVisibleSize().width / 2 ;
        if (cc.view.getVisibleSize().width / cc.view.getVisibleSize().height >= 2) {
            offsetX -= 250;
        }
        cc.tween(this.doubleCatchTip)
            .by(0.3, { x: -offsetX })
            .delay(1)
            .by(0.4, { x: offsetX })
            .start()
    }

    /** 生成敌人. */
    private onCreateEnemy() {
        const node = cc.instantiate(this.prefabEnemys[0]);
        node.parent = this.map;
    }

    /**随机生成道具 */
    private async loadProps() {
        // let index = Random.randomNumber(0, this.prefabProps.length -3);
        //区间标识
        let num = Random.randomNumber(1, 15);
        let index = 0;
        switch (num) {
            case 1:
                index = this.propArr[0];
                break;
            case 2:
            case 3:
                index = this.propArr[1];
                break;
            case 4:
            case 5:
            case 6:
                index = this.propArr[2];
                break;
            case 7:
            case 8:
            case 9:
            case 10:
                index = this.propArr[3];
                break;
            default:
                index = this.propArr[4];
                break;
        }

        let prop = cc.instantiate(this.prefabProps[index]);
        prop.parent = this.map;
        let x = Random.randomNumber(-GameDataCenter.mapSize.width / 2 + 200, GameDataCenter.mapSize.width / 2 - 200);
        let y = Random.randomNumber(-GameDataCenter.mapSize.height / 2 + 200, GameDataCenter.mapSize.height / 2 - 200);
        let pos = cc.v2(x, y);
        prop.setPosition(pos);
        for (let i = 0; i < this.map.childrenCount; i++) {
            if (this.map.children[i].group == "obstacle") { //|| this.map.children[i].group == "prop"
                if (prop.getBoundingBox().intersects(this.map.children[i].getBoundingBox())) {
                    //位置矫正
                    let random = Math.random();

                    let offset = 0;
                    if (this.map.children[i].height > this.map.children[i].width) {
                        offset = this.map.children[i].height;
                    } else {
                        offset = this.map.children[i].width;
                    }

                    if (random >= 0.5) {
                        pos.x -= offset * 1.5;
                    } else {
                        pos.x += offset * 1.5;
                    }

                    prop.setPosition(pos);
                    // console.log("道具与障碍物产生重叠");
                }else{
                    prop.setPosition(pos);
                }
            }
        }
    }

    //生成电视机
    loadVideos(){
        GameDataCenter.videoPosIndex = Random.randomNumber(0, 2);
        GameDataCenter.videoNodeArr = [];
        for (let i = 0; i < 2; i++) {
            let video = cc.instantiate(this.prefabProps[this.prefabProps.length - 1]);
            video.parent = this.map;
            video.setPosition(GameDataCenter.videoPosArr[GameDataCenter.videoPosIndex][i]);
            GameDataCenter.videoNodeArr.push(video);
        }
    }

    // reloadVideos(){
    //     if (GameDataCenter.videoNodeArr.length != 0) { return; }
    //     this.loadVideos();
    // }

    onPlayerVideoClip(index){
        if(index){
            cc.audioEngine.play(this.videoClip, false, 1);
        }else{
            //玩家关闭
            cc.audioEngine.play(this.videoOff, false, 1);
        }
    }

}
