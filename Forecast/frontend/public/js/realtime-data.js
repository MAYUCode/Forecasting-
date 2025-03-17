class RealTimeDataController {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.updateCallbacks = new Map();
        this.initialize();
    }

    initialize() {
        this.setupWebSocket();
        this.registerDataHandlers();
        this.setupHeartbeat();
    }

    setupWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/dashboard`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('WebSocket connection established');
            this.reconnectAttempts = 0;
            this.sendInitialDataRequest();
        };

        this.ws.onclose = () => {
            console.log('WebSocket connection closed');
            this.handleReconnection();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.handleError(error);
        };

        this.ws.onmessage = (event) => {
            this.handleIncomingData(event.data);
        };
    }

    registerDataHandlers() {
        // Register handlers for different data types
        this.updateCallbacks.set('shipment', this.updateShipmentData.bind(this));
        this.updateCallbacks.set('vehicle', this.updateVehicleData.bind(this));
        this.updateCallbacks.set('route', this.updateRouteData.bind(this));
        this.updateCallbacks.set('metrics', this.updateMetrics.bind(this));
        this.updateCallbacks.set('alert', this.handleAlert.bind(this));
        this.updateCallbacks.set('maintenance', this.updateMaintenance.bind(this));
    }

    setupHeartbeat() {
        // Send heartbeat every 30 seconds
        setInterval(() => {
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'heartbeat' }));
            }
        }, 30000);
    }

    handleIncomingData(data) {
        try {
            const parsedData = JSON.parse(data);
            const handler = this.updateCallbacks.get(parsedData.type);
            
            if (handler) {
                handler(parsedData.data);
            } else {
                console.warn('No handler for data type:', parsedData.type);
            }
        } catch (error) {
            console.error('Error processing incoming data:', error);
        }
    }

    updateShipmentData(data) {
        // Update shipment cards and tracking information
        const shipmentCards = document.querySelectorAll(`[data-shipment-id="${data.id}"]`);
        shipmentCards.forEach(card => {
            card.querySelector('.status').textContent = data.status;
            card.querySelector('.location').textContent = data.currentLocation;
            card.querySelector('.eta').textContent = data.estimatedArrival;
            
            // Update status indicator color
            card.querySelector('.status-indicator').className = 
                `status-indicator ${data.status.toLowerCase()}`;
        });

        // Update tracking map if visible
        if (window.trackingMap) {
            this.updateTrackingMap(data);
        }

        // Update statistics
        this.updateShipmentStats(data);
    }

    updateVehicleData(data) {
        // Update vehicle markers on the map
        if (window.operatorMap) {
            this.updateVehicleMarker(data);
        }

        // Update vehicle status cards
        const vehicleCard = document.querySelector(`[data-vehicle-id="${data.id}"]`);
        if (vehicleCard) {
            vehicleCard.querySelector('.status').textContent = data.status;
            vehicleCard.querySelector('.location').textContent = data.location;
            vehicleCard.querySelector('.fuel-level').style.width = `${data.fuelLevel}%`;
        }
    }

    updateRouteData(data) {
        // Update route visualization on the map
        if (window.operatorMap) {
            this.updateRouteVisualization(data);
        }

        // Update route status in the list
        const routeItem = document.querySelector(`[data-route-id="${data.id}"]`);
        if (routeItem) {
            routeItem.querySelector('.status').textContent = data.status;
            routeItem.querySelector('.completion').style.width = `${data.completion}%`;
        }
    }

    updateMetrics(data) {
        // Update dashboard metrics
        Object.entries(data).forEach(([key, value]) => {
            const metricElement = document.querySelector(`[data-metric="${key}"]`);
            if (metricElement) {
                metricElement.textContent = value;
                
                // Add trend indicator
                if (value.trend) {
                    const trendClass = value.trend > 0 ? 'trending-up' : 'trending-down';
                    metricElement.querySelector('.trend').className = `trend ${trendClass}`;
                }
            }
        });

        // Update charts if they exist
        if (window.chartManager) {
            window.chartManager.updateCharts(data);
        }
    }

    handleAlert(data) {
        // Show alert notification
        const notification = document.createElement('div');
        notification.className = `alert alert-${data.severity}`;
        notification.innerHTML = `
            <i class="icon-${data.severity}"></i>
            <span>${data.message}</span>
            <button class="close-btn">&times;</button>
        `;
        
        document.querySelector('.alerts-container').appendChild(notification);

        // Auto-dismiss after 5 seconds for non-critical alerts
        if (data.severity !== 'critical') {
            setTimeout(() => notification.remove(), 5000);
        }

        // Play alert sound if enabled
        if (data.severity === 'critical') {
            this.playAlertSound();
        }
    }

    updateMaintenance(data) {
        // Update maintenance alerts
        const maintenanceList = document.querySelector('.maintenance-alerts');
        if (maintenanceList) {
            const alertElement = document.createElement('div');
            alertElement.className = 'maintenance-alert';
            alertElement.innerHTML = `
                <div class="alert-header">
                    <span class="vehicle-id">${data.vehicleId}</span>
                    <span class="priority ${data.priority}">${data.priority}</span>
                </div>
                <p class="alert-message">${data.message}</p>
                <div class="alert-actions">
                    <button class="acknowledge-btn">Acknowledge</button>
                    <button class="schedule-btn">Schedule</button>
                </div>
            `;
            maintenanceList.insertBefore(alertElement, maintenanceList.firstChild);
        }
    }

    handleReconnection() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.setupWebSocket(), 5000 * this.reconnectAttempts);
        } else {
            console.error('Max reconnection attempts reached');
            this.showOfflineWarning();
        }
    }

    handleError(error) {
        console.error('WebSocket error:', error);
        // Show error notification to user
        if (window.buttonActions) {
            window.buttonActions.showError('Connection error. Please refresh the page.');
        }
    }

    sendInitialDataRequest() {
        this.ws.send(JSON.stringify({
            type: 'init',
            dashboard: this.getDashboardType(),
            timestamp: Date.now()
        }));
    }

    getDashboardType() {
        if (document.body.classList.contains('admin-dashboard')) return 'admin';
        if (document.body.classList.contains('operator-dashboard')) return 'operator';
        return 'user';
    }

    playAlertSound() {
        const audio = new Audio('/assets/sounds/alert.mp3');
        audio.play().catch(error => console.warn('Failed to play alert sound:', error));
    }

    showOfflineWarning() {
        const warning = document.createElement('div');
        warning.className = 'offline-warning';
        warning.innerHTML = `
            <i class="icon-offline"></i>
            <span>You are currently offline. Data may be outdated.</span>
            <button onclick="window.location.reload()">Refresh</button>
        `;
        document.body.appendChild(warning);
    }
}

// Initialize real-time data controller
document.addEventListener('DOMContentLoaded', () => {
    window.realTimeData = new RealTimeDataController();
}); 