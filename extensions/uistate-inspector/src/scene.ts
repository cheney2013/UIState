// @ts-nocheck
import { director, Node } from "cc";

export function load() {}
export function unload() {}
export const methods = {
    copyRecords(uuid: string) {
        const node = this.iterateFindChildByUuid(director.getScene(), uuid);
        if (!node) return null;
        const uiState = node.getComponent("UIState");
        if (!uiState) return null;
        const cloneState = {};
        Object.values(uiState.records).forEach((stateRecord, index) => {
            const records = [];
            stateRecord.forEach(record => {
                const clone = {};
                Object.assign(clone, record);
                if (record.node) {
                    clone.uuid = record.node.uuid;
                    clone.name = record.node.name;
                    delete clone.node;
                }
                records.push(clone);
            });
            cloneState[uiState.states[index]] = records;
        });
        return cloneState;
    },

    /** 根据uuid深度优先查找节点 */
    iterateFindChildByUuid(node: Node, uuid: string): Node {
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            if (child.uuid === uuid) return child;
            if (child.children?.length) {
                const findNode = this.iterateFindChildByUuid(child, uuid);
                if (findNode) return findNode;
            }
        }
        return null;
    }
};
