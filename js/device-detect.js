/* ==========================================================================
   全站设备检测 + 响应式适配（电脑 / 平板 / 手机 三类）
   - 渲染前执行：<head> 中去掉 defer 同步引入本脚本，脚本在解析到时立即检测，
     并同步插入对应设备的专属样式表 css/device-{mobile|tablet|desktop}.css，
     保证首次绘制前已完成设备判定与样式加载。
   - 特性检测优先：先用 pointer/coarse + hover 特性与视口宽度判定，
     UA 特征（iPadOS 桌面UA伪装、触屏笔记本等）仅作辅助，不依赖 UA 宽度。
   - 统一断点（与 CSS 媒体查询一致）：<600px 手机；600–1023px 平板；≥1024px 电脑。
   - 横竖屏/缩放：监听 resize、orientationchange（含 iOS 尺寸延迟）与
     matchMedia 断点变化，实时重判定并切换设备类名与专属样式表。
   - 对外接口保持兼容：detectDevice() 返回 { isMobile, isTablet, isDesktop,
     type, orientation, touch, userAgent, screenWidth, innerWidth }。
   ========================================================================== */
(function () {
    'use strict';

    /* ---------- 统一断点（与 css/device-*.css 媒体查询保持一致） ---------- */
    var BREAK_MOBILE = 600;   // < 600px  → 手机
    var BREAK_TABLET = 1024;  // < 1024px → 平板；≥1024px → 电脑

    /* ---------- 特性检测 ---------- */
    // 触控特性：粗指针（手指）为主输入设备
    function hasCoarsePointer() {
        try { return window.matchMedia && matchMedia('(pointer: coarse)').matches; }
        catch (e) { return false; }
    }
    // 悬停特性：无 hover 能力多为触屏设备
    function lacksHover() {
        try { return window.matchMedia && matchMedia('(hover: none)').matches; }
        catch (e) { return false; }
    }
    function anyPointerCoarse() {
        try { return window.matchMedia && matchMedia('(any-pointer: coarse)').matches; }
        catch (e) { return false; }
    }
    // UA 特征（辅助）：iPadOS 13+ 伪装桌面 UA 时，只有 maxTouchPoints > 1 可区分
    function uaLooksTablet() {
        var ua = navigator.userAgent || '';
        if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return true;
        // iPadOS 桌面 UA：无 iPad 字样但为 Mac + 多点触控
        if (/Macintosh/i.test(ua) && (navigator.maxTouchPoints || 0) > 1) return true;
        return false;
    }
    function uaLooksMobile() {
        var ua = navigator.userAgent || '';
        return /Mobi|Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    }

    // 主判定：特性优先，宽度为主，UA 兜底
    // 触屏设备按“短边”判定（手机横屏 844×390 短边 390 仍是手机，iPad 竖屏短边 768 是平板）；
    // 鼠标键盘设备按视口宽度判定（窄窗口视为小屏电脑，不影响桌面布局档位）。
    function computeDevice() {
        var w = window.innerWidth || document.documentElement.clientWidth || 0;
        var h = window.innerHeight || document.documentElement.clientHeight || 0;
        var coarse = hasCoarsePointer() || lacksHover() || uaLooksTablet() || uaLooksMobile();
        var type;

        if (coarse) {
            // 触屏：用短边分类
            var shortEdge = Math.min(w, h);
            if (shortEdge >= BREAK_TABLET) {
                type = 'tablet';   // 大屏触控（iPad 横屏等）
            } else if (shortEdge >= BREAK_MOBILE) {
                type = 'tablet';   // 中屏触控（平板竖屏 / 大屏手机横屏）
            } else {
                type = 'mobile';   // 短边 < 600：手机（含横屏）
            }
        } else {
            // 非触屏（桌面/带鼠标笔记本）：一律桌面档；
            // 窄窗口的响应式收窄由页面自身媒体查询负责
            type = 'desktop';
        }
        // 兜底：UA 明确是平板且当前判为电脑时，纠正为平板（防大屏触控本误判）
        if (type === 'desktop' && (uaLooksTablet() || (anyPointerCoarse() && !hasCoarsePointer()))) {
            type = 'tablet';
        }
        return type;
    }

    function orientationOf() {
        return (window.innerWidth || 0) >= (window.innerHeight || 0) ? 'landscape' : 'portrait';
    }

    /* ---------- 专属样式表注入（渲染前同步插入） ---------- */
    var CSS_HREF = {
        mobile:  'css/device-mobile.css',
        tablet:  'css/device-tablet.css',
        desktop: 'css/device-desktop.css'
    };
    var cssLinks = { mobile: null, tablet: null, desktop: null };

    function ensureCss() {
        var head = document.head || document.getElementsByTagName('head')[0];
        Object.keys(CSS_HREF).forEach(function (type) {
            if (cssLinks[type]) return;
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = CSS_HREF[type];
            link.setAttribute('data-device-css', type);
            // 全部加载，用 media 属性切换（浏览器可预取，切换即时生效）
            link.media = 'only all';
            head.appendChild(link);
            cssLinks[type] = link;
        });
    }

    // 各页面的 <style> 内联块位于本脚本之后，会排在注入的 link 之后；
    // DOMContentLoaded / load 时把设备样式重新移到 head 末尾，
    // 确保设备专属样式在层叠中最后生效，压过页面自带的媒体查询。
    function relinkCss() {
        var head = document.head || document.getElementsByTagName('head')[0];
        Object.keys(cssLinks).forEach(function (type) {
            if (cssLinks[type]) head.appendChild(cssLinks[type]); // appendChild 会移动已有节点
        });
    }

    function applyCss(type) {
        Object.keys(cssLinks).forEach(function (t) {
            if (cssLinks[t]) cssLinks[t].media = (t === type) ? 'all' : 'none';
        });
    }

    /* ---------- 设备类名（同时挂到 <html> 与 <body>） ---------- */
    var BODY_CLASSES = ['mobile-device', 'tablet-device', 'desktop-device'];
    function applyBodyClass(type) {
        // <html> 在 head 阶段即可用：保证首次绘制前已带设备类
        var root = document.documentElement;
        BODY_CLASSES.forEach(function (c) { root.classList.remove(c); });
        root.classList.add(type + '-device');
        root.setAttribute('data-device', type);

        // body 解析后同步挂载，兼容以 body 为作用域的页面样式
        if (document.body) {
            BODY_CLASSES.forEach(function (c) { document.body.classList.remove(c); });
            document.body.classList.add(type + '-device');
            document.body.setAttribute('data-device', type);
        }
    }

    /* ---------- 总应用入口 ---------- */
    var currentType = null;
    var lastOrientation = orientationOf();

    function applyDevice(force) {
        var type = computeDevice();
        var ori = orientationOf();
        var changed = (type !== currentType);
        var rotated = (ori !== lastOrientation);
        if (!changed && !rotated && !force) return;

        currentType = type;
        lastOrientation = ori;

        ensureCss();
        applyCss(type);
        applyBodyClass(type);

        // 供页面脚本按需响应（设备或横竖屏变化都会触发）
        var detail = { type: type, orientation: ori, changed: changed, rotated: rotated };
        try {
            window.dispatchEvent(new CustomEvent('devicechange', { detail: detail }));
            if (rotated) {
                window.dispatchEvent(new CustomEvent('orientationchange', { detail: detail }));
            }
        } catch (e) {}
    }

    /* ---------- 渲染前立即执行 ---------- */
    // 脚本在 <head> 同步引入，此刻 body 尚未解析：先定 CSS，body 就绪后补类名
    applyDevice(true);
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { relinkCss(); applyDevice(true); });
    } else {
        relinkCss();
    }

    /* ---------- 窗口尺寸 / 横竖屏 实时适配 ---------- */
    var resizeTimer = null;
    function onResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () { applyDevice(false); }, 100);
    }
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', function () {
        // iOS 旋转后视口尺寸延迟更新，多次补偿检测
        onResize();
        setTimeout(function () { applyDevice(false); }, 300);
        setTimeout(function () { applyDevice(false); }, 600);
    });

    // matchMedia 断点变化（含窗口拖拽跨断点、浏览器缩放）
    if (window.matchMedia) {
        try {
            var mqMobile = matchMedia('(max-width: ' + (BREAK_MOBILE - 1) + 'px)');
            var mqDesktop = matchMedia('(min-width: ' + BREAK_TABLET + 'px)');
            var mqCoarse = matchMedia('(pointer: coarse)');
            [mqMobile, mqDesktop, mqCoarse].forEach(function (mq) {
                if (mq.addEventListener) mq.addEventListener('change', onResize);
            });
        } catch (e) {}
    }

    /* ---------- 公共接口（页面脚本使用，签名保持兼容） ---------- */
    function detectDevice() {
        var type = computeDevice();
        return {
            isMobile: type === 'mobile',
            isTablet: type === 'tablet',
            isDesktop: type === 'desktop',
            type: type,
            orientation: orientationOf(),
            touch: hasCoarsePointer() || lacksHover(),
            userAgent: navigator.userAgent,
            screenWidth: window.screen ? window.screen.width : 0,
            innerWidth: window.innerWidth || 0
        };
    }

    window.detectDevice = detectDevice;
    window.DEVICE = {
        get type() { return currentType || computeDevice(); },
        get orientation() { return orientationOf(); },
        detect: detectDevice,
        refresh: function () { applyDevice(true); },
        breakpoints: { mobile: BREAK_MOBILE, tablet: BREAK_TABLET }
    };

    /* ---------- 移动端工具栏点击展开（保留：仅触屏设备启用） ---------- */
    function initMobileToolbar() {
        var toolbar = document.querySelector('.toolbar');
        var d = detectDevice();
        if (!toolbar || !(d.isMobile || d.isTablet)) return;
        if (toolbar.__ddBound) return;
        toolbar.__ddBound = true;

        toolbar.addEventListener('click', function (e) {
            e.stopPropagation();
            toolbar.classList.toggle('expanded');
        });
        document.addEventListener('click', function (e) {
            if (!toolbar.contains(e.target)) toolbar.classList.remove('expanded');
        });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileToolbar);
    } else {
        initMobileToolbar();
    }
    window.addEventListener('load', function () { relinkCss(); applyDevice(true); initMobileToolbar(); });
})();
