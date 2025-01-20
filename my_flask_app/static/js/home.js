function checkInputs() {
    // Declare the variables to track the input states for each option
    let warningMessage = '';
    let valid = true;

    // Check Option 1
    if (!checkOption('option1')) {
        valid = false;
        warningMessage += 'Option 1: Please provide either a numeric input or upload an image.\n';
    }
    // Check Option 2
    if (!checkOption('option2')) {
        valid = false;
        warningMessage += 'Option 2: Please provide either a numeric input or upload an image.\n';
    }
    // Check Option 3
    if (!checkOption('option3')) {
        valid = false;
        warningMessage += 'Option 3: Please provide either a numeric input or upload an image.\n';
    }
    // Check Option 4
    if (!checkOption('option4')) {
        valid = false;
        warningMessage += 'Option 4: Please provide either a numeric input or upload an image.\n';
    }

    // Show the warning message if any option is missing an input
    if (!valid) {
        alert(warningMessage);
    }

    return valid;  // Return true if all options are valid, false if not
}

// Helper function to check if numeric input or image is selected for each option
function checkOption(option) {
    const numericInput = document.querySelector(`#${option}-num-input`).value;
    const imageInput = document.querySelector(`#${option}-image-input`).files.length;

    // Return true if either numeric input or image upload is provided
    return numericInput || imageInput > 0;
}

// Trigger the checkInputs function on form submission
document.querySelector('form').addEventListener('submit', function(event) {
    if (!checkInputs()) {
        // Prevent form submission if any option is missing input
        event.preventDefault();
    }
});
    
// This function will hide or reset calculated values when the page is loaded (or refreshed)
function reload(){
    // Example: Clear a div or element with output
    document.getElementById("output").style.display = "none"; // Hides the result
};

// Function to show input fields based on selected option
function toggleInput(optionId) {
    const numInput = document.getElementById(optionId + '-num');
    const imageInput = document.getElementById(optionId + '-image');
    const numRadio = document.getElementById(optionId + '-num-radio');
    const imageRadio = document.getElementById(optionId + '-image-radio');

    if (numRadio.checked) {
        numInput.style.display = 'block';
        imageInput.style.display = 'none';
    } else if (imageRadio.checked) {
        numInput.style.display = 'none';
        imageInput.style.display = 'block';
    }
}
