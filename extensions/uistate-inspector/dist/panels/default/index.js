"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
module.exports = Editor.Panel.define({
    listeners: {
        show() {
            console.log("show", arguments);
        },
        hide() {
            console.log("hide");
        }
    },
    template: (0, fs_1.readFileSync)((0, path_1.join)(__dirname, "../../../static/template/default/index.html"), "utf-8"),
    style: "div { color: yellow; }",
    $: {
        btnCopy: "#btnCopy",
        code: "#code"
    },
    methods: {},
    ready() {
        if (arguments[0])
            this.$.code.innerHTML = JSON.stringify(arguments[0], null, 2);
        this.$.btnCopy.addEventListener('confirm', () => {
            Editor.Clipboard.write("text", this.$.code.innerHTML);
            console.log("已复制到剪贴板！");
        });
    },
    beforeClose() { },
    close() { }
});
