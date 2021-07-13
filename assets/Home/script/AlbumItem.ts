/**
 * 平行世界Item.
 */

const {ccclass, property} = cc._decorator;

@ccclass
export default class AlbumItem extends cc.Component {

    @property({type: cc.Sprite})
    bgSprite: cc.Sprite = null;

    @property({type: sp.Skeleton})
    skeleton: sp.Skeleton = null;

    @property({type: cc.Sprite})
    nameSprite: cc.Sprite = null;

    @property({type: [cc.SpriteFrame]})
    sfBgs: cc.SpriteFrame[] = [];

    @property({type: [cc.SpriteFrame]})
    sfNames: cc.SpriteFrame[] = [];

    // LIFE-CYCLE CALLBACKS:

    public data: {name: string, index: number, animation: string} = null;
    public index: number = 0;

    // onLoad () {}

    start () {
        this.showData();
    }

    // update (dt) {}

    onClickedItem() {
        cc.systemEvent.emit("ON_CLICK_Album_Item", this.index, this.data);
    }

    private showData() {
        this.bgSprite.spriteFrame = this.sfBgs[(this.data.index - 1) % this.sfBgs.length];
        this.nameSprite.spriteFrame = this.sfNames[this.data.index - 1];
        this.skeleton.setAnimation(0, this.data.animation, true);
    }

}
