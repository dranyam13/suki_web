// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Ensure API config is initialized
    if (typeof sukiApiConfig !== 'undefined') {
        sukiApiConfig.init().catch(err => {
            console.error('[Suki Login] Failed to initialize API config:', err);
        });
    }
    
    // Form submission handler
    const form = document.getElementById('suki-login-form');
    if (form) {
        form.addEventListener('submit', handleLoginSubmit);
    }
    
    // Input focus effects and scanner support
    const sukiIdInput = document.getElementById('sukiId');
    if (sukiIdInput) {
        // Auto-focus the input for scanner
        sukiIdInput.focus();
        
        sukiIdInput.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        sukiIdInput.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
        
        // Clear error on input and enforce numbers only
        sukiIdInput.addEventListener('input', function() {
            // Strip non-digit characters
            this.value = this.value.replace(/\D/g, '');
            const errorDiv = document.getElementById('login-error');
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        });
        
        // Support for barcode scanner - auto-submit when Enter is pressed
        // Scanners typically send characters quickly followed by Enter key
        sukiIdInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const form = document.getElementById('suki-login-form');
                if (form) {
                    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                }
            }
        });
    }
});

function handleLoginSubmit(e) {
    e.preventDefault();
    
    const sukiId = document.getElementById('sukiId').value.trim();
    const errorDiv = document.getElementById('login-error');
    const errorText = document.getElementById('error-text');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    
    // Hide previous errors
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
    
    // Validation
    if (!sukiId) {
        if (errorText) errorText.textContent = 'Please enter your Suki Card ID.';
        if (errorDiv) errorDiv.style.display = 'flex';
        return;
    }
    
    if (sukiId.length < 4) {
        if (errorText) errorText.textContent = 'Card ID must be at least 4 characters.';
        if (errorDiv) errorDiv.style.display = 'flex';
        return;
    }
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.setAttribute('aria-busy', 'true');
    if (btnText) btnText.style.display = 'none';
    if (btnLoader) btnLoader.style.display = 'inline-block';
    
    // Determine API URL with fallback
    let apiUrl;
    if (typeof sukiApiConfig !== 'undefined' && sukiApiConfig.backendUrl !== undefined) {
        apiUrl = `${sukiApiConfig.backendUrl}/api/suki_points?id=${encodeURIComponent(sukiId)}`;
    } else {
        // Fallback - use current host with port 8000
        const backendUrl = `${window.location.protocol}//${window.location.hostname}:8000`;
        apiUrl = `${backendUrl}/api/suki_points?id=${encodeURIComponent(sukiId)}`;
    }
    
    fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        timeout: 10000
    })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP Error: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            if (data && data.success) {
                // Successful login - redirect to dashboard
                window.location.href = `suki_dashboard.html?id=${encodeURIComponent(sukiId)}`;
            } else {
                showError(data?.message || 'Invalid Suki Card ID. Please try again.');
                resetButton();
            }
        })
        .catch(error => {
            console.error('[Suki Login] API Error:', error);
            
            // Provide more specific error messages
            let errorMessage = 'Server error. Please try again later.';
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'Network error. Please check your connection.';
            } else if (error.message.includes('HTTP')) {
                errorMessage = 'Server error. Please try again later.';
            }
            
            showError(errorMessage);
            resetButton();
        });
    
    function showError(message) {
        if (errorText) errorText.textContent = message;
        if (errorDiv) errorDiv.style.display = 'flex';
    }
    
    function resetButton() {
        submitBtn.disabled = false;
        submitBtn.setAttribute('aria-busy', 'false');
        if (btnText) btnText.style.display = 'inline';
        if (btnLoader) btnLoader.style.display = 'none';
    }
}
