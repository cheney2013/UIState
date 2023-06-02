"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = exports.unload = exports.load = void 0;
// @ts-nocheck
const cc_1 = require("cc");
function load() { }
exports.load = load;
function unload() { }
exports.unload = unload;
exports.methods = {
    copyRecords(uuid) {
        const node = this.iterateFindChildByUuid(cc_1.director.getScene(), uuid);
        if (!node)
            return null;
        const uiState = node.getComponent("UIState");
        if (!uiState)
            return null;
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
    iterateFindChildByUuid(node, uuid) {
        var _a;
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            if (child.uuid === uuid)
                return child;
            if ((_a = child.children) === null || _a === void 0 ? void 0 : _a.length) {
                const findNode = this.iterateFindChildByUuid(child, uuid);
                if (findNode)
                    return findNode;
            }
        }
        return null;
    }
};
