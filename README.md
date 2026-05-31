# UJSCOURSE

江苏大学评教辅助用户脚本。

这个项目提供一个运行在 ScriptCat / Tampermonkey 中的用户脚本，用来在麦可思评教页面自动完成选项勾选、文本评语填写，并支持连续处理下一门课程。

![UJSCOURSE Logo](./logo.png)

## 功能概览

- 自动识别评教页面并注入操作按钮
- 自动填写单选题
- 自动勾选多选题
- 自动填充统一评语
- 支持“仅填充”模式，方便人工复核后再提交
- 支持“全自动评教循环”模式，可在多门课程之间连续执行
- 自动处理提交确认弹窗

## 运行环境

- 浏览器：Chrome、Edge 或其他支持用户脚本扩展的 Chromium 浏览器
- 脚本管理器：
  - [ScriptCat](https://docs.scriptcat.org/)
  - [Tampermonkey](https://www.tampermonkey.net/)
- 目标页面：
  - `*.edu.cn`
  - `*.mycospxk.com`

## 安装

### 方式一：直接安装仓库中的脚本

1. 安装 ScriptCat 或 Tampermonkey。
2. 打开脚本文件：
   - [auto.user.js](https://github.com/zhengge6/UJSCOURSE/raw/main/auto.user.js)
3. 在脚本管理器中确认安装。

### 方式二：手动复制安装

1. 打开仓库中的 [auto.user.js](./auto.user.js)。
2. 复制全部内容。
3. 在脚本管理器中新建脚本并粘贴保存。

## 使用方法

1. 登录学校评教系统并进入具体评教页面。
2. 脚本检测到页面后，会在页面顶部区域注入按钮。
3. 根据需要选择以下模式：
   - `仅填充`：只填内容，不自动提交
   - `全自动评教循环`：自动填充、提交、确认，并尝试跳转下一门
4. 如果已进入循环模式，可点击 `停止循环` 终止自动流程。

## 当前默认配置

脚本顶部内置了一组默认配置：

```javascript
const config = {
  autoSubmit: false,
  radio: [0, 1],
  checkbox: true,
  comment: "我对本课程非常满意，老师教学认真负责。",
  reviewHref: "answer"
};
```

配置含义：

- `autoSubmit`
  - 是否启用自动提交标记
  - 当前主要由按钮流程控制，默认不建议手动改动
- `radio`
  - 单选题评分范围
  - `0=非常同意, 1=同意, 2=一般, 3=不同意, 4=非常不同意`
  - `[0, 1]` 表示在前两个选项之间随机选择
- `checkbox`
  - 是否勾选多选题
- `comment`
  - 文本题默认评语
- `reviewHref`
  - 用于识别评教页面 URL 的关键字

## 工作机制

- 使用 `MutationObserver` 监听页面 DOM 变化
- 使用 `history.pushState` / `replaceState` 监听站内跳转
- 检测到评教区域后自动注入按钮
- 自动提交后轮询包含“下一”字样的按钮，尝试进入下一门课程
- 通过 `sessionStorage` 保存循环状态，刷新或页面跳转后可继续执行

## 已知限制

- 当前逻辑面向麦可思风格页面，若学校页面结构变更，脚本可能需要同步调整选择器
- “下一门”按钮依赖文字模糊匹配，不同学校或页面改版后可能失效
- 文本评语目前使用固定内容，不会自动生成多样化文本
- 仓库当前未单独提供 `LICENSE` 文件；脚本头部声明为 `MIT`

## 文件说明

- [auto.user.js](./auto.user.js)：主脚本
- [logo.png](./logo.png)：项目图标
- [OpenWrt.mtd1.bin](./OpenWrt.mtd1.bin)：仓库中现有二进制文件，和脚本功能无直接关系

## 后续维护建议

- 增加多个评语模板并随机选择
- 把选择器配置抽离，降低页面改版后的维护成本
- 为“下一门”检测增加更稳的页面状态判断
- 补充 `LICENSE` 文件和版本更新记录

## 免责声明

本项目仅用于前端自动化与用户脚本技术学习。请在了解学校相关规定和使用后果的前提下自行使用。
