class DashboardCharts {
    constructor() {
        this.initializeCharts();
    }

    initializeCharts() {
        this.createDemandChart();
        this.createEfficiencyChart();
    }

    createDemandChart() {
        const ctx = document.getElementById('demandChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Forecasted Demand',
                    data: [1200, 1900, 1700, 1600, 2100, 1800],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }, {
                    label: 'Actual Demand',
                    data: [1300, 1800, 1600, 1700, 2000, 1900],
                    borderColor: 'rgb(255, 99, 132)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Coal Demand Forecast vs Actual'
                    }
                }
            }
        });
    }

    createEfficiencyChart() {
        const ctx = document.getElementById('efficiencyChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                datasets: [{
                    label: 'Rake Utilization (%)',
                    data: [85, 92, 88, 95, 90],
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Rake Allocation Efficiency'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }
}

// Initialize charts
new DashboardCharts(); 