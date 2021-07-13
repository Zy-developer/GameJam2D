/**
 * 调整层级顺序
 */

const {ccclass, property, executeInEditMode, disallowMultiple, help} = cc._decorator;

@ccclass
@executeInEditMode
@disallowMultiple
export class ZIndex extends cc.Component {

    @property
    _zIndex: number = 0;

    @property({
        tooltip: '层级, 如果要在父节点下层，需要小于等于-1。',
    })
    get zIndex () {
        return this._zIndex;
    }
    set zIndex (value) {
        this._zIndex = value;
        this.targetNode.zIndex = this._zIndex;
    }

    @property({
        type: cc.Node,
        tooltip: '节点对象，默认为当前组件关联的节点对象。'
    })
    targetNode: cc.Node = null;

    onLoad() {
        if (!this.targetNode) {
            this.targetNode = this.node;
        }
        this.targetNode.zIndex = this.zIndex;
    }

    setZIndex (z) {
        this._zIndex = z;
        this.targetNode.zIndex = this.zIndex;
    }

    getZIndex () {
        return this.targetNode.zIndex;
    }
}