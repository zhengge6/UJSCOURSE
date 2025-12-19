// ==UserScript==
// @name         自动评教：江苏大学
// @namespace    
// @version      2.3.0
// @author       Zheng 
// @description  基于v2.0.1核心逻辑，增加“全自动循环评教”功能。支持自动填充、自动提交、自动点击下一门、自动继续下一门，实现全程无人值守。
// @license      MIT
// @icon         https://ts3.tc.mm.bing.net/th/id/ODF.OBdTb_bnewqEd7HjDCi4mg?w=32&h=32&qlt=90&pcl=fffffa&o=6&pid=1.2
// @match        *://*.edu.cn/*
// @match        *://*.mycospxk.com/*
// @require      https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js
// @run-at       document-start
// ==/UserScript==

(function ($) {
  'use strict';

  // --- 核心配置 (保持原版偏好) ---
  const config = {
    // 自动提交开关（脚本内部管理，无需手动改）
    autoSubmit: false,
    // 评价内容: 0=非常同意, 1=同意
    radio: [0, 1],
    checkbox: true,
    comment: "我对本课程非常满意，老师教学认真负责。",
    
    // DOM 元素配置 (原版)
    reviewHref: "answer",
    reviewParentElement: "div.ant-tabs div.ant-tabs-bar div.ant-tabs-nav-container div.ant-tabs-nav-wrap div.ant-tabs-nav-scroll",
    reviewRadioField: ["非常", "", "一般", "不", "非常不"],
    reviewSubmitElement: ".ant-btn.ant-btn-primary:not(.--lcandy2-mycos-auto-review)",
    reviewModalElement: "div.ant-modal-body"
  };

  // --- 原版填充逻辑 (完全保留，确保不漏选) ---
  const fillInput = (element, value) => {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
    const inputEvent = new Event("input", { bubbles: true });
    nativeInputValueSetter.call(element, value);
    element.dispatchEvent(inputEvent);
  };
  
  const getRnd = (min, max) => {
    return Math.floor(Math.random() * (max + 1 - min)) + min;
  };

  const seleRadio = (selection, fixedTexts = ["非常", "", "一般", "不", "非常不"]) => {
    let positions = new Array(5).fill(-1);
    let result = false;
    let radioSelection = selection;
    $(".ant-radio-group").each((index, element) => {
      let options = $(element).find(".ant-radio-wrapper");
      options.each((index2, element2) => {
        let text = $(element2).text().trim();
        if (text.includes(fixedTexts[0]) && !text.includes(fixedTexts[4])) positions[0] = index2;
        if (text.includes(fixedTexts[4])) positions[4] = index2;
        if (text.includes(fixedTexts[3]) && !text.includes(fixedTexts[4])) positions[3] = index2;
        if (text.includes(fixedTexts[2])) positions[2] = index2;
        else if (index2 > 0 && index2 < 4) {
          let prevText = options.eq(index2 - 1).text().trim();
          let nextText = options.eq(index2 + 1).text().trim();
          let character1Prev = prevText.replace(fixedTexts[0], "").replace(fixedTexts[3], "");
          let character1Next = nextText.replace(fixedTexts[0], "").replace(fixedTexts[3], "");
          let character1Current = text.replace(fixedTexts[0], "").replace(fixedTexts[3], "");
          if (character1Current !== character1Prev && character1Current !== character1Next) positions[2] = index2;
        }
        if (fixedTexts[1] != "" && text.startsWith(fixedTexts[1])) positions[1] = index2;
        if (!text.includes(fixedTexts[0]) && !text.includes(fixedTexts[3]) && positions[2] !== index2 && positions[1] == -1) positions[1] = index2;
      });
      radioSelection.sort();
      let randomIndex = getRnd(radioSelection[0], radioSelection[radioSelection.length - 1]);
      if (positions[randomIndex] !== -1) {
        options.eq(positions[randomIndex]).trigger("click");
        result = true;
        positions = Array(5).fill(-1);
      }
    });
    return result;
  };

  const seleCheckbox = () => {
    let checkbox_list = $(".ant-checkbox-group");
    for (let i = 0; i < checkbox_list.length; i++) {
      let lists = checkbox_list[i].children;
      for (let j = 0; j < lists.length; j++) {
        let btn = $(checkbox_list[i]).find(".ant-checkbox-input")[j];
        $(btn).trigger("click");
      }
    }
    return true;
  };

  const fillComments = (comment) => {
    const textbox_list = $(".ant-input");
    for (let i = 0; i < textbox_list.length; i++) {
      const textArea = textbox_list[i];
      fillInput(textArea, comment);
    }
    return true;
  };

  const Review = () => {
    seleRadio(config.radio);
    seleCheckbox();
    fillComments(config.comment);
    console.log("[自动评教] 内容填充完成");
  };

  // --- 新增：自动处理下一门逻辑 ---
  
  // 核心：检测并点击“下一门课程”
  const checkAndClickNext = () => {
    console.log("[自动评教] 开始搜索“下一门”按钮...");
    let attempts = 0;
    
    // 每秒检测一次，持续检测20秒（防止网速慢）
    const timer = setInterval(() => {
      attempts++;
      // 模糊匹配按钮文字，兼容“下一门课程”、“下一位教师”等
      const $nextBtn = $("button").filter(function() {
        return $(this).text().trim().includes("下一");
      });

      if ($nextBtn.length) {
        clearInterval(timer);
        console.log("[自动评教] 发现目标，3秒后跳转...");
        $("button.--lcandy2-mycos-auto-review").text(`即将跳转下一门...`);
        
        setTimeout(() => {
          $nextBtn.trigger("click");
        }, 3000); // 3秒延迟，模拟人工，避免过快报错
      } else if (attempts > 20) {
        clearInterval(timer);
        // 如果找不到下一门，且当前开启了全自动，说明可能评完了
        if (sessionStorage.getItem('UJS_Auto_Loop') === 'true') {
           console.log("[自动评教] 未找到下一门，流程可能结束。");
           alert("自动评教流程结束，未检测到下一门课程。");
           sessionStorage.removeItem('UJS_Auto_Loop');
        }
      }
    }, 1000);
  };

  const executeReview = async (isAuto) => {
    Review(); // 执行填充
    const $submitButton = $(config.reviewSubmitElement);
    
    if (isAuto) {
      $submitButton.children().text("自动提交中...");
      setTimeout(() => {
        // 点击提交
        $(config.reviewSubmitElement).trigger("click");
        
        // 提交后，启动“下一门”检测
        checkAndClickNext();
      }, 500);
    } else {
      $submitButton.children().text("填充完成，请手动提交");
    }
  };

  // --- UI 与 状态管理 ---

  const addReviewButton = (listener) => {
    if ($("button.--lcandy2-mycos-auto-review").length) return;
    
    const $parentElement = $(config.reviewParentElement);
    // 样式美化
    const btnStyle = "margin-left: 10px; border-radius: 4px; font-weight: bold;";
    
    // 按钮1：停止/重置
    const $stopBtn = $(`<button type="button" class="ant-btn ant-btn-danger --lcandy2-mycos-auto-review" style="${btnStyle}">停止循环</button>`);
    $stopBtn.on("click", () => {
        sessionStorage.removeItem('UJS_Auto_Loop');
        alert("全自动循环已停止");
        location.reload();
    });

    // 按钮2：全自动开始
    const $startBtn = $(`<button type="button" class="ant-btn ant-btn-primary --lcandy2-mycos-auto-review" style="${btnStyle} background-color: #52c41a; border-color: #52c41a;">🚀 全自动评教循环</button>`);
    $startBtn.on("click", () => {
        const confirmed = confirm("确认开始【全自动评教】？\n\n脚本将自动：填充 -> 提交 -> 确认 -> 跳转下一门 -> 重复。\n\n请不要关闭浏览器。");
        if (confirmed) {
            sessionStorage.setItem('UJS_Auto_Loop', 'true');
            listener(true); // 立即开始当前页面的评教
        }
    });
    
    // 如果正在自动运行中，显示运行状态
    if (sessionStorage.getItem('UJS_Auto_Loop') === 'true') {
        $startBtn.text("♻️ 自动循环运行中...").prop("disabled", true);
        $parentElement.append($startBtn).append($stopBtn);
        
        // 自动触发逻辑 (延迟1.5秒等待页面稳定)
        console.log("[自动评教] 检测到自动循环标记，即将执行...");
        setTimeout(() => {
            listener(true);
        }, 1500);
    } else {
        // 未运行时，显示开始按钮
        // 同时也保留一个单次填充按钮（原版功能）
        const $onceBtn = $(`<button type="button" class="ant-btn --lcandy2-mycos-auto-review" style="${btnStyle}">仅填充</button>`);
        $onceBtn.on("click", () => listener(false));
        
        $parentElement.append($onceBtn).append($startBtn);
    }
  };

  const mycosTest = async () => {
    const configJs = $("script").filter((index, element) => {
      const src = $(element).attr("src");
      return src && src.includes("config.js");
    });
    if (!configJs.length) return false;
    const response = await fetch(configJs.attr("src"));
    const responseText = await response.text();
    return responseText.includes("mycos");
  };

  // --- 监听器 ---
  
  const watchUrlChange = (onChange) => {
    const originalPushState = history.pushState;
    history.pushState = function(state, title, url) {
      originalPushState.apply(this, arguments);
      onChange(url);
    };
    const originalReplaceState = history.replaceState;
    history.replaceState = function(state, title, url) {
      originalReplaceState.apply(this, arguments);
      onChange(url);
    };
    window.addEventListener("popstate", () => {
      onChange(document.location.href);
    });
  };

  // 这里的 removeModal 是处理提交后的“确认提交”弹窗
  const removeModal = ($button) => {
    // 只有在点击提交后，且按钮可用时才点击
    if (!$button.prop("disabled")) {
        console.log("[自动评教] 自动确认弹窗");
        $button.trigger("click");
    }
  };

  const main = () => {
    addReviewButton(executeReview);
  };

  const observer = (func, func2) => {
    const observer2 = new MutationObserver((mutations) => {
      for (let mutation of mutations) {
        if (mutation.addedNodes.length) {
          const $topContent = $(config.reviewParentElement);
          const href = window.location.href;
          const hrefTest = href.includes(config.reviewHref);
          
          if ($topContent.length && hrefTest) {
            // 这里不需要 disconnect，因为页面内跳转需要持续监听
            func(); 
          }
          
          const $modalBody = $(config.reviewModalElement);
          const $button = $modalBody.find("button.ant-btn-primary");
          if ($modalBody.length && $button.length) {
            // 如果开启了自动循环，或者是自动提交模式，则处理弹窗
            // 为了安全，我们只在点击了自动按钮后才自动确认弹窗
            if (sessionStorage.getItem('UJS_Auto_Loop') === 'true' || config.autoSubmit) {
                 func2($button);
            }
          }
        }
      }
    });
    observer2.observe(document.body, {
      childList: true,
      subtree: true
    });
  };

  $(async () => {
    if (!await mycosTest()) return;
    
    observer(main, removeModal);
    watchUrlChange((newUrl) => {
      // URL 变化时，重新注入按钮（如果需要）
      setTimeout(main, 1000);
    });
  });

})(jQuery);
