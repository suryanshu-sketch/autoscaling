/**
 * Results Page Logic
 */

let resultData = null;

function initResult() {
    document.getElementById('loading-container').style.display = 'flex';
    document.getElementById('results-content').style.display = 'none';

    setTimeout(() => {
        processResults();
    }, 2000);
}

// --- UPDATED: Now async and calls the Flask ML API ---
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

    try {
        // Prepare payload exactly as Flask API expects
        const apiPayload = {
            cpu_peak: workload.peakCPU,
            cpu_avg: workload.avgCPU,
            variance: workload.variance,        // "low", "medium", "high"
            pattern: workload.pattern,          // "stable", "cyclic", "spiky"
            duration_hours: workload.duration,
            instance_count: workload.instanceCount
        };

        const response = await fetch('http://127.0.0.1:5001/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(apiPayload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'API request failed');
        }

        const apiResult = await response.json();

        // Build evaluation object compatible with renderResults()
        const evaluation = {
            best: apiResult.predicted_strategy,
            bestScore: Math.round(apiResult.confidence * 100),
            confidence: Math.round(apiResult.confidence * 100),
            strategies: {},
            details: {}
        };

        // Populate scores from probabilities (and add placeholder details)
        const strategies = Object.keys(apiResult.probabilities);
        strategies.forEach(strategy => {
            const prob = apiResult.probabilities[strategy];
            evaluation.strategies[strategy] = Math.round(prob * 100);
            // You can replace these default values with actual metrics if available
            evaluation.details[strategy] = {
                cost: 50,
                latency: 50,
                stability: 50
            };
        });

        resultData = {
            workload,
            evaluation,
            dataSource
        };

        renderResults();

    } catch (error) {
        console.error('Prediction error:', error);
        alert('Failed to get prediction from server.\nMake sure Flask is running on port 5001.\n\nError: ' + error.message);
    } finally {
        document.getElementById('loading-container').style.display = 'none';
        document.getElementById('results-content').style.display = 'block';
    }
}

function renderResults() {
    const { workload, evaluation } = resultData;

    document.getElementById('summary-pattern').textContent = capitalize(workload.pattern);
    document.getElementById('summary-variance').textContent = capitalize(workload.variance);
    document.getElementById('summary-peak-cpu').textContent = workload.peakCPU + '%';
    document.getElementById('summary-avg-cpu').textContent = workload.avgCPU + '%';

    document.getElementById('recommendation-strategy').textContent = evaluation.best;
    document.getElementById('recommendation-score').textContent = evaluation.bestScore;
    document.getElementById('recommendation-confidence').textContent = evaluation.confidence;

    const explanation = generateExplanation(workload, evaluation);
    document.getElementById('explanation-text').textContent = explanation;

    renderStrategyBars(evaluation.strategies);
    renderComparisonTable(evaluation);
}

function renderStrategyBars(strategies) {
    const container = document.getElementById('strategy-bars');
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