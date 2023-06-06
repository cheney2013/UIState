/*
author:cy
version:1.0.0
date:2023.06.02
qq:1183875513
使用过程中遇到问题可以联系我
*/

import {
    CCClass,
    CCString,
    Color,
    Component,
    Enum,
    Label,
    Node,
    RichText, Sprite, SpriteFrame,
    Widget,
    _decorator, assetManager
} from "cc";
import { EDITOR } from "cc/env";

let isInitDebugComp = false;

enum States {
    Default
}

/**
 * 会记录的组件及其属性
 */
const COMP_ATTR_RECORD = <const>{
    "cc.UITransform": ["width", "height", "anchorX", "anchorY"],
    "cc.Widget": ["isAlignBottom", "isAlignTop", "isAlignLeft", "isAlignRight", "isAlignVerticalCenter", "isAlignHorizontalCenter", 
                "isAbsoluteTop", "isAbsoluteBottom", "isAbsoluteLeft", "isAbsoluteRight", "isAbsoluteHorizontalCenter", "isAbsoluteVerticalCenter",
                "left", "right", "top", "bottom", "horizontalCenter", "verticalCenter", "alignMode", "alignFlags"],
    "cc.UIOpacity": ["opacity"],
    "cc.Label": ["color", "string", "horizontalAlign", "verticalAlign", "fontSize", "fontFamily", "lineHeight", "overflow", "isBold", "isItalic", "isUnderline", "underlineHeight"],
    "cc.RichText": ["string", "horizontalAlign", "verticalAlign", "fontSize", "fontFamily", "maxWidth", "lineHeight"],
    "cc.Sprite": ["color", "spriteFrame", "grayscale", "sizeMode", "type", "trim"],
    "CustomLabel": ["customProp"]
}

type KEY_OF_COMP_ATTR_RECORD = keyof typeof COMP_ATTR_RECORD;
type STRUCT_OF_COMP_ATTR_RECORD<K extends KEY_OF_COMP_ATTR_RECORD> = typeof COMP_ATTR_RECORD[K];

type RecordProps = {
    [K in KEY_OF_COMP_ATTR_RECORD]?: {[key in STRUCT_OF_COMP_ATTR_RECORD<K>[number]]:any};
} & {
    node: Node;
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    angle: number;
    active: boolean;
};

/**
 * 判断在真正的编辑器模式中。
 * 由于编辑器预览 EDITOR 也为 true，
 * 但又不想让特定代码在编辑器预览执行
 */
//@ts-ignore
const REAL_EDITOR = EDITOR && !cc.GAME_VIEW;

const { ccclass, property, executeInEditMode, disallowMultiple } = _decorator;
@ccclass("UIState")
@executeInEditMode
@disallowMultiple
export default class UIState extends Component {
    @property
    private _states: string[] = ["Default"];

    @property({ type: [CCString], step: 1 })
    set states(value: string[]) {
        if (EDITOR) {
            // 状态数量减少时
            if (value.length < this._states.length){
                let hasData = false;
                for (let i = value.length; i < this._states.length; i++) {
                    hasData = !!(this._records![i] && this._records![i].length);
                    if (hasData) break;
                }
                // 二次确认
                if (hasData){
                    Editor.Dialog.warn("要删除的状态中含有数据,删除操作不可逆,是否继续?", {
                        cancel:1,
                        buttons: ["是", "否"]
                    }).then(returnValue=>{
                        // 否
                        if(returnValue.response === 1)
                            return;
                        
                        for (let i = value.length; i < this._states.length; i++) {
                            delete this._records![i];
                        }
                        this._states = value;
                        this.updateStateEnumList();

                        // 软刷新场景,编辑器会闪一下,应该有更好的接口可以不闪的刷新吧,不过懒得找了
                        Editor.Message.request("scene", "soft-reload");
                    });
                    return;
                }
            }
            this._states = value;
            this.updateStateEnumList();
        }else{
            this._states = value;
        }        
    }

    get states() {
        return this._states;
    }

    @property
    private _state: States = States.Default;

    set state(val: number) {
        if (this._state === val) return;
        // 编辑器模式时，切换状态前保存当前状态数据
        if (REAL_EDITOR) {
            this.walkNode(this.node, child => {
                this.recordBeforeStateChange(child);
            });
        }
        
        let stateRecord = this.records[val];
        // 新的状态不存在的话
        if (!stateRecord) {
            // 编辑器模式下,从当前状态复制
            if (REAL_EDITOR) {
                stateRecord = this.createState(val);
                const currStateRecord = this.records[this._state];

                currStateRecord.forEach(record => {
                    stateRecord.push(this.cloneRecord(record));
                });
            }
            else return;
        }

        this._state = val;
        this.applyState();
        if (REAL_EDITOR) this.onFocusInEditor!();
    }

    @property({ type: Enum(States) })
    get state() {
        return this._state;
    }

    // creator bug 用二维数组的数据结构，在编辑器里删除一个节点，再撤销会报错
    // 找不到原因，只能用对象实现了
    // private _records:RecordProps[][] = [];
    /** 关键：加上 @property 让编辑器序列化保存这个数据 */
    @property
    private _records?: { [k in number]: RecordProps[] } = undefined;

    private _backupRecords?: { [k in number]: RecordProps[] };

    get records() {
        // creator bug 在编辑器里删除一个节点，再撤销会重新赋初始值给组件所有
        // 带 @property 装饰器的属性，导致数据丢失，无奈只能用另一个变量来恢复数据了
        if (!this._records) this._records = this._backupRecords;
        return this._records!;
    }

    /** 根据 uuid 快速找到记录（当前状态） */
    private _uuidRecordMap?: Map<string, RecordProps>;

    /** 当前状态的节点记录，用于判断节点是否修改 */
    private _defaultNodeState = new Map<string, RecordProps>();

    onLoad() {
        // 编辑器模式下，确保一个场景或预制只初始化一次
        if (REAL_EDITOR) {
            if (!isInitDebugComp){
                isInitDebugComp = true;
                UIStateDecorator(Component);
            }
        }

        if (!this._records) this._records = {};
        this._backupRecords = this._records;

        if (REAL_EDITOR) this.updateStateEnumList();

        if (!this.records[this._state])
            this.createState(this._state);
        this.applyState();
    }

    private updateStateEnumList() {
        const enumList: { name: string; value: number }[] = [];
        this.states.forEach((state, index) => {
            enumList.push({ name: state, value: index });
        });
        CCClass.Attr.setClassAttr(this, "state", "enumList", enumList);
    }

    /**
     * 保存当前状态
     */
    saveCurrentState() {
        // 编辑器模式时
        this.walkNode(this.node, child => {
            this.recordBeforeStateChange(child);
        });
        console.log("已保存当前状态");
    }

    /** 必须要有个默认状态 */
    private createState(state:number) {
        const stateRecord:RecordProps[] = [];
        this.records[state] = stateRecord;
        return stateRecord;
    }

    private applyState() {
        let stateRecord = this.records[this._state];

        // 建立当前状态的缓存映射关系
        this._uuidRecordMap = new Map();
        stateRecord.forEach(record => {
            if (record.node) this._uuidRecordMap?.set(record.node.uuid, record);
        });

        // 应用状态
        for (let i = stateRecord.length - 1; i >= 0; i--) {
            const record = stateRecord[i];
            const node = record.node;

            // 删除无效的记录
            if (!node || !node.parent){
                stateRecord.splice(i, 1);
                continue;
            }

            if (node === this.node) continue;
            node.angle = record.angle;
            node.setScale(record.scaleX, record.scaleY);

            node.components.forEach(comp=>{
                const compName = (comp as any).__proto__.__classname__ as keyof KEY_OF_COMP_ATTR_RECORD;
                const recordCompAttr = record[compName as keyof RecordProps];

                if (!recordCompAttr) return;

                const registerComps = this.getNeedRecordComps(comp);

                if (!registerComps.length) return;

                registerComps.forEach(compName=>{
                    let compAttrs:string[] = COMP_ATTR_RECORD[compName];
                    switch(compName){
                        case "cc.Label":
                            Object.values(compAttrs).forEach(attr => {
                                this.applyLabelAttr(attr, comp as Label, recordCompAttr);
                            });
                            break;
                        case "cc.Sprite":
                            Object.values(compAttrs).forEach(attr => {
                                this.applySpriteAttr(attr, comp as Sprite, recordCompAttr);
                            });
                            break;
                        default:
                            Object.values(compAttrs).forEach(attr => {
                                comp[attr] = recordCompAttr[attr];
                            });
                            break;
                    }
                });
                if (record[(comp as any).__proto__.__classname__])
                    comp.enabled = record[(comp as any).__proto__.__classname__].enabled;
            });
            node.active = record.active!;

            // 应用组件启用状态
            node.components.forEach((comp, index) => {
                const compName = (comp as any).__proto__.__classname__ as keyof RecordProps;
                const recordCompAttr = record[compName];
                // 没有记录且没在 COMP_ATTR_RECORD 中表明是在其他状态新增的组件,那么在当前状态就需要禁用
                if(!recordCompAttr && this.isNeedRecordComp(comp)){
                    comp.enabled = false;
                }
            });
            const widget = node.getComponent(Widget);
            if (!widget || !widget.enabled)
                node.setPosition(record.x, record.y);
        }

        this._defaultNodeState.clear();
        this.walkNodeWithSubUIState(this.node, child => {
            this._defaultNodeState.set(child.uuid, this.recordNode(child));
        });
    }

    /**
     * 记录节点
     * @param node
     * @returns
     */
    private recordNode(node: Node, record?: RecordProps) {
        if (!record)
            record = {
                node,
                active: node.active,
                x: node.position.x,
                y: node.position.y,
                angle: node.angle,
                scaleX: node.scale.x,
                scaleY: node.scale.y
            };
        else{
            record.active = node.active;
            record.x = node.position.x;
            record.y = node.position.y;
            record.angle = node.angle;
            record.scaleX = node.scale.x;
            record.scaleY = node.scale.y;
        }
        
        // 记录组件启用状态
        node.components.forEach(comp => {
            const registerComps = this.getNeedRecordComps(comp);
            let recordCompAttr:any;
            if (!registerComps.length)
                return;

            recordCompAttr = {
                enabled: comp.enabled
            };
            record[(comp as any).__proto__.__classname__] = recordCompAttr;
            
            registerComps.forEach(compName=>{
                let compAttrs = COMP_ATTR_RECORD[compName];
                if (compAttrs){
                    switch(compName){
                        case "cc.Label":
                            compAttrs.forEach(attr => {
                                this.recordLabelAttr(attr, comp as Label, recordCompAttr);
                            });
                            break;
                        case "cc.Sprite":
                            compAttrs.forEach(attr => {
                                this.recordSpriteAttr(attr, comp as Sprite, recordCompAttr);
                            });
                            break;
                        default:
                            compAttrs.forEach(attr => {
                                recordCompAttr[attr] = comp[attr as keyof typeof comp];
                            });
                            break;
                    }
                }
            });
        });

        return record;
    }

    private recordLabelAttr(attr:string, comp:Label, recordCompAttr:any){
        switch(attr){
            case "color":
                recordCompAttr[attr] = comp.color.toHEX();
                break;
            case "string":
                // 有多语言组件时不处理
                if (comp.getComponent("L10nLabel")) break;
            default:
                recordCompAttr[attr] = comp[attr as keyof typeof comp];
                break;
        }
    }

    private applyLabelAttr(attr:string, comp:Label, recordCompAttr:any){
        switch(attr){
            case "color":
                comp.color.fromHEX(recordCompAttr[attr]);
                (comp as any)["_updateColor"]();
                break;
            default:
                (comp as any)[attr] = recordCompAttr[attr];
                break;
        }
    }

    private recordSpriteAttr(attr:string, comp:Sprite, recordCompAttr:any){
        switch(attr){
            case "color":
                recordCompAttr[attr] = comp.color.toHEX();
                break;
            case "spriteFrame":
                recordCompAttr[attr] = comp.spriteFrame?.uuid;
                break;
            default:
                recordCompAttr[attr] = comp[attr as keyof typeof comp];
                break;
        }
    }

    private applySpriteAttr(attr:string, comp:Sprite, recordCompAttr:any){
        switch(attr){
            case "color":
                comp.color.fromHEX(recordCompAttr[attr]);
                (comp as any)["_updateColor"]();
                break;
            case "spriteFrame":
                if (comp.spriteFrame?.uuid === recordCompAttr[attr]) return;

                if (recordCompAttr[attr])
                    assetManager.loadAny<SpriteFrame>(recordCompAttr[attr], (err, asset) => {
                        if (err) {
                            console.warn(err);
                            return;
                        }
                        comp.spriteFrame = asset;

                        // 特定情况下会出现SpriteFrame没有更新，点击 Creator 能够刷新
                        // 使用软刷新场景的接口，编辑器会闪一下，体验不是太好，不过可以保证显示正确
                        REAL_EDITOR && Editor.Message.request("scene", "soft-reload");
                    });
                else comp.spriteFrame = null;
                break;
            default:
                (comp as any)[attr] = recordCompAttr[attr];
                break;
        }
    }

    /** 
     * 保存状态
     * 新增的节点不需要处理
     * 修改的节点
     *      有记录：更新状态当前记录
     *      无记录：保存当前状态，并在其他状态上保存默认的状态
     */
    private recordBeforeStateChange(node: Node) {
        const defaultNodeState = this._defaultNodeState.get(node.uuid)!;

        // 新增的节点记录到 _defaultNodeState
        if (!defaultNodeState){
            this._defaultNodeState.set(node.uuid, this.recordNode(node));
            return;
        }

        let isModify = false;
        let record = this._uuidRecordMap?.get(node.uuid);
        // 清理已经删除的组件
        Object.keys(COMP_ATTR_RECORD).some(compName=>{
            if (node.getComponent(compName)) return false;

            if (defaultNodeState[compName as keyof RecordProps]){
                isModify = true;

                // 如果没有记录就退出循环,因为已经知道了修改状态,而且也不需要更新记录
                if (!record) return true;

                delete record![compName as keyof RecordProps];
                return false;
            }else if (record){
                delete record![compName as keyof RecordProps];
                return false;
            }
            return false;
        });

        if (!isModify){
            if (defaultNodeState.active !== node.active || defaultNodeState.x!== node.position.x || 
                defaultNodeState.y!== node.position.y|| defaultNodeState.angle !== node.angle ||
                defaultNodeState.scaleX!== node.scale.x || defaultNodeState.scaleY!== node.scale.y)
                    isModify = true;
        }

        if (!isModify)
            // 检查节点是否有增加或修改
            isModify = node.components.some(component =>{
                // 不在 COMP_ATTR_RECORD 里的组件不记录
                if (!this.isNeedRecordComp(component)) return false;

                const compName = (component as any).__proto__.__classname__ as keyof RecordProps;
                // 新增的组件
                if (!defaultNodeState[compName])
                    return true;
                
                const compAttrRecord = defaultNodeState[compName]!;
                return Object.keys(compAttrRecord).some(key => {
                    switch(key){
                        case "color":
                            return (compAttrRecord as any)[key] !== ((component as any)[key] as Color).toHEX();
                        case "spriteFrame":
                            return (compAttrRecord as any)[key] !== ((component as any)[key] as SpriteFrame).uuid;
                        default:
                            if ((compAttrRecord as any)[key] !== (component as any)[key])
                                return true;
                            return false;
                    }
                })
            })

        if (isModify){
            if (record){
                this.recordNode(node, record);
            }else{
                Object.values(this.records).forEach((stateRecord, state) => {
                    if (this._state === state) {
                        record = this.recordNode(node);
                        this._uuidRecordMap?.set(node.uuid, record);
                    }else {
                        // 深度拷贝
                        record = this.cloneRecord(this._defaultNodeState.get(node.uuid)!);
                    }
                    stateRecord.push(record);
                });
            }
        }
    }

    /**
     * 是否是需要记录的组件，继承自 COMP_ATTR_RECORD 列出的组件也算
     * @param component 
     * @returns 
     */
    private isNeedRecordComp(component: Component): boolean{
        let isRegister = false;
        let compProto = (component as any).__proto__;
        while(compProto){
            const compName = compProto.__classname__ as keyof KEY_OF_COMP_ATTR_RECORD;
            if (COMP_ATTR_RECORD[compName]){
                isRegister = true;
                break;
            }
            compProto = compProto.__proto__;
        }
        return isRegister;
    }

    /**
     * 获取需要记录的组件
     * @param component 
     * @returns 一个字符串数组，包含需要记录的组件
     */
    private getNeedRecordComps(component:Component):string[]{
        const ret = [];
        let compProto = (component as any).__proto__;
        while(compProto){
            const compName = compProto.__classname__ as keyof KEY_OF_COMP_ATTR_RECORD;
            if (COMP_ATTR_RECORD[compName]) ret.push(compName);
            compProto = compProto.__proto__;
        }
        return ret;
    }
    
    /**
     * 遍历时包括拥有UIState的子节点
     * @param node 
     * @param func 
     */
    private walkNodeWithSubUIState(node: Node, func: (target: Node) => void) {
        let skipUuid = "";
        node.walk(
            child => {
                if (skipUuid) return;
                // if (child === node) return;
                if (child.getComponent(RichText)) {
                    skipUuid = child.uuid;
                }
                func(child);
            },
            (child: Node) => {
                if (skipUuid && skipUuid === child.uuid) {
                    skipUuid = "";
                }
            }
        );
    }

    private walkNode(node: Node, func: (target: Node) => void) {
        let skipUuid = "";
        node.walk(
            child => {
                if (skipUuid) return;
                // if (child === node) return;
                if (child.getComponent(RichText) || (child !== node && child.getComponent(UIState))) {
                    skipUuid = child.uuid;
                }
                func(child);
            },
            (child: Node) => {
                if (skipUuid && skipUuid === child.uuid) {
                    skipUuid = "";
                }
            }
        );
    }

    /**
     * 深拷贝记录
     * @param sourceRecord 要拷贝的记录
     * @returns 克隆的记录
     */
    private cloneRecord(sourceRecord:RecordProps){
        let clone = Object.assign({}, sourceRecord);
        (clone.node as any) = undefined;
        clone = JSON.parse(JSON.stringify(clone)) as RecordProps;
        clone.node = sourceRecord.node;
        return clone;
    }
}

// 场景编辑器左下角的自定义信息显示
const DIV_NAME = "UIStateElement";
const UIStateDecorator = function (ctr: Function) {
    let createUIStateElement = function () {
        var div = document.createElement("div");
        div.id = DIV_NAME;
        div.style.background = "#2b2b2b";
        div.style.position = "fixed";
        div.style.padding = "10px";
        div.style.color = "#cccccc";
        div.style.fontSize = "14px";
        div.style.left = "0px";
        div.style.bottom = "0px";
        div.style.zIndex = "99999";
        div.style.borderRadius = "calc(var(--size-normal-radius) * 2px)";
        div.style.boxShadow = "inset 0 0 0 calc(var(--size-normal-border) * 1px) var(--color-default-border-normal)";
        document.getElementById("GameDiv")!.append(div);
        return div;
    };

    let __oldOnFocusInEditor = ctr.prototype.onFocusInEditor;
    ctr.prototype.onFocusInEditor = function () {
        let targetElement = document.getElementById(DIV_NAME);
        if (!targetElement) targetElement = createUIStateElement();

        if (targetElement) {
            // 找到 UIState
            let uiState: UIState;
            let node = this.node;
            while (node) {
                uiState = node.getComponent(UIState);
                if (uiState) break;
                node = node.parent;
            }

            if (!node) return;

            Editor.Message.send("uistate-inspector", "record-uuid", uiState!.uuid);

            targetElement.innerHTML = `<span style="font-size:12px;color:#888">UIState</span> <br/> ${node.name}  <br/> state: ${
                uiState!.states[uiState!.state]
            } `;
        }
        __oldOnFocusInEditor?.apply(this, arguments);
    };

    let __oldOnLostFocusInEditor = ctr.prototype.onLostFocusInEditor;
    ctr.prototype.onLostFocusInEditor = function () {
        if (document.getElementById(DIV_NAME)) {
            document.getElementById(DIV_NAME)!.remove();
        }
        __oldOnLostFocusInEditor?.apply(this, arguments);
    };
};