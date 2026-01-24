import React, { useState, useEffect, useRef } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useNavigate } from 'react-router-dom';
import supabase from '../../utils/supabaseClient';
import { getApiConfig } from '../../utils/config';

const MAPBOX_TOKEN = getApiConfig().MAPBOX?.ACCESS_TOKEN || 'pk.eyJ1Ijoic2lnbndpc2UiLCJhIjoiY21rc2tjNjQ3MGFjajNkcHJ1cTNsbWV6dyJ9.xbJQFP3HCM2jmG87wvwC1Q';

function FoodMap({ onMarkerClick, showSignupPrompt = true }) {
    const navigate = useNavigate();
    const [viewState, setViewState] = useState({
        longitude: -98.5795, // Center of USA
        latitude: 39.8283,
        zoom: 4
    });
    const [foodListings, setFoodListings] = useState([]);
    const [selectedListing, setSelectedListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const mapRef = useRef();

    useEffect(() => {
        fetchFoodListings();
        getUserLocation();
    }, []);

    const getUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setViewState({
                        longitude: position.coords.longitude,
                        latitude: position.coords.latitude,
                        zoom: 11
                    });
                },
                (error) => {
                    console.log('Location access denied or unavailable, using default location');
                }
            );
        }
    };

    const fetchFoodListings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('food_listings')
                .select('*')
                .eq('status', 'available')
                .not('latitude', 'is', null)
                .not('longitude', 'is', null)
                .limit(100);

            if (error) throw error;
            setFoodListings(data || []);
        } catch (error) {
            console.error('Error fetching food listings:', error);
            setFoodListings([]);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkerClick = (listing) => {
        setSelectedListing(listing);
        
        // Center map on selected marker
        setViewState({
            ...viewState,
            longitude: listing.longitude,
            latitude: listing.latitude,
            zoom: 13
        });

        if (onMarkerClick) {
            onMarkerClick(listing);
        }
    };

    const handleSignupClick = () => {
        navigate('/signup');
    };

    const handleLoginClick = () => {
        navigate('/login');
    };

    return (
        <div className="relative w-full h-full">
            <Map
                ref={mapRef}
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/streets-v12"
                mapboxAccessToken={MAPBOX_TOKEN}
            >
                {foodListings.map((listing) => (
                    <Marker
                        key={listing.id}
                        longitude={listing.longitude}
                        latitude={listing.latitude}
                        anchor="bottom"
                    >
                        <div 
                            className="cursor-pointer transform hover:scale-110 transition-transform"
                            style={{
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onClick={() => handleMarkerClick(listing)}
                        >
                            <div className="relative">
                                <div className="absolute -inset-1 bg-green-400 rounded-full opacity-75 blur-sm"></div>
                                <div className="relative bg-green-600 rounded-full p-2 shadow-lg">
                                    <i className="fas fa-utensils text-white text-lg"></i>
                                </div>
                            </div>
                        </div>
                    </Marker>
                ))}

                {selectedListing && showSignupPrompt && (
                    <Popup
                        longitude={selectedListing.longitude}
                        latitude={selectedListing.latitude}
                        anchor="top"
                        onClose={() => setSelectedListing(null)}
                        closeOnClick={false}
                        maxWidth="320px"
                    >
                        <div className="p-3 max-w-xs">
                            {selectedListing.image_url && (
                                <img 
                                    src={selectedListing.image_url} 
                                    alt={selectedListing.title}
                                    className="w-full h-32 object-cover rounded-lg mb-3"
                                />
                            )}
                            <h3 className="font-bold text-lg text-gray-900 mb-2">
                                {selectedListing.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {selectedListing.description}
                            </p>
                            <div className="flex items-center gap-2 mb-3 text-sm text-gray-700">
                                <i className="fas fa-weight text-green-600"></i>
                                <span>{selectedListing.quantity} {selectedListing.unit}</span>
                            </div>
                            
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                                <p className="text-sm text-blue-800 font-medium mb-2">
                                    <i className="fas fa-info-circle mr-1"></i>
                                    Sign up to claim this food!
                                </p>
                                <p className="text-xs text-blue-700">
                                    Create a free account to connect with donors and help reduce food waste.
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleSignupClick}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                                >
                                    Sign Up Free
                                </button>
                                <button
                                    onClick={handleLoginClick}
                                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
                                >
                                    Log In
                                </button>
                            </div>
                        </div>
                    </Popup>
                )}
            </Map>

            {loading && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg px-4 py-2">
                    <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        <span className="text-sm text-gray-600">Loading food locations...</span>
                    </div>
                </div>
            )}

            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-4 py-2">
                <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <span className="font-medium text-gray-700">{foodListings.length} Available Listings</span>
                </div>
            </div>
        </div>
    );
}

export default FoodMap;
