/**
 * Expert Input Mode Logic
 */

function initExpert() {
    // Reset form on page load
    document.getElementById('expert-form').reset();
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
