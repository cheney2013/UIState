"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unload = exports.load = exports.methods = void 0;
let storedDirector;
let uuid;
/**
 * @en Registration method for the main process of Extension
 * @zh 为扩展的主进程的注册方法
 */
exports.methods = {
    recordUuid(_uuid) {
        uuid = _uuid;
    },
    recordDirector(director) {
        storedDirector = director;
        console.log("main receive", director);
    },
    saveScene() {
        Editor.Message.send("scene", "execute-component-method", {
            uuid,
            name: "saveCurrentState",
            args: []
        });
        console.log("saveScene", arguments);
    }
};
/**
 * @en Hooks triggered after extension loading is complete
 * @zh 扩展加载完成后触发的钩子
 */
function load() { }
exports.load = load;
/**
 * @en Hooks triggered after extension uninstallation is complete
 * @zh 扩展卸载完成后触发的钩子
 */
function unload() { }
exports.unload = unload;
