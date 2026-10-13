/* ==========================================================================
   全站语言 + 主题切换（零存储）
   - 主题：默认跟随系统 prefers-color-scheme，data-theme="light|dark"，
     系统切换实时跟随；手动切换仅影响当前页面，不写任何本地存储。
   - 语言：默认跟随 navigator.language（zh* → 中文，其余 → 英文）；
     手动切换同样不存储。
   - 页面接入：
       1) <head> 尽早引入 <script src="js/lang-theme.js"></script>
       2) 可选定义 window.PAGE_I18N = { zh:{key:'文案'}, en:{...} }
          正文元素用 data-i18n="key" / data-i18n-html="key" 标注
       3) 可选定义 window.PAGE_META = { zh:{title,description,keywords}, en:{...} }
       4) JS 动态渲染的文案：监听 window 'langchange' 事件（e.detail.lang），
          用 LT.t(key) 取词重渲染
       5) 控件挂载点：页面在顶栏/工具栏放 <span class="lt-mount"></span>；
          没有则自动悬浮到左上角
   ========================================================================== */
(function () {
    var root = document.documentElement;

    /* ---------- 主题 ---------- */
    function sysTheme() {
        return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    function setTheme(t) {
        root.setAttribute('data-theme', t);
    }
    setTheme(sysTheme());
    if (window.matchMedia) {
        try {
            matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
                setTheme(e.matches ? 'dark' : 'light');
            });
        } catch (err) {}
    }

    /* ---------- 语言 ---------- */
    function sysLang() {
        return (navigator.language || 'zh-CN').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en';
    }
    var LANG = sysLang();

    function t(key) {
        var dict = (window.PAGE_I18N || {})[LANG] || {};
        var zh = (window.PAGE_I18N || {}).zh || {};
        return dict[key] !== undefined ? dict[key] : (zh[key] !== undefined ? zh[key] : key);
    }

    function setMeta(nameOrProp, content) {
        var el = document.querySelector('meta[name="' + nameOrProp + '"], meta[property="' + nameOrProp + '"]');
        if (el && content) el.setAttribute('content', content);
    }

    function applyLang() {
        document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.dataset.i18n); });
        document.querySelectorAll('[data-i18n-html]').forEach(function (el) { el.innerHTML = t(el.dataset.i18nHtml); });
        root.setAttribute('lang', LANG === 'en' ? 'en' : 'zh-CN');
        var m = (window.PAGE_META || {})[LANG];
        if (m) {
            document.title = m.title || document.title;
            setMeta('description', m.description);
            setMeta('keywords', m.keywords);
            setMeta('og:title', m.title);
            setMeta('og:description', m.description);
            setMeta('twitter:title', m.title);
            setMeta('twitter:description', m.description);
        }
        document.querySelectorAll('.lt-lang button').forEach(function (b) {
            b.setAttribute('aria-pressed', String(b.dataset.lang === LANG));
        });
        window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: LANG } }));
    }

    /* ---------- 控件样式（注入一次，明暗通用） ---------- */
    var css = [
        '.lt-controls{display:inline-flex;align-items:center;gap:8px}',
        '.lt-lang{display:inline-flex;border:1px solid rgba(128,128,128,.55);border-radius:9999px;overflow:hidden;background:transparent}',
        '.lt-lang button{font:inherit;font-size:12px;font-weight:600;padding:3px 11px;border:0;background:transparent;color:inherit;opacity:.6;cursor:pointer;transition:background .2s ease,opacity .2s ease}',
        '.lt-lang button[aria-pressed="true"]{opacity:1;background:rgba(128,128,128,.22)}',
        '.lt-theme{display:inline-flex;width:28px;height:28px;align-items:center;justify-content:center;border:1px solid rgba(128,128,128,.55);border-radius:9999px;background:transparent;color:inherit;cursor:pointer;transition:background .2s ease}',
        '.lt-theme:hover{background:rgba(128,128,128,.18)}',
        '.lt-theme svg{width:15px;height:15px}',
        '.lt-theme .ic-sun{display:none}',
        'html[data-theme="dark"] .lt-theme .ic-moon{display:none}',
        'html[data-theme="dark"] .lt-theme .ic-sun{display:block}',
        '.lt-fixed{position:fixed;top:10px;left:12px;z-index:9999;padding:4px 8px;border-radius:9999px;border:1px solid rgba(128,128,128,.4);background:rgba(128,128,128,.16);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}'
    ].join('\n');

    var CONTROLS_HTML =
        '<span class="lt-controls">' +
            '<span class="lt-lang" role="group" aria-label="Language">' +
                '<button type="button" data-lang="zh">中文</button>' +
                '<button type="button" data-lang="en">EN</button>' +
            '</span>' +
            '<button type="button" class="lt-theme" aria-label="Toggle dark mode">' +
                '<svg class="ic-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>' +
                '<svg class="ic-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>' +
            '</button>' +
        '</span>';

    function mount() {
        var style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

        var host = document.querySelector('.lt-mount');
        if (!host) {
            host = document.createElement('div');
            host.className = 'lt-fixed';
            document.body.appendChild(host);
        }
        host.insertAdjacentHTML('beforeend', CONTROLS_HTML);

        host.querySelectorAll('.lt-lang button').forEach(function (btn) {
            btn.addEventListener('click', function () {
                LANG = btn.dataset.lang === 'en' ? 'en' : 'zh';
                applyLang();
            });
        });
        host.querySelector('.lt-theme').addEventListener('click', function () {
            setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
        });

        applyLang();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount);
    } else {
        mount();
    }

    window.LT = {
        get lang() { return LANG; },
        t: t,
        applyLang: applyLang,
        setTheme: setTheme
    };
})();
