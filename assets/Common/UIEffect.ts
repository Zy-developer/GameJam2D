/**
 * 效果类
 */

/**
 * 效果类型
 */
export enum EUIEffectType {
    /** 禁用效果 */
    NONE = 1,
    /** 光效旋转 */
    LIGHT_ROTATE = 2,
    /** 果冻抖动 */
    JELLY = 3,
    /** 间接性摇晃 */
    ROTATE_INTERVAL = 4,
    /** 心跳 */
    BREATH = 5,
    /** 摇晃 */
    ROTATE = 6,
    /** 上下循环浮动 */
    FLOAT_REPEAT = 7,
    /** 缩放 */
    SCALE = 8,
    /**快速放大缩小 */
    BUTTON_JUMP = 9,
    /** 间接性缩放 */
    SCALE_INTERVAL = 10,
    /** 放大摇晃 */
    SCALE_ANGLE = 11,
    /** 心跳. */
    HEARTBEAT = 12,
}


const { ccclass, property, } = cc._decorator;

@ccclass
export class UIEffect extends cc.Component {

    @property({ type: cc.Enum(EUIEffectType), tooltip: '效果类型:\n- NONE: 禁用效果.\n- LIGHT_ROTATE: 光效旋转.\n- JELLY: 果冻抖动.\n- ROTATE_INTERVAL: 间接性摇晃.\n- BREATH: 心跳.\n- ROTATE: 摇晃.\n- FLOAT_REPEAT: 上下循环浮动.\n- SCALE: 缩放.\n- BUTTON_JUMP: 快速放大缩小.\n- SCALE_INTERVAL: 间接性缩放.\n- HEARTBEAT: 心跳.' })
    effectType: EUIEffectType = EUIEffectType.NONE;
    @property({ tooltip: '定制动画参数' })
    customParams: boolean = false;
    @property({ tooltip: '动画时间', visible() { return this.customParams; } })
    duration: number = 1.0;
    @property({
        tooltip: '动画间隔时间', visible() {
            return this.customParams && (
                this.effectType === EUIEffectType.ROTATE_INTERVAL ||
                this.effectType === EUIEffectType.SCALE_INTERVAL ||
                this.effectType === EUIEffectType.ROTATE
            );
        }
    })
    interval: number = 1.0;

    onLoaded() {
        switch (this.effectType) {
            case EUIEffectType.LIGHT_ROTATE:
                this.onLightRotate(this.node);
                break;
            case EUIEffectType.JELLY:
                this.onJelly(this.node);
                break;
            case EUIEffectType.ROTATE_INTERVAL:
                this.onRotateInterval(this.node);
                break;
            case EUIEffectType.SCALE:
                this.onScale(this.node);
                break;
            case EUIEffectType.SCALE_INTERVAL:
                this.onScaleInterval(this.node);
                break;
            case EUIEffectType.BREATH:
                this.onBreath(this.node);
                break;
            case EUIEffectType.ROTATE:
                this.onRotate(this.node);
                break;
            case EUIEffectType.FLOAT_REPEAT:
                this.onFloatRepeat(this.node);
                break;
            case EUIEffectType.BUTTON_JUMP:
                this.onButtonJump(this.node);
                break;
            case EUIEffectType.SCALE_ANGLE:
                this.onScaleAngle(this.node);
                break;
            case EUIEffectType.HEARTBEAT:
                this.onHeartbeat(this.node);
                break;
            default:
                break;
        }
    }

    /** 放大缩小提示 */
    private onButtonJump(node: cc.Node) {
        // let zIndex = node.zIndex;
        // node.zIndex = cc.macro.MAX_ZINDEX - 10;
        const scale = node.scale;

        cc.tween(node).repeatForever(
            cc.tween().delay(1)
            .to(0.15, { scale: scale + 0.3 })
            .to(0.15, { scale: scale + 0.1 })
            .to(0.15, { scale: scale + 0.3 })
            .to(0.15, { scale: scale + 0.1 })
            .to(0.15, { scale: scale + 0.3 })
            .to(0.15, { scale: scale })
            .call(() => {
                // node.zIndex = zIndex;
            }).delay(2)
        ).start();
    }

    /** 光效旋转 */
    private onLightRotate(node: cc.Node) {
        // const time = 1;
        const time = this.duration;

        cc.tween(node).by(time, { angle: -90 }).repeatForever().start();
    }

    /** 上下浮动 */
    private onFloatRepeat(node) {
        // const time = 1;
        const time = this.duration;

        cc.tween(node).repeatForever(
            cc.tween()
            .by(time, { position: cc.v2(0, 10) }, { easing: cc.easing.sineInOut })
            .by(time, { position: cc.v2(0, -10) }, { easing: cc.easing.sineInOut })
        ).start();
    }

    /** 果冻抖动 */
    private onJelly(node) {
        const beganY = node.y;
        const beganX = node.x;
        const time = 2;
        const jumpTime = 1.5;

        cc.tween(node).then(cc.scaleTo(0.3 * time, 1.1, 0.9).easing(cc.easeSineIn()))
            .by(0.15 * time, { position: cc.v2(0, 9) }, { easing: cc.easing.sineOut }).start();

        cc.tween(node).delay(0.3 * time).then(cc.scaleTo(0.3, 0.97, 1.08).easing(cc.easeSineOut())).start();

        cc.tween(node).delay(0.45 * time)
        .then(cc.jumpTo(0.13 * jumpTime, cc.v2(beganX, beganY), 1, 1))
        .then(cc.jumpTo(0.11 * jumpTime, cc.v2(beganX, beganY + 9), 1, 1))
        .then(cc.jumpTo(0.10 * jumpTime, cc.v2(beganX, beganY), 1, 1))
        .then(cc.jumpTo(0.08 * jumpTime, cc.v2(beganX, beganY + 5), 1, 1))
        .then(cc.jumpTo(0.06 * jumpTime, cc.v2(beganX, beganY), 1, 1))
        .then(cc.jumpTo(0.04 * jumpTime, cc.v2(beganX, beganY + 3), 1, 1))
        .then(cc.jumpTo(0.02 * jumpTime, cc.v2(beganX, beganY), 1, 1)).start();

        cc.tween(node).delay(0.45 * time)
        .then(cc.scaleTo(0.13 * jumpTime, 1.1, 0.9).easing(cc.easeSineIn()))
        .then(cc.scaleTo(0.11 * jumpTime, 0.915, 1.08).easing(cc.easeSineOut()))
        .then(cc.scaleTo(0.10 * jumpTime, 1.06, 0.93).easing(cc.easeSineIn()))
        .then(cc.scaleTo(0.08 * jumpTime, 0.94, 1.045).easing(cc.easeSineOut()))
        .then(cc.scaleTo(0.06 * jumpTime, 1.035, 0.965).easing(cc.easeSineIn()))
        .then(cc.scaleTo(0.04 * jumpTime, 0.975, 1.025).easing(cc.easeSineOut()))
        .then(cc.scaleTo(0.02 * jumpTime, 1, 1).easing(cc.easeSineIn()))
        .call(this.onJelly.bind(this, node)).start();
    }

    /** 间接性摇晃 */
    private onRotateInterval(node) {
        // const time = 0.5;
        const time = this.duration;

        cc.tween(node).repeatForever(
            cc.tween()
            .by(time, { angle: 20 }, { easing: cc.easing.sineOut })
            .by(time * 2, { angle: -40 }, { easing: cc.easing.sineInOut })
            .by(time, { angle: 20 }, { easing: cc.easing.sineIn })
            .delay(0.5)
        ).start();
    }

    /** 呼吸 */
    private onBreath(node) {
        // const time = 1;
        const time = this.duration;

        cc.tween(node).repeatForever(
            cc.tween().to(time, { scale: 1.1 }).to(1.5 * time, { scale: 0.9 })
        ).start();
    }

    /** 摇晃 */
    private onRotate(node) {
        // const time = 0.1;
        const time = this.duration;

        cc.tween(node).repeatForever(
            cc.tween().delay(6)
            .to(time, { angle: 15 })
            .to(time, { angle: -15 })
            .to(time, { angle: 15 })
            .to(time, { angle: -15 })
            .to(time, { angle: 0 })
        ).start();
    }

    /** 呼吸 */
    private onScale(node) {
        // const time = 1;
        const time = this.duration;

        cc.tween(node).repeatForever(
            cc.tween().to(time, { scale: 1.1 }).to(time, { scale: 0.9 })
        ).start();
    }

    /** 间接性缩放提示 */
    private onScaleInterval(node) {
        // const time = 1;
        const interval = this.interval || 3;
        const time = this.duration;

        cc.tween(node).repeatForever(
            cc.tween()
            .to(time, { scale: 1.1 })
            .to(time, { scale: 1 })
            .to(time, { scale: 1.1 })
            .to(time, { scale: 1 })
            .delay(interval)
        ).start();
    }

    private onScaleAngle(node) {
        cc.tween(node).to(.3, { scale: 1.2 })
            .to(.1, { angle: 10 })
            .to(.15, { angle: -8 })
            .to(.13, { angle: 6 })
            .to(.1, { angle: -4 })
            .to(.08, { angle: 0 })
            .to(.3, { scale: 1 }).delay(.5).call(() => {
                this.onScaleAngle(node);
            }).start();
    }

    /** 心跳. */
    private onHeartbeat(node: cc.Node) {
        const time = this.duration;

        cc.tween(node)
        .to(0.15, { scale: 1.3 })
        .to(0.15, { scale: 0.9 })
        .to(0.15, { scale: 1.3 })
        .to(0.15, { scale: 0.9 })
        .to(0.15, { scale: 1.3 })
        .to(0.15, { scale: 1 })
        .delay(2).union()
        .repeatForever()
        .start();
    }
}
