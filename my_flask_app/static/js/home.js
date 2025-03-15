document.addEventListener('DOMContentLoaded', function() {
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const manualSection = document.getElementById('manual-input');
    const imageSection = document.getElementById('image-input');
    const abiForm = document.getElementById('abi-form');
    const imageForm = document.getElementById('image-form');
    const resultsSection = document.getElementById('results');
    const dropZones = document.querySelectorAll('.drop-zone');

    // Initial state - show manual input by default
    manualSection.style.display = 'block';
    imageSection.style.display = 'none';

    // Toggle between manual and image input
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            toggleBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Show/hide sections based on selected mode
            if (btn.dataset.mode === 'manual') {
                manualSection.style.display = 'block';
                imageSection.style.display = 'none';
            } else {
                manualSection.style.display = 'none';
                imageSection.style.display = 'block';
            }
            
            // Hide results when switching modes
            resultsSection.style.display = 'none';
        });
    });

    // Handle manual input form submission
    abiForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            right_arm: document.getElementById('right-arm').value,
            left_arm: document.getElementById('left-arm').value,
            right_ankle: document.getElementById('right-ankle').value,
            left_ankle: document.getElementById('left-ankle').value
        };
        // Show loading animation
        document.getElementById('loading-indicator').style.display = 'flex';
        try {
           const response = await fetch('https://flask-app-pqxn.onrender.com/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
});

            const result = await response.json();
             // Hide loading animation
            document.getElementById('loading-indicator').style.display = 'none';
            if (result.error) {
                showError(result.error);
                return;
            }
            displayResults(result);
        } catch (error) {
            showError('An error occurred while calculating ABI.');
        }
    });

    // Handle image upload form submission
    imageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        const imageInputs = imageForm.querySelectorAll('.drop-zone-input');
        let hasImages = false;

        imageInputs.forEach(input => {
            if (input.files[0]) {
                formData.append(input.name, input.files[0]);
                hasImages = true;
            }
        });

        if (!hasImages) {
            showError('Please upload at least one image.');
            return;
        }
        // Show loading animation
        document.getElementById('loading-indicator').style.display = 'flex';
        try {
            const response = await fetch('/process-images', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            // Hide loading animation
            document.getElementById('loading-indicator').style.display = 'none';
            if (result.error) {
                showError(result.error);
                return;
            }
            displayResults(result);
        } catch (error) {
            showError('An error occurred while processing the images.');
        }
    });

    // Handle drag and drop functionality for each drop zone
    dropZones.forEach(dropZone => {
        const input = dropZone.querySelector('.drop-zone-input');
        const preview = dropZone.querySelector('.preview-container');

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('dragover');
            });
        });

        dropZone.addEventListener('drop', (e) => {
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                input.files = e.dataTransfer.files;
                updatePreview(file, preview, dropZone);
            }
        });

        dropZone.addEventListener('click', () => {
            input.click();
        });

        input.addEventListener('change', () => {
            if (input.files[0]) {
                updatePreview(input.files[0], preview, dropZone);
            }
        });
    });

    function updatePreview(file, preview, dropZone) {
        const content = dropZone.querySelector('.drop-zone-content');
        content.style.display = 'none';
        preview.style.display = 'block';

        // Remove existing preview
        preview.innerHTML = '';

        // Create image preview
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        
        // Create remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            clearPreview(dropZone, preview, content);
        });

        preview.appendChild(img);
        preview.appendChild(removeBtn);
    }

    function clearPreview(dropZone, preview, content) {
        const input = dropZone.querySelector('.drop-zone-input');
        input.value = '';
        preview.style.display = 'none';
        preview.innerHTML = '';
        content.style.display = 'block';
    }

    function displayResults(result) {
        // Show results section
        resultsSection.style.display = 'block';
        
        document.getElementById('right-abi').textContent = result.right_abi.toFixed(2);
        document.getElementById('left-abi').textContent = result.left_abi.toFixed(2);
        document.getElementById('right-risk').textContent = result.right_risk;
        document.getElementById('left-risk').textContent = result.left_risk;

        // Update risk level classes
        updateRiskClass('right-risk', result.right_risk);
        updateRiskClass('left-risk', result.left_risk);

        // Update details
        document.getElementById('right-details').textContent = getRiskDetails(result.right_abi);
        document.getElementById('left-details').textContent = getRiskDetails(result.left_abi);

        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    function updateRiskClass(elementId, risk) {
        const element = document.getElementById(elementId);
        element.classList.remove('normal', 'mild', 'moderate', 'severe');
        
        if (risk.includes('Normal')) {
            element.classList.add('normal');
        } else if (risk.includes('Mild')) {
            element.classList.add('mild');
        } else if (risk.includes('Moderate')) {
            element.classList.add('moderate');
        } else if (risk.includes('Severe')) {
            element.classList.add('severe');
        }
    }

    function getRiskDetails(abi) {
        if (abi > 1.3) {
            return 'Further evaluation needed for arterial calcification';
        }
        if (abi >= 0.9) {
            return 'Normal arterial blood flow';
        }
        if (abi >= 0.7) {
            return 'Lifestyle changes and medical management recommended';
        }
        if (abi >= 0.4) {
            return 'Regular monitoring and vascular specialist consultation recommended';
        }
        return 'Immediate vascular specialist consultation required';
    }

    function showError(message) {
        // Create error notification
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;

        // Add to document
        document.body.appendChild(notification);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Add error notification styles if not already in CSS
    if (!document.querySelector('#error-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'error-notification-styles';
        style.textContent = `
            .error-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: var(--danger-color);
                color: white;
                padding: 1rem;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                z-index: 1000;
                animation: slideIn 0.3s ease-out;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }

            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
});
