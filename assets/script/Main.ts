import { Button, Component, Node, NodeEventType, _decorator } from 'cc';
import UIState from './component/UIState';
const { ccclass, property } = _decorator;

@ccclass('Main')
export class Main extends Component {
    @property(Button)
    btnChangeOutter:Button;

    @property(Button)
    btnChangeInner:Button;

    @property(Node)
    innerBox:Node;

    start() {
        this.btnChangeOutter.node.on(NodeEventType.TOUCH_END, () => {
            const uiState = this.node.getComponent(UIState);
            uiState.state = uiState.state === 0 ? 1 : 0;
        });
        this.btnChangeInner.node.on(NodeEventType.TOUCH_END, () => {
            const uiState = this.innerBox.getComponent(UIState);
            uiState.state = uiState.state === 0 ? 1 : 0;
        });
    }

    update(deltaTime: number) {
        
    }
}


