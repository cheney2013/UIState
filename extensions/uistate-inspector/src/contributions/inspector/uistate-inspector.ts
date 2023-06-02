import { methods } from "../../main";
import { updatePropByDump } from "./utils/prop";
//@ts-ignore
import packageJSON from "../../../package.json";

type Selector<$> = { $: Record<keyof $, any | null> };

export const template = `
<div class="component-container">
</div>
<ui-prop>
    <ui-button class="staticButton" tooltip="复制到剪贴板，出现异常时方便检查">
        查看保存的数据
    </ui-button>
</ui-prop>
`;
export const $ = {
    componentContainer: ".component-container",
    staticButton: ".staticButton"
};

export function ready(this: Selector<typeof $> & typeof methods) {
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
            name: packageJSON.name,
            method: "copyRecords",
            args: [(this.dump as any).value.node.value.uuid]
        });

        Editor.Panel.open("uistate-inspector", json);
    });
}

export function update(this: Selector<typeof $> & typeof methods, dump: any) {
    // 缓存 dump 数据，请挂在 this 上，否则多开的时候可能出现问题
    this.dump = dump;
    updatePropByDump(this, dump);
}
