<div align="center">

<img src="./logo.png" alt="UJSCOURSE Logo" width="112">

# UJSCOURSE

**江苏大学 MyCOS 4.5.x 自动评教辅助脚本**

仅适配电脑端 · 全自动循环 · 多教师 Tab · 好评混搭

[![Version](https://img.shields.io/badge/version-3.1.0-0ea5e9?style=flat-square)](./auto.user.js)
[![Platform](https://img.shields.io/badge/platform-仅电脑端-111827?style=flat-square)](#入口教程)
[![Target](https://img.shields.io/badge/target-MyCOS%204.5.x-8b5cf6?style=flat-square)](https://ujs.mycospxk.com/)
[![License](https://img.shields.io/badge/license-禁止擅自分发-dc2626?style=flat-square)](./LICENSE)

[English](./README.md) · [简体中文](./README-zh.md)

[入口教程](#入口教程) · [快速开始](#快速开始) · [功能](#功能) · [免责声明](#免责声明) · [许可协议](#许可协议)

</div>

---

## 入口教程

> **脚本只适配了电脑端！** 请使用电脑浏览器。手机 / 微信内置页未适配。

### 1. 访问综合门户

打开浏览器，输入并访问：

**http://ehall.ujs.edu.cn/**

### 2. 搜索并进入平台

登录后，在页面**顶端搜索栏**中输入「教学质量管理平台」，按下回车或点击搜索，在结果中打开官方入口。

对应链接：

**https://ehall.ujs.edu.cn/appShow?appId=7411413317485319/**

进入后打开 **我的任务 → 未完成**。

---

## 快速开始

1. 在电脑端安装 [Tampermonkey](https://www.tampermonkey.net/) 或 [ScriptCat](https://docs.scriptcat.org/)
2. 安装本仓库 [`auto.user.js`](./auto.user.js)（推荐从 Releases 安装）
3. 按 [入口教程](#入口教程) 进入评教平台
4. 在未完成任务或答卷页，使用右下角面板 → **全自动**

答卷页还可使用：

- **一键评教** — 只填充不提交  
- **评教并提交** — 填完全部教师 Tab 并提交当前课  

---

## 功能

| 能力 | 说明 |
|---|---|
| **全自动** | 填充 → 提交 → 下一课程 → 下一问卷 |
| **多教师 Tab** | 提交前自动填完每位教师 |
| **好评混搭** | 只要好评档；不全满分；无差评 / 一般 |
| **并发** | 可选多标签（`1`–`5`），各标签只交一门 |
| **MyCOS 4.5.x** | 适配「差 → 好」从左到右的选项顺序 |
| **悬浮面板** | 启动 / 停止 / 并发数 |

---

## 配置

在 `auto.user.js` 顶部的 `config` 中修改：

```js
{
  strongRatio: 0.35,      // 最正面占比
  strongMaxRatio: 0.5,    // 最正面上限，避免全满分
  minGoodCount: 1,        // 至少保留若干次正面
  concurrency: 1,         // 1=串行（推荐）；2–5=多标签
  comments: [ /* 评语池 */ ],
}
```

---

## 免责声明

1. **仅限本人使用。** 只可在你自己的账号上，完成你自己的评教任务。
2. **不提供任何担保。** 软件按现状提供。提交失败、账号受限、数据异常、学业或行政后果等，作者不承担责任。
3. **后果自负。** 须遵守江苏大学相关规定与法律法规。滥用（含代他人规模化评教、商业代评等）责任由使用者自行承担。
4. **非官方。** 本项目与江苏大学、麦可思 / MyCOS **无任何隶属或背书关系**。
5. **仅电脑端。** 移动端 / 小程序界面不在支持范围。
6. **禁止擅自分发。** 未经作者书面授权，不得传播、转载、镜像或二次分发，详见 [许可协议](#许可协议)。

---

## 许可协议

**专有协议（Proprietary）— 保留所有权利。**

Copyright (c) 2026 Zheng.

- 允许在你本人设备上，出于非商业、个人评教目的使用。
- **未经本人书面授权，不得分发、上传、转载、镜像或以任何形式分享本软件（含修改版）。**
- 未经授权，不得商用，不得封装为对外服务。

完整条款见 [`LICENSE`](./LICENSE)。

---

## 目录结构

```text
UJSCOURSE/
├── README.md / README-zh.md
├── LICENSE                 # 专有协议
├── logo.png
└── auto.user.js            # 用户脚本 v3.1.0
```

## 版本

| 版本 | 说明 |
|---|---|
| **3.1.0** | 全自动、多教师、好评混搭、多标签并发、适配 4.5.x |
| **2.5.0** | 历史 AI 辅助循环 |
| **2.4.x** | 历史连续下一门 |

## 致谢

维护：[Zheng](https://github.com/zhengge6)。早期社区基础：lcandy2。
