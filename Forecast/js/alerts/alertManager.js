class AlertManager {
    constructor() {
        this.alerts = new Map();
        this.subscribers = new Set();
        this.notificationSound = new Audio('/assets/sounds/alert.mp3');
        this.initialize();
    }

    initialize() {
        this.initializeWebSocket();
        this.loadInitialAlerts();
        this.initializeNotifications();
    }

    initializeWebSocket() {
        this.ws = new WebSocket(`ws://${window.location.host}/ws/alerts`);
        this.ws.onmessage = (event) => {
            const alert = JSON.parse(event.data);
            this.handleNewAlert(alert);
        };
    }

    async loadInitialAlerts() {
        try {
            const response = await fetch('/api/alerts/recent');
            const alerts = await response.json();
            alerts.forEach(alert => this.addAlert(alert));
        } catch (error) {
            console.error('Failed to load initial alerts:', error);
        }
    }

    async initializeNotifications() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            this.notificationsEnabled = permission === 'granted';
        }
    }

    handleNewAlert(alert) {
        this.addAlert(alert);
        this.notifySubscribers(alert);
        this.showNotification(alert);
    }

    addAlert(alert) {
        this.alerts.set(alert.id, {
            ...alert,
            timestamp: new Date(alert.timestamp)
        });
        this.updateAlertsList();
    }

    updateAlertsList() {
        const alertList = document.getElementById('alertList');
        if (!alertList) return;

        alertList.innerHTML = Array.from(this.alerts.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .map(alert => this.createAlertElement(alert))
            .join('');

        // Add click handlers
        alertList.querySelectorAll('.alert-item').forEach(element => {
            element.addEventListener('click', () => {
                this.handleAlertClick(element.dataset.alertId);
            });
        });
    }

    createAlertElement(alert) {
        return `
            <div class="alert-item ${alert.severity}" data-alert-id="${alert.id}">
                <div class="alert-header">
                    <span class="alert-type">${alert.type}</span>
                    <span class="alert-time">
                        ${this.formatTimestamp(alert.timestamp)}
                    </span>
                </div>
                <div class="alert-content">
                    <p>${alert.message}</p>
                    ${this.getAlertDetails(alert)}
                </div>
                <div class="alert-actions">
                    <button class="acknowledge-btn" 
                            ${alert.acknowledged ? 'disabled' : ''}>
                        ${alert.acknowledged ? 'Acknowledged' : 'Acknowledge'}
                    </button>
                    <button class="details-btn">View Details</button>
                </div>
            </div>
        `;
    }

    getAlertDetails(alert) {
        switch (alert.type) {
            case 'delay':
                return `
                    <div class="alert-details">
                        <span>Delay: ${alert.data.delayMinutes} minutes</span>
                        <span>Location: ${alert.data.location}</span>
                    </div>
                `;
            case 'maintenance':
                return `
                    <div class="alert-details">
                        <span>Component: ${alert.data.component}</span>
                        <span>Priority: ${alert.data.priority}</span>
                    </div>
                `;
            default:
                return '';
        }
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMinutes = Math.floor((now - date) / 60000);

        if (diffMinutes < 60) {
            return `${diffMinutes}m ago`;
        } else if (diffMinutes < 1440) {
            return `${Math.floor(diffMinutes / 60)}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    async handleAlertClick(alertId) {
        const alert = this.alerts.get(alertId);
        if (!alert) return;

        if (!alert.acknowledged) {
            try {
                await this.acknowledgeAlert(alertId);
            } catch (error) {
                console.error('Failed to acknowledge alert:', error);
            }
        }

        this.showAlertDetails(alert);
    }

    async acknowledgeAlert(alertId) {
        const response = await fetch(`/api/alerts/${alertId}/acknowledge`, {
            method: 'POST'
        });

        if (response.ok) {
            const alert = this.alerts.get(alertId);
            if (alert) {
                alert.acknowledged = true;
                this.updateAlertsList();
            }
        }
    }

    showAlertDetails(alert) {
        const modal = document.createElement('div');
        modal.className = 'alert-modal';
        modal.innerHTML = `
            <div class="alert-modal-content">
                <div class="alert-modal-header">
                    <h3>${alert.type} Alert</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="alert-modal-body">
                    <div class="alert-info">
                        <p><strong>Message:</strong> ${alert.message}</p>
                        <p><strong>Time:</strong> ${alert.timestamp.toLocaleString()}</p>
                        <p><strong>Severity:</strong> ${alert.severity}</p>
                        <p><strong>Status:</strong> ${alert.acknowledged ? 'Acknowledged' : 'Pending'}</p>
                    </div>
                    <div class="alert-details">
                        ${this.getDetailedAlertInfo(alert)}
                    </div>
                </div>
                <div class="alert-modal-footer">
                    <button class="primary-btn" onclick="window.location.href='/tracking/${alert.data.rakeId}'">
                        View in Tracking
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.close-btn').addEventListener('click', () => {
            modal.remove();
        });
    }

    getDetailedAlertInfo(alert) {
        // Convert alert data to detailed HTML representation
        return Object.entries(alert.data).map(([key, value]) => `
            <div class="detail-item">
                <span class="detail-label">${key}:</span>
                <span class="detail-value">${value}</span>
            </div>
        `).join('');
    }

    showNotification(alert) {
        if (this.notificationsEnabled) {
            const notification = new Notification(`${alert.type} Alert`, {
                body: alert.message,
                icon: '/assets/icons/alert.png'
            });

            notification.onclick = () => {
                window.focus();
                this.showAlertDetails(alert);
            };
        }

        this.notificationSound.play().catch(() => {
            // Handle autoplay restrictions
        });
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    notifySubscribers(alert) {
        this.subscribers.forEach(callback => callback(alert));
    }
}

// Initialize alert manager
const alertManager = new AlertManager(); 