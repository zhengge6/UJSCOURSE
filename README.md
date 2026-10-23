<div align="center">

<img src="./logo.png" alt="UJSCOURSE Logo" width="112">

# UJSCOURSE

**Jiangsu University course-evaluation helper for MyCOS 4.5.x**

Desktop userscript · full-auto loop · multi-teacher tabs · positive-only scoring

[![Version](https://img.shields.io/badge/version-3.1.0-0ea5e9?style=flat-square)](./auto.user.js)
[![Platform](https://img.shields.io/badge/platform-Desktop%20only-111827?style=flat-square)](#access--entry)
[![Target](https://img.shields.io/badge/target-MyCOS%204.5.x-8b5cf6?style=flat-square)](https://ujs.mycospxk.com/)
[![License](https://img.shields.io/badge/license-Proprietary-dc2626?style=flat-square)](./LICENSE)

[English](./README.md) · [简体中文](./README-zh.md)

[Access & Entry](#access--entry) · [Quick Start](#quick-start) · [Features](#features) · [Disclaimer](#disclaimer) · [License](#license)

</div>

---

## Access & Entry

> **Desktop only.** This script is built for the **PC web** evaluation UI. Mobile / WeChat H5 is not supported.

### 1. Open the university portal

In a desktop browser, visit:

**http://ehall.ujs.edu.cn/**

### 2. Search and open the platform

After login, use the **top search bar**, type **教学质量管理平台**, press Enter, then open the official result.

Direct app link:

**https://ehall.ujs.edu.cn/appShow?appId=7411413317485319/**

You should land on the MyCOS teaching-quality portal (e.g. `ujs.mycospxk.com`). Open **My Tasks → Unfinished**.

---

## Quick Start

1. Install [Tampermonkey](https://www.tampermonkey.net/) or [ScriptCat](https://docs.scriptcat.org/) on **desktop** Chrome / Edge.
2. Install [`auto.user.js`](./auto.user.js) from this repository (Releases recommended).
3. Enter the platform via [Access & Entry](#access--entry).
4. On an unfinished-task or answer page, use the floating panel → **Full auto**.

Answer-page shortcuts:

- **One-click fill** — populate only  
- **Fill & submit** — fill every teacher tab and submit the current course  

---

## Features

| Capability | Detail |
|---|---|
| **Full auto** | Fill → submit → next course → next questionnaire |
| **Multi-teacher tabs** | Completes every instructor tab before submit |
| **Safe scoring** | Positive-only mix (top / second-tier); never “average” or negative; never all-max |
| **Concurrency** | Optional multi-tab workers (`1`–`5`) |
| **MyCOS 4.5.x** | Correct handling of reversed Likert order (poor → excellent) |
| **Floating control** | Start / stop / concurrency |

---

## Configuration

Edit `config` inside `auto.user.js`:

```js
{
  strongRatio: 0.35,      // share of top-tier positives
  strongMaxRatio: 0.5,    // cap so a form cannot be all-max
  minGoodCount: 1,        // at least one second-tier positive
  concurrency: 1,         // 1 = serial (recommended); 2–5 = multi-tab
  comments: [ /* ... */ ],
}
```

---

## Disclaimer

1. **Personal use only.** Use this software only on **your own** account to complete **your own** evaluation tasks.
2. **No warranty.** The software is provided “as is”. The author is not responsible for failed submits, account restrictions, data loss, or any academic / administrative consequences.
3. **You are responsible.** You must follow Jiangsu University rules and applicable laws. Misuse (including assisting others at scale, commercial “evaluation services”, or abuse of the platform) is solely your liability.
4. **No affiliation.** This project is **not** affiliated with, endorsed by, or sponsored by Jiangsu University or MyCOS / 麦可思.
5. **Desktop scope.** Mobile layouts and mini-programs are out of scope; behavior there is undefined.
6. **Distribution locked.** Redistribution without the author’s written authorization is prohibited — see [License](#license).

---

## License

**Proprietary — All Rights Reserved.**

Copyright (c) 2026 Zheng.

- Personal, non-commercial use on your own devices is allowed.
- **Redistribution, republishing, mirroring, or sharing (modified or not) without prior written authorization is forbidden.**
- Commercial use and third-party service wrapping are forbidden without authorization.

See [`LICENSE`](./LICENSE) for the full terms.

---

## Project layout

```text
UJSCOURSE/
├── README.md / README-zh.md
├── LICENSE                 # Proprietary
├── logo.png
└── auto.user.js            # Userscript v3.1.0
```

## Changelog

| Version | Notes |
|---|---|
| **3.1.0** | Full auto, multi-teacher, positive mix, multi-tab concurrency, 4.5.x scales |
| **2.5.0** | Prior AI-assisted loop (historical) |
| **2.4.x** | Prior continuous next-course flow |

## Credits

Maintained by [Zheng](https://github.com/zhengge6). Earlier community work by lcandy2.
