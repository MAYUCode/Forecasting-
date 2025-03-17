class Dashboard {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.initialize();
    }

    initialize() {
        this.checkAuth();
        this.loadUserInfo();
        this.initializeEventListeners();
        this.loadScheduleData();
    }

    checkAuth() {
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }
    }

    loadUserInfo() {
        document.getElementById('userName').textContent = this.currentUser.name;
        document.getElementById('userRole').textContent = this.currentUser.role;
    }

    initializeEventListeners() {
        // Navigation
        document.querySelectorAll('.dashboard-nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(e.target);
            });
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });

        // Search and Filter
        document.getElementById('scheduleSearch').addEventListener('input', (e) => {
            this.filterSchedules(e.target.value);
        });

        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.filterSchedules(document.getElementById('scheduleSearch').value, e.target.value);
        });

        // Export
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportReport();
        });
    }

    handleNavigation(target) {
        document.querySelectorAll('.dashboard-nav a').forEach(link => {
            link.classList.remove('active');
        });
        target.classList.add('active');

        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
        });
        document.querySelector(target.getAttribute('href')).classList.add('active');
    }

    loadScheduleData() {
        // Sample data - replace with actual API call
        const schedules = [
            { date: '2024-03-15', route: 'Mine A to Port B', status: 'scheduled', quantity: '1000 tons' },
            { date: '2024-03-16', route: 'Mine C to Port D', status: 'in-transit', quantity: '1500 tons' },
            { date: '2024-03-17', route: 'Mine B to Port A', status: 'completed', quantity: '800 tons' },
        ];

        const tbody = document.querySelector('#scheduleTable tbody');
        tbody.innerHTML = schedules.map(schedule => `
            <tr>
                <td>${schedule.date}</td>
                <td>${schedule.route}</td>
                <td><span class="status-badge ${schedule.status}">${schedule.status}</span></td>
                <td>${schedule.quantity}</td>
                <td>
                    <button class="action-btn view-btn">View</button>
                    <button class="action-btn edit-btn">Edit</button>
                </td>
            </tr>
        `).join('');
    }

    filterSchedules(searchTerm, status = '') {
        // Implementation for filtering schedules
    }

    exportReport() {
        // Implementation for exporting data to CSV
        const data = [
            ['Date', 'Route', 'Status', 'Quantity'],
            // Add actual data rows here
        ];

        const csvContent = "data:text/csv;charset=utf-8," 
            + data.map(row => row.join(",")).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "schedule_report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Initialize dashboard
new Dashboard(); 