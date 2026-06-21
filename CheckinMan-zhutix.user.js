// ==UserScript==
// @name         CheckinMan - 致美化签到
// @namespace    https://zhutix.com/
// @version      2.1
// @description  CheckinMan 合集 · 每天自动签到致美化，全局静默运行，一天一次
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      zhutix.com
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const API      = 'https://zhutix.com/wp-json/b2/v1/userMission';
    const KEY_DATE  = 'zhutix_checkin_date';
    const KEY_TOKEN = 'zhutix_token';
    const SITE_NAME = '致美化';

    // ---------- 工具 ----------
    function today() {
        const d = new Date();
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    }

    function getCookie(name) {
        const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
        return m ? decodeURIComponent(m[1]) : '';
    }

    /**
     * @param {'success'|'info'|'error'} type
     * @param {string} text  详情文本
     */
    function toast(type, text) {
        const colors = {
            success: { bg: '#0d2818', border: '#16a34a', accent: '#22c55e' },
            info:    { bg: '#1a1a2e', border: '#3b82f6', accent: '#60a5fa' },
            error:   { bg: '#2a0d0d', border: '#dc2626', accent: '#f87171' },
        };
        const c = colors[type];

        const el = document.createElement('div');
        el.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                <span style="
                    display:inline-block;padding:2px 8px;border-radius:4px;
                    font-size:12px;font-weight:600;letter-spacing:.5px;
                    background:${c.accent}22;color:${c.accent};
                ">${SITE_NAME}</span>
                <span style="font-size:12px;color:#888;">每日签到</span>
            </div>
            <div style="font-size:14px;color:#e0e0e0;">${text}</div>
        `;
        Object.assign(el.style, {
            position: 'fixed', top: '20px', right: '20px', zIndex: '2147483647',
            background: c.bg, padding: '14px 20px',
            borderRadius: '8px', fontFamily: 'system-ui, sans-serif',
            boxShadow: `0 4px 20px rgba(0,0,0,.5)`, border: `1px solid ${c.border}`,
            minWidth: '200px', transition: 'opacity .5s', opacity: '0',
            pointerEvents: 'none',
        });
        document.body.appendChild(el);
        requestAnimationFrame(() => el.style.opacity = '1');
        setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 600); }, 5000);
    }

    // ---------- 每次访问致美化时刷新 token ----------
    if (location.hostname === 'zhutix.com') {
        const t = getCookie('b2_token');
        if (t) GM_setValue(KEY_TOKEN, t);
    }

    // ---------- 判断是否需要签到 ----------
    if (GM_getValue(KEY_DATE, '') === today()) return;

    const token = GM_getValue(KEY_TOKEN, '');
    if (!token) return;

    // ---------- 执行签到 ----------
    GM_xmlhttpRequest({
        method: 'POST',
        url: API,
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        onload(resp) {
            GM_setValue(KEY_DATE, today());

            if (resp.status === 200) {
                try {
                    const d = JSON.parse(resp.responseText);
                    const m = d.mission || {};
                    toast('success', `签到成功! +${m.credit || '?'}锋币  连续${m.day || '?'}天`);
                } catch {
                    toast('success', '签到成功!');
                }
            } else if (resp.status === 400 || resp.status === 403) {
                try {
                    const msg = JSON.parse(resp.responseText).message || '';
                    if (msg.includes('已签到')) {
                        toast('info', '今日已签到');
                    } else {
                        toast('error', msg);
                    }
                } catch {
                    toast('error', `签到失败 (${resp.status})`);
                }
            } else {
                toast('error', `签到失败 (${resp.status})`);
            }
        },
        onerror() {
            // 失败不标记日期，下次访问重试
            toast('error', '网络异常，下次访问自动重试');
        },
    });
})();
