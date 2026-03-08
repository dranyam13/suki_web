// Get Suki Card ID from URL
function getQueryParam(name) {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    } catch (error) {
        console.error('[Suki Dashboard] Error parsing URL params:', error);
        return null;
    }
}

// =====================================================
// REAL-TIME AUTO-REFRESH SYSTEM
// =====================================================
const AutoRefresh = {
    intervalId: null,
    interval: 3000, // Refresh every 3 seconds for real-time updates
    lastData: null,
    isActive: true,
    
    // Start auto-refresh
    start() {
        if (this.intervalId) return; // Already running
        
        this.isActive = true;
        this.intervalId = setInterval(() => {
            if (this.isActive && document.visibilityState === 'visible') {
                this.refresh();
            }
        }, this.interval);
        
        console.log('[Suki Dashboard] Auto-refresh started');
    },
    
    // Stop auto-refresh
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isActive = false;
        console.log('[Suki Dashboard] Auto-refresh stopped');
    },
    
    // Pause when tab is not visible
    pause() {
        this.isActive = false;
    },
    
    // Resume when tab becomes visible
    resume() {
        this.isActive = true;
        this.refresh(); // Refresh immediately when resuming
    },
    
    // Perform a silent refresh (no loading indicators)
    async refresh() {
        const sukiId = getQueryParam('id');
        if (!sukiId) return;
        
        let apiUrl;
        if (typeof sukiApiConfig !== 'undefined' && sukiApiConfig.backendUrl) {
            apiUrl = `${sukiApiConfig.backendUrl}/api/suki_points?id=${encodeURIComponent(sukiId)}`;
        } else {
            const backendUrl = `${window.location.protocol}//${window.location.hostname}:8000`;
            apiUrl = `${backendUrl}/api/suki_points?id=${encodeURIComponent(sukiId)}`;
        }
        
        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.warn('[Suki Dashboard] Auto-refresh failed:', response.status);
                return;
            }
            
            const data = await response.json();
            
            if (data && data.success) {
                // Check if data has changed
                if (this.hasDataChanged(data)) {
                    console.log('[Suki Dashboard] Data changed, updating...');
                    updateDashboardSmooth(data);
                    this.lastData = data;
                }
            }
        } catch (error) {
            console.warn('[Suki Dashboard] Auto-refresh error:', error);
        }
    },
    
    // Check if data has changed from last fetch
    hasDataChanged(newData) {
        if (!this.lastData) return true;
        
        return (
            this.lastData.points !== newData.points ||
            this.lastData.name !== newData.name ||
            this.lastData.tier !== newData.tier
        );
    },
    
    // Set refresh interval (in milliseconds)
    setInterval(ms) {
        this.interval = ms;
        if (this.intervalId) {
            this.stop();
            this.start();
        }
    }
};

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        AutoRefresh.resume();
    } else {
        AutoRefresh.pause();
    }
});

// Smooth update function that doesn't reset animations
function updateDashboardSmooth(data) {
    try {
        // Update user name (only if changed)
        const userNameElement = document.getElementById('user-name');
        if (userNameElement && userNameElement.textContent !== (data.name || 'Suki Member')) {
            userNameElement.textContent = data.name || 'Suki Member';
        }
        
        // Update points with animation
        const pointsElement = document.getElementById('points-value');
        if (pointsElement && typeof data.points === 'number') {
            const currentPoints = parseInt(pointsElement.textContent.replace(/,/g, '')) || 0;
            if (currentPoints !== data.points) {
                // Add highlight animation for changed points
                pointsElement.classList.add('points-updated');
                animateNumber(pointsElement, data.points, 500);
                setTimeout(() => {
                    pointsElement.classList.remove('points-updated');
                }, 1000);
            }
        }
        
        // Update peso value
        const pesoValueElement = document.getElementById('peso-value');
        if (pesoValueElement && typeof data.points === 'number') {
            const pesoValue = getPesoValue(data.points);
            if (pesoValueElement.textContent !== pesoValue.toLocaleString('en-PH')) {
                pesoValueElement.textContent = pesoValue.toLocaleString('en-PH');
            }
        }
        
        // Update tier
        const tierStatusElement = document.getElementById('tier-status');
        if (tierStatusElement) {
            const newTier = data.tier || (typeof data.points === 'number' ? getTier(data.points).name : null);
            if (newTier && tierStatusElement.textContent !== newTier) {
                tierStatusElement.textContent = newTier;
                tierStatusElement.classList.add('tier-updated');
                setTimeout(() => {
                    tierStatusElement.classList.remove('tier-updated');
                }, 1000);
            }
        }
        
        // Update flip card member name
        const cardMemberName = document.getElementById('card-member-name');
        if (cardMemberName && cardMemberName.textContent !== (data.name || 'Suki Member')) {
            cardMemberName.textContent = data.name || 'Suki Member';
        }
        
    } catch (error) {
        console.error('[Suki Dashboard] Error in smooth update:', error);
    }
}

// Animate number counting up
function animateNumber(element, target, duration = 1000) {
    if (!element) return;
    
    const start = 0;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + (target - start) * easeOutQuart);
        
        element.textContent = current.toLocaleString('en-PH');
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Calculate tier based on points
function getTier(points) {
    if (points >= 500) return { name: 'Gold', level: 3 };
    if (points >= 200) return { name: 'Silver', level: 2 };
    if (points >= 50) return { name: 'Bronze', level: 1 };
    return { name: 'Member', level: 0 };
}

// Calculate peso value (1 point = ₱1 discount example)
function getPesoValue(points) {
    return Math.floor(points * 1); // 1 point = ₱1
}

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', function() {
    // Always display the card ID from URL immediately
    const sukiId = getQueryParam('id');
    const cardIdElement = document.getElementById('card-id');
    if (cardIdElement && sukiId) {
        cardIdElement.textContent = sukiId;
    }
    
    // Also update flip card ID immediately
    const flipCardId = document.getElementById('flip-card-id');
    if (flipCardId && sukiId) {
        const formattedId = sukiId.replace(/(.{3})(.{4})(.{3})/, '$1 $2 $3');
        flipCardId.textContent = formattedId;
    }
    
    // Generate QR code for this card
    generateQRCode(sukiId);
    
    // Add keyboard support for flip card
    const flipCard = document.querySelector('.flip-card');
    if (flipCard) {
        flipCard.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.classList.toggle('flipped');
            }
        });
    }
    
    // Ensure API config is initialized
    if (typeof sukiApiConfig !== 'undefined') {
        sukiApiConfig.init().then(() => {
            loadDashboardData();
            // Start auto-refresh for real-time updates
            AutoRefresh.start();
        }).catch(err => {
            console.error('[Suki Dashboard] Failed to initialize API config:', err);
            showError('Failed to initialize API configuration. Please try again.');
        });
    } else {
        console.warn('[Suki Dashboard] sukiApiConfig not available');
        loadDashboardData();
        // Start auto-refresh for real-time updates
        AutoRefresh.start();
    }
});

// Generate QR code that links to the login page
function generateQRCode(cardId) {
    const qrContainer = document.getElementById('card-qr-code');
    if (!qrContainer || !cardId) return;
    
    // Clear any existing content
    qrContainer.innerHTML = '';
    
    // Build the login URL (users scan to go to login page)
    const baseUrl = window.location.origin + window.location.pathname.replace('suki_dashboard.html', 'suki_login.html');
    const loginUrl = baseUrl;
    
    // Check if QRCode library is loaded
    if (typeof QRCode !== 'undefined') {
        new QRCode(qrContainer, {
            text: loginUrl,
            width: 50,
            height: 50,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });
    } else {
        // Fallback: use QR Server API
        const qrImg = document.createElement('img');
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=${encodeURIComponent(loginUrl)}`;
        qrImg.alt = 'QR Code to view points';
        qrImg.style.width = '50px';
        qrImg.style.height = '50px';
        qrContainer.appendChild(qrImg);
    }
    
    console.log('[Suki Dashboard] QR code generated for:', loginUrl);
}

function loadDashboardData() {
    const sukiId = getQueryParam('id');
    const errorModal = document.getElementById('error-modal');
    const errorMessage = document.getElementById('error-message');
    
    if (!sukiId) {
        if (errorMessage) errorMessage.textContent = 'No Suki Card ID provided. Please login first.';
        if (errorModal) errorModal.style.display = 'flex';
        console.warn('[Suki Dashboard] No Card ID in URL');
        return;
    }
    
    // Determine API URL
    let apiUrl;
    if (typeof sukiApiConfig !== 'undefined' && sukiApiConfig.backendUrl) {
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
        }
    })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP Error: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            if (data && data.success) {
                updateDashboard(data);
            } else {
                showError(data?.message || 'Unable to fetch your card data.');
            }
        })
        .catch(error => {
            console.error('[Suki Dashboard] API Error:', error);
            
            let errorMsg = 'Server error. Please try again later.';
            if (error.message.includes('HTTP')) {
                errorMsg = 'Unable to connect to server. Please check your connection.';
            }
            
            showError(errorMsg);
        });
}

function updateDashboard(data) {
    try {
        // Update user name
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = data.name || 'Suki Member';
        }
        
        // Animate points value
        const pointsElement = document.getElementById('points-value');
        if (pointsElement && typeof data.points === 'number') {
            animateNumber(pointsElement, data.points, 1200);
        }
        
        // Update peso value
        const pesoValueElement = document.getElementById('peso-value');
        if (pesoValueElement && typeof data.points === 'number') {
            const pesoValue = getPesoValue(data.points);
            pesoValueElement.textContent = pesoValue.toLocaleString('en-PH');
        }
        
        // Update tier - use tier from API if available, otherwise calculate from points
        const tierStatusElement = document.getElementById('tier-status');
        if (tierStatusElement) {
            if (data.tier) {
                tierStatusElement.textContent = data.tier;
                tierStatusElement.setAttribute('aria-label', `Member Tier Status: ${data.tier}`);
            } else if (typeof data.points === 'number') {
                const tier = getTier(data.points);
                tierStatusElement.textContent = tier.name;
                tierStatusElement.setAttribute('aria-label', `Member Tier Status: ${tier.name}`);
            }
        }
        
        // Update flip card member name
        const cardMemberName = document.getElementById('card-member-name');
        if (cardMemberName) {
            cardMemberName.textContent = data.name || 'Suki Member';
        }
        
        // Update member since year
        const memberSince = document.getElementById('member-since');
        if (memberSince) {
            if (data.memberSince) {
                memberSince.textContent = `Member since ${data.memberSince}`;
            } else {
                // Fallback to current year if not available
                memberSince.textContent = `Member since ${new Date().getFullYear()}`;
            }
        }
        
        // Update flip card ID (formatted with spaces)
        const flipCardId = document.getElementById('flip-card-id');
        const sukiId = getQueryParam('id');
        if (flipCardId && sukiId) {
            // Format card ID with spaces for readability (e.g., "123 4567 890")
            const formattedId = sukiId.replace(/(.{3})(.{4})(.{3})/, '$1 $2 $3');
            flipCardId.textContent = formattedId;
        }
        
    } catch (error) {
        console.error('[Suki Dashboard] Error updating dashboard:', error);
        showError('Error displaying your information. Please refresh the page.');
    }
}

function showError(message) {
    const errorModal = document.getElementById('error-modal');
    const errorMessageElement = document.getElementById('error-message');
    
    if (errorMessageElement) {
        errorMessageElement.textContent = message || 'An error occurred. Please try again.';
    }
    
    if (errorModal) {
        errorModal.style.display = 'flex';
        errorModal.setAttribute('aria-hidden', 'false');
    }
}
