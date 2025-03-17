class DashboardController {
    constructor() {
        this.initializeEventListeners();
        this.currentDateFilter = 'today';
        this.notificationsPanelOpen = false;
    }

    initializeEventListeners() {
        // Date filter buttons
        document.querySelectorAll('.date-btn').forEach(button => {
            button.addEventListener('click', (e) => this.handleDateFilter(e));
        });

        // Notification button
        document.querySelector('.notification-btn').addEventListener('click', 
            () => this.toggleNotificationsPanel());

        // New Schedule button
        document.querySelector('.action-btn').addEventListener('click', 
            () => this.openNewScheduleModal());

        // Search functionality
        const searchInput = document.querySelector('.search-input');
        searchInput.addEventListener('input', 
            debounce((e) => this.handleSearch(e.target.value), 300));

        // Navigation items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Chart action buttons
        document.querySelectorAll('.chart-filter-btn').forEach(button => {
            button.addEventListener('click', (e) => this.openChartFilters(e));
        });

        document.querySelectorAll('.chart-export-btn').forEach(button => {
            button.addEventListener('click', (e) => this.exportChartData(e));
        });

        // Close notifications panel
        document.querySelector('.notifications-panel .close-btn')
            .addEventListener('click', () => this.toggleNotificationsPanel());
    }

    async handleDateFilter(event) {
        const button = event.target;
        const filter = button.textContent.toLowerCase();

        // Update active state
        document.querySelectorAll('.date-btn').forEach(btn => 
            btn.classList.remove('active'));
        button.classList.add('active');

        if (filter === 'custom range') {
            this.openDateRangePicker();
            return;
        }

        this.currentDateFilter = filter;
        await this.updateDashboardData(filter);
    }

    async openDateRangePicker() {
        const { start, end } = await this.showDateRangeModal();
        if (start && end) {
            await this.updateDashboardData('custom', { start, end });
        }
    }

    showDateRangeModal() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal date-range-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>Select Date Range</h3>
                    <div class="date-inputs">
                        <input type="date" id="startDate">
                        <input type="date" id="endDate">
                    </div>
                    <div class="modal-actions">
                        <button class="cancel-btn">Cancel</button>
                        <button class="apply-btn">Apply</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            modal.querySelector('.cancel-btn').addEventListener('click', () => {
                modal.remove();
                resolve({});
            });

            modal.querySelector('.apply-btn').addEventListener('click', () => {
                const start = modal.querySelector('#startDate').value;
                const end = modal.querySelector('#endDate').value;
                modal.remove();
                resolve({ start, end });
            });
        });
    }

    async updateDashboardData(filter, dateRange = {}) {
        try {
            const params = new URLSearchParams({
                filter,
                ...dateRange
            });

            const response = await fetch(`/api/dashboard/stats?${params}`);
            const data = await response.json();

            this.updateStats(data.stats);
            this.updateCharts(data.charts);
            this.updateActivityList(data.activities);
        } catch (error) {
            console.error('Error updating dashboard:', error);
            this.showError('Failed to update dashboard data');
        }
    }

    updateStats(stats) {
        Object.entries(stats).forEach(([key, value]) => {
            const statElement = document.querySelector(`[data-stat="${key}"]`);
            if (statElement) {
                const numberElement = statElement.querySelector('.number');
                const trendElement = statElement.querySelector('.trend');
                
                numberElement.textContent = value.current;
                trendElement.textContent = `${value.trend}%`;
                trendElement.className = `trend ${value.trend >= 0 ? 'positive' : 'negative'}`;
            }
        });
    }

    toggleNotificationsPanel() {
        const panel = document.getElementById('notificationsPanel');
        this.notificationsPanelOpen = !this.notificationsPanelOpen;
        panel.classList.toggle('active', this.notificationsPanelOpen);
    }

    async openNewScheduleModal() {
        const modal = document.createElement('div');
        modal.className = 'modal schedule-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Create New Schedule</h3>
                <form id="scheduleForm">
                    <div class="form-group">
                        <label>Route</label>
                        <select name="route" required>
                            <option value="">Select Route</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Date</label>
                        <input type="date" name="date" required>
                    </div>
                    <div class="form-group">
                        <label>Time</label>
                        <input type="time" name="time" required>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="cancel-btn">Cancel</button>
                        <button type="submit" class="submit-btn">Create Schedule</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // Populate routes dropdown
        const routeSelect = modal.querySelector('select[name="route"]');
        const routes = await this.fetchRoutes();
        routes.forEach(route => {
            const option = document.createElement('option');
            option.value = route.id;
            option.textContent = route.name;
            routeSelect.appendChild(option);
        });

        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            modal.remove();
        });

        modal.querySelector('#scheduleForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createNewSchedule(new FormData(e.target));
            modal.remove();
        });
    }

    async handleSearch(query) {
        if (query.length < 2) return;

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const results = await response.json();
            this.showSearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    showSearchResults(results) {
        // Implementation of search results display
    }

    handleNavigation(event) {
        event.preventDefault();
        const target = event.currentTarget.getAttribute('href').substring(1);
        
        // Update active state
        document.querySelectorAll('.nav-item').forEach(item => 
            item.classList.remove('active'));
        event.currentTarget.classList.add('active');

        // Load section content
        this.loadSection(target);
    }

    async loadSection(section) {
        try {
            const response = await fetch(`/api/sections/${section}`);
            const data = await response.json();
            // Update main content area with new section
            document.querySelector('.dashboard-overview').innerHTML = data.content;
        } catch (error) {
            console.error('Error loading section:', error);
        }
    }

    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize dashboard
const dashboard = new DashboardController(); 