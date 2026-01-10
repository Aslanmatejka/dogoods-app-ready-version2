import React, { useState, useEffect } from 'react';
import FoodList from '../components/food/FoodList';
import { FilterPanel } from '../components/food/FilterPanel';
import { useGeoLocation } from '../utils/hooks/useLocation';
import MainLayout from '../components/layout/MainLayout';
import Button from '../components/common/Button';
import dataService from '../utils/dataService';

function NearMePage() {
    const [filters, setFilters] = useState({
        radius: 10,
        foodType: '',
        dietaryPreferences: [],
        pickupTime: ''
    });

    const { 
        location, 
        loading: locationLoading, 
        error: locationError,
        enableLocation 
    } = useGeoLocation();

    const [nearbyListings, setNearbyListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (location) {
            fetchNearbyListings();
        }
    }, [location, filters]);

    const fetchNearbyListings = async () => {
        setLoading(true);
        try {
            // Fetch all approved listings
            const allListings = await dataService.getFoodListings({ status: 'approved' });
            
            // Filter by distance if location is available
            if (location && location.latitude && location.longitude) {
                const filtered = allListings.filter(listing => {
                    if (!listing.latitude || !listing.longitude) return false;
                    
                    // Calculate distance using Haversine formula
                    const R = 6371; // Earth's radius in km
                    const dLat = (listing.latitude - location.latitude) * Math.PI / 180;
                    const dLon = (listing.longitude - location.longitude) * Math.PI / 180;
                    const a = 
                        Math.sin(dLat/2) * Math.sin(dLat/2) +
                        Math.cos(location.latitude * Math.PI / 180) * 
                        Math.cos(listing.latitude * Math.PI / 180) *
                        Math.sin(dLon/2) * Math.sin(dLon/2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    const distance = R * c;
                    
                    // Convert radius from miles to km (1 mile = 1.60934 km)
                    const radiusKm = filters.radius * 1.60934;
                    return distance <= radiusKm;
                });
                
                // Apply additional filters
                let result = filtered;
                
                if (filters.foodType) {
                    result = result.filter(listing => listing.category === filters.foodType);
                }
                
                if (filters.dietaryPreferences && filters.dietaryPreferences.length > 0) {
                    result = result.filter(listing => {
                        if (!listing.dietary_tags) return false;
                        return filters.dietaryPreferences.some(pref => 
                            listing.dietary_tags.includes(pref.toLowerCase())
                        );
                    });
                }
                
                setNearbyListings(result);
            } else {
                setNearbyListings(allListings);
            }
        } catch (error) {
            console.error('Error fetching nearby listings:', error);
            setNearbyListings([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-4">Food Near Me</h1>
                    {!location && !locationLoading && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                            <h2 className="text-lg font-semibold mb-2">Enable Location Services</h2>
                            <p className="text-gray-600 mb-4">
                                Allow ShareFoods to access your location to see available food listings near you.
                            </p>
                            <Button
                                onClick={enableLocation}
                                className="bg-green-500 hover:bg-green-600 text-white"
                            >
                                Enable Location
                            </Button>
                        </div>
                    )}
                    
                    {locationError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <p className="text-red-600">
                                {locationError}. Please enable location services in your browser settings.
                            </p>
                        </div>
                    )}
                </div>

                {location && (
                    <>
                        <FilterPanel
                            onFilterChange={handleFilterChange}
                            initialRadius={filters.radius}
                        />
                        <div className="mt-6">
                            <FoodList
                                foods={nearbyListings}
                                loading={loading}
                                showDistance={true}
                            />
                        </div>
                    </>
                )}
            </div>
        </MainLayout>
    );
}

export default NearMePage;
