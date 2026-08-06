<div align="center">

<img src="./logo.png" alt="UJSCOURSE Logo" width="112">

# UJSCOURSE

**江苏大学评教辅助脚本**

一个面向麦可思评教页面的用户脚本，提供自动填充、自动确认、连续下一门等能力。

[![Version](https://img.shields.io/badge/version-2.4.0-2f855a?style=flat-square)](./auto.user.js)
[![Platform](https://img.shields.io/badge/platform-UserScript-1f2937?style=flat-square)](https://docs.scriptcat.org/)
[![Engine](https://img.shields.io/badge/target-MyCOS-8b5cf6?style=flat-square)](https://www.mycospxk.com/)
[![License](https://img.shields.io/badge/license-MIT-f59e0b?style=flat-square)](./LICENSE)

[English](./README.md) · [简体中文](./README-zh.md)

[快速开始](#快速开始) · [功能说明](#功能说明) · [配置项](#配置项) · [工作方式](#工作方式) · [注意事项](#注意事项)

</div>

---

## 这是什么

`UJSCOURSE` 是一个江苏大学评教辅助用户脚本。

它会在评教页面加载后自动注入操作按钮，帮助你完成：

- 单选题自动勾选
- 多选题自动勾选
- 文本评语自动填写
- 提交确认弹窗自动处理
- 多门课程连续评教

这个项目通过浏览器页面中的 DOM 交互工作，不是后端工具，也不是接口脚本。

## 功能说明

### 1. 仅填充

进入评教页面后，脚本会注入 `仅填充` 按钮。

点击后会：

- 按配置范围选择单选题
- 勾选页面中的多选题
- 填写统一评语

这一模式**不会自动提交**，更适合先检查再手动提交。

### 2. 全自动评教循环

点击 `全自动评教循环` 后，脚本会按顺序执行：

1. 填充当前页面内容
2. 点击提交
3. 自动确认弹窗
4. 搜索并点击包含"下一"字样的按钮
5. 在下一门课程页面继续重复

循环状态通过 `sessionStorage` 保存，所以页面跳转后可以继续运行。

### 3. 停止循环

当自动流程运行中，页面会显示 `停止循环` 按钮，可随时终止当前自动状态。

## 快速开始

### 安装脚本管理器

推荐任选其一：

- [ScriptCat](https://docs.scriptcat.org/)
- [Tampermonkey](https://www.tampermonkey.net/)

### 安装脚本

直接打开并安装：

- [auto.user.js](https://github.com/zhengge6/UJSCOURSE/raw/main/auto.user.js)

如果你的脚本管理器没有自动接管，也可以手动复制 [auto.user.js](./auto.user.js) 内容创建新脚本。

### 使用

1. 登录学校评教系统
2. 进入具体评教页面
3. 等待脚本注入按钮
4. 选择 `仅填充` 或 `全自动评教循环`

## 配置项

当前脚本内默认配置如下：

```javascript
const config = {
  autoSubmit: false,
  radio: [0, 1],
  checkbox: true,
  comment: "我对本课程非常满意，老师教学认真负责。",
  reviewHref: "answer",
  reviewParentElement: "div.ant-tabs div.ant-tabs-bar div.ant-tabs-nav-container div.ant-tabs-nav-wrap div.ant-tabs-nav-scroll",
  reviewRadioField: ["非常", "", "一般", "不", "非常不"],
  reviewSubmitElement: ".ant-btn.ant-btn-primary:not(.--lcandy2-mycos-auto-review)",
  reviewModalElement: "div.ant-modal-body"
};
```

你通常只需要关心这几个字段：

| 字段 | 作用 |
| --- | --- |
| `radio` | 控制单选题可选范围，`[0, 1]` 表示在"非常同意"和"同意"之间随机选择 |
| `checkbox` | 是否自动勾选多选题 |
| `comment` | 文本题默认评语 |
| `reviewHref` | 用于判断当前是否处于评教页面 |

评分索引含义：

- `0 = 非常同意`
- `1 = 同意`
- `2 = 一般`
- `3 = 不同意`
- `4 = 非常不同意`

## 工作方式

脚本当前依赖前端页面结构和浏览器行为：

- 使用 `MutationObserver` 监听页面变化
- 重写 `history.pushState` / `replaceState` 监听站内跳转
- 通过页面结构判断是否已进入评教区域
- 在自动流程开启时自动确认弹窗
- 轮询"下一门"按钮推进流程

这让脚本足够轻量，但也意味着它依赖目标页面结构保持兼容。

## 文件结构

| 文件 | 说明 |
| --- | --- |
| [auto.user.js](./auto.user.js) | 主脚本文件 |
| [logo.png](./logo.png) | 项目标识 |
| [LICENSE](./LICENSE) | MIT 许可证，与脚本头部声明一致 |
| [README.md](./README.md) | 英文 README |

## 注意事项

- 当前逻辑主要面向麦可思风格页面
- 如果学校页面结构改版，选择器可能需要同步更新
- "下一门"步骤依赖按钮文本模糊匹配
- 文本评语目前为固定内容，不会自动生成多样化文案
- 仓库已包含独立的 `LICENSE` 文件，与脚本头部声明的 MIT 一致

## 免责声明

本项目用于用户脚本与前端自动化技术学习。请结合实际场景、学校规则和个人判断自行使用。
