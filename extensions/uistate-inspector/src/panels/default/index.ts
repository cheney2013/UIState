import { readFileSync } from "fs";
import { join } from "path";

module.exports = Editor.Panel.define({
    listeners: {
        show() {
            console.log("show", arguments);
        },
        hide() {
            console.log("hide");
        }
    },
    template: readFileSync(join(__dirname, "../../../static/template/default/index.html"), "utf-8"),
    style: "div { color: yellow; }",
    $: {
        btnCopy: "#btnCopy",
        code: "#code"
    },
    methods: {
    },
    ready() {
        if (arguments[0]) this.$.code!.innerHTML = JSON.stringify(arguments[0], null, 2);
        this.$.btnCopy!.addEventListener('confirm', () => {
            Editor.Clipboard.write("text", this.$.code!.innerHTML);
            console.log("已复制到剪贴板！");
        });
    },
    beforeClose() {},
    close() {}
});
