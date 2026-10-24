<div align="center">

<img src="./logo.png" alt="UJSCOURSE Jiangsu University auto course evaluation logo" width="112">

# UJSCOURSE · Jiangsu University Auto Course Evaluation

**Userscript for Jiangsu University (UJS) MyCOS / 麦可思 teaching-quality evaluation**

Desktop Tampermonkey / ScriptCat · full-auto next course · multi-teacher tabs · positive-only mix

[![Version](https://img.shields.io/badge/version-3.3.2-0ea5e9?style=flat-square)](./auto.user.js)
[![Platform](https://img.shields.io/badge/platform-Desktop%20only-111827?style=flat-square)](#access--entry)
[![Target](https://img.shields.io/badge/target-MyCOS%204.5.x-8b5cf6?style=flat-square)](https://ujs.mycospxk.com/)
[![GitHub stars](https://img.shields.io/github/stars/zhengge6/UJSCOURSE?style=flat-square)](https://github.com/zhengge6/UJSCOURSE/stargazers)
[![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-6b7280?style=flat-square)](./LICENSE)

[English](./README.md) · [简体中文](./README-zh.md) · [Releases](https://github.com/zhengge6/UJSCOURSE/releases) · [Issues](https://github.com/zhengge6/UJSCOURSE/issues)

[Access & Entry](#access--entry) · [Quick Start](#quick-start) · [Features](#features) · [FAQ](#faq) · [Disclaimer](#disclaimer) · [License](#license)

</div>

---

## What is this

**UJSCOURSE** is a browser userscript that helps **Jiangsu University (江苏大学 / UJS)** students complete **MyCOS (麦可思) teaching-quality / course-evaluation** tasks on desktop Chrome or Edge via [Tampermonkey](https://www.tampermonkey.net/) or [ScriptCat](https://docs.scriptcat.org/).

Search-friendly names: `UJSCOURSE`, `Jiangsu University auto evaluation`, `UJS MyCOS review`, `ujs.mycospxk.com userscript`, `教学质量管理平台`.

| Item | Detail |
|---|---|
| University | Jiangsu University (UJS) |
| Platform | MyCOS · `ujs.mycospxk.com` · portal app「教学质量管理平台」 |
| Deliverable | Readable userscript [`auto.user.js`](./auto.user.js) (ScriptCat-friendly) |
| Version | **v3.3.2** |
| Repo | https://github.com/zhengge6/UJSCOURSE |

> Not affiliated with, endorsed by, or sponsored by Jiangsu University or MyCOS / 麦可思.

---

## Access & Entry

> **Desktop web only.** Mobile / WeChat H5 / mini-programs are not supported.

### 1. Open the UJS portal

**http://ehall.ujs.edu.cn/**

### 2. Open the teaching-quality platform (MyCOS)

After login, search **教学质量管理平台** in the top bar, or open:

**https://ehall.ujs.edu.cn/appShow?appId=7411413317485319/**

Then go to **My Tasks → Unfinished** and open an evaluation form.

---

## Quick Start

1. Install [Tampermonkey](https://www.tampermonkey.net/) or [ScriptCat](https://docs.scriptcat.org/) on desktop Chrome / Edge.
2. Install [`auto.user.js`](https://raw.githubusercontent.com/zhengge6/UJSCOURSE/main/auto.user.js) (prefer [Releases](https://github.com/zhengge6/UJSCOURSE/releases)).
3. Enter the platform via [Access & Entry](#access--entry).
4. Use the floating panel → **Full auto**.

Also on answer pages:

- **One-click fill** — populate only  
- **Fill & submit** — fill every teacher tab and submit  

First run requires typing **同意** in the disclaimer modal. After **5** successful auto-submits, activation is required (QQ `1142573554` on the activation page).

---

## Features

| Capability | Detail |
|---|---|
| **Full auto** | Fill → submit → next course → next questionnaire |
| **Multi-teacher tabs** | Completes every instructor tab before submit |
| **Safe scoring** | Positive-only mix; never average/negative; never all-max |
| **Concurrency** | Optional multi-tab workers (`1`–`5`) |
| **MyCOS 4.5.x** | Handles reversed Likert order (poor → excellent) |
| **Gate** | Disclaimer + trial quota + server activation |

---

## FAQ

**Q: How do I find this project in search engines?**  
A: Search the brand **`UJSCOURSE`** or `zhengge6/UJSCOURSE`. Generic Chinese queries are competitive; the brand name is the reliable hit.

**Q: Is this the UJS course-grabber (正方选课)?**  
A: No. This repo only covers **MyCOS course evaluation**, not course selection.

**Q: ScriptCat vs Tampermonkey?**  
A: Both work. For ScriptCat store uploads, use the readable `auto.user.js` only (no heavy obfuscation).

**Q: Mobile support?**  
A: No. Use desktop Chrome / Edge.

---

## Configuration & development

Edit [`auto.src.js`](./auto.src.js), then:

```bash
npm install
npm run sync    # copies readable build → auto.user.js
```

Optional private obfuscated file (do **not** upload to ScriptCat): `npm run obfuscate` → `auto.obf.user.js`.

```js
{
  strongRatio: 0.35,
  strongMaxRatio: 0.5,
  minGoodCount: 1,
  concurrency: 1,
  comments: [ /* ... */ ],
}
```

---

## Disclaimer

On first launch you must type **同意** exactly to continue.

This project is for learning / testing only; do not use it for formal evaluations or in ways that violate school rules; you accept the consequences.

1. **Personal use only** on your own account and your own tasks.  
2. **No warranty.** Provided “as is”.  
3. **You are responsible** for university rules and applicable law.  
4. **No affiliation** with Jiangsu University or MyCOS / 麦可思.  
5. **Desktop scope only.**  
6. **Trial & activation** after 5 successful auto-submits.

---

## License

Copyright (c) 2026 Zheng. All rights reserved.

Personal installation and use on your own devices is welcome.  
Redistribution and commercial use require prior written permission.

Full terms: [`LICENSE`](./LICENSE).

---

## Project layout

```text
UJSCOURSE/
├── README.md / README-zh.md
├── LICENSE
├── logo.png
├── auto.src.js             # editable source
├── auto.user.js            # release / ScriptCat install (v3.3.2)
├── tools/sync-release.mjs
└── server/                 # activation UI + API
```

## Changelog

| Version | Notes |
|---|---|
| **3.3.2** | Smoother activation flow and docs |
| **3.3.1** | Activate in a web page |
| **3.2.x** | First-use confirmation; activation after trial |
| **3.1.0** | Full auto, multi-teacher, positive mix, concurrency, 4.5.x |

## Links

- GitHub: https://github.com/zhengge6/UJSCOURSE  
- Install: https://raw.githubusercontent.com/zhengge6/UJSCOURSE/main/auto.user.js  
- Portal: http://ehall.ujs.edu.cn/  

## Credits

Maintained by [Zheng](https://github.com/zhengge6). Earlier community work by lcandy2.
