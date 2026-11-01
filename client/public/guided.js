/**
 * Guided Questionnaire Flow Logic
 */

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
    document.getElementById('progress-fill').style.width = progress + '%';
    document.getElementById('current-step').textContent = currentStep;
    
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
    if (currentStep > 1) {
        backBtn.style.display = 'block';
    } else {
        backBtn.style.display = 'none';
    }
    
    // Show finish button on last step
    if (currentStep === totalSteps) {
        nextBtn.style.display = 'none';
        finishBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'block';
        finishBtn.style.display = 'none';
    }
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Attach event listeners to radio/checkbox for validation feedback
    document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', function() {
            // Optional: Add visual feedback on selection
        });
    });
});
