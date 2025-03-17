class UserDashboardController {
    constructor() {
        this.shipments = new Map();
        this.notifications = [];
        this.trackingMap = null;
        this.initialize();
    }

    async initialize() {
        this.initializeEventListeners();
        await this.loadInitialData();
        this.setupTrackingMap();
        this.setupRealTimeUpdates();
        this.loadUserProfile();
    }

    initializeEventListeners() {
        // Track Shipment Button
        document.querySelector('.search-btn').addEventListener('click', 
            () => this.trackShipment());

        // New Shipment Button
        document.querySelector('[data-action="new-shipment"]').addEventListener('click', 
            () => this.showNewShipmentModal());

        // Download Report Button
        document.querySelector('[data-action="download-report"]').addEventListener('click', 
            () => this.downloadReport());

        // Contact Support Button
        document.querySelector('[data-action="contact-support"]').addEventListener('click', 
            () => this.showSupportModal());

        // Notification Button
        document.querySelector('.notification-btn').addEventListener('click', 
            () => this.toggleNotifications());

        // Profile Button
        document.querySelector('.user-profile').addEventListener('click', 
            () => this.showProfileModal());

        // Shipment Cards
        document.querySelectorAll('.shipment-card').forEach(card => {
            card.addEventListener('click', (e) => this.showShipmentDetails(e));
        });

        // Add hover effects for interactive elements
        this.addHoverEffects();
    }

    addHoverEffects() {
        const interactiveElements = document.querySelectorAll('.action-btn, .shipment-card');
        interactiveElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                element.style.transform = 'translateY(-2px)';
                element.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            });
            element.addEventListener('mouseleave', () => {
                element.style.transform = 'translateY(0)';
                element.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)';
            });
        });
    }

    async showNewShipmentModal() {
        const modal = document.createElement('div');
        modal.className = 'modal new-shipment-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Create New Shipment</h2>
                    <img src="/assets/images/new-shipment-icon.svg" alt="New Shipment" class="modal-icon">
                </div>
                <form id="newShipmentForm">
                    <div class="form-group">
                        <label>Origin</label>
                        <input type="text" name="origin" required>
                    </div>
                    <div class="form-group">
                        <label>Destination</label>
                        <input type="text" name="destination" required>
                    </div>
                    <div class="form-group">
                        <label>Coal Type</label>
                        <select name="coalType" required>
                            <option value="thermal">Thermal Coal</option>
                            <option value="coking">Coking Coal</option>
                            <option value="anthracite">Anthracite</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Volume (tons)</label>
                        <input type="number" name="volume" required>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="submit-btn">Create Shipment</button>
                        <button type="button" class="cancel-btn">Cancel</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        this.initializeNewShipmentForm(modal);
    }

    async trackShipment() {
        const trackingInput = document.querySelector('.search-input');
        const trackingId = trackingInput.value.trim();

        if (!trackingId) {
            this.showError('Please enter a tracking number');
            return;
        }

        try {
            const response = await fetch(`/api/shipments/track/${trackingId}`);
            const shipmentData = await response.json();

            if (shipmentData) {
                this.showTrackingModal(shipmentData);
            } else {
                this.showError('Shipment not found');
            }
        } catch (error) {
            this.showError('Failed to track shipment');
        }
    }

    showTrackingModal(shipment) {
        const modal = document.createElement('div');
        modal.className = 'modal tracking-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Shipment Tracking</h2>
                    <img src="/assets/images/tracking-icon.svg" alt="Tracking" class="modal-icon">
                </div>
                <div class="tracking-details">
                    <div class="tracking-map" id="trackingMap"></div>
                    <div class="tracking-info">
                        <div class="info-item">
                            <img src="/assets/images/location-start.svg" alt="Origin">
                            <span>Origin: ${shipment.origin}</span>
                        </div>
                        <div class="info-item">
                            <img src="/assets/images/location-end.svg" alt="Destination">
                            <span>Destination: ${shipment.destination}</span>
                        </div>
                        <div class="info-item">
                            <img src="/assets/images/status.svg" alt="Status">
                            <span>Status: ${shipment.status}</span>
                        </div>
                        <div class="info-item">
                            <img src="/assets/images/time.svg" alt="ETA">
                            <span>ETA: ${shipment.eta}</span>
                        </div>
                    </div>
                    <div class="tracking-timeline">
                        ${this.generateTrackingTimeline(shipment.events)}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.initializeTrackingMap(shipment);
    }

    generateTrackingTimeline(events) {
        return events.map(event => `
            <div class="timeline-item ${event.status.toLowerCase()}">
                <img src="/assets/images/status-${event.status.toLowerCase()}.svg" alt="${event.status}">
                <div class="timeline-content">
                    <h4>${event.status}</h4>
                    <p>${event.description}</p>
                    <span class="time">${event.timestamp}</span>
                </div>
            </div>
        `).join('');
    }

    async downloadReport() {
        try {
            const response = await fetch('/api/shipments/report', {
                method: 'GET',
                headers: {
                    'Accept': 'application/pdf'
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'shipment-report.pdf';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                this.showSuccess('Report downloaded successfully');
            } else {
                throw new Error('Failed to download report');
            }
        } catch (error) {
            this.showError('Failed to download report');
        }
    }

    showSupportModal() {
        const modal = document.createElement('div');
        modal.className = 'modal support-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Contact Support</h2>
                    <img src="/assets/images/support-icon.svg" alt="Support" class="modal-icon">
                </div>
                <div class="support-options">
                    <div class="support-option" onclick="window.location.href='tel:+1234567890'">
                        <img src="/assets/images/phone-icon.svg" alt="Phone">
                        <h3>Call Us</h3>
                        <p>24/7 Support Line</p>
                    </div>
                    <div class="support-option" onclick="window.location.href='mailto:support@example.com'">
                        <img src="/assets/images/email-icon.svg" alt="Email">
                        <h3>Email Us</h3>
                        <p>Response within 24h</p>
                    </div>
                    <div class="support-option" onclick="this.startLiveChat()">
                        <img src="/assets/images/chat-icon.svg" alt="Chat">
                        <h3>Live Chat</h3>
                        <p>Instant Support</p>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.innerHTML = `
            <img src="/assets/images/error-icon.svg" alt="Error">
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.innerHTML = `
            <img src="/assets/images/success-icon.svg" alt="Success">
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Initialize user dashboard
const userDashboard = new UserDashboardController(); 