"use strict";
module.exports = Editor.Panel.define({
    listeners: {
        show() {
            console.log("show");
        },
        hide() {
            console.log("hide");
        }
    },
    template: "<div>Hello</div>",
    style: "div { color: yellow; }",
    $: {
        code: "#code"
    },
    methods: {},
    ready() { },
    beforeClose() { },
    close() { }
});
