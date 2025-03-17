class TrackingManager {
    constructor() {
        this.map = null;
        this.markers = new Map();
        this.selectedRake = null;
        this.websocket = null;
        this.routeVisualization = null;
        this.initialize();
    }

    async initialize() {
        await this.loadGoogleMaps();
        this.initializeMap();
        this.routeVisualization = new RouteVisualization(this.map);
        this.initializeWebSocket();
        this.initializeEventListeners();
        this.loadInitialData();
    }

    async loadGoogleMaps() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`;
            script.async = true;
            script.defer = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    initializeMap() {
        this.map = new google.maps.Map(document.getElementById('trackingMap'), {
            center: { lat: 20.5937, lng: 78.9629 }, // Center of India
            zoom: 5,
            styles: this.getMapStyles(),
            disableDefaultUI: true,
            zoomControl: true
        });
    }

    initializeWebSocket() {
        this.websocket = new WebSocket(`ws://${window.location.host}/ws/tracking`);
        this.websocket.onmessage = (event) => this.handleWebSocketMessage(event);
    }

    initializeEventListeners() {
        document.querySelector('.refresh-btn').addEventListener('click', () => {
            this.refreshData();
        });

        document.getElementById('routeFilter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('statusFilter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.querySelector('.search-box input').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
    }

    async loadInitialData() {
        try {
            const response = await fetch('/api/tracking/active-rakes');
            const data = await response.json();
            this.updateRakes(data);
        } catch (error) {
            console.error('Failed to load tracking data:', error);
        }
    }

    updateRakes(rakes) {
        this.clearMarkers();
        this.updateRakeList(rakes);
        rakes.forEach(rake => this.addRakeMarker(rake));
    }

    addRakeMarker(rake) {
        const marker = new google.maps.Marker({
            position: {
                lat: rake.location.coordinates[1],
                lng: rake.location.coordinates[0]
            },
            map: this.map,
            icon: this.getMarkerIcon(rake.status),
            title: `Rake ${rake.id}`
        });

        marker.addListener('click', () => {
            this.selectRake(rake.id);
        });

        this.markers.set(rake.id, marker);
    }

    getMarkerIcon(status) {
        const colors = {
            'on-time': '#4caf50',
            'delayed': '#f44336',
            'loading': '#ff9800',
            'unloading': '#ff9800'
        };

        return {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: colors[status] || '#757575',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#ffffff',
            scale: 8
        };
    }

    updateRakeList(rakes) {
        const rakeList = document.getElementById('rakeList');
        rakeList.innerHTML = rakes.map(rake => `
            <div class="rake-item ${rake.id === this.selectedRake ? 'selected' : ''}"
                 data-rake-id="${rake.id}">
                <div class="rake-info">
                    <strong>Rake ${rake.id}</strong>
                    <span class="rake-route">${rake.route}</span>
                </div>
                <div class="rake-status ${rake.status}">
                    ${rake.status.replace('-', ' ')}
                </div>
                <div class="rake-details">
                    <span>Speed: ${rake.speed} km/h</span>
                    <span>ETA: ${rake.eta}</span>
                </div>
            </div>
        `).join('');

        // Add click listeners to rake items
        rakeList.querySelectorAll('.rake-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectRake(item.dataset.rakeId);
            });
        });
    }

    selectRake(rakeId) {
        this.selectedRake = rakeId;
        document.querySelectorAll('.rake-item').forEach(item => {
            item.classList.toggle('selected', item.dataset.rakeId === rakeId);
        });

        const marker = this.markers.get(rakeId);
        if (marker) {
            this.map.panTo(marker.getPosition());
            this.map.setZoom(12);
        }

        // Load route visualization
        const rake = this.getRakeData(rakeId);
        if (rake && rake.routeId) {
            this.routeVisualization.visualizeRoute(rake.routeId);
        }

        // Load history data for today
        const today = new Date().toISOString().split('T')[0];
        this.routeVisualization.loadHistoryData(rakeId, today);
    }

    handleWebSocketMessage(event) {
        const data = JSON.parse(event.data);
        switch (data.type) {
            case 'location_update':
                this.updateRakeLocation(data.rake_id, data.location);
                break;
            case 'status_update':
                this.updateRakeStatus(data.rake_id, data.status);
                break;
            case 'alert':
                this.addAlert(data.alert);
                break;
        }
    }

    // ... (additional methods for filtering, searching, and updating)
}

// Initialize tracking manager
const trackingManager = new TrackingManager(); 