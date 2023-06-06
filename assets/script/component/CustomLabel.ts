import { Label, _decorator } from "cc";

const { ccclass, property } = _decorator;

@ccclass
export class CustomLabel extends Label{
    @property
    customProp:string = "test";
}