class SchedulingManager {
    constructor() {
        this.schedules = [];
        this.routes = [
            { id: 1, name: 'Mine A to Port B' },
            { id: 2, name: 'Mine C to Port D' },
            { id: 3, name: 'Mine B to Port A' }
        ];
        this.resourceChart = null;
        this.initialize();
    }

    initialize() {
        this.initializeEventListeners();
        this.populateRouteFilter();
        this.loadSchedules();
        this.createResourceChart();
    }

    initializeEventListeners() {
        document.getElementById('newScheduleBtn').addEventListener('click', () => {
            this.showNewScheduleModal();
        });

        document.getElementById('scheduleDate').addEventListener('change', () => {
            this.filterSchedules();
        });

        document.getElementById('routeFilter').addEventListener('change', () => {
            this.filterSchedules();
        });
    }

    populateRouteFilter() {
        const routeFilter = document.getElementById('routeFilter');
        this.routes.forEach(route => {
            const option = document.createElement('option');
            option.value = route.id;
            option.textContent = route.name;
            routeFilter.appendChild(option);
        });
    }

    async loadSchedules() {
        // Simulate API call
        const schedules = await this.fetchSchedules();
        this.schedules = schedules;
        this.renderSchedules();
        this.updateResourceChart();
    }

    async fetchSchedules() {
        // Simulate API response
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    {
                        id: 1,
                        date: '2024-03-20',
                        routeId: 1,
                        quantity: 1200,
                        status: 'scheduled',
                        rakes: 3
                    },
                    {
                        id: 2,
                        date: '2024-03-21',
                        routeId: 2,
                        quantity: 1500,
                        status: 'scheduled',
                        rakes: 4
                    },
                    {
                        id: 3,
                        date: '2024-03-22',
                        routeId: 3,
                        quantity: 800,
                        status: 'scheduled',
                        rakes: 2
                    }
                ]);
            }, 500);
        });
    }

    renderSchedules() {
        const schedulesList = document.getElementById('schedulesList');
        schedulesList.innerHTML = this.schedules
            .map(schedule => {
                const route = this.routes.find(r => r.id === schedule.routeId);
                return `
                    <div class="schedule-item" data-id="${schedule.id}">
                        <div class="schedule-info">
                            <h4>${route.name}</h4>
                            <p>Date: ${schedule.date}</p>
                            <p>Quantity: ${schedule.quantity} tons</p>
                            <p>Rakes: ${schedule.rakes}</p>
                        </div>
                        <div class="schedule-actions">
                            <span class="status-badge ${schedule.status}">${schedule.status}</span>
                            <button class="edit-btn" onclick="schedulingManager.editSchedule(${schedule.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="delete-btn" onclick="schedulingManager.deleteSchedule(${schedule.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
            })
            .join('');
    }

    createResourceChart() {
        const ctx = document.getElementById('resourceChart').getContext('2d');
        this.resourceChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Allocated Rakes',
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    borderColor: 'rgb(75, 192, 192)',
                    borderWidth: 1,
                    data: []
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Daily Resource Allocation'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Rakes'
                        }
                    }
                }
            }
        });
    }

    updateResourceChart() {
        const dateGroups = this.groupSchedulesByDate();
        this.resourceChart.data.labels = Array.from(dateGroups.keys());
        this.resourceChart.data.datasets[0].data = Array.from(dateGroups.values())
            .map(schedules => schedules.reduce((sum, schedule) => sum + schedule.rakes, 0));
        this.resourceChart.update();
    }

    groupSchedulesByDate() {
        return this.schedules.reduce((groups, schedule) => {
            if (!groups.has(schedule.date)) {
                groups.set(schedule.date, []);
            }
            groups.get(schedule.date).push(schedule);
            return groups;
        }, new Map());
    }

    filterSchedules() {
        const date = document.getElementById('scheduleDate').value;
        const routeId = document.getElementById('routeFilter').value;

        const filtered = this.schedules.filter(schedule => {
            const dateMatch = !date || schedule.date === date;
            const routeMatch = !routeId || schedule.routeId === parseInt(routeId);
            return dateMatch && routeMatch;
        });

        this.renderFilteredSchedules(filtered);
    }

    renderFilteredSchedules(filteredSchedules) {
        const schedulesList = document.getElementById('schedulesList');
        schedulesList.innerHTML = filteredSchedules
            .map(schedule => {
                const route = this.routes.find(r => r.id === schedule.routeId);
                return `
                    <div class="schedule-item" data-id="${schedule.id}">
                        <div class="schedule-info">
                            <h4>${route.name}</h4>
                            <p>Date: ${schedule.date}</p>
                            <p>Quantity: ${schedule.quantity} tons</p>
                            <p>Rakes: ${schedule.rakes}</p>
                        </div>
                        <div class="schedule-actions">
                            <span class="status-badge ${schedule.status}">${schedule.status}</span>
                            <button class="edit-btn" onclick="schedulingManager.editSchedule(${schedule.id})">Edit</button>
                            <button class="delete-btn" onclick="schedulingManager.deleteSchedule(${schedule.id})">Delete</button>
                        </div>
                    </div>
                `;
            })
            .join('');
    }

    showNewScheduleModal() {
        // Create and show modal for new schedule
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>New Schedule</h2>
                <form id="newScheduleForm">
                    <div class="form-group">
                        <label for="scheduleRoute">Route</label>
                        <select id="scheduleRoute" required>
                            ${this.routes.map(route => 
                                `<option value="${route.id}">${route.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="scheduleDate">Date</label>
                        <input type="date" id="scheduleDate" required>
                    </div>
                    <div class="form-group">
                        <label for="scheduleQuantity">Quantity (tons)</label>
                        <input type="number" id="scheduleQuantity" required min="100">
                    </div>
                    <div class="form-group">
                        <label for="scheduleRakes">Number of Rakes</label>
                        <input type="number" id="scheduleRakes" required min="1">
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="primary-btn">Create Schedule</button>
                        <button type="button" class="secondary-btn" onclick="this.closest('.modal').remove()">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('newScheduleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createNewSchedule(e.target);
            modal.remove();
        });
    }

    async createNewSchedule(form) {
        const newSchedule = {
            id: this.schedules.length + 1,
            routeId: parseInt(form.scheduleRoute.value),
            date: form.scheduleDate.value,
            quantity: parseInt(form.scheduleQuantity.value),
            rakes: parseInt(form.scheduleRakes.value),
            status: 'scheduled'
        };

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        this.schedules.push(newSchedule);
        this.renderSchedules();
        this.updateResourceChart();
    }

    async deleteSchedule(id) {
        if (!confirm('Are you sure you want to delete this schedule?')) {
            return;
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        this.schedules = this.schedules.filter(schedule => schedule.id !== id);
        this.renderSchedules();
        this.updateResourceChart();
    }

    editSchedule(id) {
        const schedule = this.schedules.find(s => s.id === id);
        if (!schedule) return;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Edit Schedule</h2>
                <form id="editScheduleForm">
                    <div class="form-group">
                        <label for="editRoute">Route</label>
                        <select id="editRoute" required>
                            ${this.routes.map(route => 
                                `<option value="${route.id}" ${route.id === schedule.routeId ? 'selected' : ''}>
                                    ${route.name}
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editDate">Date</label>
                        <input type="date" id="editDate" value="${schedule.date}" required>
                    </div>
                    <div class="form-group">
                        <label for="editQuantity">Quantity (tons)</label>
                        <input type="number" id="editQuantity" value="${schedule.quantity}" required min="100">
                    </div>
                    <div class="form-group">
                        <label for="editRakes">Number of Rakes</label>
                        <input type="number" id="editRakes" value="${schedule.rakes}" required min="1">
                    </div>
                    <div class="modal-actions">
                        <button type="submit" class="primary-btn">Update Schedule</button>
                        <button type="button" class="secondary-btn" onclick="this.closest('.modal').remove()">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('editScheduleForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateSchedule(id, e.target);
            modal.remove();
        });
    }

    async updateSchedule(id, form) {
        const updatedSchedule = {
            ...this.schedules.find(s => s.id === id),
            routeId: parseInt(form.editRoute.value),
            date: form.editDate.value,
            quantity: parseInt(form.editQuantity.value),
            rakes: parseInt(form.editRakes.value)
        };

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        this.schedules = this.schedules.map(schedule => 
            schedule.id === id ? updatedSchedule : schedule
        );
        
        this.renderSchedules();
        this.updateResourceChart();
    }
}

// Initialize scheduling manager
const schedulingManager = new SchedulingManager(); 