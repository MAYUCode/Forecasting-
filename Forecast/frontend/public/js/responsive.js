class ResponsiveController {
    constructor() {
        this.isSidebarOpen = false;
        this.initializeResponsiveFeatures();
    }

    initializeResponsiveFeatures() {
        // Add mobile menu toggle button
        this.addMobileMenuToggle();
        
        // Handle window resize
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Handle touch events for sidebar
        this.initializeTouchEvents();
        
        // Handle orientation change
        window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
        
        // Initialize responsive tables
        this.makeTablesResponsive();
    }

    addMobileMenuToggle() {
        const topBar = document.querySelector('.top-bar');
        const toggleButton = document.createElement('button');
        toggleButton.className = 'mobile-menu-toggle';
        toggleButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
        `;
        
        topBar.insertBefore(toggleButton, topBar.firstChild);
        
        toggleButton.addEventListener('click', () => this.toggleSidebar());
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        this.isSidebarOpen = !this.isSidebarOpen;
        sidebar.classList.toggle('active', this.isSidebarOpen);
        
        if (this.isSidebarOpen) {
            // Add overlay
            this.addSidebarOverlay();
        } else {
            this.removeSidebarOverlay();
        }
    }

    addSidebarOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.addEventListener('click', () => this.toggleSidebar());
        document.body.appendChild(overlay);
    }

    removeSidebarOverlay() {
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) {
            overlay.remove();
        }
    }

    initializeTouchEvents() {
        let touchStartX = 0;
        let touchEndX = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, false);
        
        document.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe(touchStartX, touchEndX);
        }, false);
    }

    handleSwipe(startX, endX) {
        const SWIPE_THRESHOLD = 100;
        const sidebar = document.querySelector('.sidebar');
        
        if (startX - endX > SWIPE_THRESHOLD) {
            // Swipe left - close sidebar
            this.isSidebarOpen && this.toggleSidebar();
        } else if (endX - startX > SWIPE_THRESHOLD && startX < 50) {
            // Swipe right from edge - open sidebar
            !this.isSidebarOpen && this.toggleSidebar();
        }
    }

    handleResize() {
        if (window.innerWidth > 1024 && this.isSidebarOpen) {
            this.toggleSidebar();
        }
        
        this.updateChartsResponsiveness();
    }

    handleOrientationChange() {
        // Reset any necessary layouts
        this.updateChartsResponsiveness();
        
        // Handle sidebar state
        if (window.innerWidth <= 1024) {
            this.isSidebarOpen && this.toggleSidebar();
        }
    }

    makeTablesResponsive() {
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-responsive';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        });
    }

    updateChartsResponsiveness() {
        if (window.Chart) {
            Chart.instances.forEach(chart => {
                chart.resize();
            });
        }
    }
}

// Initialize responsive features
const responsive = new ResponsiveController(); 