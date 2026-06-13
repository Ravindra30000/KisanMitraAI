import asyncio
import sys
import os

# Add app to path
sys.path.append(os.path.join(os.path.dirname(__file__), "app"))

from app.services.location import reverse_geocode, forward_geocode

async def main():
    # Test coordinates
    test_coords = [
        {"name": "Mumbai", "lat": 19.0760, "lon": 72.8777},
        {"name": "Delhi", "lat": 28.6139, "lon": 77.2090},
        {"name": "Bhopal", "lat": 23.2599, "lon": 77.4126}
    ]
    
    print("Starting geocoding diagnostics...")
    for item in test_coords:
        print(f"\nTesting reverse geocode {item['name']} (lat={item['lat']}, lon={item['lon']}):")
        result = await reverse_geocode(item["lat"], item["lon"])
        print(f"Result: {result}")

    test_places = [
        {"state": "Maharashtra", "district": "Pune"},
        {"state": "Uttar Pradesh", "district": "Lucknow"},
        {"state": "Madhya Pradesh", "district": "Indore"}
    ]

    print("\nStarting forward geocoding diagnostics...")
    for item in test_places:
        print(f"\nTesting forward geocode {item['district']}, {item['state']}:")
        result = await forward_geocode(item["state"], item["district"])
        print(f"Result: {result}")

if __name__ == "__main__":
    asyncio.run(main())
