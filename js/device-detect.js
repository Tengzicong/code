// 设备检测逻辑
function detectDevice() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android|webOS|BlackBerry|PlayBook|IEMobile|Opera Mini/i.test(navigator.userAgent) && window.screen.width >= 768;
    
    return {
        isMobile: isMobile && !isTablet,
        isTablet: isTablet,
        isDesktop: !isMobile && !isTablet,
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        innerWidth: window.innerWidth
    };
}

// 根据设备类型应用不同的样式
function applyDeviceStyles() {
    const device = detectDevice();
    
    // 添加设备类型类名到 body
    document.body.classList.remove('mobile-device', 'tablet-device', 'desktop-device');
    
    if (device.isMobile) {
        document.body.classList.add('mobile-device');
        console.log('📱 检测到移动设备');
    } else if (device.isTablet) {
        document.body.classList.add('tablet-device');
        console.log('📱 检测到平板设备');
    } else {
        document.body.classList.add('desktop-device');
        console.log('💻 检测到电脑设备');
    }
}

// 移动端工具栏点击展开功能
function initMobileToolbar() {
    const toolbar = document.querySelector('.toolbar');
    const device = detectDevice();
    
    if (device.isMobile && toolbar) {
        toolbar.addEventListener('click', function(e) {
            e.stopPropagation();
            toolbar.classList.toggle('expanded');
        });

        // 点击其他地方关闭工具栏
        document.addEventListener('click', function(e) {
            if (!toolbar.contains(e.target)) {
                toolbar.classList.remove('expanded');
            }
        });
    }
}

// 页面加载时自动执行
window.addEventListener('load', function() {
    applyDeviceStyles();
    initMobileToolbar();
});

// 窗口大小改变时重新检测
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        applyDeviceStyles();
    }, 250);
});
