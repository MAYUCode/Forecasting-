class MainDashboardController {
    constructor() {
        this.activeDashboard = null;
        this.dashboards = new Map();
        this.sharedData = new Map();
        this.userRole = null;
        this.initialize();
    }

    async initialize() {
        try {
            await this.getUserRole();
            this.initializeDashboards();
            this.setupEventListeners();
            this.initializeSharedComponents();
            this.setupRealTimeConnection();
        } catch (error) {
            console.error('Dashboard initialization failed:', error);
            this.showError('Failed to initialize dashboard');
        }
    }

    async getUserRole() {
        try {
            const response = await fetch('/api/user/role');
            const { role } = await response.json();
            this.userRole = role;
            document.body.setAttribute('data-role', role);
        } catch (error) {
            console.error('Failed to get user role:', error);
            throw error;
        }
    }

    initializeDashboards() {
        // Initialize role-specific dashboards
        this.dashboards.set('admin', new AdminDashboardController(this));
        this.dashboards.set('operator', new OperatorDashboardController(this));
        this.dashboards.set('user', new UserDashboardController(this));

        // Set active dashboard based on user role
        this.activeDashboard = this.dashboards.get(this.userRole);
        if (!this.activeDashboard) {
            throw new Error('Invalid user role');
        }
    }

    setupEventListeners() {
        // Global navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Dashboard switching (for admin users)
        if (this.userRole === 'admin') {
            document.querySelectorAll('.dashboard-switch').forEach(btn => {
                btn.addEventListener('click', (e) => this.switchDashboard(e));
            });
        }

        // Shared components events
        this.setupSharedEventListeners();
    }

    initializeSharedComponents() {
        // Initialize components shared across all dashboards
        this.initializeHeader();
        this.initializeNotifications();
        this.initializeGlobalSearch();
        this.initializeQuickActions();
    }

    setupRealTimeConnection() {
        // Create WebSocket connection for real-time updates
        const ws = new WebSocket(`ws://${window.location.host}/ws/dashboard`);
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleRealTimeUpdate(data);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.showError('Real-time connection failed');
        };
    }

    initializeHeader() {
        const header = document.createElement('header');
        header.className = 'main-header';
        header.innerHTML = `
            <div class="header-left">
                <img src="/assets/images/logo.png" alt="Logo" class="logo">
                <h1>Coal Transport Dashboard</h1>
            </div>
            <div class="header-center">
                <div class="global-search">
                    <input type="text" placeholder="Search across all dashboards...">
                    <button class="search-btn">
                        <i class="icon-search"></i>
                    </button>
                </div>
            </div>
            <div class="header-right">
                <button class="notifications-btn">
                    <i class="icon-notifications"></i>
                    <span class="badge">0</span>
                </button>
                <div class="user-menu">
                    <img src="/assets/images/avatar.png" alt="User" class="avatar">
                    <span class="user-name">Loading...</span>
                    <div class="user-dropdown">
                        <a href="#profile">Profile</a>
                        <a href="#settings">Settings</a>
                        <a href="#logout">Logout</a>
                    </div>
                </div>
            </div>
        `;
        document.body.prepend(header);
    }

    initializeNotifications() {
        const notificationsPanel = document.createElement('div');
        notificationsPanel.className = 'notifications-panel';
        notificationsPanel.innerHTML = `
            <div class="panel-header">
                <h3>Notifications</h3>
                <button class="mark-all-read">Mark all as read</button>
            </div>
            <div class="notifications-list"></div>
        `;
        document.body.appendChild(notificationsPanel);
    }

    initializeGlobalSearch() {
        const searchInput = document.querySelector('.global-search input');
        let searchTimeout;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.performGlobalSearch(e.target.value);
            }, 300);
        });
    }

    async performGlobalSearch(query) {
        if (!query) return;

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const results = await response.json();
            this.showSearchResults(results);
        } catch (error) {
            console.error('Search failed:', error);
            this.showError('Search failed');
        }
    }

    showSearchResults(results) {
        const resultsPanel = document.createElement('div');
        resultsPanel.className = 'search-results-panel';
        resultsPanel.innerHTML = `
            <div class="results-header">
                <h3>Search Results</h3>
                <button class="close-btn">&times;</button>
            </div>
            <div class="results-content">
                ${this.formatSearchResults(results)}
            </div>
        `;
        document.body.appendChild(resultsPanel);

        resultsPanel.querySelector('.close-btn').addEventListener('click', () => {
            resultsPanel.remove();
        });
    }

    formatSearchResults(results) {
        return Object.entries(results).map(([category, items]) => `
            <div class="result-category">
                <h4>${category}</h4>
                <div class="result-items">
                    ${items.map(item => `
                        <div class="result-item" data-id="${item.id}">
                            <i class="icon-${category.toLowerCase()}"></i>
                            <div class="item-details">
                                <h5>${item.title}</h5>
                                <p>${item.description}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    async switchDashboard(event) {
        const role = event.target.dataset.role;
        const dashboard = this.dashboards.get(role);
        
        if (dashboard) {
            this.activeDashboard = dashboard;
            await this.activeDashboard.initialize();
            this.updateDashboardView();
        }
    }

    updateDashboardView() {
        // Update active dashboard indicators
        document.querySelectorAll('.dashboard-switch').forEach(btn => {
            btn.classList.toggle('active', 
                btn.dataset.role === this.activeDashboard.constructor.name.toLowerCase());
        });

        // Update content area
        this.activeDashboard.render();
    }

    handleRealTimeUpdate(data) {
        // Distribute updates to appropriate dashboard
        this.activeDashboard.handleUpdate(data);

        // Update shared components if necessary
        if (data.notifications) {
            this.updateNotifications(data.notifications);
        }

        if (data.globalStats) {
            this.updateGlobalStats(data.globalStats);
        }
    }

    updateNotifications(notifications) {
        const badge = document.querySelector('.notifications-btn .badge');
        const list = document.querySelector('.notifications-list');
        
        badge.textContent = notifications.unread;
        list.innerHTML = notifications.items.map(item => `
            <div class="notification-item ${item.read ? 'read' : 'unread'}">
                <i class="icon-${item.type}"></i>
                <div class="notification-content">
                    <p>${item.message}</p>
                    <span class="time">${item.time}</span>
                </div>
            </div>
        `).join('');
    }

    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.innerHTML = `
            <i class="icon-error"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.innerHTML = `
            <i class="icon-success"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Initialize main dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.mainDashboard = new MainDashboardController();
}); 