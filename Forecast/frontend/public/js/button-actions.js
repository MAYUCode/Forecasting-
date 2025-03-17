class ButtonActionsController {
    constructor() {
        this.initialize();
    }

    initialize() {
        // Common button actions
        this.initializeCommonButtons();
        
        // Role-specific button actions
        if (this.isAdminDashboard()) {
            this.initializeAdminButtons();
        } else if (this.isOperatorDashboard()) {
            this.initializeOperatorButtons();
        } else if (this.isUserDashboard()) {
            this.initializeUserButtons();
        }
    }

    initializeCommonButtons() {
        // Profile buttons
        document.querySelectorAll('.profile-btn, .user-profile').forEach(btn => {
            btn.addEventListener('click', () => this.handleProfileClick());
        });

        // Notification buttons
        document.querySelectorAll('.notification-btn').forEach(btn => {
            btn.addEventListener('click', () => this.toggleNotifications());
        });

        // Logout buttons
        document.querySelectorAll('.logout-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleLogout());
        });

        // Settings buttons
        document.querySelectorAll('.settings-btn').forEach(btn => {
            btn.addEventListener('click', () => this.openSettings());
        });

        // Help buttons
        document.querySelectorAll('.help-btn').forEach(btn => {
            btn.addEventListener('click', () => this.showHelp());
        });
    }

    initializeAdminButtons() {
        // Emergency Override
        document.querySelector('.emergency-btn')?.addEventListener('click', 
            () => this.handleEmergencyOverride());

        // System Status
        document.querySelector('.system-status-btn')?.addEventListener('click', 
            () => this.showSystemStatus());

        // User Management
        document.querySelector('[data-action="manage-users"]')?.addEventListener('click', 
            () => this.openUserManagement());

        // Route Management
        document.querySelector('[data-action="manage-routes"]')?.addEventListener('click', 
            () => this.openRouteManagement());

        // System Logs
        document.querySelector('[data-action="view-logs"]')?.addEventListener('click', 
            () => this.viewSystemLogs());

        // Backup System
        document.querySelector('[data-action="backup-system"]')?.addEventListener('click', 
            () => this.initiateBackup());

        // Analytics
        document.querySelector('[data-action="view-analytics"]')?.addEventListener('click', 
            () => this.openAnalytics());
    }

    initializeOperatorButtons() {
        // Status Toggle
        document.querySelector('.status-toggle')?.addEventListener('click', 
            () => this.toggleOperatorStatus());

        // Report Issue
        document.querySelector('.alert-btn')?.addEventListener('click', 
            () => this.reportIssue());

        // Vehicle Status Updates
        document.querySelectorAll('.vehicle-status-update').forEach(btn => {
            btn.addEventListener('click', (e) => this.updateVehicleStatus(e));
        });

        // Route Selection
        document.querySelectorAll('.route-item').forEach(item => {
            item.addEventListener('click', (e) => this.selectRoute(e));
        });

        // Maintenance Reports
        document.querySelector('.maintenance-btn')?.addEventListener('click', 
            () => this.reportMaintenance());

        // Emergency Contact
        document.querySelector('.emergency-contact-btn')?.addEventListener('click', 
            () => this.contactEmergency());
    }

    initializeUserButtons() {
        // Track Shipment
        document.querySelector('.search-btn')?.addEventListener('click', 
            () => this.trackShipment());

        // New Shipment
        document.querySelector('[data-action="new-shipment"]')?.addEventListener('click', 
            () => this.createNewShipment());

        // Download Report
        document.querySelector('[data-action="download-report"]')?.addEventListener('click', 
            () => this.downloadShipmentReport());

        // Contact Support
        document.querySelector('[data-action="contact-support"]')?.addEventListener('click', 
            () => this.contactSupport());

        // View History
        document.querySelector('[data-action="view-history"]')?.addEventListener('click', 
            () => this.viewShipmentHistory());
    }

    // Common Actions
    async handleProfileClick() {
        try {
            const response = await fetch('/api/user/profile');
            const profile = await response.json();
            this.showProfileModal(profile);
        } catch (error) {
            this.showError('Failed to load profile');
        }
    }

    async toggleNotifications() {
        const panel = document.querySelector('.notifications-panel');
        if (panel.classList.contains('active')) {
            panel.classList.remove('active');
        } else {
            try {
                const response = await fetch('/api/notifications');
                const notifications = await response.json();
                this.updateNotificationsPanel(notifications);
                panel.classList.add('active');
            } catch (error) {
                this.showError('Failed to load notifications');
            }
        }
    }

    async handleLogout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
        } catch (error) {
            this.showError('Failed to logout');
        }
    }

    // Admin Actions
    async handleEmergencyOverride() {
        const confirmed = await this.showConfirmDialog(
            'Are you sure you want to activate emergency override?'
        );
        if (confirmed) {
            try {
                await fetch('/api/admin/emergency-override', { method: 'POST' });
                this.showSuccess('Emergency override activated');
            } catch (error) {
                this.showError('Failed to activate emergency override');
            }
        }
    }

    // Operator Actions
    async toggleOperatorStatus() {
        try {
            const response = await fetch('/api/operator/status', { method: 'POST' });
            const status = await response.json();
            this.updateStatusDisplay(status);
            this.showSuccess(`Status updated to ${status}`);
        } catch (error) {
            this.showError('Failed to update status');
        }
    }

    // User Actions
    async trackShipment() {
        const trackingNumber = document.querySelector('.search-input').value;
        if (!trackingNumber) {
            this.showError('Please enter a tracking number');
            return;
        }

        try {
            const response = await fetch(`/api/shipments/track/${trackingNumber}`);
            const shipment = await response.json();
            this.showTrackingModal(shipment);
        } catch (error) {
            this.showError('Failed to track shipment');
        }
    }

    // Utility Methods
    isAdminDashboard() {
        return document.body.classList.contains('admin-dashboard');
    }

    isOperatorDashboard() {
        return document.body.classList.contains('operator-dashboard');
    }

    isUserDashboard() {
        return document.body.classList.contains('user-dashboard');
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

// Initialize button actions
document.addEventListener('DOMContentLoaded', () => {
    window.buttonActions = new ButtonActionsController();
}); 