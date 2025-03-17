class TrackingManager {
    constructor() {
        this.map = null;
        this.markers = new Map();
        this.activeRakes = new Map();
        this.alerts = [];
        this.selectedRakeId = null;
        this.initialize();
    }

    async initialize() {
        await this.loadGoogleMapsAPI();
        this.initializeMap();
        this.initializeEventListeners();
        this.startRealTimeUpdates();
    }

    loadGoogleMapsAPI() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY`;
            script.async = true;
            script.defer = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    initializeMap() {
        this.map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: 20.5937, lng: 78.9629 }, // Center of India
            zoom: 5,
            styles: [
                {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }]
                }
            ]
        });
    }

    initializeEventListeners() {
        document.getElementById('trackingRouteFilter').addEventListener('change', () => {
            this.filterRakes();
        });

        document.getElementById('trackingStatusFilter').addEventListener('change', () => {
            this.filterRakes();
        });
    }

    startRealTimeUpdates() {
        // Simulate real-time updates every 5 seconds
        setInterval(() => {
            this.fetchUpdates();
        }, 5000);

        // Initial fetch
        this.fetchUpdates();
    }

    async fetchUpdates() {
        // Simulate API call for rake positions and status
        const updates = await this.fetchRakeData();
        this.updateRakePositions(updates);
        this.checkForAlerts(updates);
    }

    async fetchRakeData() {
        // Simulate API response
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    {
                        id: 1,
                        name: 'Rake-001',
                        position: { lat: 19.0760, lng: 72.8777 },
                        status: 'in-transit',
                        route: 'Mine A to Port B',
                        speed: 45,
                        eta: '2024-03-20 15:30',
                        delay: 0
                    },
                    {
                        id: 2,
                        name: 'Rake-002',
                        position: { lat: 22.5726, lng: 88.3639 },
                        status: 'delayed',
                        route: 'Mine C to Port D',
                        speed: 0,
                        eta: '2024-03-20 18:45',
                        delay: 30
                    }
                    // Add more rake data as needed
                ]);
            }, 1000);
        });
    }

    updateRakePositions(updates) {
        updates.forEach(update => {
            if (!this.markers.has(update.id)) {
                // Create new marker
                const marker = new google.maps.Marker({
                    position: update.position,
                    map: this.map,
                    title: update.name,
                    icon: this.getMarkerIcon(update.status)
                });

                marker.addListener('click', () => {
                    this.selectRake(update.id);
                });

                this.markers.set(update.id, marker);
            } else {
                // Update existing marker
                const marker = this.markers.get(update.id);
                marker.setPosition(update.position);
                marker.setIcon(this.getMarkerIcon(update.status));
            }

            this.activeRakes.set(update.id, update);
        });

        this.renderRakeList();
    }

    getMarkerIcon(status) {
        const colors = {
            'in-transit': '#1976d2',
            'loading': '#388e3c',
            'unloading': '#f57c00',
            'delayed': '#d32f2f'
        };

        return {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: colors[status] || '#666',
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: '#fff',
            scale: 8
        };
    }

    renderRakeList() {
        const list = document.getElementById('activeRakesList');
        list.innerHTML = Array.from(this.activeRakes.values())
            .map(rake => `
                <div class="rake-item ${rake.id === this.selectedRakeId ? 'selected' : ''}"
                     onclick="trackingManager.selectRake(${rake.id})">
                    <h4>${rake.name}</h4>
                    <p>Route: ${rake.route}</p>
                    <p>Status: <span class="status-badge ${rake.status}">${rake.status}</span></p>
                    <p>Speed: ${rake.speed} km/h</p>
                    <p>ETA: ${rake.eta}</p>
                    ${rake.delay ? `<p class="delay-warning">Delay: ${rake.delay} minutes</p>` : ''}
                </div>
            `)
            .join('');
    }

    selectRake(rakeId) {
        this.selectedRakeId = rakeId;
        const rake = this.activeRakes.get(rakeId);
        if (rake) {
            this.map.panTo(rake.position);
            this.map.setZoom(12);
        }
        this.renderRakeList();
    }

    checkForAlerts(updates) {
        updates.forEach(update => {
            if (update.delay > 15) {
                this.addAlert({
                    type: 'warning',
                    message: `${update.name} is delayed by ${update.delay} minutes on route ${update.route}`,
                    timestamp: new Date()
                });
            }
            if (update.status === 'delayed') {
                this.addAlert({
                    type: 'danger',
                    message: `${update.name} has stopped at ${update.position.lat}, ${update.position.lng}`,
                    timestamp: new Date()
                });
            }
        });
    }

    addAlert(alert) {
        this.alerts.unshift(alert);
        if (this.alerts.length > 10) {
            this.alerts.pop();
        }
        this.renderAlerts();
        this.showNotification(alert);
    }

    renderAlerts() {
        const alertsContainer = document.getElementById('trackingAlerts');
        alertsContainer.innerHTML = this.alerts
            .map(alert => `
                <div class="alert-item ${alert.type}">
                    <p>${alert.message}</p>
                    <small>${alert.timestamp.toLocaleTimeString()}</small>
                </div>
            `)
            .join('');
    }

    showNotification(alert) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Coal Transport Alert', {
                body: alert.message,
                icon: '/assets/images/logo.png'
            });
        }
    }

    filterRakes() {
        const routeFilter = document.getElementById('trackingRouteFilter').value;
        const statusFilter = document.getElementById('trackingStatusFilter').value;

        this.markers.forEach((marker, rakeId) => {
            const rake = this.activeRakes.get(rakeId);
            const routeMatch = !routeFilter || rake.route === routeFilter;
            const statusMatch = !statusFilter || rake.status === statusFilter;
            marker.setVisible(routeMatch && statusMatch);
        });
    }
}

// Request notification permission
if ('Notification' in window) {
    Notification.requestPermission();
}

// Initialize tracking manager
const trackingManager = new TrackingManager(); 