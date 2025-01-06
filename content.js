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