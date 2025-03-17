class AnalyticsManager {
    constructor() {
        this.charts = new Map();
        this.dataComparison = new DataComparison();
        this.initialize();
    }

    initialize() {
        this.initializeEventListeners();
        this.initializeCharts();
        this.loadInitialData();
        this.initializeFilters();
    }

    initializeEventListeners() {
        document.getElementById('updateAnalytics').addEventListener('click', () => {
            this.updateAnalytics();
        });
    }

    initializeCharts() {
        this.createVolumeTrendChart();
        this.createRoutePerformanceChart();
        this.createDelayAnalysisChart();
        this.createEfficiencyMatrixChart();
    }

    initializeFilters() {
        this.dataFilters = new DataFilters('analyticsFilters', {
            filters: [
                {
                    id: 'dateRange',
                    label: 'Date Range',
                    type: 'date'
                },
                {
                    id: 'route',
                    label: 'Route',
                    type: 'select',
                    options: [
                        { value: 'route-a', label: 'Route A' },
                        { value: 'route-b', label: 'Route B' },
                        { value: 'route-c', label: 'Route C' }
                    ]
                },
                {
                    id: 'volume',
                    label: 'Volume Range (tons)',
                    type: 'range'
                }
            ],
            onFilterChange: (filters) => this.handleFilterChange(filters)
        });
    }

    createVolumeTrendChart() {
        const ctx = document.getElementById('volumeTrendChart').getContext('2d');
        this.charts.set('volumeTrend', new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Daily Volume',
                    borderColor: '#1976d2',
                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                    data: [],
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Volume (tons)'
                        }
                    }
                }
            }
        }));
    }

    createRoutePerformanceChart() {
        const ctx = document.getElementById('routePerformanceChart').getContext('2d');
        this.charts.set('routePerformance', new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Average Transit Time',
                    backgroundColor: '#388e3c',
                    data: []
                }, {
                    label: 'Delay Frequency',
                    backgroundColor: '#f57c00',
                    data: []
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        }));
    }

    createDelayAnalysisChart() {
        const ctx = document.getElementById('delayAnalysisChart').getContext('2d');
        this.charts.set('delayAnalysis', new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Weather', 'Technical', 'Loading/Unloading', 'Traffic', 'Other'],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#1976d2',
                        '#388e3c',
                        '#f57c00',
                        '#d32f2f',
                        '#7b1fa2'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        }));
    }

    createEfficiencyMatrixChart() {
        const ctx = document.getElementById('efficiencyMatrixChart').getContext('2d');
        this.charts.set('efficiencyMatrix', new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Utilization', 'On-time Delivery', 'Cost Efficiency', 'Speed', 'Safety'],
                datasets: [{
                    label: 'Current Period',
                    data: [],
                    borderColor: '#1976d2',
                    backgroundColor: 'rgba(25, 118, 210, 0.2)'
                }, {
                    label: 'Previous Period',
                    data: [],
                    borderColor: '#388e3c',
                    backgroundColor: 'rgba(56, 142, 60, 0.2)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                }
            }
        }));
    }

    async loadInitialData() {
        const data = await this.fetchAnalyticsData();
        this.updateMetrics(data.metrics);
        this.updateCharts(data);
    }

    async fetchAnalyticsData() {
        // Simulate API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    metrics: {
                        totalVolume: '125,000 tons',
                        avgDeliveryTime: '36 hours',
                        rakeUtilization: '85%',
                        otdRate: '92%'
                    },
                    volumeTrend: {
                        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                        data: [1200, 1350, 1250, 1400, 1300, 1200, 1450]
                    },
                    routePerformance: {
                        labels: ['Route A', 'Route B', 'Route C', 'Route D'],
                        transitTime: [24, 36, 28, 32],
                        delayFrequency: [5, 8, 3, 6]
                    },
                    delayAnalysis: [30, 25, 20, 15, 10],
                    efficiencyMatrix: {
                        current: [85, 92, 78, 88, 95],
                        previous: [80, 88, 75, 85, 90]
                    }
                });
            }, 1000);
        });
    }

    updateMetrics(metrics) {
        document.getElementById('totalVolume').textContent = metrics.totalVolume;
        document.getElementById('avgDeliveryTime').textContent = metrics.avgDeliveryTime;
        document.getElementById('rakeUtilization').textContent = metrics.rakeUtilization;
        document.getElementById('otdRate').textContent = metrics.otdRate;
    }

    updateCharts(data) {
        // Update Volume Trend Chart
        const volumeTrendChart = this.charts.get('volumeTrend');
        volumeTrendChart.data.labels = data.volumeTrend.labels;
        volumeTrendChart.data.datasets[0].data = data.volumeTrend.data;
        volumeTrendChart.update();

        // Update Route Performance Chart
        const routePerformanceChart = this.charts.get('routePerformance');
        routePerformanceChart.data.labels = data.routePerformance.labels;
        routePerformanceChart.data.datasets[0].data = data.routePerformance.transitTime;
        routePerformanceChart.data.datasets[1].data = data.routePerformance.delayFrequency;
        routePerformanceChart.update();

        // Update Delay Analysis Chart
        const delayAnalysisChart = this.charts.get('delayAnalysis');
        delayAnalysisChart.data.datasets[0].data = data.delayAnalysis;
        delayAnalysisChart.update();

        // Update Efficiency Matrix Chart
        const efficiencyMatrixChart = this.charts.get('efficiencyMatrix');
        efficiencyMatrixChart.data.datasets[0].data = data.efficiencyMatrix.current;
        efficiencyMatrixChart.data.datasets[1].data = data.efficiencyMatrix.previous;
        efficiencyMatrixChart.update();
    }

    async updateAnalytics() {
        const startDate = document.getElementById('analyticsStartDate').value;
        const endDate = document.getElementById('analyticsEndDate').value;
        
        if (!startDate || !endDate) {
            alert('Please select both start and end dates');
            return;
        }

        // Simulate loading state
        this.setLoadingState(true);
        
        try {
            const data = await this.fetchAnalyticsData();
            this.updateMetrics(data.metrics);
            this.updateCharts(data);
        } catch (error) {
            console.error('Error updating analytics:', error);
            alert('Failed to update analytics. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    setLoadingState(loading) {
        const button = document.getElementById('updateAnalytics');
        button.disabled = loading;
        button.textContent = loading ? 'Loading...' : 'Update';
    }

    async handleFilterChange(filters) {
        // Update analytics based on filters
        const data = await this.fetchFilteredData(filters);
        this.updateCharts(data);
    }

    async exportData(format) {
        const data = await this.fetchAnalyticsData();
        const timestamp = new Date().toISOString().split('T')[0];

        switch (format) {
            case 'csv':
                ExportUtils.exportToCSV(this.formatDataForExport(data), 
                    `analytics_${timestamp}.csv`);
                break;
            case 'excel':
                ExportUtils.exportToExcel(this.formatDataForExport(data), 
                    `analytics_${timestamp}.xlsx`);
                break;
            case 'pdf':
                ExportUtils.exportToPDF('analyticsSection', 
                    `analytics_${timestamp}.pdf`);
                break;
        }
    }

    formatDataForExport(data) {
        // Format data for export
        return Object.entries(data.metrics).map(([metric, value]) => ({
            Metric: metric,
            Value: value
        }));
    }

    handleComparisonUpdate(comparisonData) {
        // Update relevant charts and metrics based on comparison data
        this.updateChartsWithComparison(comparisonData);
    }

    updateChartsWithComparison(comparisonData) {
        // Update charts to show comparison data
        this.charts.forEach(chart => {
            if (chart.data.datasets.length === 1) {
                chart.data.datasets.push({
                    ...chart.data.datasets[0],
                    label: 'Comparison',
                    borderColor: '#f57c00'
                });
                chart.update();
            }
        });
    }
}

// Initialize analytics manager
const analyticsManager = new AnalyticsManager(); 