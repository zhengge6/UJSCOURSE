// ==UserScript==
// @name         自动评教：江苏大学
// @namespace
// @version      2.4.0
// @author       Zheng
// @description  自动评教助手：单选/多选/文本自动填充、全自动循环评教、随机评语、进度统计、AI 建议（仅建议不提交）。
// @license      MIT
// @icon         https://ts3.tc.mm.bing.net/th/id/ODF.OBdTb_bnewqEd7HjDCi4mg?w=32&h=32&qlt=90&pcl=fffffa&o=6&pid=1.2
// @match        *://*.edu.cn/*
// @match        *://*.mycospxk.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      *
// @require      https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js
// @run-at       document-start
// ==/UserScript==

(function ($) {
  'use strict';

  // NOTE: This script includes an optional "AI helper" panel that generates a suggestion plan
  // (structured JSON + UI highlights). It does NOT auto-submit; "apply" only fills options/comments.

  // --- 核心配置 ---
  const config = {
    // 自动提交开关（脚本内部管理，无需手动改）
    autoSubmit: false,
    // 评价内容: 0=非常同意, 1=同意
    radio: [0, 1],
    // 单选题语义匹配词表：0=最正向，4=最负向
    radioKeywords: [
      ["非常同意", "完全同意", "非常满意", "完全满意", "特别满意", "非常好", "优秀"],
      ["同意", "满意", "较满意", "良好", "好"],
      ["一般", "中立", "普通", "中等", "还行"],
      ["不同意", "不满意", "较差", "不好"],
      ["非常不同意", "完全不同意", "非常不满意", "完全不满意", "很差", "差"]
    ],
    checkbox: true,
    // 评语池：每次随机取一条（避免所有课程评语雷同）
    comments: [
      "我对本课程非常满意，老师教学认真负责。",
      "老师讲解清晰，课堂氛围好，收获很大。",
      "课程内容丰富，授课生动，受益匪浅。",
      "教学严谨细致，重点突出，非常喜欢。",
      "老师认真负责，答疑耐心，课程体验很好。",
      "课程安排合理，讲授深入浅出，好评。",
      "感谢老师一学期的辛勤付出，课程很棒。",
      "老师教学水平高，课堂互动充分，很满意。"
    ],
    comment: "我对本课程非常满意，老师教学认真负责。",
    // 下一门按钮关键词
    nextKeyword: "下一",
    ai: {
      enabled: true,
      endpoint: "https://api.openai.com/v1/chat/completions",
      apiKey: "",
      model: "gpt-4o-mini",
      temperature: 0.2
    },

    // DOM 元素配置
    reviewHref: "answer",
    reviewParentElement: "div.ant-tabs div.ant-tabs-bar div.ant-tabs-nav-container div.ant-tabs-nav-wrap div.ant-tabs-nav-scroll",
    reviewRadioField: ["非常", "", "一般", "不", "非常不"],
    reviewSubmitElement: ".ant-btn.ant-btn-primary:not(.--lcandy2-mycos-auto-review)",
    reviewModalElement: "div.ant-modal-body"
  };

  const gmGet = (key, fallback) => {
    try {
      if (typeof GM_getValue === "function") return GM_getValue(key, fallback);
    } catch (e) {}
    return fallback;
  };

  const gmSet = (key, value) => {
    try {
      if (typeof GM_setValue === "function") return GM_setValue(key, value);
    } catch (e) {}
  };

  const normalizeText = (text) => {
    return (text || "").replace(/\s+/g, "").replace(/[：:，,。.!！?？]/g, "").trim();
  };

  const safeJsonParse = (text) => {
    try { return JSON.parse(text); } catch (e) { return null; }
  };

  const getAiCfg = () => {
    const raw = gmGet("ujs_ai_cfg", "");
    if (!raw) return { ...config.ai };
    const parsed = safeJsonParse(raw);
    if (!parsed || typeof parsed !== "object") return { ...config.ai };
    return { ...config.ai, ...parsed };
  };

  const setAiCfg = (aiCfg) => {
    gmSet("ujs_ai_cfg", JSON.stringify(aiCfg || {}));
  };

  const callAi = (aiCfg, prompt, onOk, onErr) => {
    const payload = {
      model: aiCfg.model,
      temperature: aiCfg.temperature,
      messages: [
        { role: "system", content: "You are a helper that returns STRICT JSON only." },
        { role: "user", content: prompt }
      ]
    };

    const headers = {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + (aiCfg.apiKey || "")
    };

    const url = (aiCfg.endpoint || "").replace(/\/+$/, "");
    if (!url) return onErr("AI endpoint is empty");
    if (!aiCfg.apiKey) return onErr("AI apiKey is empty");

    if (typeof GM_xmlhttpRequest === "function") {
      GM_xmlhttpRequest({
        method: "POST",
        url,
        headers,
        data: JSON.stringify(payload),
        timeout: 45000,
        onload: (res) => {
          if (!res || res.status < 200 || res.status >= 300) return onErr("HTTP " + (res ? res.status : "?"));
          const data = safeJsonParse(res.responseText);
          if (!data) return onErr("Invalid JSON response");
          const content = data?.choices?.[0]?.message?.content;
          if (!content) return onErr("Empty AI content");
          onOk(content);
        },
        onerror: () => onErr("Network error"),
        ontimeout: () => onErr("Timeout")
      });
      return;
    }

    fetch(url, { method: "POST", headers, body: JSON.stringify(payload) })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status)))
      .then((data) => {
        const content = data?.choices?.[0]?.message?.content;
        if (!content) throw new Error("Empty AI content");
        onOk(content);
      })
      .catch((e) => onErr(String(e && e.message ? e.message : e)));
  };

  const extractSurvey = () => {
    const questions = [];

    $(".ant-radio-group").each((idx, groupEl) => {
      const $group = $(groupEl);
      const $options = $group.find(".ant-radio-wrapper");
      if (!$options.length) return;

      const $item = $group.closest(".ant-form-item");
      const labelText =
        $item.find(".ant-form-item-label").text().trim() ||
        $item.find("label").first().text().trim() ||
        "";

      const options = $options.map((_, opt) => $(opt).text().trim()).get();
      questions.push({
        type: "radio",
        label: labelText,
        options
      });
    });

    $(".ant-checkbox-group").each((idx, groupEl) => {
      const $group = $(groupEl);
      const $item = $group.closest(".ant-form-item");
      const labelText =
        $item.find(".ant-form-item-label").text().trim() ||
        $item.find("label").first().text().trim() ||
        "";

      const options = $group.find(".ant-checkbox-wrapper").map((_, opt) => $(opt).text().trim()).get();
      if (!options.length) return;
      questions.push({
        type: "checkbox",
        label: labelText,
        options
      });
    });

    const textAreas = $(".ant-input").map((_, el) => el).get().filter((el) => (el && el.tagName || "").toLowerCase() === "textarea");
    if (textAreas.length) {
      questions.push({
        type: "text",
        label: "Comment",
        options: []
      });
    }

    return { url: location.href, questions };
  };

  const buildAiPrompt = (survey, prefs) => {
    const minScore = Math.min.apply(null, prefs.radio);
    const maxScore = Math.max.apply(null, prefs.radio);
    return [
      "Return STRICT JSON only, no markdown, no explanation.",
      "",
      "Task: produce a suggestion plan for a course-evaluation form.",
      "Constraints:",
      "- Do NOT include any auto-submit instructions.",
      "- For radio questions, choose ONE option that matches the desired sentiment score range.",
      "- Desired score range: " + minScore + " to " + maxScore + " (0=most positive, 4=most negative).",
      "- For checkbox questions, you may choose all options (or leave empty if unsure).",
      '- Also return a "comment" string suggestion (can reuse the provided default).',
      "",
      "Output schema:",
      '{ "radio": [ { "q": "<label>", "pick": "<exact option text>" } ], "checkbox": [ { "q": "<label>", "pick": ["<exact option text>", "..."] } ], "comment": "<text>" }',
      "",
      "Form JSON:",
      JSON.stringify(survey),
      "",
      "Default comment:",
      prefs.comment
    ].join("\n");
  };

  const applyAiHighlight = (plan) => {
    $(".ujs-ai-hl").removeClass("ujs-ai-hl");

    const normalize = (s) => normalizeText(s);

    if (plan && Array.isArray(plan.radio)) {
      plan.radio.forEach((entry) => {
        const pick = normalize(entry && entry.pick);
        if (!pick) return;
        $(".ant-radio-wrapper").each((_, el) => {
          if (normalize($(el).text()) === pick) $(el).addClass("ujs-ai-hl");
        });
      });
    }

    if (plan && Array.isArray(plan.checkbox)) {
      plan.checkbox.forEach((entry) => {
        const picks = (entry && entry.pick) || [];
        const set = new Set(picks.map(normalize).filter(Boolean));
        if (!set.size) return;
        $(".ant-checkbox-wrapper").each((_, el) => {
          if (set.has(normalize($(el).text()))) $(el).addClass("ujs-ai-hl");
        });
      });
    }
  };

  // 按 AI 建议实际填充选项与评语（不提交）
  const applyAiPlan = (plan) => {
    const normalize = (s) => normalizeText(s);
    let applied = 0;

    if (plan && Array.isArray(plan.radio)) {
      plan.radio.forEach((entry) => {
        const pick = normalize(entry && entry.pick);
        if (!pick) return;
        $(".ant-radio-group").each((_, group) => {
          const $wrapper = $(group).find(".ant-radio-wrapper").filter(function() {
            return normalize($(this).text()) === pick;
          }).first();
          if ($wrapper.length && !$wrapper.find(".ant-radio-checked").length) {
            $wrapper.trigger("click");
            applied += 1;
          }
        });
      });
    }

    if (plan && Array.isArray(plan.checkbox)) {
      plan.checkbox.forEach((entry) => {
        const picks = (entry && entry.pick) || [];
        const set = new Set(picks.map(normalize).filter(Boolean));
        if (!set.size) return;
        $(".ant-checkbox-group").each((_, group) => {
          $(group).find(".ant-checkbox-wrapper").each((_, el) => {
            const $wrap = $(el);
            if (set.has(normalize($wrap.text())) && !$wrap.find(".ant-checkbox-checked").length) {
              $wrap.trigger("click");
              applied += 1;
            }
          });
        });
      });
    }

    const comment = (plan && plan.comment) || pickComment(config);
    if (comment) {
      fillComments(comment);
      applied += 1;
    }

    return applied;
  };

  const filterQuestionsForDebug = (patternText) => {
    $(".ujs-ai-hidden").removeClass("ujs-ai-hidden");
    const raw = (patternText || "").trim();
    if (!raw) return 0;

    let re = null;
    try {
      // Support /re/flags style, otherwise treat as case-insensitive substring regex.
      const m = raw.match(/^\/(.+)\/([gimsuy]*)$/);
      if (m) re = new RegExp(m[1], m[2]);
      else re = new RegExp(raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    } catch (e) {
      // If regex fails, fall back to substring matching.
      re = null;
    }

    const matches = (text) => {
      const t = String(text || "");
      if (re) return re.test(t);
      return t.toLowerCase().includes(raw.toLowerCase());
    };

    let shown = 0;
    $(".ant-form-item").each((_, itemEl) => {
      const $item = $(itemEl);
      const hasQuestion = $item.find(".ant-radio-group,.ant-checkbox-group,textarea.ant-input,.ant-input").length > 0;
      if (!hasQuestion) return;

      const labelText = $item.find(".ant-form-item-label").text().trim() || $item.find("label").first().text().trim();
      const optionText = $item.find(".ant-radio-wrapper,.ant-checkbox-wrapper").map((_, el) => $(el).text().trim()).get().join(" ");
      const hay = (labelText ? labelText + " " : "") + optionText;

      if (matches(hay)) {
        shown += 1;
      } else {
        $item.addClass("ujs-ai-hidden");
      }
    });

    return shown;
  };

  const ensureAiUi = () => {
    if (!config.ai.enabled) return;
    if (document.getElementById("ujs-ai-panel")) return;

    if (typeof GM_addStyle === "function") {
      GM_addStyle([
        "#ujs-ai-panel{position:fixed;right:20px;bottom:20px;z-index:2147483647;width:360px;max-height:70vh;display:none;flex-direction:column;overflow:hidden;",
        "background:rgba(18,18,24,.92);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.08);border-radius:14px;box-shadow:0 18px 60px rgba(0,0,0,.55);",
        "font-family:system-ui,Segoe UI,Arial;font-size:12px;color:rgba(255,255,255,.85)}",
        "#ujs-ai-panel.open{display:flex}",
        "#ujs-ai-hdr{display:flex;align-items:center;justify-content:space-between;padding:12px 12px;border-bottom:1px solid rgba(255,255,255,.06)}",
        "#ujs-ai-hdr b{color:#fff;font-size:13px}",
        "#ujs-ai-hdr button{border:none;background:rgba(255,255,255,.08);color:rgba(255,255,255,.8);border-radius:8px;padding:6px 8px;cursor:pointer}",
        "#ujs-ai-body{padding:10px 12px;overflow:auto;display:flex;flex-direction:column;gap:8px}",
        "#ujs-ai-body label{display:block;color:rgba(255,255,255,.7);margin-bottom:4px}",
        "#ujs-ai-body input{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#fff;border-radius:10px;padding:8px}",
        "#ujs-ai-body textarea{width:100%;box-sizing:border-box;min-height:86px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#fff;border-radius:10px;padding:8px;resize:vertical}",
        "#ujs-ai-actions{display:flex;gap:8px;padding:10px 12px;border-top:1px solid rgba(255,255,255,.06)}",
        "#ujs-ai-actions button{flex:1;border:none;border-radius:10px;padding:9px 10px;cursor:pointer;font-weight:700}",
        "#ujs-ai-run{background:#10b981;color:#052e2a}",
        "#ujs-ai-apply{background:#3b82f6;color:#fff}",
        "#ujs-ai-copy{background:rgba(255,255,255,.12);color:#fff}",
        "#ujs-ai-hl{background:rgba(255,255,255,.12);color:#fff}",
        "#ujs-ai-log{white-space:pre-wrap;font-family:ui-monospace,Consolas,monospace;color:rgba(255,255,255,.75);padding:0 12px 12px}",
        ".ujs-ai-hl{outline:2px solid rgba(59,130,246,.85);outline-offset:2px;border-radius:6px}",
        ".ujs-ai-hidden{display:none !important}"
      ].join(""));
    }

    const panel = document.createElement("div");
    panel.id = "ujs-ai-panel";
    panel.innerHTML = [
      '<div id="ujs-ai-hdr"><b>AI 助手（仅建议，不自动提交）</b><button id="ujs-ai-close">✕</button></div>',
      '<div id="ujs-ai-body">',
      '<div><label>接口地址</label><input id="ujs-ai-endpoint" placeholder="https://.../v1/chat/completions"></div>',
      '<div><label>API 密钥</label><input id="ujs-ai-key" placeholder="sk-..." type="password"></div>',
      '<div><label>模型</label><input id="ujs-ai-model" placeholder="gpt-4o-mini"></div>',
      '<div><label>温度</label><input id="ujs-ai-temp" placeholder="0.2"></div>',
      '<div><label>筛选（关键词或 /正则/flags）</label><input id="ujs-ai-filter" placeholder="e.g. 满意 或 /满意|一般/i"></div>',
      '<div><label>结果（JSON 建议）</label><textarea id="ujs-ai-result" placeholder="{...}"></textarea></div>',
      "</div>",
      '<div id="ujs-ai-actions">',
      '<button id="ujs-ai-run">生成建议</button>',
      '<button id="ujs-ai-apply">应用建议</button>',
      '<button id="ujs-ai-copy">复制</button>',
      "</div>",
      '<div id="ujs-ai-actions">',
      '<button id="ujs-ai-hl">高亮</button>',
      '<button id="ujs-ai-apply-filter">筛选</button>',
      '<button id="ujs-ai-clear-filter">清除</button>',
      '<button id="ujs-ai-dump">导出表单</button>',
      "</div>",
      '<div id="ujs-ai-log"></div>'
    ].join("");
    document.body.appendChild(panel);

    const aiCfg = getAiCfg();
    panel.querySelector("#ujs-ai-endpoint").value = aiCfg.endpoint || "";
    panel.querySelector("#ujs-ai-key").value = aiCfg.apiKey || "";
    panel.querySelector("#ujs-ai-model").value = aiCfg.model || "";
    panel.querySelector("#ujs-ai-temp").value = String(aiCfg.temperature ?? 0.2);

    const log = (msg) => {
      const el = panel.querySelector("#ujs-ai-log");
      el.textContent = (el.textContent ? el.textContent + "\n" : "") + msg;
    };

    panel.querySelector("#ujs-ai-close").onclick = () => panel.classList.remove("open");

    const saveCfgFromUi = () => {
      const next = {
        endpoint: panel.querySelector("#ujs-ai-endpoint").value.trim(),
        apiKey: panel.querySelector("#ujs-ai-key").value.trim(),
        model: panel.querySelector("#ujs-ai-model").value.trim(),
        temperature: Number(panel.querySelector("#ujs-ai-temp").value.trim() || "0.2")
      };
      setAiCfg(next);
      return next;
    };

    panel.querySelector("#ujs-ai-run").onclick = () => {
      const nextCfg = saveCfgFromUi();
      const survey = extractSurvey();
      if (!survey.questions.length) return log("[ERR] 当前页面未检测到问卷题目");

      const prompt = buildAiPrompt(survey, { radio: config.radio, comment: config.comment });
      log("[AI] 生成中...");

      callAi(nextCfg, prompt, (content) => {
        const trimmed = String(content).trim();
        panel.querySelector("#ujs-ai-result").value = trimmed;
        log("[OK] 已生成建议");
      }, (err) => {
        log("[ERR] " + err);
      });
    };

    panel.querySelector("#ujs-ai-apply").onclick = () => {
      const raw = panel.querySelector("#ujs-ai-result").value || "";
      const plan = safeJsonParse(raw);
      if (!plan) return log("[ERR] 结果不是合法 JSON");
      const applied = applyAiPlan(plan);
      applyAiHighlight(plan);
      log("[OK] 已应用 " + applied + " 处（仅填充，未提交）");
    };

    panel.querySelector("#ujs-ai-copy").onclick = async () => {
      const text = panel.querySelector("#ujs-ai-result").value || "";
      try {
        await navigator.clipboard.writeText(text);
        log("[OK] 已复制");
      } catch (e) {
        log("[ERR] 复制失败");
      }
    };

    panel.querySelector("#ujs-ai-hl").onclick = () => {
      const raw = panel.querySelector("#ujs-ai-result").value || "";
      const plan = safeJsonParse(raw);
      if (!plan) return log("[ERR] 结果不是合法 JSON");
      applyAiHighlight(plan);
      log("[OK] 已高亮（未自动点击）");
    };

    panel.querySelector("#ujs-ai-apply-filter").onclick = () => {
      const patternText = panel.querySelector("#ujs-ai-filter").value || "";
      const shown = filterQuestionsForDebug(patternText);
      log("[OK] 筛选完成，显示 " + shown + " 题");
    };

    panel.querySelector("#ujs-ai-clear-filter").onclick = () => {
      panel.querySelector("#ujs-ai-filter").value = "";
      filterQuestionsForDebug("");
      log("[OK] 已清除筛选");
    };

    panel.querySelector("#ujs-ai-dump").onclick = async () => {
      const survey = extractSurvey();
      const text = JSON.stringify(survey, null, 2);
      panel.querySelector("#ujs-ai-result").value = text;
      try {
        await navigator.clipboard.writeText(text);
        log("[OK] 已导出并复制表单 JSON");
      } catch (e) {
        log("[OK] 已导出表单 JSON（复制失败）");
      }
    };
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

  const getRadioScoreByText = (text, radioKeywords) => {
    const normalized = normalizeText(text);
    if (!normalized) return -1;

    for (let score = radioKeywords.length - 1; score >= 0; score--) {
      if (radioKeywords[score].some((keyword) => normalized.includes(normalizeText(keyword)))) {
        return score;
      }
    }

    return -1;
  };

  const mapRadioOptions = ($options, radioKeywords) => {
    const positions = new Array(5).fill(-1);
    const unmatched = [];

    $options.each((optionIndex, optionElement) => {
      const text = $(optionElement).text().trim();
      const score = getRadioScoreByText(text, radioKeywords);
      if (score !== -1 && positions[score] === -1) {
        positions[score] = optionIndex;
      } else if (score === -1) {
        unmatched.push(optionIndex);
      }
    });

    const matchedCount = positions.filter((position) => position !== -1).length;
    if (matchedCount >= 3) return positions;

    if ($options.length === 5) {
      return [0, 1, 2, 3, 4];
    }

    unmatched.forEach((optionIndex) => {
      const firstEmpty = positions.findIndex((position) => position === -1);
      if (firstEmpty !== -1) {
        positions[firstEmpty] = optionIndex;
      }
    });

    return positions;
  };

  const seleRadio = (selection, radioKeywords = config.radioKeywords) => {
    let result = false;
    const radioSelection = [...selection].sort((a, b) => a - b);

    $(".ant-radio-group").each((index, element) => {
      const $options = $(element).find(".ant-radio-wrapper");
      if (!$options.length) return;

      const positions = mapRadioOptions($options, radioKeywords);
      const availableScores = radioSelection.filter((score) => positions[score] !== -1);
      if (!availableScores.length) {
        console.warn("[自动评教] 单选题未匹配到可用选项：", $options.map((_, option) => $(option).text().trim()).get());
        return;
      }

      const chosenScore = availableScores[getRnd(0, availableScores.length - 1)];
      $options.eq(positions[chosenScore]).trigger("click");
      result = true;
    });

    return result;
  };

  const seleCheckbox = () => {
    let checkbox_list = $(".ant-checkbox-group");
    for (let i = 0; i < checkbox_list.length; i++) {
      const inputs = $(checkbox_list[i]).find(".ant-checkbox-input");
      inputs.each((_, input) => {
        if (!input.checked) {
          $(input).trigger("click");
        }
      });
    }
    return true;
  };

  const pickComment = (cfg) => {
    const pool = (cfg.comments || []).filter((c) => c && c.trim());
    if (pool.length) return pool[getRnd(0, pool.length - 1)];
    return cfg.comment;
  };

  // 只填充 textarea，避免把评语写进普通输入框（学号/搜索框等）
  const fillComments = (comment) => {
    const textbox_list = $(".ant-input").filter(function() {
      return (this.tagName || "").toLowerCase() === "textarea" && !this.disabled;
    });
    for (let i = 0; i < textbox_list.length; i++) {
      const textArea = textbox_list[i];
      fillInput(textArea, comment);
    }
    return true;
  };

  const Review = () => {
    seleRadio(config.radio);
    seleCheckbox();
    fillComments(pickComment(config));
    console.log("[自动评教] 内容填充完成");
  };

  // --- 自动处理下一门逻辑 ---

  // 读取/累加已完成课程数（sessionStorage，页面跳转后仍保留）
  const getDoneCount = () => {
    return parseInt(sessionStorage.getItem("UJS_COUNT") || "0", 10) || 0;
  };

  const incDoneCount = () => {
    const next = getDoneCount() + 1;
    sessionStorage.setItem("UJS_COUNT", String(next));
    return next;
  };

  // 核心：检测并点击“下一门课程”
  const checkAndClickNext = () => {
    console.log("[自动评教] 开始搜索“下一门”按钮...");
    let attempts = 0;

    // 每秒检测一次，持续检测30秒（防止网速慢）
    const timer = setInterval(() => {
      attempts++;
      // 模糊匹配可见按钮文字，兼容“下一门课程”、“下一位教师”等
      const $nextBtn = $("button").filter(function() {
        return $(this).text().trim().includes(config.nextKeyword) && $(this).is(":visible");
      });
      // 弹窗（如确认框）尚未关闭时不点击，避免误点
      const modalOpen = $(".ant-modal-wrap:visible").length > 0;

      if ($nextBtn.length && !modalOpen) {
        clearInterval(timer);
        console.log("[自动评教] 发现目标，3秒后跳转...");
        const $markBtn = $("button.--lcandy2-mycos-auto-review");
        if ($markBtn.length) $markBtn.text("即将跳转下一门...");

        setTimeout(() => {
          $nextBtn.trigger("click");
        }, getRnd(2500, 3800)); // 2.5~3.8秒延迟，模拟人工，避免过快报错
      } else if (attempts > 30) {
        clearInterval(timer);
        // 如果找不到下一门，且当前开启了全自动，说明可能评完了
        if (sessionStorage.getItem('UJS_Auto_Loop') === 'true') {
           const done = getDoneCount();
           console.log("[自动评教] 未找到下一门，流程可能结束。");
           alert("自动评教流程结束，共完成 " + done + " 门课程。");
           sessionStorage.removeItem('UJS_Auto_Loop');
        }
      }
    }, 1000);
  };

  const executeReview = async (isAuto) => {
    Review(); // 执行填充
    const $submitButton = $(config.reviewSubmitElement);

    if (isAuto) {
      if ($submitButton.length) {
        incDoneCount();
        $submitButton.text("自动提交中...");
      }
      setTimeout(() => {
        // 点击提交
        $(config.reviewSubmitElement).trigger("click");

        // 提交后，启动“下一门”检测
        checkAndClickNext();
      }, 500);
    } else {
      if ($submitButton.length) $submitButton.text("填充完成，请手动提交");
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
            sessionStorage.setItem('UJS_COUNT', '0'); // 新一轮从 0 计数
            listener(true); // 立即开始当前页面的评教
        }
    });

    // 如果正在自动运行中，显示运行状态与进度
    if (sessionStorage.getItem('UJS_Auto_Loop') === 'true') {
        const done = getDoneCount();
        $startBtn.text("♻️ 自动循环运行中 · 已完成 " + done + " 门").prop("disabled", true);
        $parentElement.append($startBtn).append($stopBtn);

        // 自动触发逻辑 (延迟1.5秒等待页面稳定)
        console.log("[自动评教] 检测到自动循环标记，即将执行...");
        setTimeout(() => {
            listener(true);
        }, 1500);
    } else {
        // 未运行时，显示开始按钮
        // 同时也保留一个单次填充按钮
        const $onceBtn = $(`<button type="button" class="ant-btn --lcandy2-mycos-auto-review" style="${btnStyle}">仅填充</button>`);
        $onceBtn.on("click", () => listener(false));

        const $aiBtn = $(`<button type="button" class="ant-btn --lcandy2-mycos-auto-review" style="${btnStyle}">AI建议</button>`);
        $aiBtn.on("click", () => {
          ensureAiUi();
          const panel = document.getElementById("ujs-ai-panel");
          if (panel) panel.classList.add("open");
        });

        $parentElement.append($onceBtn).append($startBtn).append($aiBtn);
    }
  };

  const mycosTest = async () => {
    try {
      const configJs = $("script").filter((index, element) => {
        const src = $(element).attr("src");
        return src && src.includes("config.js");
      });
      if (!configJs.length) return false;
      const response = await fetch(configJs.attr("src"));
      if (!response.ok) return false;
      const responseText = await response.text();
      return responseText.includes("mycos");
    } catch (e) {
      return false;
    }
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
