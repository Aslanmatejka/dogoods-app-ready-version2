import React, { useState } from 'react';
import PropTypes from 'prop-types';
import FoodSafetyService from '../../utils/foodSafetyService';
import { toast } from 'react-toastify';

/**
 * SafetyInspectionModal Component
 * Detailed safety inspection checklist for recipients before accepting food
 */
function SafetyInspectionModal({ isOpen, onClose, listingId, listingData }) {
  const [checks, setChecks] = useState({
    // Temperature
    temperatureRecorded: '',
    temperatureInRange: null,
    
    // Packaging
    packagingIntact: null,
    packagingSealed: null,
    packagingClean: null,
    packagingLabeled: null,
    
    // Condition
    appearanceGood: null,
    smellNormal: null,
    noMold: null,
    noDiscoloration: null,
    textureNormal: null,
    
    // Expiration
    expiryDateVisible: null,
    withinExpiryDate: null,
    
    // Allergens
    allergensLabeled: null,
    
    // Storage
    storedProperly: null,
    
    // Notes
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);

  const sections = [
    {
      title: 'Temperature Check',
      icon: 'fa-thermometer-half',
      fields: [
        { key: 'temperatureRecorded', label: 'Record Current Temperature (°F)', type: 'number' },
        { key: 'temperatureInRange', label: 'Is temperature within safe range?', type: 'boolean' }
      ]
    },
    {
      title: 'Packaging Inspection',
      icon: 'fa-box',
      fields: [
        { key: 'packagingIntact', label: 'Packaging is intact (no tears/damage)', type: 'boolean' },
        { key: 'packagingSealed', label: 'Packaging is properly sealed', type: 'boolean' },
        { key: 'packagingClean', label: 'Packaging appears clean', type: 'boolean' },
        { key: 'packagingLabeled', label: 'Contents are labeled', type: 'boolean' }
      ]
    },
    {
      title: 'Food Condition',
      icon: 'fa-eye',
      fields: [
        { key: 'appearanceGood', label: 'Food appears normal (color, consistency)', type: 'boolean' },
        { key: 'smellNormal', label: 'Food smells normal (no off odors)', type: 'boolean' },
        { key: 'noMold', label: 'No visible mold or fungus', type: 'boolean' },
        { key: 'noDiscoloration', label: 'No unusual discoloration', type: 'boolean' },
        { key: 'textureNormal', label: 'Texture appears normal', type: 'boolean' }
      ]
    },
    {
      title: 'Expiration & Safety',
      icon: 'fa-calendar-check',
      fields: [
        { key: 'expiryDateVisible', label: 'Expiration/best-before date is visible', type: 'boolean' },
        { key: 'withinExpiryDate', label: 'Food is within expiration date', type: 'boolean' },
        { key: 'allergensLabeled', label: 'Allergens are clearly labeled', type: 'boolean' },
        { key: 'storedProperly', label: 'Food was stored properly', type: 'boolean' }
      ]
    }
  ];

  const handleCheckChange = (key, value) => {
    setChecks(prev => ({ ...prev, [key]: value }));
  };

  const calculateOverallSafety = () => {
    const criticalChecks = [
      'noMold',
      'smellNormal',
      'withinExpiryDate',
      'packagingIntact'
    ];

    const criticalFailed = criticalChecks.some(key => checks[key] === false);
    if (criticalFailed) return false;

    // Count passing checks
    const booleanChecks = Object.entries(checks)
      .filter(([key, value]) => typeof value === 'boolean')
      .filter(([_, value]) => value === true);

    // Pass if >75% of checks are true
    return booleanChecks.length / 13 >= 0.75;
  };

  const calculateSafetyScore = () => {
    let score = 100;

    // Critical failures (-30 each)
    if (checks.noMold === false) score -= 30;
    if (checks.smellNormal === false) score -= 30;
    if (checks.withinExpiryDate === false) score -= 30;
    if (checks.packagingIntact === false) score -= 20;

    // Other failures (-5 each)
    const otherChecks = [
      'packagingSealed', 'packagingClean', 'appearanceGood',
      'noDiscoloration', 'textureNormal', 'expiryDateVisible',
      'allergensLabeled', 'storedProperly'
    ];

    otherChecks.forEach(key => {
      if (checks[key] === false) score -= 5;
    });

    return Math.max(0, score);
  };

  const handleSubmit = async () => {
    const overallSafe = calculateOverallSafety();
    const safetyScore = calculateSafetyScore();

    setSubmitting(true);
    try {
      await FoodSafetyService.performSafetyCheck(listingId, {
        checkType: 'recipient',
        temperature: checks.temperatureRecorded ? parseFloat(checks.temperatureRecorded) : null,
        temperatureInRange: checks.temperatureInRange,
        packagingIntact: checks.packagingIntact,
        packagingSealed: checks.packagingSealed,
        packagingClean: checks.packagingClean,
        packagingLabeled: checks.packagingLabeled,
        appearanceGood: checks.appearanceGood,
        smellNormal: checks.smellNormal,
        noMold: checks.noMold,
        noDiscoloration: checks.noDiscoloration,
        textureNormal: checks.textureNormal,
        expiryDateVisible: checks.expiryDateVisible,
        withinExpiryDate: checks.withinExpiryDate,
        allergensLabeled: checks.allergensLabeled,
        storedProperly: checks.storedProperly,
        overallSafe,
        safetyScore,
        notes: checks.notes
      });

      if (overallSafe) {
        toast.success('Safety inspection passed! Food is safe to accept.');
      } else {
        toast.warning('Safety concerns detected. Please review before accepting.');
      }

      onClose({ passed: overallSafe, score: safetyScore });
    } catch (error) {
      toast.error('Failed to submit safety inspection');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentSectionData = sections[currentSection];
  const isLastSection = currentSection === sections.length - 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center">
              <i className="fas fa-clipboard-check mr-2"></i>
              Safety Inspection Checklist
            </h2>
            <button onClick={() => onClose()} className="text-white hover:text-gray-200">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
          <p className="text-green-100 text-sm mt-1">
            {listingData?.title || 'Food Item'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex justify-between mb-2">
            {sections.map((section, index) => (
              <button
                key={index}
                onClick={() => setCurrentSection(index)}
                className={`flex-1 text-xs font-medium pb-2 border-b-2 transition-colors ${
                  index === currentSection
                    ? 'border-green-500 text-green-600'
                    : index < currentSection
                    ? 'border-green-300 text-green-500'
                    : 'border-gray-200 text-gray-400'
                }`}
              >
                <i className={`fas ${section.icon} mr-1`}></i>
                {section.title}
              </button>
            ))}
          </div>
        </div>

        {/* Current Section */}
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <i className={`fas ${currentSectionData.icon} text-green-600 mr-2`}></i>
            {currentSectionData.title}
          </h3>

          <div className="space-y-4">
            {currentSectionData.fields.map((field) => (
              <div key={field.key} className="border-b border-gray-200 pb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                </label>
                
                {field.type === 'number' ? (
                  <input
                    type="number"
                    value={checks[field.key]}
                    onChange={(e) => handleCheckChange(field.key, e.target.value)}
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder="Enter temperature"
                  />
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleCheckChange(field.key, true)}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                        checks[field.key] === true
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <i className="fas fa-check-circle mr-2"></i>
                      Yes / Pass
                    </button>
                    <button
                      onClick={() => handleCheckChange(field.key, false)}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                        checks[field.key] === false
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <i className="fas fa-times-circle mr-2"></i>
                      No / Fail
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Notes (last section only) */}
          {isLastSection && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={checks.notes}
                onChange={(e) => handleCheckChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Any additional observations or concerns..."
                maxLength={500}
              />
            </div>
          )}

          {/* Warning Messages */}
          {checks.noMold === false && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex">
                <i className="fas fa-exclamation-triangle text-red-600 mr-3 mt-0.5"></i>
                <div className="text-sm text-red-800">
                  <strong>Critical Safety Issue:</strong> Mold detected. Do not consume this food.
                </div>
              </div>
            </div>
          )}

          {checks.smellNormal === false && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <div className="flex">
                <i className="fas fa-exclamation-triangle text-red-600 mr-3 mt-0.5"></i>
                <div className="text-sm text-red-800">
                  <strong>Critical Safety Issue:</strong> Abnormal smell detected. Food may be spoiled.
                </div>
              </div>
            </div>
          )}

          {checks.withinExpiryDate === false && (
            <div className="mt-4 bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
              <div className="flex">
                <i className="fas fa-exclamation-circle text-orange-600 mr-3 mt-0.5"></i>
                <div className="text-sm text-orange-800">
                  <strong>Warning:</strong> Food is past expiration date. Use extreme caution.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-between">
          <button
            onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
            disabled={currentSection === 0}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Previous
          </button>

          <div className="text-sm text-gray-600">
            Section {currentSection + 1} of {sections.length}
          </div>

          {isLastSection ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-check"></i>
                  <span>Complete Inspection</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setCurrentSection(currentSection + 1)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Next
              <i className="fas fa-arrow-right ml-2"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

SafetyInspectionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  listingId: PropTypes.string.isRequired,
  listingData: PropTypes.object
};

export default SafetyInspectionModal;
