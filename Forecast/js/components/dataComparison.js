class DataComparison {
    constructor() {
        this.comparisonData = new Map();
        this.activeComparisons = new Set();
        this.initialize();
    }

    initialize() {
        this.renderComparisonUI();
        this.initializeEventListeners();
    }

    renderComparisonUI() {
        const container = document.createElement('div');
        container.className = 'comparison-container';
        container.innerHTML = `
            <div class="comparison-controls">
                <h3>Data Comparison</h3>
                <div class="comparison-options">
                    <select id="comparisonType">
                        <option value="time">Time Period</option>
                        <option value="route">Route</option>
                        <option value="custom">Custom Range</option>
                    </select>
                    <div id="comparisonParams" class="comparison-params"></div>
                    <button id="addComparison" class="primary-btn">Add Comparison</button>
                </div>
                <div id="activeComparisons" class="active-comparisons"></div>
            </div>
            <div id="comparisonCharts" class="comparison-charts"></div>
        `;

        document.querySelector('.analytics-section').appendChild(container);
    }

    initializeEventListeners() {
        document.getElementById('comparisonType').addEventListener('change', (e) => {
            this.updateComparisonParams(e.target.value);
        });

        document.getElementById('addComparison').addEventListener('click', () => {
            this.addNewComparison();
        });
    }

    updateComparisonParams(type) {
        const paramsContainer = document.getElementById('comparisonParams');
        let html = '';

        switch (type) {
            case 'time':
                html = `
                    <div class="date-range">
                        <div class="range-group">
                            <label>Period 1:</label>
                            <input type="date" id="period1Start">
                            <input type="date" id="period1End">
                        </div>
                        <div class="range-group">
                            <label>Period 2:</label>
                            <input type="date" id="period2Start">
                            <input type="date" id="period2End">
                        </div>
                    </div>
                `;
                break;
            case 'route':
                html = `
                    <div class="route-selection">
                        <select id="route1">
                            <option value="">Select Route 1</option>
                            <option value="route-a">Route A</option>
                            <option value="route-b">Route B</option>
                            <option value="route-c">Route C</option>
                        </select>
                        <select id="route2">
                            <option value="">Select Route 2</option>
                            <option value="route-a">Route A</option>
                            <option value="route-b">Route B</option>
                            <option value="route-c">Route C</option>
                        </select>
                    </div>
                `;
                break;
            case 'custom':
                html = `
                    <div class="custom-range">
                        <input type="text" id="customMetric" placeholder="Metric Name">
                        <input type="number" id="customValue1" placeholder="Value 1">
                        <input type="number" id="customValue2" placeholder="Value 2">
                    </div>
                `;
                break;
        }

        paramsContainer.innerHTML = html;
    }

    async addNewComparison() {
        const type = document.getElementById('comparisonType').value;
        const params = this.getComparisonParams(type);
        
        if (!this.validateParams(params)) {
            alert('Please fill in all comparison parameters');
            return;
        }

        const comparisonId = `comparison-${Date.now()}`;
        const comparisonData = await this.fetchComparisonData(type, params);
        
        this.comparisonData.set(comparisonId, comparisonData);
        this.activeComparisons.add(comparisonId);
        
        this.renderComparison(comparisonId, type, params);
        this.updateComparisonCharts();
    }

    getComparisonParams(type) {
        switch (type) {
            case 'time':
                return {
                    period1: {
                        start: document.getElementById('period1Start').value,
                        end: document.getElementById('period1End').value
                    },
                    period2: {
                        start: document.getElementById('period2Start').value,
                        end: document.getElementById('period2End').value
                    }
                };
            case 'route':
                return {
                    route1: document.getElementById('route1').value,
                    route2: document.getElementById('route2').value
                };
            case 'custom':
                return {
                    metric: document.getElementById('customMetric').value,
                    value1: document.getElementById('customValue1').value,
                    value2: document.getElementById('customValue2').value
                };
        }
    }

    validateParams(params) {
        return Object.values(params).every(value => 
            value !== null && value !== undefined && value !== ''
        );
    }

    async fetchComparisonData(type, params) {
        // Simulate API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    type,
                    params,
                    data: this.generateMockData(type)
                });
            }, 1000);
        });
    }

    generateMockData(type) {
        const dates = Array.from({length: 7}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        }).reverse();

        return {
            labels: dates,
            datasets: [
                {
                    label: 'Series 1',
                    data: Array.from({length: 7}, () => 
                        Math.floor(Math.random() * 1000)
                    )
                },
                {
                    label: 'Series 2',
                    data: Array.from({length: 7}, () => 
                        Math.floor(Math.random() * 1000)
                    )
                }
            ]
        };
    }

    renderComparison(id, type, params) {
        const container = document.getElementById('activeComparisons');
        const comparisonElement = document.createElement('div');
        comparisonElement.className = 'comparison-item';
        comparisonElement.innerHTML = `
            <div class="comparison-header">
                <h4>${this.getComparisonTitle(type, params)}</h4>
                <button class="remove-comparison" data-id="${id}">×</button>
            </div>
            <canvas id="chart-${id}"></canvas>
        `;
        container.appendChild(comparisonElement);
    }

    getComparisonTitle(type, params) {
        switch (type) {
            case 'time':
                return `Time Comparison: ${params.period1.start} vs ${params.period2.start}`;
            case 'route':
                return `Route Comparison: ${params.route1} vs ${params.route2}`;
            case 'custom':
                return `Custom Comparison: ${params.metric}`;
        }
    }

    updateComparisonCharts() {
        this.activeComparisons.forEach(id => {
            const data = this.comparisonData.get(id);
            const ctx = document.getElementById(`chart-${id}`).getContext('2d');
            
            new Chart(ctx, {
                type: 'line',
                data: data.data,
                options: {
                    responsive: true,
                    plugins: {
                        title: {
                            display: true,
                            text: this.getComparisonTitle(data.type, data.params)
                        }
                    }
                }
            });
        });
    }
} 