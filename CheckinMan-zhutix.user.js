// ==UserScript==
// @name         CheckinMan - 致美化签到
// @namespace    https://zhutix.com/
// @version      2.3
// @description  CheckinMan 合集 · 每天自动签到致美化，全局静默运行，一天一次
// @downloadURL  https://raw.githubusercontent.com/Cairl/CheckinMan/main/CheckinMan-zhutix.user.js
// @updateURL    https://raw.githubusercontent.com/Cairl/CheckinMan/main/CheckinMan-zhutix.user.js
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      zhutix.com
// @run-at       document-idle
// ==/UserScript==

// Design note: @match *://*/* is intentional — it allows the script to
// attempt a daily check-in regardless of which page the user opens first.
// The date guard (GM_getValue) ensures at most one attempt per day.
// All heavy code (toast, API calls) lives after the guard — subsequent
// page loads exit immediately after a single GM_getValue + string compare.

(function () {
    'use strict';

    // ---- keys & date ----
    const KEY_DATE  = 'zhutix_checkin_date';
    const KEY_TOKEN = 'zhutix_token';

    function today() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    // ---- always refresh token when visiting zhutix.com ----
    if (location.hostname === 'zhutix.com') {
        const m = document.cookie.match(/(?:^|; )b2_token=([^;]*)/);
        if (m) GM_setValue(KEY_TOKEN, decodeURIComponent(m[1]));
    }

    // ---- already checked in today? stop here ----
    if (GM_getValue(KEY_DATE, '') === today()) return;

    const token = GM_getValue(KEY_TOKEN, '');
    if (!token) return;

    // ================================================================
    //  Everything below runs at most ONCE per day (first page opened)
    // ================================================================

    const API_MISSION = 'https://zhutix.com/wp-json/b2/v1/getUserMission';
    const API_CHECKIN = 'https://zhutix.com/wp-json/b2/v1/userMission';
    const SITE_NAME   = '致美化';

    // ---------- UI ----------
    function toast(type, text) {
        const colors = {
            success: { bg: '#0d2818', border: '#16a34a', accent: '#22c55e' },
            info:    { bg: '#1a1a2e', border: '#3b82f6', accent: '#60a5fa' },
            error:   { bg: '#2a0d0d', border: '#dc2626', accent: '#f87171' },
        };
        const c = colors[type];

        const el = document.createElement('div');
        Object.assign(el.style, {
            position: 'fixed', top: '20px', right: '20px', zIndex: '2147483647',
            background: c.bg, padding: '14px 20px',
            borderRadius: '8px', fontFamily: 'system-ui, sans-serif',
            boxShadow: '0 4px 20px rgba(0,0,0,.5)', border: `1px solid ${c.border}`,
            minWidth: '200px', transition: 'opacity .5s', opacity: '0',
            pointerEvents: 'none',
        });

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.gap = '8px';
        header.style.marginBottom = '6px';

        const badge = document.createElement('span');
        badge.style.cssText = 'display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:600;letter-spacing:.5px;';
        badge.style.background = c.accent + '22';
        badge.style.color = c.accent;
        badge.textContent = SITE_NAME;

        const label = document.createElement('span');
        label.style.fontSize = '12px';
        label.style.color = '#888';
        label.textContent = '每日签到';

        header.appendChild(badge);
        header.appendChild(label);

        const detail = document.createElement('div');
        detail.style.fontSize = '14px';
        detail.style.color = '#e0e0e0';
        detail.textContent = text;

        el.appendChild(header);
        el.appendChild(detail);

        if (!document.body) return;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.style.opacity = '1');
        el.addEventListener('transitionend', () => el.remove(), { once: true });
        setTimeout(() => { el.style.opacity = '0'; }, 5000);
    }

    // ---------- 执行签到（两阶段：先拉取任务数据，再签到）----------
    /**
     * Parse credit and day from B2 API response.
     * Tries multiple response structures to handle version differences.
     */
    function parseCreditDay(respText) {
        try {
            const d = JSON.parse(respText);
            const data = d.data || d;          // {success, data:{...}} wrapper
            const m = data.mission || data;    // {mission:{credit,day}} or flat
            return {
                credit: m.credit,
                day:    m.day || m.continuous || m.today
            };
        } catch (e) {
            return {};
        }
    }

    function doCheckin(token, streakText) {
        GM_xmlhttpRequest({
            method: 'POST',
            url: API_CHECKIN,
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: '',
            onload(resp) {
                GM_setValue(KEY_DATE, today());

                if (resp.status === 200) {
                    const info = parseCreditDay(resp.responseText);
                    const credit = info.credit != null ? info.credit : '?';
                    let day = info.day != null ? info.day : streakText;
                    const dayStr = day ? `  连续${day}天` : '';
                    toast('success', `签到成功! +${credit}锋币${dayStr}`);
                } else if (resp.status === 400 || resp.status === 403) {
                    try {
                        const msg = JSON.parse(resp.responseText).message || '';
                        if (msg.includes('已签到') || msg.includes('重复')) {
                            toast('info', '今日已签到');
                        } else {
                            toast('error', msg || `签到失败 (${resp.status})`);
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
    }

    // 第一阶段：获取签到任务数据（B2 新版要求先调 getUserMission）
    GM_xmlhttpRequest({
        method: 'POST',
        url: API_MISSION,
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: 'count=10&paged=1',
        onload(resp) {
            let streak = '';
            try { streak = parseCreditDay(resp.responseText).day; } catch (e) {}
            // 取到任务数据后执行签到
            doCheckin(token, streak || '');
        },
        onerror() {
            // getUserMission 失败不阻塞，直接尝试签到
            doCheckin(token, '');
        },
    });
})();
