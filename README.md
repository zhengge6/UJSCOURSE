<div align="center">

<img src="https://github.com/zhengge6/UJSCOURSE/raw/main/logo.png" alt="UJSCOURSE Logo" height="120" style="border-radius:24px; margin-bottom: 20px;">

# UJS-AUTO-REVIEW

**✏️ 江苏大学自动评教助手**

[![Version](https://img.shields.io/badge/version-3.0.0-brightgreen?style=flat-square&logo=github)](https://github.com/zhengge6/UJSCOURSE)
[![ScriptCat](https://img.shields.io/badge/脚本猫-推荐-ff6b35?style=flat-square&logo=tampermonkey)](https://docs.scriptcat.org/)
[![Platform](https://img.shields.io/badge/platform-UserScript-blue?style=flat-square&logo=javascript)](https://docs.scriptcat.org/)
[![License](https://img.shields.io/badge/license-MIT-yellow?style=flat-square)](LICENSE)

<p style="font-size:16px; color:#6c757d;">自动化 · 智能 · 现代化视觉体验</p>

[🚀 快速开始](#-快速开始) • [📖 使用指南](#-使用指南) • [⚙️ 配置选项](#-配置选项) • [❓ 常见问题](#-常见问题)

</div>

---

## ✨ 核心特性

| 🚀 智能填充 | 🔄 双模式支持 | 🎯 高度兼容 | 🛠️ 灵活配置 |
| :--- | :--- | :--- | :--- |
| 自动识别单选/多选题型 | 「仅填充」安全校验模式 | 完美适配**麦可思**系统 | 自定义评价倾向 |
| 精准匹配分值逻辑 | 「填充并提交」高效模式 | 兼容主流浏览器 & 插件 | 无需代码知识即可调整 |
| 智能生成文本评价 | 操作透明，实时日志 | 支持 UJS 全部评教场景 | 模拟人工操作逻辑 |

---

## 🚀 快速开始

### ⚡ 三步完成配置

#### 1. 安装脚本管理器 (选其一)
* **🐱 脚本猫 (推荐)**：针对中文环境优化，功能强大且轻量。  
    [Edge 下载](https://microsoftedge.microsoft.com/addons/detail/%E8%84%9A%E6%9C%AC%E7%8C%AB/liilgpjgabokdklappibcjfablkpcekh) · [Chrome 下载](https://chrome.google.com/webstore/detail/scriptcat/ndcooeababalnlpkfedmmbbbgkljhpjf)
* **🐒 Tampermonkey**：全球最流行的用户脚本管理器。  
    [官方网站](https://www.tampermonkey.net/)

#### 2. 安装评教脚本
1. 点击本仓库的 `ujs.auto.js` (或对应脚本文件) 查看代码并复制。
2. 在脚本管理器中选择 **「新建脚本」**。
3. 替换默认内容并点击 **「保存」**。

#### 3. 开始使用
* 登录江苏大学评教系统。
* 进入评教页面后，页面会自动加载 **「一键评教」** 悬浮按钮。

---

## 📖 使用指南

### 🪄 最佳实践流程

1. **初次试用**：建议先使用 **「一键评教」** 模式。脚本会自动勾选选项并填写评语，但不会自动提交。
2. **人工复核**：检查填充的内容是否符合你的真实意图。
3. **高效模式**：确认配置无误后，可点击 **「评教并提交」** 一键完成。

> [!TIP]
> 脚本内置了随机偏移算法，每次选择的选项会在你设定的范围内浮动，模拟真实人工评价分布。

---

## ⚙️ 配置选项

你可以通过修改脚本头部的 `config` 常量来自定义行为：

```javascript
const config = {
  // 提交模式：true 自动提交 / false 仅填充内容
  autoSubmit: false,
  
  // 单选权重：0=非常同意, 1=同意, 2=一般, 3=不同意, 4=非常不同意
  // 例如 [0, 1] 表示会在“非常同意”和“同意”中随机选择
  radio: [0, 1],
  
  // 文本评价内容
  comment: "老师授课认真，逻辑清晰，受益匪浅。",
  
  // 系统选择器参数（通常无需修改）
  reviewHref: "answer"
};

```

---

## ❓ 常见问题

**Q: 为什么进入页面后没有显示按钮？** A: 请检查脚本是否已启用，或尝试刷新页面。如果学校更新了评教域名，请在 Issue 中反馈。

**Q: 脚本安全吗？会被后台察觉吗？** A: 脚本完全开源透明，模拟的是原生 DOM 点击事件，且支持随机选项，在技术特征上与人工点击保持一致。

**Q: 评价内容可以自动变化吗？** A: 可以在配置中修改 `comment` 内容，建议定期更换评语以保持反馈质量。

---

## 📄 开源协议

本项目采用 [MIT License](https://www.google.com/search?q=LICENSE) 开源。

<div align="center">

**Made with ❤️ for UJS Students**

Copyright © 2025 [zhengge6](https://github.com/zhengge6)

</div>

```

```
