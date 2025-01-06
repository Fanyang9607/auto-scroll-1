class AutoScroller {
    constructor() {
        this.isScrolling = false;
        this.settings = {
            speed: 5,
            mode: 'smooth',
            pauseTime: 3,
            enableGesture: true
        };
        this.touchStartY = 0;
        this.touchStartX = 0;
        
        this.setupGestureControl();
        
        // 添加目标页面支持
        this.targetFrame = null;
        this.setupTargetPage();
        
        // 添加平台特定设置
        this.platform = {
            type: 'normal', // normal, douyin
            interval: 3000  // 视频自动切换间隔（毫秒）
        };
        
        // 添加平台选择
        this.setupPlatformSelect();
        
        // 添加悬浮窗控制
        this.floating = false;
        this.setupFloatingControls();
    }

    setupGestureControl() {
        document.addEventListener('touchstart', (e) => {
            if (!this.settings.enableGesture) return;
            this.touchStartY = e.touches[0].clientY;
            this.touchStartX = e.touches[0].clientX;
        });

        document.addEventListener('touchend', (e) => {
            if (!this.settings.enableGesture) return;
            
            const touchEndY = e.changedTouches[0].clientY;
            const touchEndX = e.changedTouches[0].clientX;
            
            const deltaY = touchEndY - this.touchStartY;
            const deltaX = touchEndX - this.touchStartX;
            
            // 判断手势方向
            if (Math.abs(deltaY) > Math.abs(deltaX)) {
                // 垂直手势
                if (deltaY < -50) { // 上滑
                    this.toggleScroll();
                } else if (deltaY > 50) { // 下滑
                    this.stop();
                }
            } else {
                // 水平手势
                if (deltaX < -50) { // 左滑
                    this.decreaseSpeed();
                } else if (deltaX > 50) { // 右滑
                    this.increaseSpeed();
                }
            }
        });
    }

    start() {
        if (this.isScrolling) return;
        this.isScrolling = true;
        this.scroll();
    }

    pause() {
        this.isScrolling = false;
    }

    stop() {
        this.isScrolling = false;
    }

    toggleScroll() {
        if (this.isScrolling) {
            this.pause();
        } else {
            this.start();
        }
    }

    scroll() {
        if (!this.isScrolling) return;

        const speed = this.settings.speed * 2;
        const mode = this.settings.mode;

        if (mode === 'smooth') {
            window.scrollBy({
                top: speed,
                behavior: 'smooth'
            });
        } else {
            const viewportHeight = window.innerHeight;
            if (window.scrollY + viewportHeight >= document.documentElement.scrollHeight) {
                this.pause();
                return;
            }
            window.scrollBy({
                top: viewportHeight,
                behavior: 'smooth'
            });
            setTimeout(() => {
                this.scroll();
            }, this.settings.pauseTime * 1000);
            return;
        }

        requestAnimationFrame(() => this.scroll());
    }

    increaseSpeed() {
        this.settings.speed = Math.min(10, this.settings.speed + 1);
    }

    decreaseSpeed() {
        this.settings.speed = Math.max(1, this.settings.speed - 1);
    }

    updateSettings(newSettings) {
        this.settings = {...this.settings, ...newSettings};
    }

    setupTargetPage() {
        const pageMode = document.getElementById('pageMode');
        const targetUrl = document.getElementById('targetUrl');
        
        pageMode.addEventListener('change', () => {
            if (pageMode.value === 'custom' && targetUrl.value) {
                this.loadTargetPage(targetUrl.value);
            }
        });
        
        targetUrl.addEventListener('change', () => {
            if (pageMode.value === 'custom') {
                this.loadTargetPage(targetUrl.value);
            }
        });
    }
    
    loadTargetPage(url) {
        // 移除旧的 iframe
        if (this.targetFrame) {
            this.targetFrame.remove();
        }
        
        // 创建新的 iframe
        this.targetFrame = document.createElement('iframe');
        this.targetFrame.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
            z-index: 1000;
            background: white;
        `;
        
        // 添加返回按钮
        const backButton = document.createElement('button');
        backButton.textContent = '返回设置';
        backButton.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            z-index: 1001;
            padding: 5px 10px;
            background: rgba(0,0,0,0.5);
            color: white;
            border: none;
            border-radius: 5px;
        `;
        backButton.onclick = () => {
            this.targetFrame.style.display = 'none';
            backButton.style.display = 'none';
        };
        
        // 加载目标页面
        this.targetFrame.src = url;
        document.body.appendChild(this.targetFrame);
        document.body.appendChild(backButton);
        
        // 监听 iframe 加载完成
        this.targetFrame.onload = () => {
            try {
                // 注入滚动控制
                const frameDoc = this.targetFrame.contentWindow;
                this.scroll = () => {
                    if (!this.isScrolling) return;
                    
                    const speed = this.settings.speed * 2;
                    if (this.settings.mode === 'smooth') {
                        frameDoc.scrollBy({
                            top: speed,
                            behavior: 'smooth'
                        });
                    } else {
                        const viewportHeight = frameDoc.innerHeight;
                        frameDoc.scrollBy({
                            top: viewportHeight,
                            behavior: 'smooth'
                        });
                        setTimeout(() => this.scroll(), this.settings.pauseTime * 1000);
                        return;
                    }
                    requestAnimationFrame(() => this.scroll());
                };
            } catch (e) {
                console.error('无法访问目标页面，可能是跨域限制');
                alert('由于安全限制，无法在该页面使用自动滚动功能');
            }
        };
    }

    setupPlatformSelect() {
        const platformSelect = document.getElementById('platformSelect');
        platformSelect.addEventListener('change', () => {
            this.platform.type = platformSelect.value;
            if (this.platform.type === 'douyin') {
                // 抖音特定设置
                this.scroll = this.douyinScroll;
            } else {
                // 普通页面滚动
                this.scroll = this.normalScroll;
            }
        });
    }
    
    douyinScroll() {
        if (!this.isScrolling) return;
        
        try {
            // 模拟向上滑动手势
            const videoContainer = document.querySelector('.swiper-slide-active');
            if (videoContainer) {
                // 触发下一个视频
                const event = new TouchEvent('touchstart', {
                    bubbles: true,
                    cancelable: true,
                    touches: [{
                        clientX: window.innerWidth / 2,
                        clientY: window.innerHeight
                    }]
                });
                videoContainer.dispatchEvent(event);
                
                // 模拟滑动结束
                setTimeout(() => {
                    const endEvent = new TouchEvent('touchend', {
                        bubbles: true,
                        cancelable: true,
                        changedTouches: [{
                            clientX: window.innerWidth / 2,
                            clientY: 0
                        }]
                    });
                    videoContainer.dispatchEvent(endEvent);
                }, 100);
            }
        } catch (e) {
            console.error('无法控制抖音视频滚动', e);
        }
        
        // 设置下一次滚动
        setTimeout(() => {
            if (this.isScrolling) {
                this.douyinScroll();
            }
        }, this.platform.interval);
    }
    
    normalScroll() {
        // 原有的滚动逻辑保持不变
        if (!this.isScrolling) return;
        
        const speed = this.settings.speed * 2;
        if (this.settings.mode === 'smooth') {
            window.scrollBy({
                top: speed,
                behavior: 'smooth'
            });
        } else {
            const viewportHeight = window.innerHeight;
            if (window.scrollY + viewportHeight >= document.documentElement.scrollHeight) {
                this.pause();
                return;
            }
            window.scrollBy({
                top: viewportHeight,
                behavior: 'smooth'
            });
            setTimeout(() => {
                this.scroll();
            }, this.settings.pauseTime * 1000);
            return;
        }
        
        requestAnimationFrame(() => this.scroll());
    }

    setupFloatingControls() {
        const floatingBtn = document.getElementById('floatingBtn');
        const floatingControls = document.querySelector('.floating-controls');
        
        floatingBtn.addEventListener('click', () => {
            this.floating = !this.floating;
            floatingControls.classList.toggle('active', this.floating);
            floatingBtn.textContent = this.floating ? '关闭悬浮窗' : '开启悬浮窗';
        });
        
        // 悬浮窗按钮事件
        document.getElementById('floatingStartBtn').onclick = () => this.start();
        document.getElementById('floatingPauseBtn').onclick = () => this.pause();
        document.getElementById('floatingStopBtn').onclick = () => this.stop();
        document.getElementById('floatingSpeedUpBtn').onclick = () => this.increaseSpeed();
        document.getElementById('floatingSpeedDownBtn').onclick = () => this.decreaseSpeed();
        document.getElementById('floatingCloseBtn').onclick = () => {
            this.floating = false;
            floatingControls.classList.remove('active');
            floatingBtn.textContent = '开启悬浮窗';
        };
        
        // 悬浮窗拖动
        let isDragging = false;
        let startY = 0;
        
        floatingControls.addEventListener('touchstart', (e) => {
            isDragging = true;
            startY = e.touches[0].clientY - floatingControls.offsetTop;
        });
        
        floatingControls.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const newY = e.touches[0].clientY - startY;
            floatingControls.style.top = `${newY}px`;
        });
        
        floatingControls.addEventListener('touchend', () => {
            isDragging = false;
        });
    }
}

// 创建自动滚动实例
const autoScroller = new AutoScroller();

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'start':
            autoScroller.start();
            break;
        case 'pause':
            autoScroller.pause();
            break;
        case 'stop':
            autoScroller.stop();
            break;
        case 'updateSettings':
            autoScroller.updateSettings(request.settings);
            break;
    }
}); 