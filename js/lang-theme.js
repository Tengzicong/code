/* ==========================================================================
   全站语言 + 主题切换
   - 主题：零存储。默认跟随系统 prefers-color-scheme，data-theme="light|dark"，
     系统切换实时跟随；手动切换仅影响当前页面，不写任何本地存储。
   - 语言：优先读取用户主动保存的选择（localStorage 'ec-lang'），
     无保存记录时自动跟随 navigator.language（zh* → 中文，其余 → 英文）；
     手动切换立即全站生效并持久化，刷新/跨页均保持。
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
    var LANG_KEY = 'ec-lang';
    function sysLang() {
        return (navigator.language || 'zh-CN').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en';
    }
    function savedLang() {
        try {
            var v = localStorage.getItem(LANG_KEY);
            return v === 'zh' || v === 'en' ? v : null;
        } catch (e) { return null; }
    }
    // 优先用户主动保存的语言，无则跟随系统语言
    var LANG = savedLang() || sysLang();
    // 同步写入，保证同标签页内后续打开的页面立即读到最新选择
    try { if (savedLang() !== LANG) localStorage.setItem(LANG_KEY, LANG); } catch (e) {}

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
        document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
            el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder));
        });
        document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
            el.setAttribute('title', t(el.dataset.i18nTitle));
        });
        document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
            el.setAttribute('aria-label', t(el.dataset.i18nAria));
        });
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
                try { localStorage.setItem(LANG_KEY, LANG); } catch (e) {}
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

    /* ---------- 输入框焦点方向键守卫（修复滚动异常 任务2） ----------
       根因：游戏页的 window/document keydown 监听器对方向键从不 preventDefault，
       浏览器同时执行方向键的默认页面滚动，导致游戏进行中画面偏移；
       且监听器挂在 window/document 上不区分事件源，简介编辑输入框聚焦时
       方向键会同时触发"角色移动 + 页面滚动"，干扰编辑。
       方案：
       1) 捕获阶段监听：可编辑元素（input/textarea/contenteditable）聚焦时，
          方向键在捕获阶段 stopPropagation，游戏监听器收不到事件，
          角色不再误动；不调用 preventDefault，框内光标移动与文本选择保留，
          且单行输入框内方向键本身不会滚动页面。
       2) 焦点不在可编辑元素时（isEditing() 为 false），游戏页自行对方向键
          preventDefault，消除默认页面滚动；失焦即自动恢复（无持久拦截）。
       ------------------------------------------------------------- */
    var ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    function isEditable(el) {
        if (!el || el === document.body || el === document.documentElement) return false;
        var tag = (el.tagName || '').toLowerCase();
        if (tag === 'textarea') return true;
        if (tag === 'input') {
            var ty = (el.type || 'text').toLowerCase();
            return ['text', 'search', 'email', 'tel', 'url', 'password', 'number'].indexOf(ty) !== -1;
        }
        if (el.isContentEditable) return true;
        return false;
    }
    window.addEventListener('keydown', function (e) {
        if (ARROW_KEYS.indexOf(e.key) === -1) return;
        if (isEditable(e.target) || isEditable(document.activeElement)) {
            // 输入框内：仅拦截事件向游戏监听器冒泡，保留光标移动/文本选择
            e.stopPropagation();
        }
    }, true); // 捕获阶段，先于页面监听器
    function isEditing() {
        return isEditable(document.activeElement);
    }

    window.LT = {
        get lang() { return LANG; },
        t: t,
        applyLang: applyLang,
        setTheme: setTheme,
        isEditing: isEditing,
        ARROW_KEYS: ARROW_KEYS
    };
    // 跨标签页语言同步：其他标签页切换语言后本页刷新（若可见）
    window.addEventListener('storage', function (e) {
        if (e.key === LANG_KEY && (e.newValue === 'zh' || e.newValue === 'en')) {
            LANG = e.newValue;
            applyLang();
        }
    });
})();
