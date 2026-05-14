// 移动端游戏按钮连续触发控制
// 用于支持按住按钮连续操作（如连续移动、连续发射等）

const touchControls = {
    intervals: {}, // 存储每个按钮的定时器
    
    // 绑定长按连续触发
    bindHoldButton(buttonId, actionFunction, interval = 100) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        
        // 触摸开始
        button.addEventListener('touchstart', (e) => {
            // 只有在事件可取消时才调用 preventDefault
            if (e.cancelable) {
                e.preventDefault();
            }
            // 立即执行一次
            actionFunction();
            // 设置定时器连续执行
            this.intervals[buttonId] = setInterval(actionFunction, interval);
        });
        
        // 触摸结束
        button.addEventListener('touchend', (e) => {
            if (e.cancelable) {
                e.preventDefault();
            }
            this.stopHold(buttonId);
        });
        
        // 触摸取消
        button.addEventListener('touchcancel', (e) => {
            if (e.cancelable) {
                e.preventDefault();
            }
            this.stopHold(buttonId);
        });
        
        // 鼠标支持（用于桌面测试）
        button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            actionFunction();
            this.intervals[buttonId] = setInterval(actionFunction, interval);
        });
        
        button.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.stopHold(buttonId);
        });
        
        button.addEventListener('mouseleave', (e) => {
            e.preventDefault();
            this.stopHold(buttonId);
        });
    },
    
    // 停止连续触发
    stopHold(buttonId) {
        if (this.intervals[buttonId]) {
            clearInterval(this.intervals[buttonId]);
            delete this.intervals[buttonId];
        }
    },
    
    // 停止所有定时器
    stopAll() {
        Object.keys(this.intervals).forEach(id => {
            clearInterval(this.intervals[id]);
        });
        this.intervals = {};
    }
};

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    touchControls.stopAll();
});
