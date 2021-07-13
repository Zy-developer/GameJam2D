/**
 * 遥杆
 */
 
const {ccclass, property} = cc._decorator;

@ccclass
export class Rocker extends cc.Component {

    static EEventNames = {
        ROCKER_START: 'ROCKER_START',
        ROCKER_MOVED: 'ROCKER_MOVED',
        ROCKER_ENDED: 'ROCKER_ENDED',
    };

    @property({
        tooltip: '是否固定遥感底座位置'
    })
    isFixedBase: boolean = false;

    @property({
        type: cc.Node,
        tooltip: '底座'
    })
    baseNode: cc.Node = null;

    @property({
        type: cc.Node,
        tooltip: '触点'
    })
    contactNode: cc.Node = null;

    @property({
        // cc.Size是值类型，值类型定义编辑器属性时不用指定type类型
        // type: cc.Size,
        tooltip: '触摸区域'
    })
    rect: cc.Size = cc.size(0, 0);

    @property({
        tooltip: '触摸区域是否全屏'
    })
    isFullSceneRect: boolean = true;

    @property({
        tooltip: '遥感偏移的半径'
    })
    radius: number = 100;

    private _initPos = null;

    onLoad() {
        this.node.width = this.rect.width;
        this.node.height = this.rect.height;
        // this.baseNode.active = false;
        // this.contactNode.active = false;

        if (this.isFullSceneRect) {
            this.node.width = cc.view.getDesignResolutionSize().width / 2;
            this.node.height = cc.view.getDesignResolutionSize().height;
        }
        this._initPos = this.baseNode.position;

        let touchNode = this.node;
        // if (this.isFixedBase) {
        //     touchNode = this.baseNode;
        //     this.baseNode.active = true;
        //     this.contactNode.active = true;
        // }
        touchNode.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        touchNode.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMoved, this);
        touchNode.on(cc.Node.EventType.TOUCH_END, this.onTouchEnded, this);
        touchNode.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancelled, this);
    }

    onDestroy() {
        let touchNode = this.node;
        if (this.isFixedBase) {
            touchNode = this.baseNode;
        }
        touchNode.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        touchNode.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMoved, this);
        touchNode.off(cc.Node.EventType.TOUCH_END, this.onTouchEnded, this);
        touchNode.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancelled, this);
    }

    onTouchStart(event: cc.Event.EventTouch) {
        const location = event.getLocation();
        const touchPos = this.node.convertToNodeSpaceAR(location);
        if (!this.isFixedBase) {
            this.baseNode.setPosition(touchPos);
        }
        this.contactNode.setPosition(touchPos);
        this.baseNode.active = true;
        this.contactNode.active = true;

        cc.systemEvent.emit(Rocker.EEventNames.ROCKER_START, {
            location, 
            position: touchPos, 
            rockerPosition: this.contactNode.position,
            direction: this.contactNode.position.sub(this.baseNode.position)
        });
    }

    onTouchMoved(event: cc.Event.EventTouch) {
        const location = event.getLocation();
        const touchPos = this.node.convertToNodeSpaceAR(location);
        this.contactNode.setPosition(this.convertTouchToRadiusPos(this.baseNode.position, touchPos, this.radius));

        cc.systemEvent.emit(Rocker.EEventNames.ROCKER_MOVED, {
            location, 
            position: touchPos, 
            rockerPosition: this.contactNode.position,
            direction: this.contactNode.position.sub(this.baseNode.position)
        });
    }

    onTouchEnded(event: cc.Event.EventTouch) {
        const location = event.getLocation();
        const touchPos = this.node.convertToNodeSpaceAR(location);
        this.baseNode.position = this.contactNode.position = this._initPos;
        // this.contactNode.position = this.baseNode.position;

        cc.systemEvent.emit(Rocker.EEventNames.ROCKER_ENDED, {
            location, 
            position: touchPos, 
            rockerPosition: this.contactNode.position,
            direction: cc.v2(0, 0)
        });

        // if (!this.isFixedBase) {
        //     this.baseNode.active = false;
        //     this.contactNode.active = false;
        // }
    }

    onTouchCancelled(event: cc.Event.EventTouch) {
        this.onTouchEnded(event);
    }

    /**
     * 转换点击位置为遥感触点位置
     * @param origin 遥感中心点
     * @param touchPos 当前触点
     * @param radius 遥感移动半径
     */
    convertTouchToRadiusPos(origin: cc.Vec2 | cc.Vec3, touchPos: cc.Vec2, radius: number): cc.Vec2 {
        const distance =  touchPos.sub(cc.v2(origin)).mag();;
        
        if (radius >= distance) {
            return touchPos;
        } 

        let offset = touchPos.sub(cc.v2(origin));
        offset = offset.mul(radius / distance);
        return cc.v2(origin).add(offset);
    }
}
