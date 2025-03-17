class AdminDashboardController {
    constructor() {
        this.systemMetrics = {};
        this.userManagement = new UserManagementSystem();
        this.routeManagement = new RouteManagementSystem();
        this.systemMonitor = new SystemMonitor();
        this.initialize();
    }

    async initialize() {
        this.initializeEventListeners();
        await this.loadInitialData();
        this.setupRealTimeUpdates();
        this.initializeCharts();
    }

    initializeEventListeners() {
        // Emergency Override Button
        document.querySelector('.emergency-btn').addEventListener('click', 
            () => this.handleEmergencyOverride());

        // System Status Button
        document.querySelector('.system-status-btn').addEventListener('click', 
            () => this.showSystemStatus());

        // Quick Action Buttons
        document.querySelectorAll('.action-btn').forEach(button => {
            button.addEventListener('click', (e) => this.handleQuickAction(e));
        });

        // Admin Controls
        this.initializeAdminControls();
    }

    async loadInitialData() {
        try {
            const [metrics, users, routes, logs] = await Promise.all([
                this.fetchSystemMetrics(),
                this.userManagement.getAllUsers(),
                this.routeManagement.getAllRoutes(),
                this.fetchSystemLogs()
            ]);

            this.updateDashboard(metrics);
            this.updateUsersList(users);
            this.updateRoutesList(routes);
            this.updateSystemLogs(logs);
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    setupRealTimeUpdates() {
        const ws = new WebSocket(`ws://${window.location.host}/admin/updates`);
        
        ws.onmessage = (event) => {
            const update = JSON.parse(event.data);
            this.handleRealTimeUpdate(update);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.setupPolling(); // Fallback to polling
        };
    }

    initializeCharts() {
        // System Performance Chart
        const perfCtx = document.getElementById('systemPerformanceChart').getContext('2d');
        this.performanceChart = new Chart(perfCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'CPU Usage',
                    data: [],
                    borderColor: '#2563eb'
                }, {
                    label: 'Memory Usage',
                    data: [],
                    borderColor: '#7c3aed'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

        // User Activity Chart
        const userCtx = document.getElementById('userActivityChart').getContext('2d');
        this.userActivityChart = new Chart(userCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Active Users',
                    data: [],
                    backgroundColor: '#2563eb'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    async handleEmergencyOverride() {
        const confirmed = await this.showConfirmDialog(
            'Emergency Override',
            'Are you sure you want to activate emergency override?'
        );

        if (confirmed) {
            try {
                await fetch('/api/admin/emergency-override', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                this.showSuccess('Emergency override activated');
            } catch (error) {
                this.showError('Failed to activate emergency override');
            }
        }
    }

    async handleQuickAction(event) {
        const action = event.target.textContent;
        switch (action) {
            case 'Add New User':
                this.userManagement.showAddUserModal();
                break;
            case 'Add New Operator':
                this.userManagement.showAddOperatorModal();
                break;
            case 'Configure Routes':
                this.routeManagement.showRouteConfigModal();
                break;
            case 'System Backup':
                await this.initiateSystemBackup();
                break;
        }
    }

    async initiateSystemBackup() {
        try {
            const response = await fetch('/api/admin/backup', {
                method: 'POST'
            });
            
            if (response.ok) {
                this.showSuccess('System backup initiated successfully');
            } else {
                throw new Error('Backup failed');
            }
        } catch (error) {
            this.showError('Failed to initiate system backup');
        }
    }

    handleRealTimeUpdate(update) {
        switch (update.type) {
            case 'metrics':
                this.updateSystemMetrics(update.data);
                break;
            case 'users':
                this.updateUsersList(update.data);
                break;
            case 'routes':
                this.updateRoutesList(update.data);
                break;
            case 'logs':
                this.addNewLog(update.data);
                break;
            case 'alert':
                this.showAlert(update.data);
                break;
        }
    }

    updateSystemMetrics(metrics) {
        this.systemMetrics = metrics;
        
        // Update metrics display
        Object.entries(metrics).forEach(([key, value]) => {
            const element = document.querySelector(`[data-metric="${key}"]`);
            if (element) {
                element.textContent = value;
            }
        });

        // Update charts
        this.updatePerformanceChart(metrics);
        this.updateUserActivityChart(metrics);
    }

    showSystemStatus() {
        const modal = document.createElement('div');
        modal.className = 'modal system-status-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>System Status</h2>
                <div class="status-grid">
                    <div class="status-item">
                        <h3>CPU Usage</h3>
                        <span>${this.systemMetrics.cpuUsage}%</span>
                    </div>
                    <div class="status-item">
                        <h3>Memory Usage</h3>
                        <span>${this.systemMetrics.memoryUsage}%</span>
                    </div>
                    <div class="status-item">
                        <h3>Active Connections</h3>
                        <span>${this.systemMetrics.activeConnections}</span>
                    </div>
                    <div class="status-item">
                        <h3>System Uptime</h3>
                        <span>${this.formatUptime(this.systemMetrics.uptime)}</span>
                    </div>
                </div>
                <button class="close-btn">Close</button>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector('.close-btn').addEventListener('click', () => {
            modal.remove();
        });
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${minutes}m`;
    }

    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Initialize admin dashboard
const adminDashboard = new AdminDashboardController(); 