<div align="center">

<img src="./logo.png" alt="UJSCOURSE 江苏大学自动评教 Logo" width="112">

# UJSCOURSE · 江苏大学自动评教

**江苏大学（UJS）MyCOS / 麦可思教学质量管理平台自动评教用户脚本**

电脑端油猴 / 脚本猫 · 全自动下一课 · 多教师 Tab · 好评混搭 · 免差评

[![Version](https://img.shields.io/badge/version-3.3.2-0ea5e9?style=flat-square)](./auto.user.js)
[![Platform](https://img.shields.io/badge/platform-仅电脑端-111827?style=flat-square)](#入口教程)
[![Target](https://img.shields.io/badge/target-MyCOS%204.5.x-8b5cf6?style=flat-square)](https://ujs.mycospxk.com/)
[![GitHub stars](https://img.shields.io/github/stars/zhengge6/UJSCOURSE?style=flat-square)](https://github.com/zhengge6/UJSCOURSE/stargazers)
[![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-6b7280?style=flat-square)](./LICENSE)

[English](./README.md) · [简体中文](./README-zh.md) · [Releases](https://github.com/zhengge6/UJSCOURSE/releases) · [Issues](https://github.com/zhengge6/UJSCOURSE/issues)

[入口教程](#入口教程) · [快速开始](#快速开始) · [功能](#功能) · [常见问题](#常见问题-faq) · [免责声明](#免责声明) · [许可协议](#许可协议)

</div>

---

## 这是什么

**UJSCOURSE** 是面向 **江苏大学** 学生的 **MyCOS（麦可思）教学质量管理平台** 自动评教辅助脚本，运行在 Chrome / Edge 的 [Tampermonkey](https://www.tampermonkey.net/) 或 [脚本猫 ScriptCat](https://docs.scriptcat.org/) 上。

适合搜索关键词：`江苏大学自动评教`、`UJS 评教`、`ujs mycospxk`、`教学质量管理平台 自动`、`MyCOS 4.5 评教脚本`、`江苏大学 过程评价`。

| 项目 | 说明 |
|---|---|
| 学校 | 江苏大学 Jiangsu University（UJS） |
| 平台 | MyCOS / 麦可思 · `ujs.mycospxk.com` · 综合门户「教学质量管理平台」 |
| 形态 | 浏览器用户脚本 `auto.user.js`（可读源码，适合脚本猫上架） |
| 版本 | **v3.3.2** |
| 仓库 | https://github.com/zhengge6/UJSCOURSE |

> 本项目与江苏大学、麦可思 / MyCOS **无隶属或官方背书关系**，仅供本人学习测试与自用。

---

## 入口教程

> **只适配电脑端网页。** 手机浏览器、微信内置页、小程序未适配。

### 1. 打开江苏大学综合门户

在电脑浏览器访问：

**http://ehall.ujs.edu.cn/**

### 2. 进入教学质量管理平台（MyCOS）

登录后，在页面**顶端搜索栏**输入「**教学质量管理平台**」，打开官方入口。

直达（需已登录门户）：

**https://ehall.ujs.edu.cn/appShow?appId=7411413317485319/**

进入后一般会跳到 `ujs.mycospxk.com`。打开 **我的任务 → 未完成**，再点某门课的「评价」。

---

## 快速开始

1. 电脑安装 [Tampermonkey](https://www.tampermonkey.net/) 或 [脚本猫](https://docs.scriptcat.org/)
2. 安装本仓库脚本：[`auto.user.js`](https://raw.githubusercontent.com/zhengge6/UJSCOURSE/main/auto.user.js)（推荐从 [Releases](https://github.com/zhengge6/UJSCOURSE/releases) 安装，便于更新）
3. 按 [入口教程](#入口教程) 进入评教答卷页
4. 使用右下角悬浮面板 → **全自动**

答卷页还可：

- **一键评教** — 只填充不提交  
- **评教并提交** — 填完全部教师 Tab 并提交当前课  

首次使用须在弹窗中输入「**同意**」。自动成功提交满 **5** 门后需激活；在激活页加 QQ **1142573554** 获取激活码。

---

## 功能

| 能力 | 说明 |
|---|---|
| **全自动评教** | 填充 → 提交 → 下一课程 → 下一问卷 |
| **多教师 Tab** | 一门课多名教师时，提交前自动填完 |
| **好评混搭** | 仅好评档；不全满分；无差评 / 一般 |
| **多标签并发** | 可选 `1`–`5`，各标签只交一门 |
| **MyCOS 4.5.x** | 适配「差 → 好」从左到右的选项顺序 |
| **免责 + 激活** | 使用前确认；试用额度后服务端激活 |

---

## 常见问题 FAQ

**Q：搜「江苏大学自动评教」怎么找到本项目？**  
A：请优先搜品牌名 **`UJSCOURSE`** 或完整仓库地址 `github.com/zhengge6/UJSCOURSE`。通用词竞争大，品牌词更容易定位到本仓库。

**Q：和正方教务抢课是不是同一个？**  
A：不是。本项目只管 **MyCOS / 教学质量管理平台评教**，不管正方选课抢课。

**Q：脚本猫 / 油猴都能用吗？**  
A：可以。上架脚本猫请使用可读版 `auto.user.js`（不要上传重度混淆代码）。

**Q：手机能用吗？**  
A：不能。请用电脑 Chrome / Edge。

**Q：激活码怎么拿？**  
A：试用满 5 门后脚本会打开激活页；加 QQ `1142573554` 说明「评教激活」即可。

---

## 配置与开发

日常改 [`auto.src.js`](./auto.src.js)，再执行：

```bash
npm install
npm run sync    # 同步可读版 → auto.user.js（脚本猫 / GitHub 安装用）
```

可选私发混淆包（**不要**上脚本猫）：`npm run obfuscate` → `auto.obf.user.js`。

`config` 示例：

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

**首次打开脚本会弹窗。** 必须准确输入「同意」后才能使用。

弹窗文案：这个项目仅用于学习测试，不得用于正式/违反学校规定的测试，后果自担！

1. **仅限本人使用。** 只可在你自己的账号上，完成你自己的评教任务。  
2. **不提供任何担保。** 软件按现状提供。提交失败、账号受限、数据异常、学业或行政后果等，作者不承担责任。  
3. **后果自负。** 须遵守江苏大学相关规定与法律法规。滥用（含代他人规模化评教、商业代评等）责任由使用者自行承担。  
4. **非官方。** 与江苏大学、麦可思 / MyCOS 无任何隶属或背书关系。  
5. **仅电脑端。** 移动端 / 小程序不在支持范围。  
6. **试用与激活。** 自动评教成功满 5 门后需激活码。

---

## 许可协议

Copyright (c) 2026 Zheng. 保留所有权利。

欢迎在本人设备上安装、自用。  
对外分发或商用，请先取得作者书面许可。

完整条款见 [`LICENSE`](./LICENSE)。

---

## 目录结构

```text
UJSCOURSE/
├── README.md / README-zh.md
├── LICENSE
├── logo.png
├── auto.src.js             # 可读开发源码
├── auto.user.js            # 发布 / 脚本猫安装（v3.3.2）
├── tools/sync-release.mjs  # npm run sync
└── server/                 # 激活页与校验 API
```

## 版本

| 版本 | 说明 |
|---|---|
| **3.3.2** | 优化激活流程与说明文档 |
| **3.3.1** | 支持在网页完成激活 |
| **3.2.x** | 使用前须确认；试用后需激活 |
| **3.1.0** | 全自动、多教师、好评混搭、并发、适配 4.5.x |

## 相关链接

- GitHub：https://github.com/zhengge6/UJSCOURSE  
- 安装脚本：https://raw.githubusercontent.com/zhengge6/UJSCOURSE/main/auto.user.js  
- 门户：http://ehall.ujs.edu.cn/  
- 评教入口示例：https://ehall.ujs.edu.cn/appShow?appId=7411413317485319/  

## 致谢

维护：[Zheng](https://github.com/zhengge6)。早期社区基础：lcandy2。
