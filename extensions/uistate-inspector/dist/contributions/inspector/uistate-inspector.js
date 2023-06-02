"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = exports.ready = exports.$ = exports.template = void 0;
const prop_1 = require("./utils/prop");
//@ts-ignore
const package_json_1 = __importDefault(require("../../../package.json"));
exports.template = `
<div class="component-container">
</div>
<ui-prop>
    <ui-button class="staticButton" tooltip="复制到剪贴板，出现异常时方便检查">
        查看保存的数据
    </ui-button>
</ui-prop>
`;
exports.$ = {
    componentContainer: ".component-container",
    staticButton: ".staticButton"
};
function ready() {
    // // @ts-ignore
    // this.elements = {
    //     // @ts-ignore
    //     stringText: {
    //         update: (element: any, dump: any) => {
    //             console.log("stringText update");
    //         },
    //         create(dump: any) {
    //             const prop = document.createElement("ui-prop");
    //             // @ts-ignore
    //             prop.dump = dump;
    //             const button = document.createElement("ui-button");
    //             button.innerText = dump.value;
    //             button.addEventListener("click", () => {
    //                 console.log("clicked stringText property");
    //             });
    //             prop.appendChild(button);
    //             return prop;
    //         }
    //     }
    // };
    this.$.staticButton.addEventListener("click", async () => {
        const json = await Editor.Message.request("scene", "execute-scene-script", {
            name: package_json_1.default.name,
            method: "copyRecords",
            args: [this.dump.value.node.value.uuid]
        });
        Editor.Panel.open("uistate-inspector", json);
    });
}
exports.ready = ready;
function update(dump) {
    // 缓存 dump 数据，请挂在 this 上，否则多开的时候可能出现问题
    this.dump = dump;
    (0, prop_1.updatePropByDump)(this, dump);
}
exports.update = update;
