/**
 * flash.ai - Emergency Response System
 * Main application logic for emergency trigger page
 */

// Global state
let currentEmergency = null;
let userLocation = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeLocation();
});

/**
 * Initialize user location detection
 */
function initializeLocation() {
    const locationText = document.getElementById('location-text');

    // Try to get user's actual location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                locationText.textContent = `Location detected: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`;
                reverseGeocode(userLocation);
            },
            (error) => {
                console.warn('Geolocation error:', error);
                useFallbackLocation();
            }
        );
    } else {
        useFallbackLocation();
    }
}

/**
 * Use fallback location (Dubai city center for demo)
 */
function useFallbackLocation() {
    userLocation = {
        lat: 25.2048,
        lng: 55.2708,
        address: 'Dubai, UAE'
    };
    document.getElementById('location-text').textContent = `Using default location: ${userLocation.address}`;
}

/**
 * Reverse geocode coordinates to get address
 */
function reverseGeocode(location) {
    // For production, use Google Maps Geocoding API
    // For demo, use simple address
    const locationText = document.getElementById('location-text');
    locationText.textContent = `Location: Dubai, UAE (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`;
    userLocation.address = 'Dubai, UAE';
}

/**
 * Main function to trigger emergency
 * @param {string} type - Emergency type: 'fire', 'hospital', or 'police'
 */
async function triggerEmergency(type) {
    console.log(`Triggering ${type} emergency`);

    // Ensure location is available
    if (!userLocation) {
        useFallbackLocation();
    }

    // Store current emergency
    currentEmergency = {
        type: type,
        location: userLocation,
        timestamp: new Date().toISOString()
    };

    // Show loading overlay
    showLoading();

    // Disable all buttons
    disableButtons();

    try {
        // Call n8n webhook
        const response = await callN8nWebhook(type, userLocation);

        console.log('Emergency response:', response);

        // Store response in sessionStorage for dashboard
        sessionStorage.setItem('emergencyResponse', JSON.stringify({
            ...currentEmergency,
            response: response
        }));

        // Show success message
        showSuccessMessage(response);

    } catch (error) {
        console.error('Error triggering emergency:', error);
        showErrorMessage(error.message);
    }
}

/**
 * Call n8n webhook endpoint
 * @param {string} type - Emergency type
 * @param {object} location - User location object
 */
async function callN8nWebhook(type, location) {
    // Get webhook URL from config
    const webhookUrl = getWebhookUrl(type);

    if (!webhookUrl) {
        throw new Error('Webhook URL not configured for ' + type);
    }

    // Prepare request payload
    const payload = {
        emergencyType: type,
        latitude: location.lat,
        longitude: location.lng,
        currentlocation: location.address || 'Dubai, UAE',
        timestamp: new Date().toISOString(),
        requestType: type === 'hospital' ? 'hospital' : type
    };

    console.log('Sending to webhook:', webhookUrl, payload);

    // Make request to n8n webhook
    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
}

/**
 * Get webhook URL for emergency type
 * @param {string} type - Emergency type
 * @returns {string} Webhook URL
 */
function getWebhookUrl(type) {
    // Map emergency types to webhook URLs from config
    const webhookMap = {
        'fire': WEBHOOK_URLS.fire,
        'hospital': WEBHOOK_URLS.ambulance,
        'police': WEBHOOK_URLS.police
    };

    return webhookMap[type];
}

/**
 * Show loading overlay
 */
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.style.display = 'flex';
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.style.display = 'none';
}

/**
 * Show success message
 * @param {object} response - API response
 */
function showSuccessMessage(response) {
    hideLoading();

    const responseDiv = document.getElementById('response-message');
    const titleEl = document.getElementById('response-title');
    const detailsEl = document.getElementById('response-details');

    // Parse response to extract key info
    let nearestUnit = 'Emergency responder';
    let eta = 'Calculating...';

    if (response && response.nearestUnit) {
        nearestUnit = response.nearestUnit;
    }

    if (response && response.eta) {
        eta = response.eta;
    }

    titleEl.textContent = 'Emergency Dispatched Successfully';
    detailsEl.innerHTML = `
        <strong>${nearestUnit}</strong> has been dispatched to your location.<br>
        Estimated arrival time: <strong>${eta}</strong>
    `;

    responseDiv.style.display = 'block';
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showErrorMessage(message) {
    hideLoading();

    const errorDiv = document.getElementById('error-message');
    const detailsEl = document.getElementById('error-details');

    detailsEl.textContent = message || 'Unable to reach emergency dispatch system. Please try again.';
    errorDiv.style.display = 'block';
}

/**
 * Disable all emergency buttons
 */
function disableButtons() {
    const buttons = document.querySelectorAll('.btn-emergency');
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    });
}

/**
 * Enable all emergency buttons
 */
function enableButtons() {
    const buttons = document.querySelectorAll('.btn-emergency');
    buttons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    });
}

/**
 * Navigate to dashboard
 */
function viewDashboard() {
    window.location.href = 'dashboard.html';
}

/**
 * Reset form to initial state
 */
function resetForm() {
    hideLoading();
    document.getElementById('response-message').style.display = 'none';
    document.getElementById('error-message').style.display = 'none';
    enableButtons();
    currentEmergency = null;
}

/**
 * Demo fallback mode (if webhooks fail)
 * Generates mock response for demo purposes
 */
function useDemoFallback(type) {
    console.log('Using demo fallback mode');

    const mockResponses = {
        fire: {
            nearestUnit: 'Al Karama Civil Defence Station',
            distance: '3.2 km',
            eta: '6 mins',
            status: 'dispatched'
        },
        hospital: {
            nearestUnit: 'Rashid Hospital',
            distance: '2.8 km',
            eta: '5 mins',
            status: 'dispatched'
        },
        police: {
            nearestUnit: 'Bur Dubai Police Station',
            distance: '1.9 km',
            eta: '4 mins',
            status: 'dispatched'
        }
    };

    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(mockResponses[type]);
        }, 2000); // Simulate network delay
    });
}

// Export functions for global access
window.triggerEmergency = triggerEmergency;
window.viewDashboard = viewDashboard;
window.resetForm = resetForm;
