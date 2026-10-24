// ==UserScript==
// @name         UJSCOURSE · 江苏大学自动评教
// @namespace    
// @version      3.3.0
// @author       Zheng
// @description  MyCOS 4.5.x 全自动评教：多教师 Tab、自动提交、自动下一课程/下一问卷；好评混搭（不全满分、无差评）；可选多标签并发。
// @license      All Rights Reserved
// @icon         https://ts3.tc.mm.bing.net/th/id/ODF.OBdTb_bnewqEd7HjDCi4mg?w=32&h=32&qlt=90&pcl=fffffa&o=6&pid=1.2
// @match        *://*.edu.cn/*
// @match        *://*.mycospxk.com/*
// @updateURL    https://raw.githubusercontent.com/zhengge6/UJSCOURSE/main/auto.user.js
// @downloadURL  https://raw.githubusercontent.com/zhengge6/UJSCOURSE/main/auto.user.js
// @supportURL   https://github.com/zhengge6/UJSCOURSE/issues
// @homepageURL  https://github.com/zhengge6/UJSCOURSE
// @require      https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js
// @run-at       document-end
// @grant        GM_openInTab
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      119.3.127.104
// @connect      raw.githubusercontent.com
// @connect      github.com
// ==/UserScript==

(function ($) {
  'use strict';

  const STORAGE_KEY = 'ujs_auto_review_state_v33';
  const PANEL_ID = 'ujs-auto-review-panel';
  const LS_DISC = 'ujs_ar_disc_v32';
  const LS_ACT = 'ujs_ar_act_v32';
  const LS_DONE = 'ujs_ar_done_v32';
  const LS_GH = 'ujs_ar_gh_opened_v33';
  const FREE_QUOTA = 5;
  const QQ_CONTACT = '1142573554';
  const GH_HOME = 'https://github.com/zhengge6';
  const DISCLAIMER_TEXT =
    '这个项目仅用于学习测试，不得用于正式/违反学校规定的测试，后果自担！';

  /* endpoint assembled at runtime (anti-casual patch) — public :80 /ujs-act */
  const apiRoot = () => {
    const parts = ['aHR0cDovLw==', 'MTE5LjMu', 'MTI3LjEwNC8=', 'dWpzLWFjdA=='];
    return parts.map((p) => atob(p)).join('');
  };
  const epActivate = () => apiRoot() + ['/', 'v', '1', '/', 'act', 'ivate'].join('');
  const epVerify = () => apiRoot() + ['/', 'v', '1', '/', 'ver', 'ify'].join('');

  const config = {
    // 语义档位只允许 0/1：最正面 / 次正面。禁止一般及差评
    radio: [0, 1],
    // 最正面占比（其余用次正面）。不能为 1，否则易被拒（全满分）
    strongRatio: 0.35,
    // 单卷内最正面题数上限比例
    strongMaxRatio: 0.5,
    // 至少保留几道次正面
    minGoodCount: 1,
    checkbox: true,
    comments: [
      '课程内容充实，讲解清楚，收获较大。',
      '老师认真负责，课堂节奏合适。',
      '整体满意度较高，希望继续保持。',
      '内容易懂，互动较好，总体满意。',
      '授课条理清晰，学习收获明显。'
    ],
    reviewHref: 'answer',
    delayTab: 400,
    delayAfterFill: 500,
    delayAfterSubmit: 1800,
    delayNav: 1200,
    // 多标签并发数（1=单页串行全自动；>1 时在课程列表页拆分到多个标签）
    concurrency: 2,
    buttonClass: '--lcandy2-mycos-auto-review',
    reviewSubmitElement: '.ant-btn.ant-btn-primary:not(.--lcandy2-mycos-auto-review)',
    reviewModalElement: 'div.ant-modal-body',
    buttonParents: [
      'div[class*="submitContext"]',
      'div.ant-tabs-nav-scroll',
      'div.ant-tabs-nav-wrap',
      'div[class*="AnswerFinalEvaluate"][class*="top"]',
      'div[class*="index__answer"]',
      'main',
      'body'
    ]
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const log = (...args) => console.log('[UJS Auto Review]', ...args);
  const getRnd = (min, max) => Math.floor(Math.random() * (max + 1 - min)) + min;

  const loadState = () => {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) {
      return {};
    }
  };
  const saveState = (patch) => {
    const next = Object.assign(loadState(), patch, { updatedAt: Date.now() });
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  };
  const clearState = () => sessionStorage.removeItem(STORAGE_KEY);

  const getDoneCount = () => Number(localStorage.getItem(LS_DONE) || 0) || 0;
  const bumpDoneCount = () => {
    const n = getDoneCount() + 1;
    localStorage.setItem(LS_DONE, String(n));
    return n;
  };
  // 同意一次即可（localStorage 持久）
  const hasDisclaimer = () => localStorage.getItem(LS_DISC) === '1';
  const setDisclaimer = () => localStorage.setItem(LS_DISC, '1');
  const readAct = () => {
    try {
      return JSON.parse(localStorage.getItem(LS_ACT) || 'null');
    } catch (e) {
      return null;
    }
  };
  const isActivated = () => {
    const t = readAct();
    return !!(t && t.token && Number(t.exp) * 1000 > Date.now());
  };
  const needsActivation = () => getDoneCount() >= FREE_QUOTA && !isActivated();
  const deviceId = () => {
    let id = localStorage.getItem('ujs_ar_dev_v32');
    if (!id) {
      id =
        'd' +
        Math.random().toString(36).slice(2) +
        Date.now().toString(36) +
        (navigator.userAgent || '').length;
      localStorage.setItem('ujs_ar_dev_v32', id);
    }
    return id.slice(0, 64);
  };

  const gmPost = (url, body) =>
    new Promise((resolve, reject) => {
      const payload = JSON.stringify(body);
      if (typeof GM_xmlhttpRequest === 'function') {
        GM_xmlhttpRequest({
          method: 'POST',
          url,
          headers: { 'Content-Type': 'application/json' },
          data: payload,
          timeout: 15000,
          onload: (res) => {
            try {
              resolve({ status: res.status, data: JSON.parse(res.responseText || '{}') });
            } catch (e) {
              reject(e);
            }
          },
          onerror: () => reject(new Error('network')),
          ontimeout: () => reject(new Error('timeout'))
        });
        return;
      }
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      })
        .then(async (r) => ({ status: r.status, data: await r.json().catch(() => ({})) }))
        .then(resolve)
        .catch(reject);
    });

  const waitBody = () =>
    new Promise((resolve) => {
      if (document.body) return resolve(document.body);
      const mo = new MutationObserver(() => {
        if (document.body) {
          mo.disconnect();
          resolve(document.body);
        }
      });
      mo.observe(document.documentElement, { childList: true });
    });

  const showOverlayModal = async ({ title, bodyHtml, footerHtml }) => {
    await waitBody();
    const id = 'ujs-gate-modal';
    $('#' + id).remove();
    const $box = $(`
        <div id="${id}" style="position:fixed;inset:0;z-index:2147483646;background:rgba(8,12,20,.78);display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(4px)">
          <div style="width:min(420px,100%);background:#0f172a;color:#e2e8f0;border-radius:14px;box-shadow:0 20px 50px #0008;border:1px solid #334155;overflow:hidden;font:14px/1.55 system-ui,sans-serif">
            <div style="padding:16px 18px 8px;font-weight:700;font-size:16px">${title}</div>
            <div class="ujs-gate-body" style="padding:4px 18px 12px">${bodyHtml}</div>
            <div class="ujs-gate-foot" style="padding:0 18px 16px;display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">${footerHtml}</div>
          </div>
        </div>
      `);
    $(document.body).append($box);
    return $box;
  };

  const openGitHubOnce = () => {
    if (localStorage.getItem(LS_GH) === '1') return;
    localStorage.setItem(LS_GH, '1');
    try {
      if (typeof GM_openInTab === 'function') {
        GM_openInTab(GH_HOME, { active: true, setParent: true });
      } else {
        window.open(GH_HOME, '_blank', 'noopener');
      }
    } catch (e) {
      /* ignore */
    }
  };

  const showThanksQQ = async () => {
    if (document.getElementById('ujs-gate-modal')) return;
    const $box = await showOverlayModal({
      title: '评教完成',
      bodyHtml: `
        <p style="margin:0 0 10px">本轮评教已跑完。</p>
        <p style="margin:0 0 8px">如果脚本对你有帮助，可以加个 QQ 好友：</p>
        <p style="margin:0;font-size:22px;font-weight:700;letter-spacing:1px;color:#93c5fd">${QQ_CONTACT}</p>
        <p style="margin:10px 0 0;opacity:.7;font-size:12px">复制后到 QQ 添加即可；不强制。</p>
      `,
      footerHtml: `
        <button type="button" class="ujs-qq-copy" style="padding:8px 12px;border:0;border-radius:8px;background:#334155;color:#e2e8f0;cursor:pointer">复制 QQ</button>
        <button type="button" class="ujs-qq-ok" style="padding:8px 16px;border:0;border-radius:8px;background:#1677ff;color:#fff;cursor:pointer;font-weight:600">好的</button>
      `
    });
    $box.find('.ujs-qq-copy').on('click', async () => {
      try {
        await navigator.clipboard.writeText(QQ_CONTACT);
        $box.find('.ujs-qq-copy').text('已复制');
      } catch (e) {
        $box.find('.ujs-qq-copy').text(QQ_CONTACT);
      }
    });
    $box.find('.ujs-qq-ok').on('click', () => $box.remove());
  };

  const markAllDone = () => {
    setStatus('全部问卷已处理完');
    saveState({ running: false });
    showThanksQQ();
  };

  const ensureDisclaimer = async () => {
    if (hasDisclaimer()) return true;
    const $box = await showOverlayModal({
      title: '使用前须知',
      bodyHtml: `
        <p style="margin:0 0 10px;opacity:.95">${DISCLAIMER_TEXT}</p>
        <p style="margin:0 0 8px;opacity:.75;font-size:12px">请在下方输入「同意」后继续（须完全一致）。首次使用会打开作者 GitHub 主页。</p>
        <input class="ujs-disc-input" type="text" placeholder="请输入：同意" style="width:100%;box-sizing:border-box;padding:10px 12px;border-radius:8px;border:1px solid #475569;background:#1e293b;color:#f8fafc;outline:none"/>
        <div class="ujs-disc-err" style="color:#f87171;font-size:12px;margin-top:6px;min-height:18px"></div>
      `,
      footerHtml: `
        <button type="button" class="ujs-disc-ok" style="padding:8px 16px;border:0;border-radius:8px;background:#1677ff;color:#fff;cursor:pointer;font-weight:600">继续</button>
      `
    });
    return new Promise((resolve) => {
      const tryOk = () => {
        const v = ($box.find('.ujs-disc-input').val() || '').trim();
        if (v !== '同意') {
          $box.find('.ujs-disc-err').text('请准确输入「同意」');
          return;
        }
        setDisclaimer();
        $box.remove();
        openGitHubOnce();
        resolve(true);
      };
      $box.find('.ujs-disc-ok').on('click', tryOk);
      $box.find('.ujs-disc-input').on('keydown', (e) => {
        if (e.key === 'Enter') tryOk();
      });
    });
  };

  const ensureActivation = async (force = false) => {
    if (!force && !needsActivation()) return true;
    if (!force && isActivated()) return true;
    const $box = await showOverlayModal({
      title: '需要激活码',
      bodyHtml: `
        <p style="margin:0 0 8px">免费试用已用完（已评 <b>${getDoneCount()}</b> / ${FREE_QUOTA} 门）。</p>
        <p style="margin:0 0 10px">请联系 QQ <b style="color:#93c5fd">${QQ_CONTACT}</b> 获取激活码后继续使用。</p>
        <input class="ujs-act-input" type="text" placeholder="输入激活码，例如 UJS-XXXX-XXXX" style="width:100%;box-sizing:border-box;padding:10px 12px;border-radius:8px;border:1px solid #475569;background:#1e293b;color:#f8fafc;outline:none;letter-spacing:.5px"/>
        <div class="ujs-act-err" style="color:#f87171;font-size:12px;margin-top:6px;min-height:18px"></div>
      `,
      footerHtml: `
        <button type="button" class="ujs-act-later" style="padding:8px 12px;border:0;border-radius:8px;background:#334155;color:#e2e8f0;cursor:pointer">稍后再说</button>
        <button type="button" class="ujs-act-ok" style="padding:8px 16px;border:0;border-radius:8px;background:#1677ff;color:#fff;cursor:pointer;font-weight:600">激活</button>
      `
    });
    return new Promise((resolve) => {
      $box.find('.ujs-act-later').on('click', () => {
        $box.remove();
        resolve(false);
      });
      $box.find('.ujs-act-ok').on('click', async () => {
        const code = ($box.find('.ujs-act-input').val() || '').trim().toUpperCase();
        if (!code) {
          $box.find('.ujs-act-err').text('请输入激活码');
          return;
        }
        $box.find('.ujs-act-ok').prop('disabled', true).text('校验中…');
        try {
          const res = await gmPost(epActivate(), { code, device: deviceId() });
          if (!res.data || !res.data.ok || !res.data.token) {
            $box.find('.ujs-act-err').text((res.data && res.data.msg) || '激活失败');
            $box.find('.ujs-act-ok').prop('disabled', false).text('激活');
            return;
          }
          localStorage.setItem(
            LS_ACT,
            JSON.stringify({ token: res.data.token, exp: res.data.exp, at: Date.now() })
          );
          $box.remove();
          setStatus('激活成功');
          resolve(true);
        } catch (e) {
          $box.find('.ujs-act-err').text('无法连接激活服务器，请稍后重试');
          $box.find('.ujs-act-ok').prop('disabled', false).text('激活');
        }
      });
    });
  };

  const gateBeforeRun = async () => {
    if (!hasDisclaimer()) {
      const agreed = await ensureDisclaimer();
      if (!agreed) return false;
    }
    if (needsActivation()) {
      const ok = await ensureActivation(true);
      if (!ok) {
        setStatus(`已评 ${getDoneCount()} 门，需激活后继续（QQ ${QQ_CONTACT}）`);
        saveState({ running: false, stop: true });
        return false;
      }
    }
    return true;
  };

  const pageKind = (href = location.href) => {
    if (/#\/my-task\/answer\//.test(href)) return 'answer';
    if (/#\/my-task\/details\//.test(href)) return 'details';
    if (/#\/my-task\/main\//.test(href)) return 'main';
    return 'other';
  };

  const fillInput = (element, value) => {
    const proto = element.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    nativeSetter.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const isNegativeAnchor = (t) =>
    /非常不|非常差|不满意|^差$|^不$|不同意/.test(t);
  const isStrongPositive = (t) =>
    /非常好|非常同意|非常满意/.test(t) && !/非常不/.test(t);
  const isSoftPositive = (t) => /^好$|^同意$|^满意$/.test(t);

  const rankOptions = (texts) => {
    const n = texts.length;
    const positions = { strong: -1, good: -1 };
    texts.forEach((t, idx) => {
      if (isStrongPositive(t)) positions.strong = idx;
      else if (isSoftPositive(t)) positions.good = idx;
    });
    if (positions.strong < 0 || positions.good < 0) {
      const first = texts[0] || '';
      const last = texts[n - 1] || '';
      const badFirst = isNegativeAnchor(first) || isStrongPositive(last);
      if (badFirst) {
        if (positions.strong < 0) positions.strong = n - 1;
        if (positions.good < 0) positions.good = Math.max(0, n - 2);
      } else {
        if (positions.strong < 0) positions.strong = 0;
        if (positions.good < 0) positions.good = Math.min(1, n - 1);
      }
    }
    return positions;
  };

  /** 好好评混搭：只要好评，不全满分，无差评 */
  const seleRadio = () => {
    const $groups = $('.ant-radio-group');
    const total = $groups.length;
    if (!total) return false;

    let strongBudget = Math.floor(total * config.strongRatio);
    const strongCap = Math.floor(total * config.strongMaxRatio);
    strongBudget = Math.min(strongBudget, Math.max(0, strongCap));
    if (total - strongBudget < config.minGoodCount) {
      strongBudget = Math.max(0, total - config.minGoodCount);
    }

    // 随机挑 strongBudget 道题给最正面
    const strongSlots = new Set();
    while (strongSlots.size < strongBudget) {
      strongSlots.add(getRnd(0, total - 1));
    }

    $groups.each((qi, group) => {
      const $options = $(group).find('.ant-radio-wrapper');
      if (!$options.length) return;
      const texts = $options.map((_, el) => $(el).text().trim()).get();
      const pos = rankOptions(texts);
      const useStrong = strongSlots.has(qi);
      const domIdx = useStrong ? pos.strong : pos.good;
      const $target = $options.eq(domIdx);
      const input = $target.find('input.ant-radio-input, input[type="radio"]')[0];
      if (input) input.click();
      $target.trigger('click');
      log(`[单选] #${qi + 1} → ${texts[domIdx]}`);
    });
    return true;
  };

  const seleCheckbox = (checkAll) => {
    let hit = false;
    $('.ant-checkbox-group').each((_, group) => {
      $(group).find('.ant-checkbox-wrapper').each((__, wrap) => {
        const $wrap = $(wrap);
        const checked = $wrap.find('.ant-checkbox-checked').length > 0;
        if ((checkAll && !checked) || (!checkAll && checked)) {
          const input = $wrap.find('input.ant-checkbox-input, input[type="checkbox"]')[0];
          if (input) input.click();
          $wrap.trigger('click');
          hit = true;
        }
      });
    });
    return hit;
  };

  const fillComments = () => {
    const list = config.comments.filter(Boolean);
    if (!list.length) return false;
    let hit = false;
    $('textarea.ant-input, textarea').each((_, el) => {
      if (el.disabled || el.readOnly) return;
      fillInput(el, list[getRnd(0, list.length - 1)]);
      hit = true;
    });
    return hit;
  };

  const fillCurrentForm = () => {
    log(seleRadio() ? '单选已填（好评混搭）' : '无单选');
    log(seleCheckbox(config.checkbox) ? '多选已处理' : '无多选');
    log(fillComments() ? '文本已填' : '无文本');
  };

  const teacherTabs = () =>
    $('.ant-tabs-tab').filter((_, el) => {
      const text = ($(el).text() || '').trim();
      return text && !/进行中|已结束|未完成|已完成|全部/.test(text);
    });

  const fillAllTeacherTabs = async () => {
    const $tabs = teacherTabs();
    if ($tabs.length <= 1) {
      fillCurrentForm();
      return $tabs.length || 1;
    }
    for (let i = 0; i < $tabs.length; i++) {
      const $tab = $tabs.eq(i);
      $tab.trigger('click');
      await sleep(config.delayTab);
      log(`教师 Tab: ${$tab.text().trim()}`);
      fillCurrentForm();
    }
    return $tabs.length;
  };

  const dismissNoiseModals = () => {
    $(config.reviewModalElement).each((_, body) => {
      const text = ($(body).text() || '');
      if (!/须知|说明|提示|知道了|开始评价|微信公众号|关注/.test(text)) return;
      const $btn = $(body).find('button.ant-btn-primary, button').filter((__, b) => {
        const t = ($(b).text() || '') + ($(b).attr('aria-label') || '');
        return /知道了|确定|关闭|Close|开始|我知道/.test(t) || $(b).hasClass('ant-modal-close');
      });
      if ($btn.length) $btn.first().trigger('click');
      else $(body).closest('.ant-modal-wrap').find('.ant-modal-close').trigger('click');
    });
    $('.ant-modal-close').each((_, el) => {
      const wrap = $(el).closest('.ant-modal-wrap');
      if (/微信公众号|关注/.test(wrap.text() || '')) $(el).trigger('click');
    });
  };

  const findSubmitButton = () => {
    const $btns = $(config.reviewSubmitElement).add('button.ant-btn-primary');
    return $btns.filter((_, el) => {
      const t = (($(el).text() || '')).replace(/\s+/g, '');
      return t === '提交' || t.includes('提交');
    }).filter((_, el) => !el.disabled && !/已提交/.test($(el).text() || ''));
  };

  const isSubmitted = () => {
    const t = $('button').map((_, el) => ($(el).text() || '').replace(/\s+/g, '')).get().join('|');
    return /已提交/.test(t);
  };

  const clickNextCourse = () => {
    const $btn = $('button').filter((_, el) => /下一课程/.test(($(el).text() || '')) && !el.disabled);
    if (!$btn.length) return false;
    $btn.first().trigger('click');
    return true;
  };

  const clickEvalSpans = (root = document) =>
    $(root)
      .find('span[class*="edit"], td span, button')
      .filter((_, el) => (($(el).text() || '').trim() === '评价'));

  const waitFor = async (fn, timeout = 15000, step = 300) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const v = fn();
      if (v) return v;
      await sleep(step);
    }
    return null;
  };

  const setStatus = (text) => {
    const $s = $(`#${PANEL_ID} .ujs-status`);
    if ($s.length) $s.text(text);
    saveState({ statusText: text });
    log(text);
  };

  const submitCurrent = async () => {
    await sleep(config.delayAfterFill);
    const $btn = findSubmitButton();
    if (!$btn.length) {
      if (isSubmitted()) return true;
      throw new Error('未找到可点击的提交按钮');
    }
    $btn.first().trigger('click');
    const ok = await waitFor(() => isSubmitted(), 12000, 400);
    if (!ok) throw new Error('提交后未出现「已提交」');
    return true;
  };

  /** 单页：填完全部教师并提交 */
  const runAnswerOnce = async () => {
    if (!(await gateBeforeRun())) throw new Error('需要激活码');
    dismissNoiseModals();
    await waitFor(() => $('.ant-radio-group').length > 0, 10000);
    const n = await fillAllTeacherTabs();
    setStatus(`已填 ${n} 个教师，提交中…`);
    await submitCurrent();
    const total = bumpDoneCount();
    saveState({ doneCount: total });
    setStatus(`提交成功，累计 ${total} 门`);
    if (needsActivation()) {
      saveState({ running: false, stop: true });
      setStatus(`已达免费额度 ${FREE_QUOTA} 门，请激活后继续`);
      await ensureActivation(true);
      if (!isActivated()) throw new Error('需要激活码');
    }
  };

  /** 全自动：当前答卷 → 下一课程 循环；没有下一课程则回列表 */
  const runFullAutoAnswerLoop = async () => {
    saveState({ running: true, mode: 'full', stop: false });
    setStatus('全自动运行中…');
    try {
      while (loadState().running && !loadState().stop) {
        if (pageKind() !== 'answer') break;
        dismissNoiseModals();
        if (!isSubmitted()) {
          await runAnswerOnce();
        } else {
          setStatus('本课已提交，准备下一课程…');
        }
        await sleep(config.delayAfterSubmit);
        if (loadState().stop) break;
        const hrefBefore = location.href;
        if (!clickNextCourse()) {
          setStatus('没有「下一课程」，返回任务列表…');
          saveState({ running: true, phase: 'after-batch' });
          // 回课程列表
          const $back = $('a, button, span').filter((_, el) => /过程评价|任务列表|专项评价|返回/.test(($(el).text() || '').trim()));
          if ($back.length) $back.first().trigger('click');
          else history.back();
          await sleep(config.delayNav);
          break;
        }
        await waitFor(() => location.href !== hrefBefore, 10000);
        await sleep(config.delayNav);
      }
    } catch (e) {
      setStatus(`出错：${e.message || e}`);
      saveState({ running: false, lastError: String(e.message || e) });
      throw e;
    }
  };

  /** 课程详情页：点第一门未评，或并发开多标签 */
  const runDetailsAuto = async () => {
    dismissNoiseModals();
    await waitFor(() => clickEvalSpans().length > 0, 10000);
    const $evals = clickEvalSpans();
    if (!$evals.length) {
      setStatus('课程列表没有「评价」入口');
      saveState({ running: false });
      return;
    }

    const concurrency = Math.max(1, Number(loadState().concurrency || config.concurrency) || 1);
    if (concurrency <= 1 || typeof GM_openInTab !== 'function') {
      setStatus(`打开第 1 / ${$evals.length} 门课…`);
      $evals.first().trigger('click');
      await waitFor(() => pageKind() === 'answer', 10000);
      await sleep(config.delayNav);
      await runFullAutoAnswerLoop();
      return;
    }

    // 多标签并发：先串行采集 answer URL，再开多个标签跑全自动
    setStatus(`采集课程链接用于 ${concurrency} 并发…`);
    const urls = [];
    const total = $evals.length;
    for (let i = 0; i < total; i++) {
      if (loadState().stop) break;
      const href0 = location.href;
      // 重新取，避免 DOM 失效
      const $now = clickEvalSpans();
      if (!$now.eq(i).length) break;
      $now.eq(i).trigger('click');
      const ok = await waitFor(() => pageKind() === 'answer', 8000);
      if (ok) {
        const u = location.href;
        if (!urls.includes(u)) urls.push(u);
        setStatus(`已采集 ${urls.length}/${total}`);
        history.back();
        await waitFor(() => pageKind() === 'details' || location.href !== u, 8000);
        await sleep(500);
      } else {
        if (location.href !== href0) history.back();
        await sleep(500);
      }
    }

    if (!urls.length) {
      setStatus('未能采集到答卷链接，改单页模式');
      const $again = clickEvalSpans();
      if ($again.length) $again.first().trigger('click');
      await waitFor(() => pageKind() === 'answer', 10000);
      await runFullAutoAnswerLoop();
      return;
    }

    // 分波并发：每波打开 concurrency 个标签，各只交一门
    saveState({ running: true, mode: 'concurrent', seedUrls: urls, seedIndex: 0 });
    const waveSize = concurrency;
    const wave = urls.slice(0, waveSize);
    setStatus(`并发第1波：打开 ${wave.length} 个标签（共 ${urls.length} 门）`);
    wave.forEach((u, idx) => {
      const sep = u.includes('?') ? '&' : '?';
      const link = u + sep + 'ujs_auto=1';
      if (idx === 0) {
        location.href = link;
      } else if (typeof GM_openInTab === 'function') {
        GM_openInTab(link, { active: false, setParent: true });
      }
    });
    await waitFor(() => pageKind() === 'answer', 10000);
    // 本页作为 worker 只交当前门
    if (!isSubmitted()) await runAnswerOnce();
    setStatus('本波当前页已提交。其余标签独立完成；全部完成后回列表点「全自动」续跑即可');
    saveState({ running: false, seedIndex: waveSize });
  };

  /** 任务主列表：依次点问卷「评价」 */
  const runMainAuto = async () => {
    dismissNoiseModals();
    await waitFor(() => clickEvalSpans().length > 0, 10000);
    const $evals = clickEvalSpans();
    if (!$evals.length) {
      markAllDone();
      return;
    }
    setStatus(`进入问卷 1 / ${$evals.length}`);
    saveState({ running: true, mode: 'full', mainIndex: 0, mainTotal: $evals.length });
    $evals.first().trigger('click');
    await waitFor(() => pageKind() === 'details' || pageKind() === 'answer', 10000);
    await sleep(config.delayNav);
    if (pageKind() === 'details') await runDetailsAuto();
    else if (pageKind() === 'answer') await runFullAutoAnswerLoop();
  };

  const startFullAuto = async () => {
    if (!(await gateBeforeRun())) return;
    saveState({
      running: true,
      stop: false,
      mode: 'full',
      doneCount: getDoneCount(),
      concurrency: Number($(`#${PANEL_ID} .ujs-conc`).val() || config.concurrency)
    });
    dismissNoiseModals();
    const kind = pageKind();
    setStatus(`全自动启动（页面: ${kind}）`);
    try {
      if (kind === 'answer') await runFullAutoAnswerLoop();
      else if (kind === 'details') await runDetailsAuto();
      else if (kind === 'main') await runMainAuto();
      else {
        location.href = 'https://ujs.mycospxk.com/index.html#/my-task/main/UnFinished';
        await sleep(2000);
        await runMainAuto();
      }
    } catch (e) {
      setStatus(`全自动停止：${e.message || e}`);
      saveState({ running: false });
    }
  };

  const stopFullAuto = () => {
    saveState({ running: false, stop: true });
    setStatus('已请求停止');
  };

  const findButtonParent = () => {
    for (const sel of config.buttonParents) {
      const $el = $(sel).first();
      if ($el.length) return $el;
    }
    return $('body');
  };

  const addAnswerButtons = () => {
    if (pageKind() !== 'answer') return;
    if ($(`button.${config.buttonClass}`).length) return;
    const $parent = findButtonParent();
    const $fill = $(
      `<button type="button" class="ant-btn ant-btn-default ${config.buttonClass}" style="margin-left:8px">一 键 评 教</button>`
    ).on('click', async () => {
      try {
        if (!(await gateBeforeRun())) return;
        await fillAllTeacherTabs();
        setStatus('仅填充完成（未提交）');
      } catch (e) {
        setStatus(String(e.message || e));
      }
    });
    const $fillSubmit = $(
      `<button type="button" class="ant-btn ant-btn-primary ${config.buttonClass}" style="margin-left:8px">评 教 并 提 交</button>`
    ).on('click', async () => {
      try {
        await runAnswerOnce();
      } catch (e) {
        setStatus(String(e.message || e));
      }
    });
    $parent.append($fill).append($fillSubmit);
  };

  const ensurePanel = () => {
    if (document.getElementById(PANEL_ID)) return;
    const st = loadState();
    const $panel = $(`
      <div id="${PANEL_ID}" style="position:fixed;right:16px;bottom:16px;z-index:999999;background:#111c;color:#fff;padding:12px 14px;border-radius:10px;font:13px/1.4 sans-serif;min-width:220px;box-shadow:0 8px 24px #0006;backdrop-filter:blur(6px)">
        <div style="font-weight:700;margin-bottom:6px">UJS 评教 ${'3.3.0'}</div>
        <div class="ujs-status" style="margin-bottom:8px;opacity:.9">${st.statusText || `待命 · 已评 ${getDoneCount()} 门 · 好评混搭`}</div>
        <label style="display:flex;align-items:center;gap:6px;margin-bottom:8px">并发
          <input class="ujs-conc" type="number" min="1" max="5" value="${st.concurrency || config.concurrency}" style="width:48px;color:#111;border-radius:4px;border:0;padding:2px 4px"/>
        </label>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button type="button" class="ujs-full" style="flex:1;padding:6px 8px;border:0;border-radius:6px;background:#1677ff;color:#fff;cursor:pointer">全自动</button>
          <button type="button" class="ujs-stop" style="padding:6px 8px;border:0;border-radius:6px;background:#555;color:#fff;cursor:pointer">停止</button>
        </div>
        <div style="margin-top:8px;opacity:.7;font-size:12px">只选好评/次好评，不全满分</div>
      </div>
    `);
    $panel.find('.ujs-full').on('click', () => startFullAuto());
    $panel.find('.ujs-stop').on('click', () => stopFullAuto());
    $panel.find('.ujs-conc').on('change', function () {
      const v = Math.min(5, Math.max(1, Number(this.value) || 1));
      this.value = v;
      config.concurrency = v;
      saveState({ concurrency: v });
    });
    $('body').append($panel);
  };

  const mycosTest = async () => {
    if (/mycospxk\.com/i.test(location.hostname)) return true;
    if ($('a:contains("MyCOS"), [class*="MyCOS"]').length) return true;
    const $configJs = $('script').filter((_, el) => (($(el).attr('src') || '').includes('config.js')));
    if (!$configJs.length) return false;
    try {
      const text = await (await fetch($configJs.attr('src'))).text();
      return /mycos/i.test(text);
    } catch (e) {
      return false;
    }
  };

  const watchUrlChange = (onChange) => {
    const wrap = (fn) =>
      function () {
        const ret = fn.apply(this, arguments);
        onChange(location.href);
        return ret;
      };
    history.pushState = wrap(history.pushState);
    history.replaceState = wrap(history.replaceState);
    window.addEventListener('popstate', () => onChange(location.href));
    window.addEventListener('hashchange', () => onChange(location.href));
  };

  const onRoute = async () => {
    dismissNoiseModals();
    ensurePanel();
    addAnswerButtons();

    const st = loadState();
    const autoParam = /[?&]ujs_auto=1/.test(location.href) || /[?&]ujs_auto=1/.test(location.hash);

    // 并发子标签：只处理当前这一门，绝不点「下一课程」，避免多标签抢同一队列
    if (autoParam && pageKind() === 'answer' && !st.workerStarted) {
      saveState({ workerStarted: true, running: true, mode: 'worker' });
      setTimeout(async () => {
        try {
          setStatus('并发子任务：填写并提交当前课程');
          if (!isSubmitted()) await runAnswerOnce();
          setStatus('并发子任务完成');
          saveState({ running: false, workerStarted: true });
        } catch (e) {
          setStatus(`并发子任务失败：${e.message || e}`);
          saveState({ running: false });
        }
      }, 800);
      return;
    }

    // 全自动跨页续跑
    if (st.running && !st.stop) {
      if (pageKind() === 'answer') {
        setTimeout(() => runFullAutoAnswerLoop(), 600);
      } else if (pageKind() === 'details' && st.phase === 'after-batch') {
        // 一门问卷跑完，回主列表找下一问卷
        setTimeout(async () => {
          setStatus('本问卷批次结束，检查是否还有未完成…');
          const $toMain = $('a, button').filter((_, el) => /我的任务|任务列表/.test(($(el).text() || '')));
          if ($toMain.length) $toMain.first().trigger('click');
          else location.href = location.pathname + location.search + '#/my-task/main/UnFinished';
          await sleep(1500);
          saveState({ phase: '' });
          const left = clickEvalSpans();
          if (left.length) {
            left.first().trigger('click');
          } else {
            markAllDone();
          }
        }, 800);
      } else if (pageKind() === 'details') {
        setTimeout(() => runDetailsAuto(), 600);
      } else if (pageKind() === 'main') {
        setTimeout(() => runMainAuto(), 600);
      }
    }
  };

  $(async () => {
    // 使用前：先弹免责声明，未同意前不测页面、不挂面板、不跑自动
    const agreed = await ensureDisclaimer();
    if (!agreed) return;
    const ok = await mycosTest();
    if (!ok) return;
    log('UJS Auto Review 3.3.0 / MyCOS 4.5.x');
    if (needsActivation()) await ensureActivation(true);
    ensurePanel();
    addAnswerButtons();
    const mo = new MutationObserver(() => {
      if (!hasDisclaimer()) return;
      dismissNoiseModals();
      addAnswerButtons();
      ensurePanel();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
    watchUrlChange(() => {
      if (!hasDisclaimer()) return;
      setTimeout(onRoute, 350);
    });
    onRoute();
  });
})(jQuery);
