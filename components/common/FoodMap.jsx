import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../utils/supabaseClient';

// Mapbox is loaded via CDN in index.html
// Access it from window.mapboxgl
const getMapboxgl = () => window.mapboxgl;

// Set Mapbox access token directly
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2lnbndpc2UiLCJhIjoiY21rc2tjNjQ3MGFjajNkcHJ1cTNsbWV6dyJ9.xbJQFP3HCM2jmG87wvwC1Q';

console.log('🔑 Mapbox token set:', MAPBOX_TOKEN.substring(0, 20) + '...');

function FoodMap({ onMarkerClick, showSignupPrompt = true }) {
    const navigate = useNavigate();
    const mapContainer = useRef(null);
    const map = useRef(null);
    const markersRef = useRef([]);
    const popupRef = useRef(null);
    const [foodListings, setFoodListings] = useState([]);
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
        if (map.current) return;

        const mapboxgl = getMapboxgl();
        if (!mapboxgl || !mapContainer.current) return;

        if (!mapContainer.current) {
            console.error('❌ Map container ref is null');
            return;
        }

        if (!MAPBOX_TOKEN) {
            console.error('❌ Mapbox token is missing');
            return;
        }

        try {
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/streets-v12', // Modern colorful style
                center: [-122.27, 37.82], // East Bay - covers San Francisco, Oakland, and Berkeley
                zoom: 11,
                attributionControl: true,
                accessToken: MAPBOX_TOKEN,
                renderWorldCopies: false,
                preserveDrawingBuffer: false,
                fadeDuration: 0, // No fade animation - instant rendering
                refreshExpiredTiles: false // Don't refresh tiles
            });

            map.current.on('load', () => {
                setMapLoaded(true);
            });

            map.current.on('error', (e) => {
                console.error('❌ Map error:', e.error);
            });

        } catch (error) {
            console.error('❌ Map creation failed:', error);
        }

        // Add navigation controls
        if (map.current && mapboxgl) {
            map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        }

        return () => {
            if (map.current) {
                map.current.remove();
            }
        };
    }, []);

    useEffect(() => {
        // Fetch listings and communities immediately
        fetchFoodListings();
        fetchCommunities();
    }, []);

    useEffect(() => {
        // Add markers as soon as both map and data are ready
        if (mapLoaded && (foodListings.length > 0 || communities.length > 0)) {
            addMarkers();
        }
    }, [mapLoaded, foodListings, communities]);

    const fetchFoodListings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('food_listings')
                .select('*')
                .in('status', ['approved', 'active'])
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

    const fetchCommunities = async () => {
        try {
            const { data, error } = await supabase
                .from('communities')
                .select('*')
                .eq('is_active', true)
                .not('latitude', 'is', null)
                .not('longitude', 'is', null);

            if (error) {
                console.error('Communities fetch error:', error);
                throw error;
            }
            
            console.log('Fetched communities:', data);
            console.log('Number of communities with coordinates:', data?.length || 0);
            setCommunities(data || []);
        } catch (error) {
            console.error('Error fetching communities:', error);
            setCommunities([]);
        }
    };

    const addMarkers = () => {
        console.log('Adding markers for', foodListings.length, 'listings and', communities.length, 'communities');
        
        const mapboxgl = getMapboxgl();
        if (!mapboxgl || !map.current) {
            console.warn('⚠️ Mapbox not ready for markers');
            return;
        }
        
        // Remove existing markers
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // Add food listing markers
        foodListings.forEach((listing) => {
            console.log('Adding food marker for:', listing.title, 'at', listing.latitude, listing.longitude);
            
            // Create custom marker element for food
            const el = document.createElement('div');
            el.className = 'custom-marker';
            el.style.cssText = 'pointer-events: auto; cursor: pointer; width: 40px; height: 50px; position: relative; z-index: 100;';
            el.innerHTML = `
                <div style="
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                    transition: transform 0.2s;
                    pointer-events: none;
                ">
                    <div style="position: relative; pointer-events: none;">
                        <div style="
                            position: absolute;
                            inset: -4px;
                            background: rgba(239, 68, 68, 0.4);
                            border-radius: 50% 50% 50% 0;
                            transform: rotate(-45deg);
                            filter: blur(4px);
                            pointer-events: none;
                        "></div>
                        <div style="
                            position: relative;
                            background: rgb(220, 38, 38);
                            width: 32px;
                            height: 32px;
                            border-radius: 50% 50% 50% 0;
                            transform: rotate(-45deg);
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            pointer-events: none;
                        ">
                            <i class="fas fa-apple-alt" style="color: white; font-size: 14px; transform: rotate(45deg); pointer-events: none;"></i>
                        </div>
                        <div style="
                            position: absolute;
                            bottom: -8px;
                            left: 50%;
                            transform: translateX(-50%);
                            width: 0;
                            height: 0;
                            border-left: 4px solid transparent;
                            border-right: 4px solid transparent;
                            border-top: 8px solid rgb(220, 38, 38);
                            pointer-events: none;
                        "></div>
                    </div>
                </div>
            `;

            el.addEventListener('click', () => {
                showPopup(listing);
            });

            const marker = new mapboxgl.Marker({
                element: el,
                anchor: 'bottom'
            })
                .setLngLat([listing.longitude, listing.latitude])
                .addTo(map.current);

            markersRef.current.push(marker);
        });

        // Add community markers
        communities.forEach((community) => {
            console.log('Adding community marker for:', community.name, 'at', community.latitude, community.longitude);
            
            // Create custom marker element for community
            const el = document.createElement('div');
            el.className = 'custom-marker community-marker';
            el.style.cssText = 'pointer-events: auto; cursor: pointer; width: 40px; height: 50px; position: relative; z-index: 90;';
            el.innerHTML = `
                <div style="
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: flex-end;
                    justify-content: center;
                    transition: transform 0.2s;
                    pointer-events: none;
                ">
                    <div style="position: relative; pointer-events: none;">
                        <div style="
                            position: absolute;
                            inset: -4px;
                            background: rgba(44, 171, 227, 0.4);
                            border-radius: 50% 50% 50% 0;
                            transform: rotate(-45deg);
                            filter: blur(4px);
                            pointer-events: none;
                        "></div>
                        <div style="
                            position: relative;
                            background: #2CABE3;
                            width: 32px;
                            height: 32px;
                            border-radius: 50% 50% 50% 0;
                            transform: rotate(-45deg);
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            pointer-events: none;
                        ">
                            <i class="fas fa-school" style="color: white; font-size: 14px; transform: rotate(45deg); pointer-events: none;"></i>
                        </div>
                        <div style="
                            position: absolute;
                            bottom: -8px;
                            left: 50%;
                            transform: translateX(-50%);
                            width: 0;
                            height: 0;
                            border-left: 4px solid transparent;
                            border-right: 4px solid transparent;
                            border-top: 8px solid #2CABE3;
                            pointer-events: none;
                        "></div>
                    </div>
                </div>
            `;

            el.addEventListener('click', () => {
                showCommunityPopup(community);
            });

            const marker = new mapboxgl.Marker({
                element: el,
                anchor: 'bottom'
            })
                .setLngLat([community.longitude, community.latitude])
                .addTo(map.current);

            markersRef.current.push(marker);
        });
    };

    const showPopup = (listing) => {
        const mapboxgl = getMapboxgl();
        if (!mapboxgl || !map.current) {
            console.warn('⚠️ Mapbox not ready for popup');
            return;
        }
        
        // Remove existing popup if clicking on a different listing
        if (popupRef.current) {
            popupRef.current.remove();
        }

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
            <p style="font-size: 14px; color: #4B5563; margin-bottom: 12px; line-height: 1.5;">
                ${listing.description || 'No description available'}
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
            closeOnClick: false,
            maxWidth: '320px',
            offset: 25
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

    const showCommunityPopup = (community) => {
        const mapboxgl = getMapboxgl();
        if (!mapboxgl || !map.current) {
            console.warn('⚠️ Mapbox not ready for popup');
            return;
        }
        
        // Remove existing popup if clicking on a different community
        if (popupRef.current) {
            popupRef.current.remove();
        }

        const popupContent = document.createElement('div');
        popupContent.className = 'p-3 max-w-xs';
        popupContent.style.width = '300px';

        popupContent.innerHTML = `
            ${community.image ? `
                <img 
                    src="${community.image}" 
                    alt="${community.name}"
                    style="width: 100%; height: 128px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;"
                />
            ` : ''}
            <h3 style="font-weight: bold; font-size: 18px; color: #111827; margin-bottom: 8px;">
                ${community.name}
            </h3>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; font-size: 14px; color: #374151;">
                <div style="display: flex; align-items: start; gap: 8px;">
                    <i class="fas fa-map-marker-alt" style="color: #2CABE3; margin-top: 2px;"></i>
                    <span>${community.location}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-clock" style="color: #2CABE3;"></i>
                    <span>${community.hours}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-phone" style="color: #2CABE3;"></i>
                    <span>${community.phone}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-user" style="color: #2CABE3;"></i>
                    <span>${community.contact}</span>
                </div>
            </div>
            
            <button id="view-community-btn" style="
                width: 100%;
                background: #2CABE3;
                color: white;
                font-weight: 500;
                padding: 8px 16px;
                border-radius: 8px;
                border: none;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s;
            " onmouseover="this.style.background='#2398c7'" onmouseout="this.style.background='#2CABE3'">
                View Community
            </button>
        `;

        popupRef.current = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
            maxWidth: '320px',
            offset: 25
        })
            .setLngLat([community.longitude, community.latitude])
            .setDOMContent(popupContent)
            .addTo(map.current);

        // Add event listener for view community button
        setTimeout(() => {
            const viewBtn = document.getElementById('view-community-btn');
            if (viewBtn) {
                viewBtn.addEventListener('click', () => navigate(`/community/${community.id}`));
            }
        }, 0);
    };

    return (
        <div className="relative w-full" style={{ height: '600px', backgroundColor: '#f0f0f0' }}>
            {/* Static map-like background - shows instantly */}
            <div 
                className="absolute inset-0" 
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(220, 220, 220, 0.5) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(220, 220, 220, 0.5) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px',
                    backgroundColor: '#e8e8e8',
                    opacity: mapLoaded ? 0 : 1,
                    transition: 'opacity 0.3s ease-out'
                }}
            >
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                        <i className="fas fa-map-marked-alt text-5xl mb-3"></i>
                        <p className="font-medium">Loading San Francisco Map...</p>
                    </div>
                </div>
            </div>
            
            <div 
                ref={mapContainer} 
                className="absolute inset-0" 
                style={{ 
                    width: '100%', 
                    height: '100%',
                    opacity: mapLoaded ? 1 : 0,
                    transition: 'opacity 0.3s ease-in'
                }} 
            />

            {loading && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg px-4 py-2 z-10">
                    <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2CABE3]"></div>
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
