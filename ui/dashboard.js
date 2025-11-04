/**
 * flash.ai - Emergency Response System
 * Dashboard logic for Mission Control Panel
 */

// Global state
let map = null;
let incidentMarker = null;
let responderMarker = null;
let routeLine = null;
let trafficLayer = null;
let emergencyData = null;
let allCenters = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadEmergencyData();
    initializeMap();
    loadEmergencyCenters();
});

/**
 * Load emergency data from sessionStorage
 */
function loadEmergencyData() {
    const storedData = sessionStorage.getItem('emergencyResponse');

    console.log('[DEBUG] SessionStorage raw data:', storedData);

    if (storedData) {
        emergencyData = JSON.parse(storedData);
        console.log('[DEBUG] Loaded emergency data:', emergencyData);
        console.log('[DEBUG] Has response?', !!emergencyData.response);
        console.log('[DEBUG] Has unitLocation?', !!emergencyData.response?.unitLocation);
        populateIncidentDetails();
    } else {
        // Use demo data for testing
        console.warn('[DEBUG] No emergency data found in sessionStorage, using demo data');
        emergencyData = getDemoData();
        populateIncidentDetails();
    }
}

/**
 * Get demo data for testing
 */
function getDemoData() {
    return {
        type: 'fire',
        location: {
            lat: 25.2048,
            lng: 55.2708,
            address: 'Dubai, UAE'
        },
        timestamp: new Date().toISOString(),
        response: {
            nearestUnit: 'Al Karama Civil Defence Station',
            unitLocation: {
                lat: 25.2528,
                lng: 55.3061
            },
            distance: '3.2 km',
            eta: '6 mins',
            status: 'dispatched'
        }
    };
}

/**
 * Populate incident details panel
 */
function populateIncidentDetails() {
    if (!emergencyData) return;

    // Emergency type
    const typeIcons = {
        fire: '🔥',
        hospital: '🚑',
        police: '🚓'
    };

    const typeNames = {
        fire: 'Fire Emergency',
        hospital: 'Medical Emergency',
        police: 'Police Emergency'
    };

    const typeIcon = typeIcons[emergencyData.type] || '⚠️';
    const typeName = typeNames[emergencyData.type] || 'Emergency';

    document.querySelector('#emergency-type .type-icon').textContent = typeIcon;
    document.getElementById('type-text').textContent = typeName;

    // Location
    document.getElementById('location-address').textContent = emergencyData.location.address || 'Dubai, UAE';
    document.getElementById('incident-coords').textContent =
        `Lat: ${emergencyData.location.lat.toFixed(4)}, Lng: ${emergencyData.location.lng.toFixed(4)}`;

    // Dispatched unit
    if (emergencyData.response) {
        const unitName = emergencyData.response.nearestUnit || 'Calculating...';
        document.querySelector('.unit-name').textContent = unitName;

        // Metrics
        document.getElementById('distance-value').textContent = emergencyData.response.distance || '--';
        document.getElementById('eta-value').textContent = emergencyData.response.eta || '--';

        // AI Analysis
        updateAIAnalysis();
    }
}

/**
 * Update AI analysis section
 */
function updateAIAnalysis() {
    const analysisDiv = document.getElementById('ai-analysis');

    setTimeout(() => {
        const analysis = generateAIAnalysis();
        analysisDiv.innerHTML = `<p>${analysis}</p>`;
    }, 2000); // Simulate AI processing time
}

/**
 * Generate AI analysis text
 */
function generateAIAnalysis() {
    if (!emergencyData || !emergencyData.response) {
        return 'Analyzing incident data...';
    }

    const { type, response } = emergencyData;

    const templates = {
        fire: `Based on real-time traffic analysis and GIS optimization, ${response.nearestUnit} is the optimal choice. Route is clear with minimal congestion. Unit is equipped for fire suppression and rescue operations.`,
        hospital: `Medical emergency detected. ${response.nearestUnit} has been selected based on proximity and specialized care availability. Ambulance is equipped with advanced life support systems.`,
        police: `Law enforcement response initiated. ${response.nearestUnit} is the nearest available unit. Officers are equipped for rapid response and situation assessment.`
    };

    return templates[type] || 'Optimal responder selected based on distance, availability, and response capability.';
}

/**
 * Initialize Google Maps
 */
function initializeMap() {
    if (!emergencyData) {
        console.error('No emergency data available for map');
        return;
    }

    const incidentLocation = {
        lat: emergencyData.location.lat,
        lng: emergencyData.location.lng
    };

    // Create map centered on incident
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: incidentLocation,
        styles: getDarkMapStyle(),
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
    });

    // Create traffic layer
    trafficLayer = new google.maps.TrafficLayer();

    // Add incident marker
    addIncidentMarker(incidentLocation);

    // Debug: Log emergency data structure
    console.log('[DEBUG] Emergency Data:', emergencyData);
    console.log('[DEBUG] Response Data:', emergencyData.response);
    console.log('[DEBUG] Unit Location:', emergencyData.response?.unitLocation);

    // Add responder marker and route
    if (emergencyData.response && emergencyData.response.unitLocation) {
        console.log('[DEBUG] Using response unit location');
        addResponderMarker(emergencyData.response.unitLocation);
        drawRoute(emergencyData.response.unitLocation, incidentLocation);
    } else {
        console.warn('[DEBUG] No unit location in response, using fallback');
        // If no unit location in response, try to find it from centers data
        findAndDisplayNearestUnit();
    }
}

/**
 * Find and display nearest unit from emergency centers
 */
async function findAndDisplayNearestUnit() {
    try {
        // Load emergency centers
        const centers = await fetch('../EmergencyCenters.json').then(r => r.json());

        const centerType = emergencyData.type === 'hospital' ? 'hospital' : emergencyData.type;
        const availableCenters = centers[centerType];

        if (!availableCenters) {
            console.error('No centers found for type:', centerType);
            return;
        }

        // For demo, just pick the first one (in production, use the GIS API result)
        const firstCenter = Object.values(availableCenters)[0];
        const unitLocation = {
            lat: firstCenter.lat,
            lng: firstCenter.lng
        };

        addResponderMarker(unitLocation);
        drawRoute(unitLocation, {
            lat: emergencyData.location.lat,
            lng: emergencyData.location.lng
        });

    } catch (error) {
        console.error('Error loading emergency centers:', error);
    }
}

/**
 * Add incident marker to map
 */
function addIncidentMarker(location) {
    incidentMarker = new google.maps.Marker({
        position: location,
        map: map,
        title: 'Incident Location',
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#EF4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
        },
        animation: google.maps.Animation.DROP
    });

    // Add info window
    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="color: #1E293B; padding: 0.5rem;">
                <h3 style="margin: 0 0 0.5rem 0; font-size: 1rem;">Incident Location</h3>
                <p style="margin: 0; font-size: 0.9rem;">${emergencyData.location.address}</p>
            </div>
        `
    });

    incidentMarker.addListener('click', () => {
        infoWindow.open(map, incidentMarker);
    });
}

/**
 * Add responder marker to map
 */
function addResponderMarker(location) {
    responderMarker = new google.maps.Marker({
        position: location,
        map: map,
        title: 'Responder Location',
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#10B981',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
        },
        animation: google.maps.Animation.DROP
    });

    // Add info window
    const unitName = emergencyData.response?.nearestUnit || 'Emergency Responder';
    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div style="color: #1E293B; padding: 0.5rem;">
                <h3 style="margin: 0 0 0.5rem 0; font-size: 1rem;">${unitName}</h3>
                <p style="margin: 0; font-size: 0.9rem;">ETA: ${emergencyData.response?.eta || 'Calculating...'}</p>
            </div>
        `
    });

    responderMarker.addListener('click', () => {
        infoWindow.open(map, responderMarker);
    });
}

/**
 * Draw route between two points
 */
function drawRoute(start, end) {
    // Create polyline for route
    const routePath = [start, end];

    routeLine = new google.maps.Polyline({
        path: routePath,
        geodesic: true,
        strokeColor: '#3B82F6',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: map
    });

    // Fit map to show both markers
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(start);
    bounds.extend(end);
    map.fitBounds(bounds);

    // Add some padding
    setTimeout(() => {
        map.setZoom(map.getZoom() - 0.5);
    }, 100);
}

/**
 * Get dark map style
 */
function getDarkMapStyle() {
    return [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#263c3f" }],
        },
        {
            featureType: "poi.park",
            elementType: "labels.text.fill",
            stylers: [{ color: "#6b9a76" }],
        },
        {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#38414e" }],
        },
        {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#212a37" }],
        },
        {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9ca5b3" }],
        },
        {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#746855" }],
        },
        {
            featureType: "road.highway",
            elementType: "geometry.stroke",
            stylers: [{ color: "#1f2835" }],
        },
        {
            featureType: "road.highway",
            elementType: "labels.text.fill",
            stylers: [{ color: "#f3d19c" }],
        },
        {
            featureType: "transit",
            elementType: "geometry",
            stylers: [{ color: "#2f3948" }],
        },
        {
            featureType: "transit.station",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
        },
        {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#17263c" }],
        },
        {
            featureType: "water",
            elementType: "labels.text.fill",
            stylers: [{ color: "#515c6d" }],
        },
        {
            featureType: "water",
            elementType: "labels.text.stroke",
            stylers: [{ color: "#17263c" }],
        },
    ];
}

/**
 * Load emergency centers data
 */
async function loadEmergencyCenters() {
    try {
        const response = await fetch('../EmergencyCenters.json');
        allCenters = await response.json();
        console.log('Loaded emergency centers:', allCenters);
    } catch (error) {
        console.error('Error loading emergency centers:', error);
    }
}

/**
 * Recenter map to show incident and responder
 */
function recenterMap() {
    if (!map || !incidentMarker) return;

    if (responderMarker) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(incidentMarker.getPosition());
        bounds.extend(responderMarker.getPosition());
        map.fitBounds(bounds);
        setTimeout(() => {
            map.setZoom(map.getZoom() - 0.5);
        }, 100);
    } else {
        map.setCenter(incidentMarker.getPosition());
        map.setZoom(13);
    }
}

/**
 * Toggle traffic layer
 */
function toggleTraffic() {
    if (!trafficLayer) return;

    if (trafficLayer.getMap()) {
        trafficLayer.setMap(null);
    } else {
        trafficLayer.setMap(map);
    }
}

/**
 * Toggle centers panel
 */
function toggleCentersPanel() {
    const panel = document.getElementById('centers-panel');

    if (panel.style.display === 'none' || !panel.style.display) {
        panel.style.display = 'block';
        populateCentersList();
    } else {
        panel.style.display = 'none';
    }
}

/**
 * Populate centers list
 */
function populateCentersList() {
    if (!allCenters || !emergencyData) return;

    const centerType = emergencyData.type === 'hospital' ? 'hospital' : emergencyData.type;
    const centers = allCenters[centerType];

    if (!centers) return;

    const listEl = document.getElementById('centers-list');
    listEl.innerHTML = '';

    Object.entries(centers).forEach(([name, location]) => {
        const distance = calculateDistance(
            emergencyData.location.lat,
            emergencyData.location.lng,
            location.lat,
            location.lng
        );

        const item = document.createElement('div');
        item.className = 'center-item';
        item.innerHTML = `
            <div class="center-name">${name}</div>
            <div class="center-distance">${distance.toFixed(2)} km away</div>
        `;

        item.onclick = () => {
            map.setCenter({ lat: location.lat, lng: location.lng });
            map.setZoom(15);
        };

        listEl.appendChild(item);
    });
}

/**
 * Calculate distance between two points (Haversine formula)
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Resolve incident
 */
function resolveIncident() {
    if (confirm('Mark this incident as resolved?')) {
        document.getElementById('incident-status').textContent = 'RESOLVED';
        document.getElementById('incident-status').style.background = '#10B981';

        // Clear session storage
        sessionStorage.removeItem('emergencyResponse');

        // Show confirmation
        setTimeout(() => {
            alert('Incident marked as resolved. Redirecting to home...');
            window.location.href = 'index.html';
        }, 500);
    }
}

// Export functions for global access
window.recenterMap = recenterMap;
window.toggleTraffic = toggleTraffic;
window.toggleCentersPanel = toggleCentersPanel;
window.resolveIncident = resolveIncident;
