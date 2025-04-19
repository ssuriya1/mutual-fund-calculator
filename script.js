function formatCurrency(number) {
    return new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
    }).format(number);
}

// Add this new function near the top with other utility functions
function roundToNearestHundred(num) {
    return Math.round(num / 100) * 100;
}

// Add near the top with other utility functions
function showDialog(message, type = 'info') {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    
    const dialog = document.createElement('div');
    dialog.className = 'dialog-box';
    
    dialog.innerHTML = `
        <div class="dialog-content ${type}">${message}</div>
        <div class="dialog-actions">
            <button onclick="this.closest('.dialog-overlay').remove()">OK</button>
        </div>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing application...');
    initializeApp();
    initializeFundPage();
});

function initializeApp() {
    if (window.location.pathname.includes('fund-selection.html')) {
        displayAllocationDetails();
    } else if (window.location.pathname.includes('portfolio-summary.html')) {
        displayPortfolioSummary();
    } else {
        // Load saved data immediately when page loads
        loadSavedData();
        
        // Add input listeners for real-time saving
        const formInputs = ['total-investment', 'small-cap', 'mid-cap', 'large-cap'];
        formInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', handleInputChange);
            }
        });

        // Add form submission handler
        const form = document.getElementById('investment-form');
        if (form) {
            form.addEventListener('submit', handleFormSubmit);
        }

        // Add tab switching listeners with data reload
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.addEventListener('click', () => {
                switchTab(tab.dataset.tab);
                if (tab.dataset.tab === 'investment') {
                    loadSavedData(); // Reload data when switching to investment tab
                }
            });
        });
    }
}

function handleInputChange(event) {
    updateAllocationDisplay(); // Update amounts whenever any input changes
    const formData = collectFormData();
    saveToLocalStorage('formData', formData);
}

function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = collectFormData();
    if (validateFormData(formData)) {
        saveToLocalStorage('formData', formData);
        showSuccessMessage('Investment details saved!');
        // Remove navigation to fund-selection.html
    }
}

function collectFormData() {
    return {
        totalInvestment: document.getElementById('total-investment').value,
        smallCap: document.getElementById('small-cap').value,
        midCap: document.getElementById('mid-cap').value,
        largeCap: document.getElementById('large-cap').value,
        lastUpdated: new Date().toISOString()
    };
}

function validateFormData(data) {
    const total = parseFloat(data.smallCap || 0) + 
                 parseFloat(data.midCap || 0) + 
                 parseFloat(data.largeCap || 0);
    
    if (!data.totalInvestment || parseFloat(data.totalInvestment) < 1000) {
        showErrorMessage('Please enter a valid investment amount (minimum ₹1,000)');
        return false;
    }

    if (total !== 100) {
        showErrorMessage(`Total allocation must equal 100%. Current: ${total}%`);
        return false;
    }

    return true;
}

function updateAllocationDisplay() {
    const totalInvestment = parseFloat(document.getElementById('total-investment').value) || 0;
    const caps = ['small-cap', 'mid-cap', 'large-cap'];
    let total = 0;

    caps.forEach(id => {
        const percentage = parseFloat(document.getElementById(id).value) || 0;
        total += percentage;
        
        // Calculate and display amount
        const amount = (totalInvestment * percentage) / 100;
        const amountElement = document.getElementById(`${id}-amount`);
        if (amountElement) {
            amountElement.textContent = `₹${formatCurrency(amount)}`;
            amountElement.className = 'allocation-amount';
        }
    });

    document.getElementById('total-allocation').textContent = total;
    
    const warning = document.getElementById('allocation-warning');
    warning.textContent = total === 100 ? ' (Perfect!)' : 
                        total > 100 ? ' (Exceeds 100%)' :
                        total >= 70 && total < 100 ? ' (Good!)' : ' (Below 100%)';
    warning.className = `warning-text ${total >= 70 && total <= 100 ? 'success' : 'warning'}`;
}

// Add listener for total investment changes
document.getElementById('total-investment')?.addEventListener('input', updateAllocationDisplay);

function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        console.log('Data saved:', data);
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

function loadSavedData() {
    try {
        const savedData = localStorage.getItem('formData');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // Set values for all form fields
            document.getElementById('total-investment').value = data.totalInvestment || '';
            document.getElementById('small-cap').value = data.smallCap || '';
            document.getElementById('mid-cap').value = data.midCap || '';
            document.getElementById('large-cap').value = data.largeCap || '';

            // Format the investment amount if needed
            if (data.totalInvestment) {
                const formattedValue = formatCurrency(parseFloat(data.totalInvestment));
                document.getElementById('total-investment').setAttribute('data-formatted', formattedValue);
            }

            updateAllocationDisplay();
        }
    } catch (error) {
        console.error('Error loading saved data:', error);
    }
}

function switchTab(tabId) {
    if (tabId === 'fund-selection') {
        window.location.href = 'fund-selection.html';
        return;
    } else if (tabId === 'portfolio-summary') {
        window.location.href = 'portfolio-summary.html';
        return;
    }
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabId}-tab`);
    });
}

function showSuccessMessage(message) {
    const warning = document.getElementById('allocation-warning');
    warning.textContent = ` (${message})`;
    warning.className = 'warning-text success';
}

// Replace showErrorMessage function
function showErrorMessage(message) {
    showDialog(message, 'error');
}

// Add this new function to display allocation details on fund selection page
function displayAllocationDetails() {
    const savedData = localStorage.getItem('formData');
    if (savedData && document.getElementById('allocation-details')) {
        const data = JSON.parse(savedData);
        const total = parseFloat(data.totalInvestment);
        
        document.getElementById('allocation-details').innerHTML = `
            <p>Total Investment: ₹${formatCurrency(total)}</p>
            <p>Small Cap: ₹${formatCurrency(total * parseFloat(data.smallCap) / 100)} (${data.smallCap}%)</p>
            <p>Mid Cap: ₹${formatCurrency(total * parseFloat(data.midCap) / 100)} (${data.midCap}%)</p>
            <p>Large Cap: ₹${formatCurrency(total * parseFloat(data.largeCap) / 100)} (${data.largeCap}%)</p>
        `;
    }
}

// Add this new function to display portfolio summary
function displayPortfolioSummary() {
    const savedData = JSON.parse(localStorage.getItem('formData') || '{}');
    const savedFunds = JSON.parse(localStorage.getItem('savedFunds') || '{}');
    
    if (!savedData.totalInvestment) {
        document.querySelector('.portfolio-overview').innerHTML = '<p>No investment data found. Please set up your investment details first.</p>';
        return;
    }

    const totalInvestment = parseFloat(savedData.totalInvestment);
    const overview = calculatePortfolioOverview(savedData, savedFunds);
    
    // Display overview with chart container
    document.querySelector('.portfolio-overview').innerHTML = `
        <h2>Portfolio Overview</h2>
        <div class="chart-container">
            <canvas id="portfolioChart"></canvas>
        </div>
        <div class="info-grid">
            <div class="info-row">
                <span>Total Investment:</span>
                <span class="amount">₹${formatCurrency(totalInvestment)}</span>
            </div>
            <div class="info-row">
                <span>Total Funds:</span>
                <span>${overview.totalFunds}</span>
            </div>
        </div>
    `;

    // Create pie chart
    createPortfolioChart(savedData, savedFunds);

    // Display cap-wise summaries
    ['small', 'mid', 'large'].forEach(capType => {
        displayCapSummary(capType, savedData, savedFunds[capType] || []);
    });
}

function createPortfolioChart(savedData, savedFunds) {
    const ctx = document.getElementById('portfolioChart');
    
    // Calculate fund distribution for each cap type
    const capTypes = ['small', 'mid', 'large'];
    const data = capTypes.map(capType => {
        const funds = savedFunds[capType] || [];
        return funds
            .filter(fund => fund.investment > 0 && fund.weightage > 0 && fund.rank > 0)
            .reduce((sum, fund) => sum + fund.investment, 0);
    });

    const labels = ['Small Cap', 'Mid Cap', 'Large Cap'];
    const colors = ['#4f46e5', '#22c55e', '#f59e0b'];

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const percentage = (value / data.reduce((a, b) => a + b, 0) * 100).toFixed(1);
                            return `₹${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function calculatePortfolioOverview(savedData, savedFunds) {
    // Count only valid funds
    const validFunds = Object.values(savedFunds)
        .flat()
        .filter(fund => fund.investment > 0 && fund.weightage > 0 && fund.rank > 0);
    
    return {
        totalFunds: validFunds.length,
        totalInvestment: parseFloat(savedData.totalInvestment)
    };
}

function displayCapSummary(capType, savedData, funds) {
    const container = document.getElementById(`${capType}-cap-summary`);
    if (!container) return;

    const totalInvestment = parseFloat(savedData.totalInvestment);
    const allocation = parseFloat(savedData[`${capType}Cap`]);
    const allocatedAmount = (totalInvestment * allocation) / 100;

    // Filter out invalid funds
    const validFunds = funds.filter(fund => 
        fund.investment > 0 && 
        fund.weightage > 0 && 
        fund.rank > 0 &&
        fund.fundName
    );

    container.innerHTML = `
        <div class="cap-header">
            <h2>${capType.charAt(0).toUpperCase() + capType.slice(1)} Cap</h2>
            <span>₹${formatCurrency(allocatedAmount)} (${allocation}%)</span>
        </div>
        <div class="fund-list">
            ${validFunds.length > 0 ? validFunds.map(fund => `
                <div class="fund-item">
                    <div class="fund-name">${fund.fundName}</div>
                    <div class="fund-details">
                        <span>Rank: ${fund.rank}</span>
                        <span>Weightage: ${fund.weightage}%</span>
                        <span>₹${formatCurrency(fund.investment)}</span>
                    </div>
                </div>
            `).join('') : '<p>No valid funds added yet</p>'}
        </div>
    `;
}

// Fund Selection Page Functions
function initializeFundPage() {
    if (window.location.pathname.includes('fund-selection.html')) {
        initializeFundTabs();
        
        // Initialize all cap types
        ['small', 'mid', 'large'].forEach(capType => {
            loadSavedFundsForCapType(capType);
        });
        
        // Set initial active tab
        switchFundTab('small');
    }
}

function initializeFundTabs() {
    document.querySelectorAll('.fund-tab-btn').forEach(tab => {
        tab.addEventListener('click', () => {
            const capType = tab.dataset.cap;
            switchFundTab(capType);
        });
    });
}

function switchFundTab(capType) {
    // Update tab buttons
    document.querySelectorAll('.fund-tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.cap === capType) {
            btn.classList.add('active');
        }
    });

    // Update content visibility
    document.querySelectorAll('.fund-content').forEach(content => {
        content.style.display = 'none';
    });
    
    const activeContent = document.getElementById(`${capType}-cap-content`);
    if (activeContent) {
        activeContent.style.display = 'block';
        // Display allocation info and load data
        displayCapAllocationInfo(capType);
        loadSavedFundsForCapType(capType);
    }
}

function displayCapAllocationInfo(capType) {
    const savedData = JSON.parse(localStorage.getItem('formData') || '{}');
    const infoElement = document.querySelector(`#${capType}-cap-content .cap-allocation-info`);
    
    if (infoElement && savedData) {
        const totalInvestment = parseFloat(savedData.totalInvestment) || 0;
        const percentage = parseFloat(savedData[`${capType}Cap`]) || 0;
        const amount = (totalInvestment * percentage) / 100;

        infoElement.innerHTML = `
            Available for ${capType} cap funds: 
            <span class="amount">₹${formatCurrency(amount)}</span>
            <span class="percentage">(${percentage}% of ₹${formatCurrency(totalInvestment)})</span>
        `;
    }
}

// Update loadSavedFundsForCapType to always add empty row if needed
function loadSavedFundsForCapType(capType) {
    const savedFunds = JSON.parse(localStorage.getItem('savedFunds') || '{}');
    const tbody = document.getElementById(`${capType}-cap-tbody`);
    
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (savedFunds[capType] && savedFunds[capType].length > 0) {
        savedFunds[capType].forEach(fund => {
            const row = createTableRow(capType, fund);
            tbody.appendChild(row);
        });
    }
    
    // Always ensure at least one empty row
    if (!tbody.querySelector('.fund-row')) {
        addNewTableRow(`${capType}-cap-tbody`);
    }
}

function displayInvestmentInfo() {
    const savedData = JSON.parse(localStorage.getItem('formData'));
    if (savedData) {
        const infoElements = document.querySelectorAll('.investment-info');
        const totalInvestment = parseFloat(savedData.totalInvestment);
        
        // Calculate amounts for each cap
        const smallCapAmount = (totalInvestment * parseFloat(savedData.smallCap)) / 100;
        const midCapAmount = (totalInvestment * parseFloat(savedData.midCap)) / 100;
        const largeCapAmount = (totalInvestment * parseFloat(savedData.largeCap)) / 100;
        
        infoElements.forEach(element => {
            element.innerHTML = `
                <div class="info-grid">
                    <div class="info-row">
                        <span>Total Investment:</span>
                        <span class="amount">₹${formatCurrency(totalInvestment)}</span>
                    </div>
                    <div class="info-row">
                        <span>Small Cap (${savedData.smallCap}%):</span>
                        <span class="amount">₹${formatCurrency(smallCapAmount)}</span>
                    </div>
                    <div class="info-row">
                        <span>Mid Cap (${savedData.midCap}%):</span>
                        <span class="amount">₹${formatCurrency(midCapAmount)}</span>
                    </div>
                    <div class="info-row">
                        <span>Large Cap (${savedData.largeCap}%):</span>
                        <span class="amount">₹${formatCurrency(largeCapAmount)}</span>
                    </div>
                </div>
            `;
        });
    }
}

function displaySavedFundsForType(capType) {
    const savedFunds = JSON.parse(localStorage.getItem('savedFunds') || '{}');
    const fundsForType = savedFunds[capType] || [];
    const container = document.querySelector(`#${capType}-cap-content .saved-funds-summary`);
    
    if (!container) return;

    if (fundsForType.length === 0) {
        container.innerHTML = '<p>No funds saved yet.</p>';
        return;
    }

    let totalInvestment = 0;
    const tableHTML = `
        <h3>Saved ${capType.charAt(0).toUpperCase() + capType.slice(1)} Cap Funds</h3>
        <table class="saved-funds-table">
            <thead>
                <tr>
                    <th>Fund Name</th>
                    <th>Weightage</th>
                    <th>Investment</th>
                    <th>Rank</th>
                </tr>
            </thead>
            <tbody>
                ${fundsForType.map(fund => {
                    totalInvestment += parseFloat(fund.investment);
                    return `
                        <tr>
                            <td>${fund.fundName}</td>
                            <td>${fund.weightage}%</td>
                            <td>₹${formatCurrency(fund.investment)}</td>
                            <td>${fund.rank}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
        <div class="saved-funds-total">
            Total Investment: ₹${formatCurrency(totalInvestment)}
        </div>
    `;

    container.innerHTML = tableHTML;
}

function addFundForm(capType) {
    const template = document.getElementById('fund-form-template');
    const form = template.content.cloneNode(true);
    const fundList = document.getElementById(`${capType}-cap-funds`);
    
    // Get investment allocation from saved data
    const savedData = JSON.parse(localStorage.getItem('formData'));
    const totalInvestment = parseFloat(savedData.totalInvestment);
    const allocation = parseFloat(savedData[`${capType}Cap`]);
    const maxInvestment = (totalInvestment * allocation) / 100;
    
    // Set up form handling
    const formElement = form.querySelector('form');
    formElement.dataset.capType = capType;
    formElement.addEventListener('submit', handleFundFormSubmit);
    
    // Set up cancel button
    form.querySelector('.btn-cancel').addEventListener('click', () => {
        formElement.remove();
    });
    
    // Set investment field value
    form.querySelector('[name="investment"]').value = maxInvestment;
    
    fundList.appendChild(form);
}

function handleFundFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const capType = form.dataset.capType;
    
    const fundData = {
        capType: capType,
        fundName: form.querySelector('[name="fund-name"]').value,
        pe: parseFloat(form.querySelector('[name="pe"]').value),
        pb: parseFloat(form.querySelector('[name="pb"]').value),
        beta: parseFloat(form.querySelector('[name="beta"]').value),
        alpha: parseFloat(form.querySelector('[name="alpha"]').value),
        sharpe: parseFloat(form.querySelector('[name="sharpe"]').value),
        sortino: parseFloat(form.querySelector('[name="sortino"]').value),
        expense: parseFloat(form.querySelector('[name="expense"]').value),
        rank: parseInt(form.querySelector('[name="rank"]').value),
        weightage: parseFloat(form.querySelector('[name="weightage"]').value),
        investment: parseFloat(form.querySelector('[name="investment"]').value)
    };
    
    saveFundData(fundData);
    displayFund(fundData);
    form.remove();
}

function handleRowSave(e) {
    const row = e.target.closest('tr');
    const capType = row.closest('.fund-content').id.split('-')[0];
    
    const fundData = {
        capType: capType,
        fundName: row.querySelector('[name="fund-name"]').value,
        pe: parseFloat(row.querySelector('[name="pe"]').value),
        pb: parseFloat(row.querySelector('[name="pb"]').value),
        beta: parseFloat(row.querySelector('[name="beta"]').value),
        alpha: parseFloat(row.querySelector('[name="alpha"]').value),
        sharpe: parseFloat(row.querySelector('[name="sharpe"]').value),
        sortino: parseFloat(row.querySelector('[name="sortino"]').value),
        expense: parseFloat(row.querySelector('[name="expense"]').value),
        rank: parseInt(row.querySelector('[name="rank"]').value),
        weightage: parseFloat(row.querySelector('[name="weightage"]').value),
        investment: calculateInvestment(capType, parseFloat(row.querySelector('[name="weightage"]').value))
    };

    if (validateFundData(fundData)) {
        saveFundData(fundData);
        row.classList.add('saved');
        addNewRow(row.closest('tbody'));
    }
}

function calculateInvestment(capType, weightage) {
    const savedData = JSON.parse(localStorage.getItem('formData'));
    const totalInvestment = parseFloat(savedData.totalInvestment);
    const capAllocation = parseFloat(savedData[`${capType}Cap`]);
    const availableCapFund = (totalInvestment * capAllocation) / 100;
    
    const tbody = document.querySelector(`#${capType}-cap-tbody`);
    const totalWeightage = Array.from(tbody.querySelectorAll('input[name="weightage"]'))
        .reduce((sum, input) => sum + (parseInt(input.value) || 0), 0);

    // Round to nearest hundred
    return totalWeightage > 0 ? roundToNearestHundred((availableCapFund * weightage) / totalWeightage) : 0;
}

function updateInvestment(weightageInput) {
    // Force weightage to be a whole number
    weightageInput.value = Math.round(weightageInput.value);
    
    const row = weightageInput.closest('tr');
    const capType = row.dataset.capType;
    const weightage = parseInt(weightageInput.value) || 0;
    
    // Update all rows
    const tbody = row.closest('tbody');
    tbody.querySelectorAll('.fund-row').forEach(row => {
        const rowWeightage = parseInt(row.querySelector('[name="weightage"]').value) || 0;
        const investment = calculateInvestment(capType, rowWeightage);
        row.querySelector('[name="investment"]').value = investment;
    });
}

function addNewRow(tbody) {
    const newRow = tbody.querySelector('tr').cloneNode(true);
    newRow.classList.remove('saved');
    Array.from(newRow.querySelectorAll('input')).forEach(input => {
        input.value = '';
    });
    newRow.querySelector('.btn-save-row').addEventListener('click', handleRowSave);
    tbody.appendChild(newRow);
}

function saveFundData(fundData) {
    let savedFunds = JSON.parse(localStorage.getItem('savedFunds') || '{}');
    if (!savedFunds[fundData.capType]) {
        savedFunds[fundData.capType] = [];
    }
    savedFunds[fundData.capType].push(fundData);
    localStorage.setItem('savedFunds', JSON.stringify(savedFunds));
}

function loadSavedFunds() {
    const savedFunds = JSON.parse(localStorage.getItem('savedFunds') || '{}');
    
    ['small', 'mid', 'large'].forEach(capType => {
        const tbody = document.getElementById(`${capType}-cap-tbody`);
        if (!tbody) return;

        // Clear tbody
        tbody.innerHTML = '';
        
        // Add saved funds if they exist
        if (savedFunds[capType] && savedFunds[capType].length > 0) {
            savedFunds[capType].forEach(fund => {
                const row = createTableRow(capType, fund);
                tbody.appendChild(row);
            });
        }
    });
}

function addInputValidation(row) {
    const rankInput = row.querySelector('input[name="rank"]');
    const weightageInput = row.querySelector('input[name="weightage"]');

    // Only validate whole numbers
    rankInput.addEventListener('change', () => {
        rankInput.value = Math.round(rankInput.value);
    });

    weightageInput.addEventListener('change', () => {
        weightageInput.value = Math.round(weightageInput.value);
        updateInvestment(weightageInput);
    });
}

function createTableRow(capType, fund = null) {
    const row = document.createElement('tr');
    row.className = 'fund-row';
    row.dataset.capType = capType;
    
    row.innerHTML = `
        <td><input type="text" name="fund-name" value="${fund?.fundName || ''}" required></td>
        <td><input type="number" name="pe" value="${fund?.pe || ''}" step="0.01" required></td>
        <td><input type="number" name="pb" value="${fund?.pb || ''}" step="0.01" required></td>
        <td><input type="number" name="beta" value="${fund?.beta || ''}" step="0.01" required></td>
        <td><input type="number" name="alpha" value="${fund?.alpha || ''}" step="0.01" required></td>
        <td><input type="number" name="sharpe" value="${fund?.sharpe || ''}" step="0.01" required></td>
        <td><input type="number" name="sortino" value="${fund?.sortino || ''}" step="0.01" required></td>
        <td><input type="number" name="expense" value="${fund?.expense || ''}" step="0.01" required></td>
        <td><input type="number" name="rank" min="1" step="1" value="${fund?.rank || ''}" required></td>
        <td><input type="number" name="weightage" min="1" step="1" value="${fund?.weightage || ''}" required onchange="updateInvestment(this)"></td>
        <td><input type="number" name="investment" value="${fund?.investment ? Math.round(fund.investment) : ''}" readonly></td>
        <td><button class="btn-delete-row" onclick="deleteRow(this)">Delete</button></td>
    `;
    
    addInputValidation(row);
    return row;
}

function addNewTableRow(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) {
        console.error('Could not find tbody with id:', tbodyId);
        return;
    }
    
    const capType = tbodyId.split('-')[0];
    const newRow = createTableRow(capType);
    tbody.appendChild(newRow);
}

function displayFund(fundData) {
    const fundElement = document.createElement('div');
    fundElement.className = 'fund-item';
    fundElement.innerHTML = `
        <h3>${fundData.fundName}</h3>
        <div class="fund-details">
            <p>Investment: ₹${formatCurrency(fundData.investment)}</p>
            <p>Weightage: ${fundData.weightage}%</p>
            <p>Rank: ${fundData.rank}</p>
        </div>
        <button class="btn-delete" onclick="deleteFund(this, '${fundData.capType}', '${fundData.fundName}')">Delete</button>
    `;
    
    document.getElementById(`${fundData.capType}-cap-funds`).appendChild(fundElement);
}

function deleteFund(button, capType, fundName) {
    if (confirm('Are you sure you want to delete this fund?')) {
        let savedFunds = JSON.parse(localStorage.getItem('savedFunds') || '{}');
        savedFunds[capType] = savedFunds[capType].filter(fund => fund.fundName !== fundName);
        localStorage.setItem('savedFunds', JSON.stringify(savedFunds));
        button.closest('.fund-item').remove();
    }
}

// Replace success alerts in saveCapFunds
function saveCapFunds(capType) {
    const tbody = document.querySelector(`#${capType}-cap-content .fund-table tbody`);
    const rows = tbody.querySelectorAll('.fund-row');
    const funds = [];
    
    rows.forEach(row => {
        if (row.querySelector('[name="fund-name"]').value) {
            const fund = {
                fundName: row.querySelector('[name="fund-name"]').value,
                pe: parseFloat(row.querySelector('[name="pe"]').value) || 0,
                pb: parseFloat(row.querySelector('[name="pb"]').value) || 0,
                beta: parseFloat(row.querySelector('[name="beta"]').value) || 0,
                alpha: parseFloat(row.querySelector('[name="alpha"]').value) || 0,
                sharpe: parseFloat(row.querySelector('[name="sharpe"]').value) || 0,
                sortino: parseFloat(row.querySelector('[name="sortino"]').value) || 0,
                expense: parseFloat(row.querySelector('[name="expense"]').value) || 0,
                rank: Math.round(parseInt(row.querySelector('[name="rank"]').value)) || 0,
                weightage: Math.round(parseInt(row.querySelector('[name="weightage"]').value)) || 0,
                investment: parseFloat(row.querySelector('[name="investment"]').value) || 0
            };
            funds.push(fund);
        }
    });
    
    // Save to localStorage
    const savedFunds = JSON.parse(localStorage.getItem('savedFunds') || '{}');
    savedFunds[capType] = funds;
    localStorage.setItem('savedFunds', JSON.stringify(savedFunds));
    
    // Show success message without clearing the form
    showDialog(`${capType.charAt(0).toUpperCase() + capType.slice(1)} cap funds saved successfully!`, 'success');
}

// Update deleteRow to use showDialog for confirmation
function deleteRow(button) {
    if (confirm('Are you sure you want to delete this row?')) { // We can keep confirm for simple yes/no
        const row = button.closest('tr');
        row.remove();
    }
}
