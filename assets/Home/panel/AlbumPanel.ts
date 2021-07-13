/**
 * 平行世界面板.
 */

import AlbumItem from "../script/AlbumItem";

const {ccclass, property} = cc._decorator;

@ccclass
export default class AlbumPanel extends cc.Component {

    @property({type: cc.ScrollView})
    scrollView: cc.ScrollView = null;

    @property({type: cc.Layout})
    layout: cc.Layout = null;

    @property({type: cc.Node})
    item: cc.Node = null;

    // LIFE-CYCLE CALLBACKS:

    private datas = [
        {name: "社畜", index: 1, animation: "work"},
        {name: "篮球", index: 2, animation: "ball"},
        {name: "音乐家", index: 3, animation: "rock"},
        {name: "电竞小子", index: 4, animation: "game"},
        {name: "漫画家", index: 5, animation: "cartoonist"},
        {name: "叛逆小子", index: 6, animation: "dark"},
        {name: "学霸", index: 7, animation: "doctor"},
    ];

    // onLoad () {}

    start () {
        this.initShowData();
    }

    // update (dt) {}

    onClickedBack() {
        this.node.destroy();
    }

    onClickedSwitchTop() {
        let curIndex = Math.floor(Math.abs(this.layout.node.x) / this.item.width);
        if (curIndex > 0) {
            --curIndex;
            this.layout.node.x = curIndex * this.item.width - 15;
        }
        // console.log(`curIndex: ${curIndex}, x: ${this.layout.node.x}`);
    }

    onClickedSwitchDown() {
        let curIndex = Math.floor(Math.abs(this.layout.node.x) / this.item.width);
        if (curIndex < this.datas.length - 3) {
            ++curIndex;
            this.layout.node.x = -(curIndex * this.item.width + 15);
        }
        // console.log(`curIndex: ${curIndex}, x: ${this.layout.node.x}`);
    }

    onClickedItem(index: number, data: any) {
        
    }

    private initShowData() {
        for (let i = 0, node: cc.Node, item: AlbumItem, data: {name: string, index: number, animation: string}; i < this.datas.length; ++i) {
            data = this.datas[i];
            node = cc.instantiate(this.item);
            node.parent = this.layout.node;
            item = node.getComponent(AlbumItem);
            item.index = i;
            item.data = data;
            node.active = true;
        }
        this.layout.updateLayout();
    }

}
