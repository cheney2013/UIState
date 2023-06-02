let storedDirector;
let uuid: string;
/**
 * @en Registration method for the main process of Extension
 * @zh 为扩展的主进程的注册方法
 */
export const methods: { [key: string]: (...any: any) => any } = {
    recordUuid(_uuid: string): void {
        uuid = _uuid;
    },
    recordDirector(director: any) {
        storedDirector = director;
        console.log("main receive", director);
    },
    saveScene(){
        Editor.Message.send("scene", "execute-component-method", {
            uuid,
            name: "saveCurrentState",
            args: []
        })
        console.log("saveScene", arguments);
    }
};

/**
 * @en Hooks triggered after extension loading is complete
 * @zh 扩展加载完成后触发的钩子
 */
export function load() {}

/**
 * @en Hooks triggered after extension uninstallation is complete
 * @zh 扩展卸载完成后触发的钩子
 */
export function unload() {}
