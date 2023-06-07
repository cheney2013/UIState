import UIState from './component/UIState';
const { ccclass, property } = cc._decorator;

@ccclass
export class Main extends cc.Component {
    @property(cc.Button)
    btnChangeOutter:cc.Button = null;

    @property(cc.Button)
    btnChangeInner:cc.Button = null;

    @property(cc.Node)
    innerBox:cc.Node = null;

    start() {
        this.btnChangeOutter.node.on(cc.Node.EventType.TOUCH_END, () => {
            const uiState = this.node.getComponent(UIState);
            uiState.state = uiState.state === 0 ? 1 : 0;
        });
        this.btnChangeInner.node.on(cc.Node.EventType.TOUCH_END, () => {
            const uiState = this.innerBox.getComponent(UIState);
            uiState.state = uiState.state === 0 ? 1 : 0;
        });
    }

    update(deltaTime: number) {
        
    }
}


