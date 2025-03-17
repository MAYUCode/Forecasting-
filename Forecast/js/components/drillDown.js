class DrillDownManager {
    constructor() {
        this.currentLevel = 'overview';
        this.drillStack = [];
        this.initialize();
    }

    initialize() {
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Add click handlers for chart elements
        document.querySelectorAll('.chart-container canvas').forEach(canvas => {
            canvas.addEventListener('click', (event) => {
                const chart = Chart.getChart(canvas);
                const elements = chart.getElementsAtEventForMode(
                    event,
                    'nearest',
                    { intersect: true },
                    false
                );

                if (elements.length > 0) {
                    const element = elements[0];
                    this.handleDrillDown(chart, element);
                }
            });
        });

        // Add back button listener
        document.getElementById('drillBackBtn')?.addEventListener('click', () => {
            this.drillUp();
        });
    }

    async handleDrillDown(chart, element) {
        const datasetIndex = element.datasetIndex;
        const index = element.index;
        const label = chart.data.labels[index];
        
        // Save current state for drilling back up
        this.drillStack.push({
            level: this.currentLevel,
            chartData: chart.data,
            chartOptions: chart.options
        });

        // Update current level
        this.currentLevel = this.getNextLevel(this.currentLevel, label);
        
        // Fetch and display detailed data
        const detailedData = await this.fetchDrillDownData(this.currentLevel, label);
        this.updateChartWithDrillDown(chart, detailedData);
        
        // Update UI to show drill-down state
        this.updateDrillDownUI();
    }

    getNextLevel(currentLevel, label) {
        const levelHierarchy = {
            'overview': 'route',
            'route': 'daily',
            'daily': 'hourly'
        };
        return levelHierarchy[currentLevel] || currentLevel;
    }

    async fetchDrillDownData(level, label) {
        // Simulate API call for drill-down data
        return new Promise(resolve => {
            setTimeout(() => {
                switch (level) {
                    case 'route':
                        resolve({
                            labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                            datasets: [{
                                label: `${label} Daily Performance`,
                                data: [65, 75, 70, 80, 85],
                                backgroundColor: '#1976d2'
                            }]
                        });
                        break;
                    case 'daily':
                        resolve({
                            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                            datasets: [{
                                label: `${label} Hourly Performance`,
                                data: [30, 45, 85, 75, 60, 40],
                                backgroundColor: '#388e3c'
                            }]
                        });
                        break;
                    default:
                        resolve({
                            labels: ['Last 6 Hours'],
                            datasets: [{
                                label: 'Detailed View',
                                data: [75],
                                backgroundColor: '#f57c00'
                            }]
                        });
                }
            }, 500);
        });
    }

    updateChartWithDrillDown(chart, newData) {
        chart.data = newData;
        chart.options.plugins.title.text = `${this.currentLevel.toUpperCase()} Level View`;
        chart.update();
    }

    drillUp() {
        if (this.drillStack.length > 0) {
            const previousState = this.drillStack.pop();
            this.currentLevel = previousState.level;
            
            const chart = Chart.getChart('mainChart'); // Update with your chart ID
            chart.data = previousState.chartData;
            chart.options = previousState.chartOptions;
            chart.update();
            
            this.updateDrillDownUI();
        }
    }

    updateDrillDownUI() {
        const drillBackBtn = document.getElementById('drillBackBtn');
        if (drillBackBtn) {
            drillBackBtn.style.display = this.drillStack.length > 0 ? 'block' : 'none';
        }

        // Update breadcrumb
        const breadcrumb = document.getElementById('drillBreadcrumb');
        if (breadcrumb) {
            breadcrumb.innerHTML = this.generateBreadcrumb();
        }
    }

    generateBreadcrumb() {
        const path = ['Overview', ...this.drillStack.map(item => item.level)];
        return path.map((level, index) => `
            <span class="breadcrumb-item ${index === path.length - 1 ? 'active' : ''}">${level}</span>
            ${index < path.length - 1 ? '<span class="breadcrumb-separator">></span>' : ''}
        `).join('');
    }
} 