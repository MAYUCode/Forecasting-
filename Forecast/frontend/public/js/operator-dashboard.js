class OperatorDashboardController {
    constructor() {
        this.activeRoutes = new Map();
        this.vehicles = new Map();
        this.maintenanceAlerts = [];
        this.map = null;
        this.dutyStatus = 'active';
        this.initialize();
    }

    async initialize() {
        this.initializeEventListeners();
        await this.loadInitialData();
        this.initializeMap();
        this.setupRealTimeUpdates();
        this.startLocationTracking();
    }

    initializeEventListeners() {
        // Status Toggle
        document.querySelector('.status-toggle').addEventListener('click', 
            () => this.toggleDutyStatus());

        // Alert Button
        document.querySelector('.alert-btn').addEventListener('click', 
            () => this.showIssueReportModal());

        // Route Selection
        document.querySelectorAll('.route-item').forEach(route => {
            route.addEventListener('click', (e) => this.handleRouteSelection(e));
        });

        // Vehicle Status Updates
        document.querySelectorAll('.vehicle-status-update').forEach(btn => {
            btn.addEventListener('click', (e) => this.updateVehicleStatus(e));
        });

        // Maintenance Reports
        document.querySelector('.report-maintenance').addEventListener('click', 
            () => this.showMaintenanceReportModal());
    }

    async loadInitialData() {
        try {
            const [routes, vehicles, alerts] = await Promise.all([
                this.fetchActiveRoutes(),
                this.fetchVehicleStatus(),
                this.fetchMaintenanceAlerts()
            ]);

            this.updateRoutesList(routes);
            this.updateVehicleGrid(vehicles);
            this.updateMaintenanceAlerts(alerts);
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    initializeMap() {
        this.map = new google.maps.Map(document.querySelector('.routes-map'), {
            zoom: 12,
            center: { lat: -34.397, lng: 150.644 },
            styles: this.getMapStyles()
        });

        // Initialize route polylines
        this.activeRoutes.forEach(route => {
            this.drawRouteOnMap(route);
        });

        // Initialize vehicle markers
        this.vehicles.forEach(vehicle => {
            this.addVehicleMarker(vehicle);
        });
    }

    setupRealTimeUpdates() {
        const ws = new WebSocket(`ws://${window.location.host}/operator/updates`);
        
        ws.onmessage = (event) => {
            const update = JSON.parse(event.data);
            this.handleRealTimeUpdate(update);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.setupPolling(); // Fallback to polling
        };
    }

    startLocationTracking() {
        if ('geolocation' in navigator) {
            navigator.geolocation.watchPosition(
                position => this.updateOperatorLocation(position),
                error => console.error('Geolocation error:', error),
                { enableHighAccuracy: true }
            );
        }
    }

    async toggleDutyStatus() {
        const newStatus = this.dutyStatus === 'active' ? 'inactive' : 'active';
        
        try {
            await fetch('/api/operator/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            this.dutyStatus = newStatus;
            this.updateStatusIndicator();
            this.showSuccess(`Status updated to ${newStatus}`);
        } catch (error) {
            this.showError('Failed to update status');
        }
    }

    showIssueReportModal() {
        const modal = document.createElement('div');
        modal.className = 'modal issue-report-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Report Issue</h2>
                <form id="issueReportForm">
                    <select name="issueType" required>
                        <option value="">Select Issue Type</option>
                        <option value="vehicle">Vehicle Issue</option>
                        <option value="route">Route Issue</option>
                        <option value="safety">Safety Concern</option>
                        <option value="other">Other</option>
                    </select>
                    <textarea name="description" 
                        placeholder="Describe the issue..." required></textarea>
                    <div class="form-actions">
                        <button type="submit" class="submit-btn">Submit Report</button>
                        <button type="button" class="cancel-btn">Cancel</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        this.initializeIssueReportForm(modal);
    }

    async handleRouteSelection(event) {
        const routeId = event.currentTarget.dataset.routeId;
        const route = this.activeRoutes.get(routeId);

        if (route) {
            this.highlightRoute(routeId);
            this.map.fitBounds(this.getRouteBounds(route));
            await this.loadRouteDetails(routeId);
        }
    }

    async updateVehicleStatus(event) {
        const vehicleId = event.currentTarget.dataset.vehicleId;
        const status = event.currentTarget.dataset.status;

        try {
            await fetch(`/api/vehicles/${vehicleId}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            this.updateVehicleStatusUI(vehicleId, status);
            this.showSuccess('Vehicle status updated');
        } catch (error) {
            this.showError('Failed to update vehicle status');
        }
    }

    handleRealTimeUpdate(update) {
        switch (update.type) {
            case 'route':
                this.updateRouteStatus(update.data);
                break;
            case 'vehicle':
                this.updateVehicleLocation(update.data);
                break;
            case 'maintenance':
                this.addMaintenanceAlert(update.data);
                break;
            case 'emergency':
                this.handleEmergencyAlert(update.data);
                break;
        }
    }

    updateOperatorLocation(position) {
        const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };

        // Update operator marker on map
        if (this.operatorMarker) {
            this.operatorMarker.setPosition(location);
        } else {
            this.operatorMarker = new google.maps.Marker({
                position: location,
                map: this.map,
                icon: '/assets/images/operator-marker.png'
            });
        }

        // Send location update to server
        this.sendLocationUpdate(location);
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

// Initialize operator dashboard
const operatorDashboard = new OperatorDashboardController(); 