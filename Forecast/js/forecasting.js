class ForecastingManager {
    constructor() {
        this.forecastChart = null;
        this.initializeControls();
        this.createForecastChart();
    }

    initializeControls() {
        document.getElementById('updateForecast').addEventListener('click', () => {
            this.updateForecast();
        });

        // Initialize with default forecast
        this.updateForecast();
    }

    async updateForecast() {
        const period = document.getElementById('forecastPeriod').value;
        const confidence = document.getElementById('confidenceLevel').value;

        // Simulate API call for forecast data
        const forecastData = await this.getForecastData(period, confidence);
        this.updateChartData(forecastData);
        this.updateMetrics(forecastData);
    }

    async getForecastData(period, confidence) {
        // Simulate API response
        // In production, this would be a real API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    dates: Array.from({length: period}, (_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() + i);
                        return date.toISOString().split('T')[0];
                    }),
                    predicted: Array.from({length: period}, () => 
                        Math.floor(1000 + Math.random() * 1000)
                    ),
                    upperBound: Array.from({length: period}, () => 
                        Math.floor(1500 + Math.random() * 1000)
                    ),
                    lowerBound: Array.from({length: period}, () => 
                        Math.floor(500 + Math.random() * 1000)
                    ),
                    metrics: {
                        avgDemand: 1500,
                        peakDemand: 2200,
                        requiredRakes: 8
                    }
                });
            }, 1000);
        });
    }

    createForecastChart() {
        const ctx = document.getElementById('forecastChart').getContext('2d');
        this.forecastChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Predicted Demand',
                        borderColor: 'rgb(75, 192, 192)',
                        data: []
                    },
                    {
                        label: 'Upper Bound',
                        borderColor: 'rgba(255, 99, 132, 0.2)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        fill: '+1',
                        data: []
                    },
                    {
                        label: 'Lower Bound',
                        borderColor: 'rgba(255, 99, 132, 0.2)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        fill: false,
                        data: []
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Demand Forecast with Confidence Intervals'
                    }
                }
            }
        });
    }

    updateChartData(data) {
        this.forecastChart.data.labels = data.dates;
        this.forecastChart.data.datasets[0].data = data.predicted;
        this.forecastChart.data.datasets[1].data = data.upperBound;
        this.forecastChart.data.datasets[2].data = data.lowerBound;
        this.forecastChart.update();
    }

    updateMetrics(data) {
        document.getElementById('avgDemand').textContent = 
            `${data.metrics.avgDemand.toLocaleString()} tons`;
        document.getElementById('peakDemand').textContent = 
            `${data.metrics.peakDemand.toLocaleString()} tons`;
        document.getElementById('requiredRakes').textContent = 
            data.metrics.requiredRakes;
    }
}

// Initialize forecasting
new ForecastingManager(); 