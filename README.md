# 项目简介

<b>一个 Cocos Creator 3.x 的插件，能够方便的管理多个UI状态，只需一个在需要记录状态的节点上添加UIState组件，即可记录所有子节点（包含子孙节点）的状态改变</b>

1. 支持嵌套UIState。子节点（子孙节点）也可以加UIState，维护自己的状态
2. 数据量小。仅记录修改的节点
3. 代码逻辑清晰易扩展。可以很方便的扩展记录的组件和属性，支持记录自定义组件

![image](https://github.com/cheney2013/ImageRepo/blob/main/2023-06-02-11-25-41.gif)

# 安装和使用

1. 将 extensions 目录下的 uistate-inspector 拷贝到你项目的 extensions 目录下

![image](https://github.com/cheney2013/ImageRepo/blob/main/Snipaste_2023-06-02_12-08-08.png)

2. 点击 Creator 工具栏的 扩展->扩展管理器，点击已安装扩展，点击刷新扩展，就可以看到 uistate-inspector 扩展

![image](https://github.com/cheney2013/ImageRepo/blob/main/Snipaste_2023-06-02_12-09-33.png)

3. 点击扩展右边的 toggle button，启用扩展
4. 将 assets\script\component 目录下的 UIState.ts 文件复制到你项目的任意位置

![image](https://github.com/cheney2013/ImageRepo/blob/main/Snipaste_2023-06-02_12-10-06.png)

5. 为你需要记录UI状态的节点添加 UIState 组件

## 测试场景

嵌套UIState 		✔	父UIState节点不会保存子UIState节点的状态

新增节点			✔	在切换到其他状态前，所有状态会保持一致，切换过一次状态后，每个状态会保存自己的数据

新增节点并修改属性	✔	在切换到其他状态前，所有状态会保持一致，切换过一次状态后，每个状态会保存自己的数据

删除节点			✔	所有状态都会删除该节点

新增组件			✔	仅对当前状态生效，其他状态会禁用该组件

删除组件			✔	所有状态都会删除该组件

禁用组件			✔	仅对当前状态生效

## 组件测试

Label				✔

RichText			✔

Sprite				✔  特定情况下会出现SpriteFrame没有更新，点击 Creator 能够刷新。使用软刷新场景的接口，编辑器会闪一下，体验不是太好，不过可以保证显示正确

Widget				✔

## 构建发布测试

Web桌面				✔
