"""
Test script for GIS Calculator API

This script tests the Flask API endpoints to ensure they work correctly
before connecting to n8n.

Run this AFTER starting gis_api.py:
1. python gis_api.py (in one terminal)
2. python test_gis_api.py (in another terminal)
"""

import requests
import json

# API base URL (change if using ngrok)
BASE_URL = "http://localhost:5000"

def test_health_check():
    """Test the health check endpoint"""
    print("\n" + "="*60)
    print("TEST 1: Health Check")
    print("="*60)

    response = requests.get(f"{BASE_URL}/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

    assert response.status_code == 200, "Health check failed"
    assert response.json()['status'] == 'healthy', "API not healthy"
    print("✓ Health check passed")

def test_home():
    """Test the home endpoint"""
    print("\n" + "="*60)
    print("TEST 2: Home Endpoint")
    print("="*60)

    response = requests.get(f"{BASE_URL}/")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

    assert response.status_code == 200, "Home endpoint failed"
    print("✓ Home endpoint passed")

def test_list_stations():
    """Test listing all stations"""
    print("\n" + "="*60)
    print("TEST 3: List All Stations")
    print("="*60)

    response = requests.get(f"{BASE_URL}/stations")
    print(f"Status Code: {response.status_code}")

    data = response.json()
    print(f"Found {len(data.get('fire', {}))} fire stations")
    print(f"Found {len(data.get('police', {}))} police stations")
    print(f"Found {len(data.get('hospital', {}))} hospitals")

    assert response.status_code == 200, "List stations failed"
    print("✓ List stations passed")

def test_calculate_fire():
    """Test fire emergency calculation"""
    print("\n" + "="*60)
    print("TEST 4: Calculate Fire Emergency")
    print("="*60)

    payload = {
        "latitude": 25.2048,
        "longitude": 55.2708,
        "emergencyType": "fire"
    }

    print(f"Request Payload: {json.dumps(payload, indent=2)}")

    response = requests.post(
        f"{BASE_URL}/calculate",
        json=payload,
        headers={"Content-Type": "application/json"}
    )

    print(f"\nStatus Code: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(f"\n✓ Success Response:")
        print(f"  Nearest Unit: {data.get('nearestUnit')}")
        print(f"  Distance: {data.get('distance')}")
        print(f"  ETA: {data.get('eta')}")
        print(f"  Location: {data.get('unitLocation')}")
        print(f"  Total Stations: {len(data.get('allStations', {}))}")

        assert data.get('success') == True, "API returned success=false"
        assert data.get('nearestUnit'), "No nearest unit found"
        assert data.get('distance'), "No distance calculated"
        assert data.get('eta'), "No ETA calculated"
        print("\n✓ Fire emergency test passed")
    else:
        print(f"❌ Error Response: {response.text}")
        raise AssertionError("Fire emergency calculation failed")

def test_calculate_police():
    """Test police emergency calculation"""
    print("\n" + "="*60)
    print("TEST 5: Calculate Police Emergency")
    print("="*60)

    payload = {
        "latitude": 25.2656,
        "longitude": 55.3125,
        "emergencyType": "police"
    }

    print(f"Request Payload: {json.dumps(payload, indent=2)}")

    response = requests.post(
        f"{BASE_URL}/calculate",
        json=payload,
        headers={"Content-Type": "application/json"}
    )

    print(f"\nStatus Code: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(f"\n✓ Success Response:")
        print(f"  Nearest Unit: {data.get('nearestUnit')}")
        print(f"  Distance: {data.get('distance')}")
        print(f"  ETA: {data.get('eta')}")
        print("\n✓ Police emergency test passed")
    else:
        print(f"❌ Error Response: {response.text}")
        raise AssertionError("Police emergency calculation failed")

def test_calculate_hospital():
    """Test hospital/ambulance emergency calculation"""
    print("\n" + "="*60)
    print("TEST 6: Calculate Hospital Emergency")
    print("="*60)

    payload = {
        "latitude": 25.2378,
        "longitude": 55.3275,
        "emergencyType": "hospital"
    }

    print(f"Request Payload: {json.dumps(payload, indent=2)}")

    response = requests.post(
        f"{BASE_URL}/calculate",
        json=payload,
        headers={"Content-Type": "application/json"}
    )

    print(f"\nStatus Code: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(f"\n✓ Success Response:")
        print(f"  Nearest Unit: {data.get('nearestUnit')}")
        print(f"  Distance: {data.get('distance')}")
        print(f"  ETA: {data.get('eta')}")
        print("\n✓ Hospital emergency test passed")
    else:
        print(f"❌ Error Response: {response.text}")
        raise AssertionError("Hospital emergency calculation failed")

def test_error_handling():
    """Test error handling with invalid input"""
    print("\n" + "="*60)
    print("TEST 7: Error Handling")
    print("="*60)

    # Test missing latitude
    payload = {
        "longitude": 55.2708,
        "emergencyType": "fire"
    }

    response = requests.post(
        f"{BASE_URL}/calculate",
        json=payload,
        headers={"Content-Type": "application/json"}
    )

    print(f"Missing latitude - Status Code: {response.status_code}")
    assert response.status_code == 400, "Should return 400 for missing latitude"
    print("✓ Error handling test passed")

def main():
    """Run all tests"""
    print("\n" + "█"*60)
    print("█" + " "*58 + "█")
    print("█" + "  GIS Calculator API Test Suite".center(58) + "█")
    print("█" + " "*58 + "█")
    print("█"*60)

    try:
        # Run tests
        test_health_check()
        test_home()
        test_list_stations()
        test_calculate_fire()
        test_calculate_police()
        test_calculate_hospital()
        test_error_handling()

        # Summary
        print("\n" + "="*60)
        print("🎉 ALL TESTS PASSED")
        print("="*60)
        print("\nThe API is ready to be connected to n8n!")
        print("\nNext steps:")
        print("1. Keep gis_api.py running")
        print("2. Run: ngrok http 5000")
        print("3. Copy the ngrok HTTPS URL")
        print("4. Update n8n workflow with the URL")

    except AssertionError as e:
        print("\n" + "="*60)
        print(f"❌ TEST FAILED: {e}")
        print("="*60)
        print("\nPlease check:")
        print("1. Is gis_api.py running? (python gis_api.py)")
        print("2. Is the .env file configured with Google Maps API key?")
        print("3. Does EmergencyCenters.json exist?")
        return False

    except requests.exceptions.ConnectionError:
        print("\n" + "="*60)
        print("❌ CONNECTION ERROR")
        print("="*60)
        print("\nCannot connect to the API server.")
        print("Please start the server first:")
        print("  python gis_api.py")
        return False

    except Exception as e:
        print("\n" + "="*60)
        print(f"❌ UNEXPECTED ERROR: {type(e).__name__}")
        print("="*60)
        print(f"Details: {str(e)}")
        return False

    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
