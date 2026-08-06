<div align="center">

<img src="./logo.png" alt="UJSCOURSE Logo" width="112">

# UJSCOURSE

**Jiangsu University Course Evaluation Helper**

A userscript for MyCOS-based course evaluation pages, with auto fill, auto confirm, and continuous next-course processing.

[![Version](https://img.shields.io/badge/version-2.4.0-2f855a?style=flat-square)](./auto.user.js)
[![Platform](https://img.shields.io/badge/platform-UserScript-1f2937?style=flat-square)](https://docs.scriptcat.org/)
[![Engine](https://img.shields.io/badge/target-MyCOS-8b5cf6?style=flat-square)](https://www.mycospxk.com/)
[![License](https://img.shields.io/badge/license-MIT-f59e0b?style=flat-square)](./LICENSE)

[English](./README.md) · [简体中文](./README-zh.md)

[Quick Start](#quick-start) · [Features](#features) · [Configuration](#configuration) · [How It Works](#how-it-works) · [Notes](#notes)

</div>

---

## What Is This

`UJSCOURSE` is a userscript for Jiangsu University course evaluation workflows.

It injects action buttons into the evaluation page and helps with:

- auto-selecting radio options
- auto-selecting checkbox options
- auto-filling text comments
- auto-confirming submission dialogs
- continuously moving to the next course

This project works on the page itself through browser DOM interactions. It is not a backend tool or API client.

## Features

### 1. Fill Only

When you enter an evaluation page, the script injects a `Fill Only` button.

Clicking it will:

- select radio choices within the configured range
- select checkbox items on the page
- fill text areas with the configured comment

This mode does **not** submit automatically, which makes it better for review-first usage.

### 2. Full Auto Loop

Clicking `Full Auto Loop` will run this sequence:

1. fill the current evaluation form
2. click submit
3. confirm the dialog automatically
4. find a button containing "next"
5. continue on the next course page

Loop state is stored in `sessionStorage`, so the flow can continue after page navigation.

### 3. Stop Loop

While auto mode is running, a `Stop Loop` button is shown so the process can be stopped at any time.

## Quick Start

### Install a userscript manager

Recommended:

- [ScriptCat](https://docs.scriptcat.org/)
- [Tampermonkey](https://www.tampermonkey.net/)

### Install the script

Open and install directly:

- [auto.user.js](https://github.com/zhengge6/UJSCOURSE/raw/main/auto.user.js)

If your userscript manager does not capture it automatically, you can also copy the contents of [auto.user.js](./auto.user.js) into a new script manually.

### Use it

1. Log in to the school evaluation system
2. Open a course evaluation page
3. Wait for the script buttons to appear
4. Choose `Fill Only` or `Full Auto Loop`

## Configuration

Current default configuration:

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

Fields you will usually care about:

| Field | Purpose |
| --- | --- |
| `radio` | Range of radio choices. `[0, 1]` means random selection between the top two options |
| `checkbox` | Whether checkbox questions should be selected automatically |
| `comment` | Default text comment |
| `reviewHref` | Keyword used to detect evaluation pages |

Score index meaning:

- `0 = strongly agree`
- `1 = agree`
- `2 = neutral`
- `3 = disagree`
- `4 = strongly disagree`

## How It Works

The script currently depends on frontend page structure and browser behavior:

- uses `MutationObserver` to watch page changes
- hooks `history.pushState` and `replaceState` for in-site navigation
- checks page structure to detect evaluation areas
- auto-confirms modal dialogs when auto flow is active
- polls for a "next" button to continue the loop

This makes it lightweight, but also means it depends on the target page structure staying compatible.

## Files

| File | Description |
| --- | --- |
| [auto.user.js](./auto.user.js) | Main userscript |
| [logo.png](./logo.png) | Project logo |
| [LICENSE](./LICENSE) | MIT License, matching the script header |
| [README-zh.md](./README-zh.md) | Chinese README |

## Notes

- The current logic mainly targets MyCOS-style evaluation pages
- If the school updates the page structure, selectors may need adjustment
- The "next course" step relies on fuzzy text matching for buttons
- Text comments are currently fixed instead of randomly generated
- The repository includes a standalone `LICENSE` file matching the MIT header in the script

## Disclaimer

This project is intended for userscript and frontend automation learning. Please use it according to your own judgment and local rules.
