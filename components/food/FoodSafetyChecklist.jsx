import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import FoodSafetyService, { STORAGE_TEMPS, COMMON_ALLERGENS } from '../../utils/foodSafetyService';
import { toast } from 'react-toastify';

/**
 * FoodSafetyChecklist Component
 * Comprehensive safety checklist for food listing creation and verification
 */
function FoodSafetyChecklist({ listingId, listingData, onUpdate, mode = 'create' }) {
  const [storageType, setStorageType] = useState(listingData?.storage_requirements || 'room_temperature');
  const [packagingType, setPackagingType] = useState(listingData?.packaging_type || 'sealed_original');
  const [condition, setCondition] = useState(listingData?.current_condition || 'good');
  const [expiryDate, setExpiryDate] = useState(listingData?.expiry_date || '');
  const [currentTemp, setCurrentTemp] = useState(listingData?.current_storage_temp || '');
  const [allergens, setAllergens] = useState(listingData?.allergen_info || []);
  const [isPerishable, setIsPerishable] = useState(listingData?.is_perishable || false);
  const [safetyNotes, setSafetyNotes] = useState(listingData?.safety_notes || '');
  const [safetyScore, setSafetyScore] = useState(null);
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    calculateSafety();
  }, [storageType, packagingType, condition, expiryDate, currentTemp]);

  const calculateSafety = () => {
    const mockListing = {
      storage_requirements: storageType,
      packaging_type: packagingType,
      current_condition: condition,
      expiry_date: expiryDate,
      is_perishable: isPerishable
    };

    const checkData = {
      temperature: currentTemp ? parseFloat(currentTemp) : undefined
    };

    const result = FoodSafetyService.calculateSafetyScore(mockListing, checkData);
    setSafetyScore(result.score);
    setIssues(result.issues);

    // Update parent component
    if (onUpdate) {
      onUpdate({
        storage_requirements: storageType,
        packaging_type: packagingType,
        current_condition: condition,
        expiry_date: expiryDate || null,
        current_storage_temp: currentTemp ? parseFloat(currentTemp) : null,
        allergen_info: allergens,
        is_perishable: isPerishable,
        safety_notes: safetyNotes,
        storage_temperature_min: STORAGE_TEMPS[storageType]?.min,
        storage_temperature_max: STORAGE_TEMPS[storageType]?.max,
        requires_refrigeration: storageType === 'refrigerated',
        requires_freezing: storageType === 'frozen',
        passed_safety_check: result.passed
      });
    }
  };

  const toggleAllergen = (allergen) => {
    setAllergens(prev =>
      prev.includes(allergen)
        ? prev.filter(a => a !== allergen)
        : [...prev, allergen]
    );
  };

  const tempRange = STORAGE_TEMPS[storageType];
  const scoreColor = FoodSafetyService.getSafetyBadgeColor(safetyScore || 0);
  const scoreLabel = FoodSafetyService.getSafetyBadgeLabel(safetyScore || 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <i className="fas fa-clipboard-check text-green-600 mr-2"></i>
          Food Safety Checklist
        </h3>
        {safetyScore !== null && (
          <div className={`px-4 py-2 rounded-lg bg-${scoreColor}-100 border-2 border-${scoreColor}-300`}>
            <div className="text-sm font-medium text-${scoreColor}-700">Safety Score</div>
            <div className={`text-2xl font-bold text-${scoreColor}-800`}>{safetyScore}/100</div>
            <div className={`text-xs text-${scoreColor}-600`}>{scoreLabel}</div>
          </div>
        )}
      </div>

      {/* Storage Requirements */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Storage Requirements *
        </label>
        <select
          value={storageType}
          onChange={(e) => setStorageType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          {Object.entries(STORAGE_TEMPS).map(([key, value]) => (
            <option key={key} value={key}>{value.label}</option>
          ))}
        </select>
        {tempRange && (
          <p className="mt-1 text-xs text-gray-600">
            <i className="fas fa-thermometer-half mr-1"></i>
            Safe temperature range: {tempRange.min}°F to {tempRange.max}°F
          </p>
        )}
      </div>

      {/* Current Temperature */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Storage Temperature (°F)
        </label>
        <input
          type="number"
          value={currentTemp}
          onChange={(e) => setCurrentTemp(e.target.value)}
          step="0.1"
          placeholder="e.g., 38"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        {currentTemp && tempRange && (
          <p className={`mt-1 text-xs ${
            parseFloat(currentTemp) >= tempRange.min && parseFloat(currentTemp) <= tempRange.max
              ? 'text-green-600'
              : 'text-red-600'
          }`}>
            {parseFloat(currentTemp) >= tempRange.min && parseFloat(currentTemp) <= tempRange.max
              ? '✓ Temperature is within safe range'
              : '⚠ Temperature is outside safe range!'}
          </p>
        )}
      </div>

      {/* Packaging Type */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Packaging Type *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { value: 'sealed_original', label: 'Original Sealed', icon: '📦' },
            { value: 'sealed_container', label: 'Sealed Container', icon: '🥡' },
            { value: 'wrapped', label: 'Wrapped', icon: '🎁' },
            { value: 'vacuum_sealed', label: 'Vacuum Sealed', icon: '🔒' },
            { value: 'open_container', label: 'Open Container', icon: '🥣' },
            { value: 'unwrapped', label: 'Unwrapped', icon: '⚠️' }
          ].map((pkg) => (
            <button
              key={pkg.value}
              type="button"
              onClick={() => setPackagingType(pkg.value)}
              className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                packagingType === pkg.value
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white hover:border-green-300'
              }`}
            >
              <span className="mr-1">{pkg.icon}</span>
              {pkg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Food Condition */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Food Condition *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[
            { value: 'excellent', label: 'Excellent', color: 'green', icon: '⭐' },
            { value: 'good', label: 'Good', color: 'blue', icon: '👍' },
            { value: 'fair', label: 'Fair', color: 'yellow', icon: '⚠️' },
            { value: 'poor', label: 'Poor', color: 'orange', icon: '😟' },
            { value: 'unsafe', label: 'Unsafe', color: 'red', icon: '🚫' }
          ].map((cond) => (
            <button
              key={cond.value}
              type="button"
              onClick={() => setCondition(cond.value)}
              className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                condition === cond.value
                  ? `border-${cond.color}-500 bg-${cond.color}-50 text-${cond.color}-700`
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <span className="mr-1">{cond.icon}</span>
              {cond.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expiration Date */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Expiration/Best Before Date
        </label>
        <input
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        {expiryDate && (
          <p className="mt-1 text-xs text-gray-600">
            {(() => {
              const days = Math.floor((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
              if (days < 0) return '⚠️ Food has expired';
              if (days === 0) return '⚠️ Expires today - use immediately';
              if (days === 1) return '⚠️ Expires tomorrow';
              return `Valid for ${days} more days`;
            })()}
          </p>
        )}
      </div>

      {/* Perishable Toggle */}
      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isPerishable}
            onChange={(e) => setIsPerishable(e.target.checked)}
            className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
          />
          <span className="text-sm font-medium text-gray-700">
            This food is perishable (requires temperature control)
          </span>
        </label>
      </div>

      {/* Allergen Information */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Allergen Information
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Select all allergens that apply to help recipients make safe choices
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {COMMON_ALLERGENS.map((allergen) => (
            <button
              key={allergen}
              type="button"
              onClick={() => toggleAllergen(allergen)}
              className={`px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                allergens.includes(allergen)
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {allergen}
            </button>
          ))}
        </div>
      </div>

      {/* Safety Notes */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Safety & Handling Notes
        </label>
        <textarea
          value={safetyNotes}
          onChange={(e) => setSafetyNotes(e.target.value)}
          rows={3}
          placeholder="e.g., 'Keep refrigerated. Reheat to 165°F before serving.'"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          maxLength={500}
        />
        <div className="text-right text-xs text-gray-500 mt-1">
          {safetyNotes.length}/500 characters
        </div>
      </div>

      {/* Issues & Warnings */}
      {issues.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mb-6">
          <div className="flex">
            <i className="fas fa-exclamation-triangle text-yellow-600 mt-0.5 mr-3"></i>
            <div>
              <h4 className="font-semibold text-yellow-900 mb-2">Safety Concerns</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                {issues.map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Safety Tips */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <div className="flex">
          <i className="fas fa-lightbulb text-blue-600 mt-0.5 mr-3"></i>
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Safety Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Always store food at proper temperature</li>
              <li>• Check expiration dates before listing</li>
              <li>• Use proper packaging to prevent contamination</li>
              <li>• Label all allergens clearly</li>
              <li>• When in doubt, don't share it out</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

FoodSafetyChecklist.propTypes = {
  listingId: PropTypes.string,
  listingData: PropTypes.object,
  onUpdate: PropTypes.func,
  mode: PropTypes.oneOf(['create', 'edit', 'view'])
};

/**
 * SafetyBadge Component
 * Display safety score badge
 */
export function SafetyBadge({ score, size = 'md', showLabel = true }) {
  if (score === null || score === undefined) return null;

  const color = FoodSafetyService.getSafetyBadgeColor(score);
  const label = FoodSafetyService.getSafetyBadgeLabel(score);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  return (
    <div className={`inline-flex items-center gap-2 rounded-full bg-${color}-100 border-2 border-${color}-300 ${sizeClasses[size]}`}>
      <i className="fas fa-shield-alt" style={{ color: `var(--${color}-600)` }}></i>
      <span className={`font-bold text-${color}-800`}>{score}</span>
      {showLabel && <span className={`text-${color}-700`}>{label}</span>}
    </div>
  );
}

SafetyBadge.propTypes = {
  score: PropTypes.number,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showLabel: PropTypes.bool
};

/**
 * TemperatureMonitor Component
 * Real-time temperature monitoring and logging
 */
export function TemperatureMonitor({ listingId, storageType }) {
  const [temperature, setTemperature] = useState('');
  const [location, setLocation] = useState('refrigerator');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (listingId) {
      loadLogs();
    }
  }, [listingId]);

  const loadLogs = async () => {
    const data = await FoodSafetyService.getTemperatureLogs(listingId, 5);
    setLogs(data);
  };

  const handleLogTemperature = async () => {
    if (!temperature) {
      toast.error('Please enter a temperature');
      return;
    }

    setLoading(true);
    try {
      await FoodSafetyService.logTemperature(listingId, parseFloat(temperature), location);
      toast.success('Temperature logged successfully');
      setTemperature('');
      loadLogs();
    } catch (error) {
      toast.error('Failed to log temperature');
    } finally {
      setLoading(false);
    }
  };

  const tempRange = STORAGE_TEMPS[storageType];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
        <i className="fas fa-thermometer-half text-blue-600 mr-2"></i>
        Temperature Monitor
      </h4>

      {tempRange && (
        <div className="bg-blue-50 p-3 rounded mb-3">
          <div className="text-sm font-medium text-blue-900">Safe Range</div>
          <div className="text-lg font-bold text-blue-700">
            {tempRange.min}°F to {tempRange.max}°F
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-3">
        <input
          type="number"
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
          step="0.1"
          placeholder="Enter temp (°F)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="refrigerator">Refrigerator</option>
          <option value="freezer">Freezer</option>
          <option value="cooler">Cooler</option>
          <option value="ambient">Room Temp</option>
        </select>
        <button
          onClick={handleLogTemperature}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Log
        </button>
      </div>

      {logs.length > 0 && (
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Recent Logs</div>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {FoodSafetyService.formatTemperature(log.temperature)}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs ${
                  log.within_safe_range ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {log.within_safe_range ? '✓ Safe' : '⚠ Out of range'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

TemperatureMonitor.propTypes = {
  listingId: PropTypes.string.isRequired,
  storageType: PropTypes.string.isRequired
};

export default FoodSafetyChecklist;
