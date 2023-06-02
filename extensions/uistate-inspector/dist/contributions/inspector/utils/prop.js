"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appendChildByDisplayOrder = exports.appendToTabGroup = exports.toggleGroups = exports.createTabGroup = exports.getName = exports.isMultipleInvalid = exports.updatePropByDump = exports.setHidden = exports.setReadonly = exports.setDisabled = exports.loopSetAssetDumpDataReadonly = exports.updateCustomPropElements = exports.sortProp = void 0;
//@ts-nocheck
/*
 * Returns the ordered PropMap
 * @param {*} value of dump
 * @returns {key:string dump:object}[]
 */
function sortProp(propMap) {
    const orderList = [];
    const normalList = [];
    Object.keys(propMap).forEach(key => {
        const item = propMap[key];
        if (item != null) {
            if ("displayOrder" in item) {
                orderList.push({
                    key,
                    dump: item
                });
            }
            else {
                normalList.push({
                    key,
                    dump: item
                });
            }
        }
    });
    orderList.sort((a, b) => a.dump.displayOrder - b.dump.displayOrder);
    return orderList.concat(normalList);
}
exports.sortProp = sortProp;
/**
 *
 * This method is used to update the custom node
 * @param {HTMLElement} container
 * @param {string[]} excludeList
 * @param {object} dump
 * @param {(element,prop)=>void} update
 */
function updateCustomPropElements(container, excludeList, dump, update) {
    const sortedProp = exports.sortProp(dump.value);
    container.$ = container.$ || {};
    /**
     * @type {Array<HTMLElement>}
     */
    const children = [];
    sortedProp.forEach(prop => {
        if (!excludeList.includes(prop.key)) {
            if (!prop.dump.visible) {
                return;
            }
            let node = container.$[prop.key];
            if (!node) {
                node = document.createElement("ui-prop");
                node.setAttribute("type", "dump");
                node.dump = prop.dump;
                node.key = prop.key;
                container.$[prop.key] = node;
            }
            if (typeof update === "function") {
                update(node, prop);
            }
            children.push(node);
        }
    });
    const currentChildren = Array.from(container.children);
    children.forEach((child, i) => {
        if (child === currentChildren[i]) {
            return;
        }
        container.appendChild(child);
    });
    // delete extra children
    currentChildren.forEach($child => {
        if (!children.includes($child)) {
            $child.remove();
        }
    });
}
exports.updateCustomPropElements = updateCustomPropElements;
/**
 * Tool function: recursively set readonly in resource data
 */
function loopSetAssetDumpDataReadonly(dump) {
    if (typeof dump !== "object") {
        return;
    }
    if (dump.readonly === undefined) {
        return;
    }
    dump.readonly = true;
    if (dump.isArray) {
        for (let i = 0; i < dump.value.length; i++) {
            exports.loopSetAssetDumpDataReadonly(dump.value[i]);
        }
        return;
    }
    for (const key in dump.value) {
        exports.loopSetAssetDumpDataReadonly(dump.value[key]);
    }
}
exports.loopSetAssetDumpDataReadonly = loopSetAssetDumpDataReadonly;
/**
 * Tool functions: set to unavailable
 * @param {object} data  dump | function
 * @param element
 */
function setDisabled(data, element) {
    if (!element) {
        return;
    }
    let disabled = data;
    if (typeof data === "function") {
        disabled = data();
    }
    if (disabled === true) {
        element.setAttribute("disabled", "true");
    }
    else {
        element.removeAttribute("disabled");
    }
}
exports.setDisabled = setDisabled;
/**
 * Tool function: Set read-only status
 * @param {object} data  dump | function
 * @param element
 */
function setReadonly(data, element) {
    if (!element) {
        return;
    }
    let readonly = data;
    if (typeof data === "function") {
        readonly = data();
    }
    if (readonly === true) {
        element.setAttribute("readonly", "true");
    }
    else {
        element.removeAttribute("readonly");
    }
    if (element.render && element.dump) {
        element.dump.readonly = readonly;
        element.render();
    }
}
exports.setReadonly = setReadonly;
/**
 * Tool function: Set the display status
 * @param {Function | boolean} data  dump | function
 * @param {HTMLElement} element
 */
function setHidden(data, element) {
    if (!element) {
        return;
    }
    let hidden = data;
    if (typeof data === "function") {
        hidden = data();
    }
    if (hidden === true) {
        element.setAttribute("hidden", "");
    }
    else {
        element.removeAttribute("hidden");
    }
}
exports.setHidden = setHidden;
function updatePropByDump(panel, dump) {
    panel.dump = dump;
    if (!panel.elements) {
        panel.elements = {};
    }
    if (!panel.$props) {
        panel.$props = {};
    }
    if (!panel.$groups) {
        panel.$groups = {};
    }
    const oldPropKeys = Object.keys(panel.$props);
    const newPropKeys = [];
    Object.keys(dump.value).forEach((key, index) => {
        var _a, _b;
        const info = dump.value[key];
        if (!info.visible) {
            return;
        }
        const element = panel.elements[key];
        let $prop = panel.$props[key];
        newPropKeys.push(key);
        if (!$prop) {
            if (element && element.create) {
                // when it need to go custom initialize
                $prop = panel.$props[key] = panel.$[key] = element.create.call(panel, info);
            }
            else {
                $prop = panel.$props[key] = panel.$[key] = document.createElement("ui-prop");
                $prop.setAttribute("type", "dump");
            }
            const _displayOrder = (_b = (_a = info.group) === null || _a === void 0 ? void 0 : _a.displayOrder) !== null && _b !== void 0 ? _b : info.displayOrder;
            $prop.displayOrder = _displayOrder === undefined ? index : Number(_displayOrder);
            if (element && element.displayOrder !== undefined) {
                $prop.displayOrder = element.displayOrder;
            }
            if (!element || !element.isAppendToParent || element.isAppendToParent.call(panel)) {
                if (info.group && dump.groups) {
                    const { id = "default", name } = info.group;
                    if (!panel.$groups[id] && dump.groups[id]) {
                        if (dump.groups[id].style === "tab") {
                            panel.$groups[id] = exports.createTabGroup(dump.groups[id], panel);
                        }
                    }
                    if (panel.$groups[id]) {
                        if (!panel.$groups[id].isConnected) {
                            exports.appendChildByDisplayOrder(panel.$.componentContainer, panel.$groups[id]);
                        }
                        if (dump.groups[id].style === "tab") {
                            exports.appendToTabGroup(panel.$groups[id], name);
                        }
                    }
                    exports.appendChildByDisplayOrder(panel.$groups[id].tabs[name], $prop);
                }
                else {
                    exports.appendChildByDisplayOrder(panel.$.componentContainer, $prop);
                }
            }
        }
        else if (!$prop.isConnected || !$prop.parentElement) {
            if (!element || !element.isAppendToParent || element.isAppendToParent.call(panel)) {
                if (info.group && dump.groups) {
                    const { id = "default", name } = info.group;
                    exports.appendChildByDisplayOrder(panel.$groups[id].tabs[name], $prop);
                }
                else {
                    exports.appendChildByDisplayOrder(panel.$.componentContainer, $prop);
                }
            }
        }
        $prop.render(info);
    });
    for (const id of oldPropKeys) {
        if (!newPropKeys.includes(id)) {
            const $prop = panel.$props[id];
            if ($prop && $prop.parentElement) {
                $prop.parentElement.removeChild($prop);
            }
        }
    }
    for (const key in panel.elements) {
        const element = panel.elements[key];
        if (element && element.ready) {
            element.ready.call(panel, panel.$[key], dump.value);
            element.ready = undefined; // ready needs to be executed only once
        }
    }
    for (const key in panel.elements) {
        const element = panel.elements[key];
        if (element && element.update) {
            element.update.call(panel, panel.$[key], dump.value);
        }
    }
    exports.toggleGroups(panel.$groups);
}
exports.updatePropByDump = updatePropByDump;
/**
 * Tool function: check whether the value of the attribute is consistent after multi-selection
 */
function isMultipleInvalid(dump) {
    let invalid = false;
    if (dump.values && dump.values.some(ds => ds !== dump.value)) {
        invalid = true;
    }
    return invalid;
}
exports.isMultipleInvalid = isMultipleInvalid;
/**
 * Get the name based on the dump data
 */
/**
 *
 * @param {string} dump
 * @returns
 */
function getName(dump) {
    if (!dump) {
        return "";
    }
    if (dump.displayName) {
        return dump.displayName;
    }
    let name = dump.name || "";
    name = name.trim().replace(/^\S/, str => str.toUpperCase());
    name = name.replace(/_/g, str => " ");
    name = name.replace(/ \S/g, str => ` ${str.toUpperCase()}`);
    // 驼峰转中间空格
    name = name.replace(/([a-z])([A-Z])/g, "$1 $2");
    return name.trim();
}
exports.getName = getName;
function createTabGroup(dump, panel) {
    const $group = document.createElement("div");
    $group.setAttribute("class", "tab-group");
    $group.dump = dump;
    $group.tabs = {};
    $group.displayOrder = dump.displayOrder;
    $group.$header = document.createElement("ui-tab");
    $group.$header.setAttribute("class", "tab-header");
    $group.appendChild($group.$header);
    $group.$header.addEventListener("change", e => {
        active(e.target.value);
    });
    function active(index) {
        const tabNames = Object.keys($group.tabs);
        const tabName = tabNames[index];
        $group.childNodes.forEach(child => {
            if (!child.classList.contains("tab-content")) {
                return;
            }
            if (child.getAttribute("name") === tabName) {
                child.style.display = "block";
            }
            else {
                child.style.display = "none";
            }
        });
    }
    // check style
    if (!panel.$this.shadowRoot.querySelector("style#group-style")) {
        const style = document.createElement("style");
        style.setAttribute("id", "group-style");
        style.innerText = `
            .tab-group {
                margin-top: 10px;
                margin-bottom: 10px;
            }
            .tab-content {
                display: none;
                border: 1px dashed var(--color-normal-border);
                padding: 10px;
                margin-top: -9px;
                border-top-right-radius: calc(var(--size-normal-radius) * 1px);
                border-bottom-left-radius: calc(var(--size-normal-radius) * 1px);
                border-bottom-right-radius: calc(var(--size-normal-radius) * 1px);
            }`;
        panel.$.componentContainer.before(style);
    }
    setTimeout(() => {
        active(0);
    });
    return $group;
}
exports.createTabGroup = createTabGroup;
function toggleGroups($groups) {
    for (const key in $groups) {
        const $props = Array.from($groups[key].querySelectorAll(".tab-content > ui-prop"));
        const show = $props.some($prop => getComputedStyle($prop).display !== "none");
        if (show) {
            $groups[key].removeAttribute("hidden");
        }
        else {
            $groups[key].setAttribute("hidden", "");
        }
    }
}
exports.toggleGroups = toggleGroups;
function appendToTabGroup($group, tabName) {
    if ($group.tabs[tabName]) {
        return;
    }
    const $content = document.createElement("div");
    $group.tabs[tabName] = $content;
    $content.setAttribute("class", "tab-content");
    $content.setAttribute("name", tabName);
    $group.appendChild($content);
    const $label = document.createElement("ui-label");
    $label.value = exports.getName(tabName);
    const $button = document.createElement("ui-button");
    $button.setAttribute("name", tabName);
    $button.appendChild($label);
    $group.$header.appendChild($button);
}
exports.appendToTabGroup = appendToTabGroup;
function appendChildByDisplayOrder(parent, newChild) {
    const displayOrder = newChild.displayOrder || 0;
    const children = Array.from(parent.children);
    const child = children.find(child => {
        if (child.dump && child.displayOrder > displayOrder) {
            return child;
        }
        return null;
    });
    if (child) {
        child.before(newChild);
    }
    else {
        parent.appendChild(newChild);
    }
}
exports.appendChildByDisplayOrder = appendChildByDisplayOrder;