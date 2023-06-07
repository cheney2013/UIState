const { ccclass, property } = cc._decorator;

@ccclass
export class CustomLabel extends cc.Label{
    @property
    customProp:string = "test";
}