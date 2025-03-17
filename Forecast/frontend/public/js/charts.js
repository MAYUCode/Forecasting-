class ChartManager {
    constructor() {
        this.charts = new Map();
        this.colors = {
            primary: '#2563eb',
            secondary: '#3b82f6',
            success: '#10b981',
            warning: '#f59e0b',
            danger: '#ef4444',
            background: 'rgba(37, 99, 235, 0.1)'
        };
        this.initialize();
    }

    initialize() {
        // Initialize delivery performance chart
        this.createDeliveryChart();
        // Initialize volume analysis chart
        this.createVolumeChart();
        // Initialize efficiency metrics chart
        this.createEfficiencyChart();
        // Set up real-time updates
        this.setupRealtimeUpdates();
    }

    createDeliveryChart() {
        const ctx = document.getElementById('deliveryChart').getContext('2d');
        this.charts.set('delivery', new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'On-Time Deliveries',
                    data: [],
                    borderColor: this.colors.primary,
                    backgroundColor: this.colors.background,
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Delayed Deliveries',
                    data: [],
                    borderColor: this.colors.warning,
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        }));
    }

    createVolumeChart() {
        const ctx = document.getElementById('volumeChart').getContext('2d');
        this.charts.set('volume', new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Coal Volume (tons)',
                    data: [],
                    backgroundColor: this.colors.primary,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        }));
    }

    createEfficiencyChart() {
        const ctx = document.getElementById('efficiencyChart').getContext('2d');
        this.charts.set('efficiency', new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Efficient', 'Delayed', 'Issues'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [
                        this.colors.success,
                        this.colors.warning,
                        this.colors.danger
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                },
                cutout: '70%'
            }
        }));
    }

    updateChartData(chartId, newData) {
        const chart = this.charts.get(chartId);
        if (!chart) return;

        chart.data.labels = newData.labels;
        chart.data.datasets.forEach((dataset, index) => {
            dataset.data = newData.datasets[index].data;
        });
        chart.update('none'); // Update without animation for performance
    }

    setupRealtimeUpdates() {
        // Connect to WebSocket for real-time updates
        const ws = new WebSocket(`ws://${window.location.host}/ws/metrics`);
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleRealtimeUpdate(data);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            // Fallback to polling if WebSocket fails
            this.setupPolling();
        };
    }

    setupPolling() {
        setInterval(async () => {
            try {
                const response = await fetch('/api/metrics/latest');
                const data = await response.json();
                this.handleRealtimeUpdate(data);
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 30000); // Poll every 30 seconds
    }

    handleRealtimeUpdate(data) {
        // Update delivery chart
        if (data.deliveries) {
            this.updateChartData('delivery', data.deliveries);
        }

        // Update volume chart
        if (data.volumes) {
            this.updateChartData('volume', data.volumes);
        }

        // Update efficiency chart
        if (data.efficiency) {
            this.updateChartData('efficiency', data.efficiency);
        }

        // Update stats
        if (data.stats) {
            this.updateStats(data.stats);
        }
    }

    updateStats(stats) {
        Object.entries(stats).forEach(([key, value]) => {
            const element = document.querySelector(`[data-stat="${key}"]`);
            if (element) {
                const numberElement = element.querySelector('.number');
                const trendElement = element.querySelector('.trend');
                
                if (numberElement) {
                    numberElement.textContent = value.current;
                }
                
                if (trendElement) {
                    const trend = value.trend;
                    trendElement.textContent = `${trend > 0 ? '+' : ''}${trend}%`;
                    trendElement.className = `trend ${trend >= 0 ? 'positive' : 'negative'}`;
                }
            }
        });
    }

    resizeCharts() {
        this.charts.forEach(chart => {
            chart.resize();
        });
    }

    destroy() {
        this.charts.forEach(chart => {
            chart.destroy();
        });
        this.charts.clear();
    }
}

// Initialize charts when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chartManager = new ChartManager();
    
    // Handle window resize
    window.addEventListener('resize', () => {
        window.chartManager.resizeCharts();
    });
}); 