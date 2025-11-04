"""
flash.ai - GIS Calculator API
Flask wrapper for GISanalyser.py to enable HTTP access from n8n

This API exposes the GIS calculation functionality as an HTTP endpoint
that can be called from n8n cloud or any other HTTP client.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from GISanalyser import calculate_driving_distance
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes (allows calls from n8n cloud and UI)

@app.route('/', methods=['GET'])
def home():
    """Health check endpoint"""
    return jsonify({
        'status': 'online',
        'service': 'flash.ai GIS Calculator API',
        'version': '1.0',
        'endpoints': {
            '/calculate': 'POST - Calculate distances to emergency centers'
        }
    })

@app.route('/calculate', methods=['POST', 'OPTIONS'])
def calculate():
    """
    Calculate distances from incident location to all emergency centers

    Expected JSON body:
    {
        "latitude": 25.2048,
        "longitude": 55.2708,
        "emergencyType": "fire"  // or "police" or "hospital"
    }

    Returns:
    {
        "success": true,
        "nearestUnit": "Station Name",
        "distance": "3.2 km",
        "eta": "6 mins",
        "unitLocation": {"lat": 25.xxx, "lng": 55.xxx},
        "allStations": {...}
    }
    """

    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 204

    try:
        # Parse request data
        data = request.json

        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400

        # Extract parameters
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        emergency_type = data.get('emergencyType', 'fire').lower()

        # Validate parameters
        if latitude is None or longitude is None:
            return jsonify({
                'success': False,
                'error': 'Missing required parameters: latitude and longitude'
            }), 400

        # Normalize emergency type
        if emergency_type == 'ambulance':
            emergency_type = 'hospital'

        if emergency_type not in ['fire', 'police', 'hospital']:
            return jsonify({
                'success': False,
                'error': f'Invalid emergencyType: {emergency_type}. Must be fire, police, or hospital'
            }), 400

        print(f"[INFO] Calculating distances for {emergency_type} emergency at ({latitude}, {longitude})")

        # Call GIS calculator
        result_json = calculate_driving_distance(latitude, longitude, emergency_type)

        if result_json is None:
            return jsonify({
                'success': False,
                'error': 'GIS calculation failed. Check Google Maps API key and network connection.'
            }), 500

        # Parse result
        all_stations = json.loads(result_json)

        if not all_stations:
            return jsonify({
                'success': False,
                'error': f'No {emergency_type} stations found in database'
            }), 404

        # Find nearest station (by distance)
        nearest_name = None
        nearest_distance = float('inf')
        nearest_data = None

        for station_name, station_data in all_stations.items():
            # Extract numeric distance (e.g., "3.2 km" -> 3.2)
            distance_str = station_data['distance']
            distance_km = float(distance_str.split()[0])

            if distance_km < nearest_distance:
                nearest_distance = distance_km
                nearest_name = station_name
                nearest_data = station_data

        # Load station coordinates from JSON
        with open('EmergencyCenters.json', 'r') as f:
            centers = json.load(f)

        unit_location = centers[emergency_type][nearest_name]

        print(f"[SUCCESS] Nearest: {nearest_name} - {nearest_data['distance']} ({nearest_data['duration']})")

        # Return response
        return jsonify({
            'success': True,
            'nearestUnit': nearest_name,
            'distance': nearest_data['distance'],
            'eta': nearest_data['duration'],
            'unitLocation': {
                'lat': unit_location['lat'],
                'lng': unit_location['lng']
            },
            'allStations': all_stations,
            'emergencyType': emergency_type,
            'incidentLocation': {
                'lat': latitude,
                'lng': longitude
            }
        })

    except FileNotFoundError as e:
        print(f"[ERROR] File not found: {e}")
        return jsonify({
            'success': False,
            'error': f'Configuration file missing: {str(e)}'
        }), 500

    except Exception as e:
        print(f"[ERROR] {type(e).__name__}: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/stations', methods=['GET'])
def list_stations():
    """
    List all emergency centers in the database

    Optional query parameter:
    ?type=fire (or police or hospital)
    """
    try:
        with open('EmergencyCenters.json', 'r') as f:
            centers = json.load(f)

        # Filter by type if specified
        station_type = request.args.get('type', '').lower()

        if station_type and station_type in centers:
            return jsonify({
                'type': station_type,
                'stations': centers[station_type]
            })

        return jsonify(centers)

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Detailed health check"""

    # Check if Google Maps API key is set
    api_key_status = 'configured' if os.getenv('GOOGLE_MAPS_APIKEY') else 'missing'

    # Check if emergency centers file exists
    try:
        with open('EmergencyCenters.json', 'r') as f:
            centers = json.load(f)
        centers_status = 'loaded'
        total_centers = sum(len(v) for v in centers.values())
    except:
        centers_status = 'missing'
        total_centers = 0

    return jsonify({
        'status': 'healthy',
        'google_maps_api': api_key_status,
        'emergency_centers': centers_status,
        'total_centers': total_centers,
        'python_version': os.sys.version
    })

if __name__ == '__main__':
    print("="*60)
    print("🚀 flash.ai GIS Calculator API")
    print("="*60)
    print(f"Server starting on http://0.0.0.0:5000")
    print(f"Google Maps API: {'✓ Configured' if os.getenv('GOOGLE_MAPS_APIKEY') else '✗ Missing'}")
    print("\nEndpoints:")
    print("  GET  /           - Service info")
    print("  POST /calculate  - Calculate distances")
    print("  GET  /stations   - List all stations")
    print("  GET  /health     - Health check")
    print("\nPress Ctrl+C to stop")
    print("="*60)

    app.run(host='0.0.0.0', port=5000, debug=True)
