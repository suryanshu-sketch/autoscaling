/**
 * INTELLIGENT AUTOSCALING STRATEGY EVALUATION SYSTEM
 * Shared Script - Navigation, Utilities, and Common Logic
 */

// ============================================
// PAGE LOADING & NAVIGATION
// ============================================

function loadPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show the requested page
    const pageElement = document.getElementById(`page-${pageName}`);
    if (pageElement) {
        pageElement.classList.add('active');
        
        // Call page-specific initialization if it exists
        if (typeof window[`init${capitalize(pageName)}`] === 'function') {
            window[`init${capitalize(pageName)}`]();
        }
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================
// LOCAL STORAGE UTILITIES
// ============================================

const Storage = {
    // Guided mode data
    setGuidedData(data) {
        localStorage.setItem('guidedData', JSON.stringify(data));
    },
    
    getGuidedData() {
        const data = localStorage.getItem('guidedData');
        return data ? JSON.parse(data) : null;
    },
    
    // Expert mode data
    setExpertData(data) {
        localStorage.setItem('expertData', JSON.stringify(data));
    },
    
    getExpertData() {
        const data = localStorage.getItem('expertData');
        return data ? JSON.parse(data) : null;
    },
    
    // Determine which mode was used
    getDataSource() {
        const guidedData = this.getGuidedData();
        const expertData = this.getExpertData();
        
        if (guidedData) return 'guided';
        if (expertData) return 'expert';
        return null;
    },
    
    // Clear all data
    clearAll() {
        localStorage.removeItem('guidedData');
        localStorage.removeItem('expertData');
    }
};

// ============================================
// INFERENCE LOGIC (Guided Mode → Workload)
// ============================================

function inferWorkload(answers) {
    let pattern = 'stable';
    let variance = 'low';
    let peakCPU = 50;
    let avgCPU = 30;
    
    // Determine pattern and variance based on traffic
    if (answers.traffic === 'unpredictable' || answers.traffic === 'event-driven') {
        pattern = 'spiky';
        variance = 'high';
        peakCPU = 85;
        avgCPU = 40;
    } else if (answers.traffic === 'business hours') {
        pattern = 'scheduled';
        variance = 'medium';
        peakCPU = 75;
        avgCPU = 35;
    } else if (answers.traffic === 'growing fast') {
        pattern = 'gradual';
        variance = 'medium';
        peakCPU = 70;
        avgCPU = 45;
    }
    
    // Adjust for scale
    if (answers.scale === '100k+') {
        peakCPU = Math.min(peakCPU + 10, 95);
        avgCPU = Math.min(avgCPU + 5, 70);
    } else if (answers.scale === '10k–100k') {
        peakCPU = Math.min(peakCPU + 5, 90);
    }
    
    // Adjust for workload type
    if (answers.workload === 'ML/AI' || answers.workload === 'Analytics') {
        variance = 'high';
        peakCPU = Math.min(peakCPU + 10, 95);
    }
    
    return {
        pattern,
        variance,
        peakCPU,
        avgCPU,
        duration: answers.duration || 1,
        instanceCount: answers.instanceCount || 1
    };
}

// ============================================
// STRATEGY EVALUATION LOGIC
// ============================================

function evaluateStrategies(workload) {
    const strategies = {
        'Predictive Scaling': {
            cost: 75,
            latency: 85,
            stability: 90,
            reason: 'Excellent for unpredictable workloads with high variance'
        },
        'Scheduled Scaling': {
            cost: 85,
            latency: 75,
            stability: 80,
            reason: 'Optimal for predictable business hours patterns'
        },
        'Reactive Scaling': {
            cost: 60,
            latency: 60,
            stability: 65,
            reason: 'Basic approach, reacts to current load'
        },
        'Queue-Based Scaling': {
            cost: 80,
            latency: 90,
            stability: 85,
            reason: 'Perfect for ML/Analytics and async workloads'
        },
        'Hybrid Scaling': {
            cost: 88,
            latency: 88,
            stability: 92,
            reason: 'Combines multiple strategies for optimal balance'
        }
    };

    // Score each strategy based on workload characteristics
    const scores = {};
    
    for (const [strategy, baseScores] of Object.entries(strategies)) {
        let score = 70; // Base score
        
        if (workload.pattern === 'spiky' && strategy === 'Predictive Scaling') {
            score = 95;
        } else if (workload.pattern === 'scheduled' && strategy === 'Scheduled Scaling') {
            score = 92;
        } else if (workload.variance === 'high' && strategy === 'Queue-Based Scaling') {
            score = 90;
        } else if (strategy === 'Hybrid Scaling') {
            score = 85; // Hybrid is always solid
        } else if (strategy === 'Reactive Scaling') {
            score = 50; // Reactive is baseline
        }
        
        // Adjust based on workload characteristics
        if (workload.peakCPU > 80) {
            if (strategy === 'Predictive Scaling' || strategy === 'Hybrid Scaling') {
                score += 5;
            }
        }
        
        if (workload.peakCPU < 40) {
            if (strategy === 'Reactive Scaling') {
                score += 10;
            }
        }
        
        scores[strategy] = Math.min(Math.round(score), 100);
    }
    
    // Find the best strategy
    let bestStrategy = 'Hybrid Scaling';
    let bestScore = scores['Hybrid Scaling'];
    
    for (const [strategy, score] of Object.entries(scores)) {
        if (score > bestScore) {
            bestScore = score;
            bestStrategy = strategy;
        }
    }
    
    return {
        strategies: scores,
        best: bestStrategy,
        bestScore: bestScore,
        confidence: Math.round(bestScore * 0.9 + Math.random() * 10),
        details: strategies
    };
}

// ============================================
// FORM VALIDATION
// ============================================

function validateFormStep(stepNumber) {
    const step = document.querySelector(`.wizard-step[data-step="${stepNumber}"]`);
    if (!step) return true;
    
    const inputs = step.querySelectorAll('input[type="radio"], input[type="checkbox"], select');
    const requiredInputs = Array.from(inputs).filter(input => input.hasAttribute('required'));
    
    if (requiredInputs.length === 0) return true;
    
    // Check if at least one required input is selected
    for (const input of requiredInputs) {
        if (input.type === 'radio') {
            const name = input.name;
            const checked = document.querySelector(`input[name="${name}"]:checked`);
            if (!checked) return false;
        } else if (input.type === 'checkbox') {
            if (!input.checked) return false;
        } else if (input.tagName === 'SELECT') {
            if (!input.value) return false;
        }
    }
    
    return true;
}

// ============================================
// UI HELPERS
// ============================================

function showLoading(container, duration = 2000) {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = '<div class="spinner"></div>';
    
    container.innerHTML = '';
    container.appendChild(spinner);
    
    return new Promise(resolve => {
        setTimeout(() => {
            container.innerHTML = '';
            resolve();
        }, duration);
    });
}

function enableButton(button) {
    button.disabled = false;
    button.style.opacity = '1';
}

function disableButton(button) {
    button.disabled = true;
    button.style.opacity = '0.5';
}

// ============================================
// GUIDED MODE FUNCTIONS
// ============================================

let currentStep = 1;
const totalSteps = 5;

function initGuided() {
    currentStep = 1;
    updateProgressBar();
    updateButtons();
    clearFormInputs();
}

function guidedNextStep() {
    // Validate current step
    if (!validateFormStep(currentStep)) {
        alert('Please answer all questions on this step');
        return;
    }

    if (currentStep < totalSteps) {
        currentStep++;
        updateProgressBar();
        updateButtons();
        scrollToTop();
    }
}

function guidedPreviousStep() {
    if (currentStep > 1) {
        currentStep--;
        updateProgressBar();
        updateButtons();
        scrollToTop();
    }
}

function guidedFinish() {
    // Validate final step
    if (!validateFormStep(currentStep)) {
        alert('Please answer all questions on this step');
        return;
    }

    // Collect all answers
    const answers = collectGuidedAnswers();
    
    // Save to localStorage
    Storage.setGuidedData(answers);
    
    // Redirect to results
    loadPage('result');
}

function collectGuidedAnswers() {
    const answers = {
        organization: document.querySelector('input[name="organization"]:checked')?.value || '',
        workload: document.querySelector('input[name="workload"]:checked')?.value || '',
        traffic: document.querySelector('input[name="traffic"]:checked')?.value || '',
        priorities: Array.from(document.querySelectorAll('input[name="priorities"]:checked')).map(el => el.value),
        scale: document.querySelector('input[name="scale"]:checked')?.value || '',
        peakUsage: document.querySelector('input[name="peak-usage"]:checked')?.value || '',
        mode: 'guided'
    };
    return answers;
}

function clearFormInputs() {
    document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
        input.checked = false;
    });
}

function updateProgressBar() {
    const progress = (currentStep / totalSteps) * 100;
    const fillElement = document.getElementById('progress-fill');
    const stepElement = document.getElementById('current-step');
    
    if (fillElement) fillElement.style.width = progress + '%';
    if (stepElement) stepElement.textContent = currentStep;
    
    // Hide/show steps
    document.querySelectorAll('.wizard-step').forEach((step, index) => {
        if (index + 1 === currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

function updateButtons() {
    const backBtn = document.getElementById('back-btn');
    const nextBtn = document.getElementById('next-btn');
    const finishBtn = document.getElementById('finish-btn');
    
    // Show/hide back button
    if (backBtn) {
        backBtn.style.display = currentStep > 1 ? 'block' : 'none';
    }
    
    // Show finish button on last step
    if (nextBtn && finishBtn) {
        if (currentStep === totalSteps) {
            nextBtn.style.display = 'none';
            finishBtn.style.display = 'block';
        } else {
            nextBtn.style.display = 'block';
            finishBtn.style.display = 'none';
        }
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// EXPERT MODE FUNCTIONS
// ============================================

function initExpert() {
    // Reset form on page load
    const form = document.getElementById('expert-form');
    if (form) form.reset();
}

function expertSubmit(event) {
    event.preventDefault();

    // Collect form data
    const formData = new FormData(document.getElementById('expert-form'));
    const data = {
        peakCPU: parseInt(formData.get('peakCPU')),
        avgCPU: parseInt(formData.get('avgCPU')),
        variance: formData.get('variance'),
        duration: parseInt(formData.get('duration')),
        pattern: formData.get('pattern'),
        instanceCount: parseInt(formData.get('instanceCount')),
        mode: 'expert'
    };

    // Validate data
    if (data.peakCPU < data.avgCPU) {
        alert('Peak CPU must be greater than or equal to Average CPU');
        return;
    }

    // Save to localStorage
    Storage.setExpertData(data);

    // Redirect to results
    loadPage('result');
}

// ============================================
// RESULTS PAGE FUNCTIONS
// ============================================

let resultData = null;

function initResult() {
    // Show loading spinner
    const loadingContainer = document.getElementById('loading-container');
    const resultsContent = document.getElementById('results-content');
    
    if (loadingContainer) loadingContainer.style.display = 'flex';
    if (resultsContent) resultsContent.style.display = 'none';

    // Simulate processing delay
    setTimeout(() => {
        processResults();
    }, 2000);
}

async function processResults() {
    const dataSource = Storage.getDataSource();
    let workload = null;

    if (dataSource === 'guided') {
        const answers = Storage.getGuidedData();
        workload = inferWorkload(answers);
    } else if (dataSource === 'expert') {
        workload = Storage.getExpertData();
    } else {
        alert('No data found. Please start over.');
        loadPage('index');
        return;
    }

    // Map frontend pattern values to what the model expects
    const patternMap = {
        'scheduled': 'cyclic',
        'gradual': 'cyclic',
        'stable': 'stable',
        'spiky': 'spiky',
        'cyclic': 'cyclic'
    };
    
    const mappedPattern = patternMap[workload.pattern] || 'stable';

    try {
        // Prepare payload exactly as Flask expects
        const apiPayload = {
            cpu_peak: workload.peakCPU,
            cpu_avg: workload.avgCPU,
            variance: workload.variance,
            pattern: mappedPattern,
            duration_hours: workload.duration || 24,
            instance_count: workload.instanceCount || 1
        };

        const response = await fetch('https://autoscalingsystem.up.railway.app/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apiPayload)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'API request failed');
        }

        const apiResult = await response.json();

        // Build evaluation object to match what renderResults expects
        const evaluation = {
            best: apiResult.predicted_strategy,
            bestScore: Math.round(apiResult.confidence * 100),
            confidence: Math.round(apiResult.confidence * 100),
            strategies: {},
            details: {}
        };

        // Populate scores from probabilities
        for (const [strategy, prob] of Object.entries(apiResult.probabilities)) {
            evaluation.strategies[strategy] = Math.round(prob * 100);
            evaluation.details[strategy] = {
                cost: 50,
                latency: 50,
                stability: 50
            };
        }

        resultData = { workload, evaluation, dataSource };
        renderResults();

    } catch (error) {
        console.error('Prediction error:', error);
        alert('Failed to get prediction. Is Flask running?\n\n' + error.message);
    } finally {
        document.getElementById('loading-container').style.display = 'none';
        document.getElementById('results-content').style.display = 'block';
    }
}

function renderResults() {
    const { workload, evaluation } = resultData;

    // Update workload summary
    const summaryPattern = document.getElementById('summary-pattern');
    const summaryVariance = document.getElementById('summary-variance');
    const summaryPeakCPU = document.getElementById('summary-peak-cpu');
    const summaryAvgCPU = document.getElementById('summary-avg-cpu');
    
    if (summaryPattern) summaryPattern.textContent = capitalize(workload.pattern);
    if (summaryVariance) summaryVariance.textContent = capitalize(workload.variance);
    if (summaryPeakCPU) summaryPeakCPU.textContent = workload.peakCPU + '%';
    if (summaryAvgCPU) summaryAvgCPU.textContent = workload.avgCPU + '%';

    // Update recommendation
    const recStrategy = document.getElementById('recommendation-strategy');
    const recScore = document.getElementById('recommendation-score');
    const recConfidence = document.getElementById('recommendation-confidence');
    
    if (recStrategy) recStrategy.textContent = evaluation.best;
    if (recScore) recScore.textContent = evaluation.bestScore;
    if (recConfidence) recConfidence.textContent = evaluation.confidence;

    // Update explanation
    const explanation = generateExplanation(workload, evaluation);
    const explanationText = document.getElementById('explanation-text');
    if (explanationText) explanationText.textContent = explanation;

    // Render strategy bars
    renderStrategyBars(evaluation.strategies);

    // Render comparison table
    renderComparisonTable(evaluation);
}

function renderStrategyBars(strategies) {
    const container = document.getElementById('strategy-bars');
    if (!container) return;
    
    container.innerHTML = '';

    for (const [strategy, score] of Object.entries(strategies)) {
        const isHighlighted = strategy === resultData.evaluation.best;
        const barHTML = `
            <div class="strategy-bar" style="${isHighlighted ? 'opacity: 1;' : 'opacity: 0.7;'}">
                <div class="strategy-name">${strategy}</div>
                <div class="bar-container">
                    <div class="bar-fill" style="width: ${score}%;">
                        <span>${score}</span>
                    </div>
                </div>
                <div class="bar-score">${score}</div>
            </div>
        `;
        container.innerHTML += barHTML;
    }
}

function renderComparisonTable(evaluation) {
    const tbody = document.getElementById('comparison-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    for (const [strategy, score] of Object.entries(evaluation.strategies)) {
        const details = evaluation.details[strategy];
        const row = `
            <tr ${strategy === evaluation.best ? 'style="background-color: rgba(37, 99, 235, 0.05); font-weight: 600;"' : ''}>
                <td><strong>${strategy}</strong></td>
                <td>${details.cost}/100</td>
                <td>${details.latency}/100</td>
                <td>${details.stability}/100</td>
            </tr>
        `;
        tbody.innerHTML += row;
    }
}

function generateExplanation(workload, evaluation) {
    const strategy = evaluation.best;
    const pattern = workload.pattern;
    const variance = workload.variance;
    const peakCPU = workload.peakCPU;

    let explanation = `${strategy} is recommended because `;

    if (pattern === 'spiky' && strategy === 'Predictive Scaling') {
        explanation += `your workload shows spiky patterns with high variance. Predictive scaling anticipates these spikes and pre-scales resources, preventing performance degradation.`;
    } else if (pattern === 'scheduled' && strategy === 'Scheduled Scaling') {
        explanation += `your traffic follows predictable business hours patterns. Scheduled scaling automatically adjusts capacity during known peak times, optimizing costs.`;
    } else if (variance === 'high' && strategy === 'Queue-Based Scaling') {
        explanation += `your workload has high variance and benefits from asynchronous processing. Queue-based scaling decouples load from processing, improving stability.`;
    } else if (strategy === 'Hybrid Scaling') {
        explanation += `your workload has mixed characteristics that benefit from combining multiple strategies. Hybrid scaling provides optimal balance between cost, latency, and stability.`;
    } else if (peakCPU > 80) {
        explanation += `your peak CPU usage is high (${peakCPU}%). This strategy efficiently handles sustained high loads while maintaining performance.`;
    } else {
        explanation += `it provides the best balance for your specific workload characteristics, considering pattern, variance, and resource utilization.`;
    }

    explanation += ` This combination of factors results in a ${evaluation.bestScore}/100 score with ${evaluation.confidence}% confidence.`;

    return explanation;
}

function downloadResults() {
    const { workload, evaluation, dataSource } = resultData;

    let csv = 'Intelligent Autoscaling Strategy Evaluation Report\n';
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;

    csv += 'WORKLOAD SUMMARY\n';
    csv += `Pattern,${workload.pattern}\n`;
    csv += `Variance,${workload.variance}\n`;
    csv += `Peak CPU,${workload.peakCPU}%\n`;
    csv += `Average CPU,${workload.avgCPU}%\n`;
    csv += `Duration,${workload.duration} hours\n`;
    csv += `Instance Count,${workload.instanceCount}\n\n`;

    csv += 'RECOMMENDATION\n';
    csv += `Best Strategy,${evaluation.best}\n`;
    csv += `Score,${evaluation.bestScore}/100\n`;
    csv += `Confidence,${evaluation.confidence}%\n\n`;

    csv += 'STRATEGY SCORES\n';
    csv += 'Strategy,Score\n';
    for (const [strategy, score] of Object.entries(evaluation.strategies)) {
        csv += `${strategy},${score}\n`;
    }

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autoscaling-report-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// ============================================
// DOCUMENT READY
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize page on load
    console.log('Application initialized');
});
