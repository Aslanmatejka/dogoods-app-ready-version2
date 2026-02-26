import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../utils/supabaseClient';
import { API_CONFIG } from '../../utils/config';

// Mapbox is loaded via CDN in index.html
// Access it from window.mapboxgl
const getMapboxgl = () => window.mapboxgl;

// Get Mapbox token from centralized config (window.__ENV__ → import.meta.env → hardcoded fallback)
const MAPBOX_TOKEN = API_CONFIG.MAPBOX.ACCESS_TOKEN;

console.log('🔑 Mapbox token set:', MAPBOX_TOKEN.substring(0, 20) + '...');

function FoodMap({ onMarkerClick, showSignupPrompt = true }) {
    const navigate = useNavigate();
    const mapContainer = useRef(null);
    const map = useRef(null);
    const markersRef = useRef([]);
    const popupRef = useRef(null);
    const mapInitialized = useRef(false); // Prevent double initialization in Strict Mode
    const [foodListings, setFoodListings] = useState([]);
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mapLoaded, setMapLoaded] = useState(false);

    useEffect(() => {
        // Prevent double initialization from React Strict Mode
        if (mapInitialized.current) return;
        
        const mapboxgl = getMapboxgl();
        if (!mapboxgl || !mapContainer.current) return;

        if (!MAPBOX_TOKEN) {
            console.error('❌ Mapbox token is missing');
            return;
        }

        mapInitialized.current = true;        try {
            console.log('🗺️ Creating Mapbox map...');
            
            // Check if Mapbox is actually available
            if (!mapboxgl) {
                console.error('❌ Mapbox GL JS not loaded from CDN');
                return;
            }
            
            // Validate token
            if (!MAPBOX_TOKEN || MAPBOX_TOKEN.length < 20) {
                console.error('❌ Invalid Mapbox token:', MAPBOX_TOKEN);
                return;
            }
            
            mapboxgl.accessToken = MAPBOX_TOKEN;
            console.log('🔑 Mapbox accessToken set globally');
            
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [-122.27, 37.82],
                zoom: 11,
                attributionControl: true,
                renderWorldCopies: false,
                preserveDrawingBuffer: false
            });
            console.log('🗺️ Map object created:', map.current);

            map.current.on('load', () => {
                console.log('✅ Map loaded successfully!');
                setMapLoaded(true);
            });

            map.current.on('error', (e) => {
                console.error('❌ Map error event:', e);
                console.error('❌ Error type:', e.error?.message || 'Unknown');
                console.error('❌ Error status:', e.error?.status || 'No status');
            });

            // Log data requests to see if Mapbox is trying to load tiles
            map.current.on('dataloading', (e) => {
                console.log('📡 Mapbox data loading:', e.dataType);
            });

            map.current.on('data', (e) => {
                console.log('📦 Mapbox data received:', e.dataType);
            });

            map.current.on('sourcedataloading', (e) => {
                console.log('🔄 Mapbox source loading:', e.sourceId);
            });

        } catch (error) {
            console.error('❌ Map creation failed with error:', error);
            console.error('❌ Error stack:', error.stack);
        }

        // Aggressive fallback - if map doesn't load in 2 seconds, force it anyway
        const loadTimeout = setTimeout(() => {
            if (!mapLoaded && map.current) {
                console.warn('⚠️ Map load timeout (2s) - forcing mapLoaded=true to show map');
                console.warn('⚠️ Check Network tab for failed Mapbox API requests');
                setMapLoaded(true);
            }
        }, 2000);

        // Add navigation controls
        if (map.current && mapboxgl) {
            map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        }

        console.log('🎯 Map initialization complete. Waiting for tiles...');
        console.log('📍 Map center:', map.current?.getCenter());
        console.log('🔍 Map zoom:', map.current?.getZoom());

        return () => {
            // Skip cleanup during React Strict Mode's double-mount behavior in development
            // The map should persist after the first mount
            console.log('🔍 Cleanup called. mapInitialized:', mapInitialized.current);
            
            // Only truly cleanup when the component is actually being destroyed
            // (not during Strict Mode's test unmount-remount cycle)
            if (import.meta.env.DEV && mapInitialized.current) {
                console.log('⏭️ Skipping cleanup in development - keeping map alive');
                return;
            }
            
            console.log('🧹 Cleanup: Removing map');
            clearTimeout(loadTimeout);
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
            mapInitialized.current = false;
        };
    }, []);

    useEffect(() => {
        // Fetch listings and communities immediately
        fetchFoodListings();
        fetchCommunities();
    }, []);

    useEffect(() => {
        // Add markers as soon as both map and data are ready
        console.log('🗺️ Map loaded:', mapLoaded, 'Listings:', foodListings.length, 'Communities:', communities.length);
        if (mapLoaded && (foodListings.length > 0 || communities.length > 0)) {
            console.log('✅ Calling addMarkers()');
            addMarkers();
        } else {
            console.log('⏳ Waiting for map or data...');
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
        if (!map.current || !map.current.getContainer()) {
            console.warn('⚠️ Map not ready yet, skipping marker addition');
            return;
        }
        
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
            // Parse and validate coordinates
            const lat = parseFloat(listing.latitude);
            const lng = parseFloat(listing.longitude);
            
            // Validate coordinates
            if (isNaN(lat) || isNaN(lng)) {
                console.error('❌ Invalid coordinates for listing', listing.title);
                return;
            }
            
            console.log('✅ Adding food marker:', listing.title);
            console.log('  Database values - lat:', listing.latitude, 'lng:', listing.longitude);
            console.log('  Parsed as numbers - lat:', lat, 'lng:', lng);
            console.log('  Mapbox format [lng, lat]:', [lng, lat]);
            
            // Create simple marker element for testing
            const el = document.createElement('div');
            el.className = 'food-marker';
            el.style.width = '24px';
            el.style.height = '24px';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = '#dc2626';
            el.style.border = '3px solid white';
            el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
            el.style.cursor = 'pointer';
            el.title = listing.title;

            el.addEventListener('click', () => {
                showPopup(listing);
            });

            try {
                const marker = new mapboxgl.Marker(el)
                    .setLngLat([lng, lat])
                    .addTo(map.current);

                markersRef.current.push(marker);
                console.log('  ✓ Marker added at coordinates:', [lng, lat]);
            } catch (error) {
                console.error('❌ Failed to add food marker for', listing.title, ':', error.message);
            }
        });

        // Add community markers
        communities.forEach((community) => {
            // Parse and validate coordinates
            const lat = parseFloat(community.latitude);
            const lng = parseFloat(community.longitude);
            
            // Validate coordinates are valid numbers and in correct ranges
            if (isNaN(lat) || isNaN(lng)) {
                console.error('❌ Invalid coordinates for', community.name, '- lat:', community.latitude, 'lng:', community.longitude);
                return;
            }
            
            // San Francisco Bay Area bounds check: lat ~37-38, lng ~-122 to -121
            if (lat < 36 || lat > 39 || lng > -121 || lng < -123) {
                console.warn('⚠️ Coordinates outside Bay Area for', community.name, '- lat:', lat, 'lng:', lng);
            }
            
            console.log('✅ Adding community marker:', community.name);
            console.log('  Database values - lat:', community.latitude, 'lng:', community.longitude);
            console.log('  Parsed as numbers - lat:', lat, 'lng:', lng);
            console.log('  Mapbox format [lng, lat]:', [lng, lat]);
            
            // Create simple marker element for testing
            const el = document.createElement('div');
            el.className = 'community-marker';
            el.style.width = '24px';
            el.style.height = '24px';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = '#3b82f6';
            el.style.border = '3px solid white';
            el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
            el.style.cursor = 'pointer';
            el.title = community.name;

            el.addEventListener('click', () => {
                showCommunityPopup(community);
            });

            try {
                const marker = new mapboxgl.Marker(el)
                    .setLngLat([lng, lat])
                    .addTo(map.current);

                markersRef.current.push(marker);
            } catch (error) {
                console.error('❌ Failed to add community marker:', error);
            }
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
            ` : `
                <button id="view-details-btn" style="
                    width: 100%;
                    background: #16A34A;
                    color: white;
                    font-weight: 500;
                    padding: 10px 16px;
                    border-radius: 8px;
                    border: none;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background 0.2s;
                " onmouseover="this.style.background='#15803D'" onmouseout="this.style.background='#16A34A'">
                    <i class="fas fa-hand-holding-heart" style="margin-right: 6px;"></i>
                    View Details & Claim
                </button>
            `}
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
        setTimeout(() => {
            if (showSignupPrompt) {
                const signupBtn = document.getElementById('signup-btn');
                const loginBtn = document.getElementById('login-btn');
                
                if (signupBtn) {
                    signupBtn.addEventListener('click', () => navigate('/signup'));
                }
                if (loginBtn) {
                    loginBtn.addEventListener('click', () => navigate('/login'));
                }
            } else {
                const viewDetailsBtn = document.getElementById('view-details-btn');
                if (viewDetailsBtn) {
                    viewDetailsBtn.addEventListener('click', () => navigate('/claim', { state: { food: listing } }));
                }
            }
        }, 0);

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

            {!loading && foodListings.length === 0 && communities.length === 0 && (
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
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                        <span className="font-medium text-gray-700">{foodListings.length} Listings</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="font-medium text-gray-700">{communities.length} Communities</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FoodMap;
