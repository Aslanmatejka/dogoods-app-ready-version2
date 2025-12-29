import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import SafetyService from '../../utils/safetyService';

/**
 * SafetyGuidelines Component
 * Displays safety tips and best practices for food exchanges
 */
function SafetyGuidelines({ category = null, compact = false }) {
  const [guidelines, setGuidelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(category);

  const categories = [
    { value: null, label: 'All Tips', icon: 'fa-list' },
    { value: 'meeting', label: 'Meeting Safety', icon: 'fa-users' },
    { value: 'pickup', label: 'Pickup Tips', icon: 'fa-box' },
    { value: 'food_handling', label: 'Food Handling', icon: 'fa-utensils' },
    { value: 'general', label: 'General', icon: 'fa-info-circle' }
  ];

  useEffect(() => {
    loadGuidelines();
  }, [selectedCategory]);

  const loadGuidelines = async () => {
    setLoading(true);
    try {
      const data = await SafetyService.getSafetyGuidelines(selectedCategory);
      setGuidelines(data);
    } catch (error) {
      console.error('Failed to load safety guidelines:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedGuidelines = guidelines.reduce((acc, guideline) => {
    if (!acc[guideline.category]) {
      acc[guideline.category] = [];
    }
    acc[guideline.category].push(guideline);
    return acc;
  }, {});

  if (compact) {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <div className="flex items-start">
          <i className="fas fa-shield-alt text-blue-600 text-xl mr-3 mt-0.5"></i>
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Safety Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {guidelines.slice(0, 3).map((guideline) => (
                <li key={guideline.id}>• {guideline.title}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-4 rounded-t-lg">
        <h2 className="text-2xl font-bold flex items-center">
          <i className="fas fa-shield-alt mr-3"></i>
          Safety Guidelines
        </h2>
        <p className="text-green-100 text-sm mt-1">
          Follow these tips for safe food exchanges
        </p>
      </div>

      {/* Category Tabs */}
      {!category && (
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                selectedCategory === cat.value
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className={`fas ${cat.icon} mr-2`}></i>
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Guidelines Content */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-3 text-gray-600 text-sm">Loading safety tips...</p>
          </div>
        ) : selectedCategory ? (
          // Single category view
          <div className="space-y-4">
            {guidelines.map((guideline) => (
              <GuidelineCard key={guideline.id} guideline={guideline} />
            ))}
          </div>
        ) : (
          // All categories view
          <div className="space-y-6">
            {Object.entries(groupedGuidelines).map(([cat, items]) => (
              <div key={cat}>
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  {getCategoryIcon(cat)}
                  <span className="ml-2">{getCategoryLabel(cat)}</span>
                </h3>
                <div className="space-y-3">
                  {items.map((guideline) => (
                    <GuidelineCard key={guideline.id} guideline={guideline} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && guidelines.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <i className="fas fa-info-circle text-4xl mb-3"></i>
            <p>No safety guidelines available</p>
          </div>
        )}
      </div>

      {/* Emergency Contact */}
      <div className="bg-red-50 border-t border-red-200 px-6 py-4">
        <div className="flex items-start">
          <i className="fas fa-exclamation-triangle text-red-600 text-xl mr-3 mt-0.5"></i>
          <div>
            <h4 className="font-semibold text-red-900">Emergency</h4>
            <p className="text-sm text-red-800 mt-1">
              If you feel unsafe or threatened, call 911 immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * GuidelineCard Component
 * Individual guideline card
 */
function GuidelineCard({ guideline }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-green-300 transition-colors">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <i className={`fas ${guideline.icon || 'fa-check'} text-green-600`}></i>
        </div>
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900 mb-1">{guideline.title}</h4>
        <p className="text-sm text-gray-600">{guideline.description}</p>
      </div>
    </div>
  );
}

// Helper functions
function getCategoryIcon(category) {
  const icons = {
    meeting: 'fa-users',
    pickup: 'fa-box',
    food_handling: 'fa-utensils',
    general: 'fa-info-circle'
  };
  return <i className={`fas ${icons[category] || 'fa-check'} text-green-600`}></i>;
}

function getCategoryLabel(category) {
  const labels = {
    meeting: 'Meeting Safety',
    pickup: 'Pickup Tips',
    food_handling: 'Food Handling',
    general: 'General Safety'
  };
  return labels[category] || category;
}

SafetyGuidelines.propTypes = {
  category: PropTypes.string,
  compact: PropTypes.bool
};

GuidelineCard.propTypes = {
  guideline: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    icon: PropTypes.string,
    category: PropTypes.string
  }).isRequired
};

/**
 * SafeMeetingLocations Component
 * Display verified safe meeting locations nearby
 */
export function SafeMeetingLocations({ city, state }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocations();
  }, [city, state]);

  const loadLocations = async () => {
    setLoading(true);
    try {
      const data = await SafetyService.getSafeMeetingLocations(city, state);
      setLocations(data);
    } catch (error) {
      console.error('Failed to load safe locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLocationIcon = (type) => {
    const icons = {
      police_station: 'fa-shield-alt',
      library: 'fa-book',
      school: 'fa-school',
      community_center: 'fa-building'
    };
    return icons[type] || 'fa-map-marker-alt';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <i className="fas fa-map-marked-alt text-green-600 mr-2"></i>
        Safe Meeting Locations Near You
      </h3>

      {loading ? (
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
        </div>
      ) : locations.length > 0 ? (
        <div className="space-y-3">
          {locations.map((location) => (
            <div
              key={location.id}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <i className={`fas ${getLocationIcon(location.location_type)} text-blue-600`}></i>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{location.name}</h4>
                <p className="text-sm text-gray-600">{location.address}</p>
                {location.hours_of_operation && (
                  <p className="text-xs text-gray-500 mt-1">
                    <i className="far fa-clock mr-1"></i>
                    {location.hours_of_operation}
                  </p>
                )}
              </div>
              {location.is_verified && (
                <i className="fas fa-check-circle text-green-500" title="Verified location"></i>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm text-center py-4">
          No safe meeting locations found nearby. Meet in any well-lit public place.
        </p>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          💡 <strong>Tip:</strong> Police station parking lots are available 24/7 for safe exchanges.
        </p>
      </div>
    </div>
  );
}

SafeMeetingLocations.propTypes = {
  city: PropTypes.string,
  state: PropTypes.string
};

export default SafetyGuidelines;
