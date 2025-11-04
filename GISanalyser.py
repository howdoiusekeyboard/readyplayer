import json

import googlemaps
import os
from dotenv import load_dotenv

load_dotenv()

def calculate_driving_distance( origin_lat, origin_lng, requestType = "police"):
    """
    Calculates the driving distance between two points using Google Maps Distance Matrix API.

    Args:
        api_key (str): Your Google Maps Platform API key.
        origin_lat (float): Latitude of the origin point.
        origin_lng (float): Longitude of the origin point.
        destination_lat (float): Latitude of the destination point.
        destination_lng (float): Longitude of the destination point.

    Returns:
        dict: A dictionary containing distance and duration information,
              or None if the request fails.
    """
    gmaps = googlemaps.Client(key=os.getenv("GOOGLE_MAPS_APIKEY"))

    # Format the coordinates for the API request
    origins = f"{origin_lat},{origin_lng}"

    with open('EmergencyCenters.json', 'r') as file:
        obj = json.load(file)

    # Get station names directly from JSON (single source of truth)
    lst = list(obj[requestType].keys())

    ans = {}
    for i in lst:
        destinations = f"{obj[requestType][i]['lat']},{obj[requestType][i]['lng']}"
        try:
            # Request distance matrix
            matrix_result = gmaps.distance_matrix(
                origins=origins,
                destinations=destinations,
                mode="driving"
            )

            # Process the result
            if matrix_result['status'] == 'OK' and matrix_result['rows']:
                # The Distance Matrix API returns a matrix.
                # For two points, we expect one row and one element in that row.
                element = matrix_result['rows'][0]['elements'][0]

                if element['status'] == 'OK':
                    distance = element['distance']['text']
                    duration = element['duration']['text']
                    ans[i] = {
                                "distance": distance,
                                "duration": duration
                            }
                else:
                    print(f"Error calculating distance for element: {element['status']}")
                    return None
            else:
                print(f"Error in Distance Matrix request: {matrix_result['status']}")
                return None

        except googlemaps.exceptions.ApiError as e:
            print(f"Google Maps API Error: {e}")
            return None
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            return None
    ans_output = json.dumps(ans, indent=4)
    return ans_output


if __name__ == "__main__":
    # --- IMPORTANT ---
    # Replace 'YOUR_API_KEY' with your actual Google Maps Platform API Key.
    # Make sure the Distance Matrix API is enabled in your Google Cloud project.
    # It's recommended to store API keys securely, e.g., using environment variables.
    # For this example, we'll put it directly here, but be cautious in production.
    # api_key = os.environ.get("GOOGLE_MAPS_API_KEY") # Recommended way

    origin_lat = 25.130839852559077
    origin_lng = 55.41718289605346

    print(f"Calculating driving distance from ({origin_lat}, {origin_lng}) to ...")
    distance_info = calculate_driving_distance(
        origin_lat, origin_lng, 'fire'
    )

    if distance_info:
        print("\n--- Distance Matrix Result ---")
        print(distance_info)
    else:
        print("Failed to retrieve distance information.")
