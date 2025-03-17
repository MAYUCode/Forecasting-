class MobileOptimizer {
    constructor() {
        this.touchStartY = 0;
        this.touchEndY = 0;
        this.isScrolling = false;
        this.lastTap = 0;
        this.initialize();
    }

    initialize() {
        this.setupPullToRefresh();
        this.setupInfiniteScroll();
        this.setupDoubleTapZoom();
        this.setupImageLazyLoading();
        this.setupGestureControls();
        this.optimizeAnimations();
    }

    setupPullToRefresh() {
        document.addEventListener('touchstart', (e) => {
            this.touchStartY = e.touches[0].clientY;
        });

        document.addEventListener('touchmove', (e) => {
            this.touchEndY = e.touches[0].clientY;
            const scrollTop = document.documentElement.scrollTop;
            
            if (scrollTop === 0 && this.touchEndY > this.touchStartY) {
                this.handlePullToRefresh(e);
            }
        });
    }

    async handlePullToRefresh(e) {
        e.preventDefault();
        const pullDistance = this.touchEndY - this.touchStartY;
        
        if (pullDistance > 100) {
            this.showRefreshIndicator();
            await this.refreshData();
            this.hideRefreshIndicator();
        }
    }

    setupInfiniteScroll() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isScrolling) {
                    this.loadMoreContent();
                }
            });
        }, options);

        const sentinel = document.querySelector('#infinite-scroll-sentinel');
        if (sentinel) observer.observe(sentinel);
    }

    async loadMoreContent() {
        this.isScrolling = true;
        try {
            // Load more content logic
            await this.fetchMoreItems();
        } finally {
            this.isScrolling = false;
        }
    }

    setupDoubleTapZoom() {
        document.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - this.lastTap;
            
            if (tapLength < 300 && tapLength > 0) {
                e.preventDefault();
                this.handleDoubleTap(e);
            }
            this.lastTap = currentTime;
        });
    }

    setupImageLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    setupGestureControls() {
        let touchstartX = 0;
        let touchendX = 0;

        document.addEventListener('touchstart', (e) => {
            touchstartX = e.changedTouches[0].screenX;
        });

        document.addEventListener('touchend', (e) => {
            touchendX = e.changedTouches[0].screenX;
            this.handleGesture();
        });
    }

    handleGesture() {
        const THRESHOLD = 50;
        if (touchendX < touchstartX - THRESHOLD) {
            this.handleSwipeLeft();
        }
        if (touchendX > touchstartX + THRESHOLD) {
            this.handleSwipeRight();
        }
    }

    optimizeAnimations() {
        // Use transform instead of left/top for animations
        const animatedElements = document.querySelectorAll('.animated');
        animatedElements.forEach(element => {
            element.style.transform = 'translateZ(0)';
            element.style.willChange = 'transform';
        });

        // Remove will-change after animation
        animatedElements.forEach(element => {
            element.addEventListener('transitionend', () => {
                element.style.willChange = 'auto';
            });
        });
    }

    showRefreshIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'refresh-indicator';
        indicator.innerHTML = `
            <div class="spinner"></div>
            <span>Refreshing...</span>
        `;
        document.body.appendChild(indicator);
    }

    hideRefreshIndicator() {
        const indicator = document.querySelector('.refresh-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    async refreshData() {
        // Implement your data refresh logic here
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Refresh dashboard data
        if (window.dashboard) {
            await window.dashboard.updateDashboardData('today');
        }
    }
}

// Initialize mobile optimizations
const mobileOptimizer = new MobileOptimizer(); 