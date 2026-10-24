/* ==========================================================================
   全站 Cookie 同意弹窗（自包含共享模块）
   - 每个页面 <head> 引入：<script src="js/cookie-consent.js" defer></script>
   - 首次访问（localStorage 无 cookieAccepted 记录）自动弹出；
     同意写入 'true'，拒绝写入 'false'，之后不再弹出。
   - 自带样式与 DOM 注入，使用自有 --cc-* 变量，不依赖页面 CSS 变量，
     在未定义变量的页面（robot-blockly / errorcore 等）同样正常。
   - 深色模式跟随 html[data-theme="dark"]（lang-theme.js 或页面自身主题）。
   - 中英双语：默认跟随 window.LT.lang（若有 lang-theme.js），
     否则按 navigator.language；监听 window 'langchange' 事件实时切换。
   ========================================================================== */
(function () {
    var STORAGE_KEY = 'cookieAccepted';

    /* ---------- 文案 ---------- */
    var I18N = {
        zh: {
            title: '🍪 Cookie 政策',
            intro: 'ERROR-CORE 尊重您的隐私，并致力于保护您的个人信息安全。本 Cookie 政策说明我们如何使用 Cookie 和类似技术。',
            what_h3: '什么是 Cookie',
            what_p: 'Cookie 是网站发送到您浏览器的小型文本文件，存储在您的设备上。它们用于使网站正常运行、改善用户体验、分析网站流量和行为。',
            types_h3: '我们使用的 Cookie 类型',
            type_necessary: '<strong>必要 Cookie</strong>：对于网站的基本功能是必需的',
            type_analytics: '<strong>分析 Cookie</strong>：收集有关访客如何使用网站的信息',
            type_functional: '<strong>功能性 Cookie</strong>：允许网站记住您的偏好设置',
            purpose_h3: 'Cookie 的使用目的',
            purpose_1: '确保网站正常运行',
            purpose_2: '分析网站流量',
            purpose_3: '优化用户体验',
            consent: '我已阅读并同意 <a href="cookie-policy.html" target="_blank" class="cc-link">《Cookie隐私协议》</a>',
            decline: '拒绝',
            accept: '同意'
        },
        en: {
            title: '🍪 Cookie Policy',
            intro: 'ERROR-CORE respects your privacy and is committed to keeping your personal information safe. This Cookie Policy explains how we use cookies and similar technologies.',
            what_h3: 'What Are Cookies',
            what_p: 'Cookies are small text files a website sends to your browser and stores on your device. They are used to keep the site running, improve your experience, and analyze site traffic and behavior.',
            types_h3: 'Types of Cookies We Use',
            type_necessary: '<strong>Essential cookies</strong>: required for the basic functions of the website',
            type_analytics: '<strong>Analytics cookies</strong>: collect information about how visitors use the website',
            type_functional: '<strong>Functional cookies</strong>: allow the website to remember your preferences',
            purpose_h3: 'Purposes of Cookie Use',
            purpose_1: 'Keep the website running properly',
            purpose_2: 'Analyze website traffic',
            purpose_3: 'Optimize the user experience',
            consent: 'I have read and agree to the <a href="cookie-policy.html" target="_blank" class="cc-link">Cookie Privacy Agreement</a>',
            decline: 'Decline',
            accept: 'Accept'
        }
    };

    function currentLang() {
        if (window.LT && window.LT.lang) return window.LT.lang === 'en' ? 'en' : 'zh';
        return (navigator.language || 'zh-CN').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en';
    }

    /* ---------- 样式（作用域变量，明暗通用） ---------- */
    var CSS = [
        '.cc-overlay{',
        '  --cc-white:#ffffff;--cc-ink:#1d1d1f;--cc-secondary:#6e6e73;--cc-steel:#86868b;',
        '  --cc-mist:#f5f5f7;--cc-hairline:rgba(0,0,0,.1);--cc-control:#e6e6e8;',
        '  --cc-action:#0071e3;--cc-action-hover:#0077ed;--cc-link:#0066cc;',
        '  --cc-r-card:28px;--cc-r-inset:14px;--cc-r-pill:980px;',
        '  --cc-ease:cubic-bezier(.28,.11,.32,1);',
        '  position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;',
        '  padding:24px;padding:max(24px, env(safe-area-inset-top)) max(24px, env(safe-area-inset-right)) max(24px, env(safe-area-inset-bottom)) max(24px, env(safe-area-inset-left));',
        '  background:rgba(0,0,0,.42);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);',
        '  opacity:0;visibility:hidden;transition:opacity .24s var(--cc-ease),visibility .24s var(--cc-ease);',
        "  font-family:'SF Pro Text',ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;",
        '  -webkit-font-smoothing:antialiased;text-align:left;',
        '}',
        'html[data-theme="dark"] .cc-overlay{',
        '  --cc-white:#161617;--cc-ink:#f5f5f7;--cc-secondary:#a1a1a6;--cc-steel:#86868b;',
        '  --cc-mist:#1d1d1f;--cc-hairline:rgba(255,255,255,.14);--cc-control:#2c2c2e;',
        '  --cc-action:#0a84ff;--cc-action-hover:#409cff;--cc-link:#2997ff;',
        '}',
        '.cc-overlay.cc-show{opacity:1;visibility:visible}',
        '.cc-modal{display:flex;flex-direction:column;gap:18px;width:min(520px,100%);max-height:min(80vh,640px);',
        '  padding:28px;background:var(--cc-white);border:1px solid var(--cc-hairline);border-radius:var(--cc-r-card);',
        '  transform:translateY(8px) scale(.985);transition:transform .24s var(--cc-ease),background-color .35s var(--cc-ease);',
        '  color:var(--cc-ink);box-sizing:border-box}',
        '.cc-overlay.cc-show .cc-modal{transform:none}',
        '.cc-modal *,.cc-modal *::before,.cc-modal *::after{box-sizing:border-box;margin:0;padding:0}',
        '.cc-modal h2{font-size:21px;font-weight:600;letter-spacing:.231px;color:var(--cc-ink);line-height:1.3}',
        '.cc-body{overflow-y:auto;padding-right:4px;font-size:15px;line-height:1.55;letter-spacing:-.224px;color:var(--cc-secondary);-webkit-overflow-scrolling:touch}',
        '.cc-body h3{margin:18px 0 8px;font-size:17px;font-weight:600;letter-spacing:-.374px;color:var(--cc-ink)}',
        '.cc-body h3:first-child{margin-top:0}',
        '.cc-body p{margin-bottom:10px}',
        '.cc-body ul{margin:0 0 10px 1.15rem}',
        '.cc-body li{margin-bottom:6px}',
        '.cc-body strong{color:var(--cc-ink);font-weight:600}',
        '.cc-link{color:var(--cc-link);text-decoration:none}',
        '.cc-link:hover{text-decoration:underline;text-underline-offset:3px}',
        '.cc-consent label{display:flex;align-items:flex-start;gap:12px;padding:14px 18px;background:var(--cc-mist);',
        '  border:1px solid var(--cc-hairline);border-radius:var(--cc-r-inset);font-size:14px;line-height:1.45;',
        '  letter-spacing:-.224px;color:var(--cc-secondary);cursor:pointer;transition:border-color .2s var(--cc-ease)}',
        '.cc-consent label:hover{border-color:var(--cc-steel)}',
        '.cc-consent input[type="checkbox"]{width:17px;height:17px;margin-top:2px;flex-shrink:0;accent-color:var(--cc-action);cursor:pointer}',
        '.cc-btns{display:flex;gap:12px;justify-content:flex-end}',
        '.cc-btn{padding:10px 22px;min-height:42px;border:1px solid transparent;border-radius:var(--cc-r-pill);',
        '  font-family:inherit;font-size:15px;font-weight:500;letter-spacing:-.224px;cursor:pointer;',
        '  transition:background-color .2s var(--cc-ease),border-color .2s var(--cc-ease),color .2s var(--cc-ease)}',
        '.cc-btn.cc-accept{background:var(--cc-action);color:#fff}',
        '.cc-btn.cc-accept:hover{background:var(--cc-action-hover)}',
        '.cc-btn.cc-accept:disabled{background:var(--cc-control);color:var(--cc-steel);cursor:not-allowed}',
        '.cc-btn.cc-decline{background:var(--cc-mist);color:var(--cc-ink)}',
        '.cc-btn.cc-decline:hover{background:var(--cc-control)}',
        '@media (max-width:720px){',
        '  .cc-modal{padding:22px;max-height:86vh;border-radius:22px}',
        '  .cc-btns{flex-direction:column-reverse}',
        '  .cc-btn{width:100%}',
        '}',
        '@media (prefers-reduced-motion:reduce){',
        '  .cc-overlay,.cc-modal,.cc-btn,.cc-consent label{transition-duration:.01ms !important}',
        '}'
    ].join('\n');

    var MODAL_HTML =
        '<div class="cc-modal" role="dialog" aria-modal="true" aria-labelledby="ccTitle">' +
            '<h2 id="ccTitle" data-cc="title"></h2>' +
            '<div class="cc-body">' +
                '<p data-cc="intro"></p>' +
                '<h3 data-cc="what_h3"></h3>' +
                '<p data-cc="what_p"></p>' +
                '<h3 data-cc="types_h3"></h3>' +
                '<ul>' +
                    '<li data-cc-html="type_necessary"></li>' +
                    '<li data-cc-html="type_analytics"></li>' +
                    '<li data-cc-html="type_functional"></li>' +
                '</ul>' +
                '<h3 data-cc="purpose_h3"></h3>' +
                '<ul>' +
                    '<li data-cc="purpose_1"></li>' +
                    '<li data-cc="purpose_2"></li>' +
                    '<li data-cc="purpose_3"></li>' +
                '</ul>' +
            '</div>' +
            '<div class="cc-consent">' +
                '<label><input type="checkbox" id="ccCheckbox"><span data-cc-html="consent"></span></label>' +
            '</div>' +
            '<div class="cc-btns">' +
                '<button type="button" class="cc-btn cc-decline" id="ccDecline" data-cc="decline"></button>' +
                '<button type="button" class="cc-btn cc-accept" id="ccAccept" disabled data-cc="accept"></button>' +
            '</div>' +
        '</div>';

    /* ---------- 逻辑 ---------- */
    function render(overlay) {
        var dict = I18N[currentLang()] || I18N.zh;
        overlay.querySelectorAll('[data-cc]').forEach(function (el) {
            el.textContent = dict[el.getAttribute('data-cc')] || '';
        });
        overlay.querySelectorAll('[data-cc-html]').forEach(function (el) {
            el.innerHTML = dict[el.getAttribute('data-cc-html')] || '';
        });
    }

    function init() {
        var saved;
        try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) { saved = null; }
        if (saved === 'true' || saved === 'false') return; // 已有有效记录，不弹窗

        var style = document.createElement('style');
        style.textContent = CSS;
        document.head.appendChild(style);

        var overlay = document.createElement('div');
        overlay.className = 'cc-overlay';
        overlay.id = 'ccOverlay';
        overlay.innerHTML = MODAL_HTML;
        document.body.appendChild(overlay);

        render(overlay);
        window.addEventListener('langchange', function () { render(overlay); });

        var checkbox = overlay.querySelector('#ccCheckbox');
        var acceptBtn = overlay.querySelector('#ccAccept');
        var declineBtn = overlay.querySelector('#ccDecline');

        checkbox.addEventListener('change', function () {
            acceptBtn.disabled = !checkbox.checked;
        });
        acceptBtn.addEventListener('click', function () {
            if (!checkbox.checked) return;
            try { localStorage.setItem(STORAGE_KEY, 'true'); } catch (e) {}
            overlay.classList.remove('cc-show');
        });
        declineBtn.addEventListener('click', function () {
            try { localStorage.setItem(STORAGE_KEY, 'false'); } catch (e) {}
            overlay.classList.remove('cc-show');
        });

        setTimeout(function () { overlay.classList.add('cc-show'); }, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
