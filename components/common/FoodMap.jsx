import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useNavigate } from 'react-router-dom';
import supabase from '../../utils/supabaseClient';
import { getApiConfig } from '../../utils/config';

const MAPBOX_TOKEN = getApiConfig().MAPBOX?.ACCESS_TOKEN || 'pk.eyJ1Ijoic2lnbndpc2UiLCJhIjoiY21rc2tjNjQ3MGFjajNkcHJ1cTNsbWV6dyJ9.xbJQFP3HCM2jmG87wvwC1Q';

mapboxgl.accessToken = MAPBOX_TOKEN;

function FoodMap({ onMarkerClick, showSignupPrompt = true }) {
    const navigate = useNavigate();
    const mapContainer = useRef(null);
    const map = useRef(null);
    const markersRef = useRef([]);
    const popupRef = useRef(null);
    const [foodListings, setFoodListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
        if (map.current) return; // Initialize map only once

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [-98.5795, 39.8283], // Center of USA
            zoom: 4
        });

        map.current.on('load', () => {
            setMapLoaded(true);
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Try to get user's location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    map.current.flyTo({
                        center: [position.coords.longitude, position.coords.latitude],
                        zoom: 11,
                        essential: true
                    });
                },
                (error) => {
                    console.log('Location access denied or unavailable');
                }
            );
        }

        return () => {
            if (map.current) {
                map.current.remove();
            }
        };
    }, []);

    useEffect(() => {
        fetchFoodListings();
    }, []);

    useEffect(() => {
        if (mapLoaded && foodListings.length > 0) {
            addMarkers();
        }
    }, [mapLoaded, foodListings]);

    const fetchFoodListings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('food_listings')
                .select('*')
                .in('status', ['available', 'approved', 'pending'])
                .not('latitude', 'is', null)
                .not('longitude', 'is', null)
                .limit(100);

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }
            
            console.log('Fetched food listings:', data);
            console.log('Number of listings with coordinates:', data?.length || 0);
            setFoodListings(data || []);
        } catch (error) {
            console.error('Error fetching food listings:', error);
            setFoodListings([]);
        } finally {
            setLoading(false);
        }
    };

    const addMarkers = () => {
        console.log('Adding markers for', foodListings.length, 'listings');
        
        // Remove existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Add new markers
        foodListings.forEach((listing) => {
            console.log('Adding marker for:', listing.title, 'at', listing.latitude, listing.longitude);
            
            // Create custom marker element
            const el = document.createElement('div');
            el.className = 'custom-marker';
            el.innerHTML = `
                <div style="
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: transform 0.2s;
                ">
                    <div style="position: relative;">
                        <div style="
                            position: absolute;
                            inset: -4px;
                            background: rgba(34, 197, 94, 0.4);
                            border-radius: 50%;
                            filter: blur(4px);
                        "></div>
                        <div style="
                            position: relative;
                            background: rgb(22, 163, 74);
                            border-radius: 50%;
                            padding: 8px;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
                        ">
                            <i class="fas fa-utensils" style="color: white; font-size: 16px;"></i>
                        </div>
                    </div>
                </div>
            `;

            el.addEventListener('mouseenter', () => {
                el.style.transform = 'scale(1.1)';
            });

            el.addEventListener('mouseleave', () => {
                el.style.transform = 'scale(1)';
            });

            el.addEventListener('click', () => {
                showPopup(listing);
            });

            const marker = new mapboxgl.Marker(el)
                .setLngLat([listing.longitude, listing.latitude])
                .addTo(map.current);

            markersRef.current.push(marker);
        });
    };

    const showPopup = (listing) => {
        // Remove existing popup
        if (popupRef.current) {
            popupRef.current.remove();
        }

        // Center map on marker
        map.current.flyTo({
            center: [listing.longitude, listing.latitude],
            zoom: 13,
            essential: true
        });

        const popupContent = document.createElement('div');
        popupContent.className = 'p-3 max-w-xs';
        popupContent.style.width = '300px';

        popupContent.innerHTML = `
            ${listing.image_url ? `
                <img 
                    src="${listing.image_url}" 
                    alt="${listing.title}"
                    style="width: 100%; height: 128px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;"
                />
            ` : ''}
            <h3 style="font-weight: bold; font-size: 18px; color: #111827; margin-bottom: 8px;">
                ${listing.title}
            </h3>
            <p style="font-size: 14px; color: #4B5563; margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                ${listing.description || ''}
            </p>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 14px; color: #374151;">
                <i class="fas fa-weight" style="color: #16A34A;"></i>
                <span>${listing.quantity} ${listing.unit}</span>
            </div>
            
            ${showSignupPrompt ? `
                <div style="background: #DBEAFE; border: 1px solid #93C5FD; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                    <p style="font-size: 14px; color: #1E40AF; font-weight: 500; margin-bottom: 8px;">
                        <i class="fas fa-info-circle" style="margin-right: 4px;"></i>
                        Sign up to claim this food!
                    </p>
                    <p style="font-size: 12px; color: #1E3A8A;">
                        Create a free account to connect with donors and help reduce food waste.
                    </p>
                </div>

                <div style="display: flex; gap: 8px;">
                    <button id="signup-btn" style="
                        flex: 1;
                        background: #16A34A;
                        color: white;
                        font-weight: 500;
                        padding: 8px 16px;
                        border-radius: 8px;
                        border: none;
                        cursor: pointer;
                        font-size: 14px;
                        transition: background 0.2s;
                    " onmouseover="this.style.background='#15803D'" onmouseout="this.style.background='#16A34A'">
                        Sign Up Free
                    </button>
                    <button id="login-btn" style="
                        flex: 1;
                        background: #F3F4F6;
                        color: #374151;
                        font-weight: 500;
                        padding: 8px 16px;
                        border-radius: 8px;
                        border: none;
                        cursor: pointer;
                        font-size: 14px;
                        transition: background 0.2s;
                    " onmouseover="this.style.background='#E5E7EB'" onmouseout="this.style.background='#F3F4F6'">
                        Log In
                    </button>
                </div>
            ` : ''}
        `;

        popupRef.current = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: true,
            maxWidth: '320px'
        })
            .setLngLat([listing.longitude, listing.latitude])
            .setDOMContent(popupContent)
            .addTo(map.current);

        // Add event listeners after popup is added to DOM
        if (showSignupPrompt) {
            setTimeout(() => {
                const signupBtn = document.getElementById('signup-btn');
                const loginBtn = document.getElementById('login-btn');
                
                if (signupBtn) {
                    signupBtn.addEventListener('click', () => navigate('/signup'));
                }
                if (loginBtn) {
                    loginBtn.addEventListener('click', () => navigate('/login'));
                }
            }, 0);
        }

        if (onMarkerClick) {
            onMarkerClick(listing);
        }
    };

    return (
        <div className="relative w-full h-full">
            <div ref={mapContainer} className="w-full h-full" />

            {loading && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg px-4 py-2 z-10">
                    <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        <span className="text-sm text-gray-600">Loading food locations...</span>
                    </div>
                </div>
            )}

            {!loading && foodListings.length === 0 && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg px-6 py-4 z-10 text-center max-w-md">
                    <div className="text-gray-600">
                        <i className="fas fa-map-marker-alt text-4xl text-gray-400 mb-3"></i>
                        <h3 className="font-bold text-lg mb-2">No Food Listings Available</h3>
                        <p className="text-sm">
                            There are currently no food listings with location data. 
                            Be the first to share food and help your community!
                        </p>
                    </div>
                </div>
            )}

            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-4 py-2 z-10">
                <div className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <span className="font-medium text-gray-700">{foodListings.length} Available Listings</span>
                </div>
            </div>
        </div>
    );
}

export default FoodMap;
