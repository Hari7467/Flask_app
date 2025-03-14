// DOM Elements
const timeRangeSelect = document.getElementById('timeRange');
const chartTypeSelect = document.getElementById('chartType');
const lineColorSelect = document.getElementById('lineColor');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const resultsTableBody = document.getElementById('resultsTableBody');
const summaryStats = document.getElementById('summaryStats');
const chartCanvas = document.getElementById('analysisChart');

// Chart instance
let analysisChart = null;

// Current data
let currentData = [];

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners to controls
    timeRangeSelect.addEventListener('change', fetchAndProcessData);
    chartTypeSelect.addEventListener('change', updateChartSettings);
    lineColorSelect.addEventListener('change', updateChartSettings);
    
    // Initial data fetch
    fetchAndProcessData();
});

// Fetch data from the backend
async function fetchData() {
    showLoading(true);
    hideError();
    
    try {
        const response = await fetch('https://flask-app-pqxn.onrender.com/getdata', { method: 'GET' });

        const result = await response.json();
        if (result.error) {
            showError(result.error);
            return null;
        }
        return result;
    } catch (error) {
        showError('An error occurred while fetching data.');
        return null;
    } finally {
        showLoading(false);
    }
}

// Process and limit data based on time range
async function fetchAndProcessData() {
    showLoading(true);
    hideError();
    
    const timeRange = parseInt(timeRangeSelect.value);
    
    try {
        const apiData = await fetchData();
        
        if (!apiData || apiData.length === 0) {
            showError('No data available.');
            currentData = { dates: [], rightABI: [], leftABI: [] };
            return;
        }
        
        // Process the data for our chart
        let processedData;
        
        if (timeRange > 0 && apiData.length > timeRange) {
            // Limit data to the specified range (most recent entries)
            processedData = apiData.slice(-timeRange);
        } else {
            processedData = apiData;
        }
        
        // Transform data into format needed for chart
        const dates = processedData.map(item => item.Date);
        const rightABI = processedData.map(item => parseFloat(item['Right ABI']));
        const leftABI = processedData.map(item => parseFloat(item['Left ABI']));
        
        currentData = {
            dates: dates,
            rightABI: rightABI,
            leftABI: leftABI,
            raw: processedData
        };
        
        // Update UI with processed data
        updateChart(currentData);
        updateTable(currentData);
        updateStats(currentData);
    } catch (error) {
        console.error('Error processing data:', error);
        showError('Failed to process data. Please try again later.');
    } finally {
        showLoading(false);
    }
}

// Update chart with new data
function updateChart(data) {
    const ctx = chartCanvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (analysisChart) {
        analysisChart.destroy();
    }
    
    const chartType = chartTypeSelect.value || 'linear';
    const lineColor = lineColorSelect.value || '#3498db';
    const secondLineColor = '#e74c3c'; // Red color for Left ABI
    
    // Configure the chart
    analysisChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: [
                {
                    label: 'Right ABI',
                    data: data.rightABI,
                    borderColor: lineColor,
                    backgroundColor: `${lineColor}20`,
                    borderWidth: 2,
                    tension: chartType === 'monotone' ? 0.4 : 0,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: lineColor,
                    pointBorderWidth: 1.5,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: false,
                    stepped: chartType === 'step',
                },
                {
                    label: 'Left ABI',
                    data: data.leftABI,
                    borderColor: secondLineColor,
                    backgroundColor: `${secondLineColor}20`,
                    borderWidth: 2,
                    tension: chartType === 'monotone' ? 0.4 : 0,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: secondLineColor,
                    pointBorderWidth: 1.5,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: false,
                    stepped: chartType === 'step',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    titleColor: '#333',
                    bodyColor: '#333',
                    borderColor: '#ddd',
                    borderWidth: 1,
                    cornerRadius: 6,
                    boxPadding: 6,
                    usePointStyle: true
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#666'
                    }
                },
                y: {
                    beginAtZero: false,
                    grid: {
                        color: '#f0f0f0'
                    },
                    ticks: {
                        color: '#666'
                    }
                }
            },
            animations: {
                tension: {
                    duration: 1000,
                    easing: 'linear'
                }
            }
        }
    });
}

// Update chart settings without fetching new data
function updateChartSettings() {
    if (currentData.dates && currentData.dates.length > 0) {
        updateChart(currentData);
    }
}

// Update results table
function updateTable(data) {
    // Clear existing table rows
    resultsTableBody.innerHTML = '';
    
    // Add new rows
    data.raw.forEach((item, index) => {
        const row = document.createElement('tr');
        
        // Date column
        const dateCell = document.createElement('td');
        dateCell.textContent = item.Date;
        row.appendChild(dateCell);
        
        // Right ABI column
        const rightABICell = document.createElement('td');
        rightABICell.textContent = item['Right ABI'];
        row.appendChild(rightABICell);
        
        // Left ABI column
        const leftABICell = document.createElement('td');
        leftABICell.textContent = item['Left ABI'];
        row.appendChild(leftABICell);
        
        // Right ABI Change column
        const rightChangeCell = document.createElement('td');
        
        if (index === 0) {
            // First row has no previous value to compare
            rightChangeCell.textContent = 'N/A';
            rightChangeCell.className = 'na-change';
        } else {
            const prevValue = parseFloat(data.raw[index - 1]['Right ABI']);
            const currentValue = parseFloat(item['Right ABI']);
            const change = ((currentValue - prevValue) / prevValue * 100).toFixed(1);
            const isPositive = currentValue >= prevValue;
            
            rightChangeCell.textContent = `${isPositive ? '↑' : '↓'} ${Math.abs(change)}%`;
            rightChangeCell.className = isPositive ? 'positive-change' : 'negative-change';
        }
        
        row.appendChild(rightChangeCell);
        
        // Left ABI Change column
        const leftChangeCell = document.createElement('td');
        
        if (index === 0) {
            // First row has no previous value to compare
            leftChangeCell.textContent = 'N/A';
            leftChangeCell.className = 'na-change';
        } else {
            const prevValue = parseFloat(data.raw[index - 1]['Left ABI']);
            const currentValue = parseFloat(item['Left ABI']);
            const change = ((currentValue - prevValue) / prevValue * 100).toFixed(1);
            const isPositive = currentValue >= prevValue;
            
            leftChangeCell.textContent = `${isPositive ? '↑' : '↓'} ${Math.abs(change)}%`;
            leftChangeCell.className = isPositive ? 'positive-change' : 'negative-change';
        }
        
        row.appendChild(leftChangeCell);
        
        resultsTableBody.appendChild(row);
    });
}

// Update summary statistics
function updateStats(data) {
    const rightValues = data.rightABI;
    const leftValues = data.leftABI;
    
    const rightAverage = rightValues.reduce((sum, val) => sum + val, 0) / rightValues.length;
    const rightHighest = Math.max(...rightValues);
    const rightLowest = Math.min(...rightValues);
    
    const leftAverage = leftValues.reduce((sum, val) => sum + val, 0) / leftValues.length;
    const leftHighest = Math.max(...leftValues);
    const leftLowest = Math.min(...leftValues);
    
    summaryStats.innerHTML = `
        <div class="stat-section">
            <h4>Right ABI</h4>
            <div class="stat-item">
                <div class="stat-label">Average</div>
                <div class="stat-value">${rightAverage.toFixed(2)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Highest Value</div>
                <div class="stat-value">${rightHighest.toFixed(2)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Lowest Value</div>
                <div class="stat-value">${rightLowest.toFixed(2)}</div>
            </div>
        </div>
        <div class="stat-section">
            <h4>Left ABI</h4>
            <div class="stat-item">
                <div class="stat-label">Average</div>
                <div class="stat-value">${leftAverage.toFixed(2)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Highest Value</div>
                <div class="stat-value">${leftHighest.toFixed(2)}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Lowest Value</div>
                <div class="stat-value">${leftLowest.toFixed(2)}</div>
            </div>
        </div>
    `;
}

// Helper function to show/hide loading indicator
function showLoading(isLoading) {
    loadingIndicator.style.display = isLoading ? 'flex' : 'none';
}

// Helper function to show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'flex';
}

// Helper function to hide error message
function hideError() {
    errorMessage.style.display = 'none';
}
