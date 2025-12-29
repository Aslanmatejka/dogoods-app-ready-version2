import React, { useState } from 'react';
import PropTypes from 'prop-types';
import SafetyService from '../../utils/safetyService';
import { toast } from 'react-toastify';

/**
 * SafetyReportModal Component
 * Modal for reporting safety concerns and incidents
 */
function SafetyReportModal({ isOpen, onClose, reportedUserId, transactionId }) {
  const [reportType, setReportType] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [evidencePreviews, setEvidencePreviews] = useState([]);
  const [severity, setSeverity] = useState('medium');
  const [submitting, setSubmitting] = useState(false);

  const reportTypes = [
    {
      value: 'inappropriate_behavior',
      label: 'Inappropriate Behavior',
      icon: '⚠️',
      description: 'Rude, offensive, or harassing conduct'
    },
    {
      value: 'unsafe_meeting',
      label: 'Unsafe Meeting Location',
      icon: '📍',
      description: 'Meeting location was not safe or isolated'
    },
    {
      value: 'food_safety',
      label: 'Food Safety Concern',
      icon: '🍽️',
      description: 'Food appeared spoiled, contaminated, or unsafe'
    },
    {
      value: 'no_show',
      label: 'No Show / Ghost',
      icon: '👻',
      description: 'User did not show up and stopped responding'
    },
    {
      value: 'misrepresentation',
      label: 'Misrepresentation',
      icon: '🚫',
      description: 'Food was significantly different from description'
    },
    {
      value: 'threatening',
      label: 'Threatening Behavior',
      icon: '🚨',
      description: 'User made threats or acted aggressively'
    },
    {
      value: 'scam',
      label: 'Scam / Fraud',
      icon: '💰',
      description: 'Attempted scam or fraudulent activity'
    },
    {
      value: 'other',
      label: 'Other Safety Concern',
      icon: '🛡️',
      description: 'Other safety or trust issues'
    }
  ];

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + evidenceFiles.length > 5) {
      toast.error('Maximum 5 evidence files allowed');
      return;
    }

    // Generate previews
    const newPreviews = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'file'
    }));

    setEvidenceFiles(prev => [...prev, ...files]);
    setEvidencePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeFile = (index) => {
    setEvidenceFiles(prev => prev.filter((_, i) => i !== index));
    setEvidencePreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      // Revoke URL for removed preview
      URL.revokeObjectURL(prev[index].preview);
      return newPreviews;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reportType) {
      toast.error('Please select a report type');
      return;
    }

    if (!description.trim()) {
      toast.error('Please provide a description');
      return;
    }

    setSubmitting(true);
    try {
      await SafetyService.reportSafetyConcern({
        reportedUserId,
        transactionId,
        reportType,
        description,
        evidenceFiles,
        severity
      });

      toast.success('Safety report submitted. Our team will review it shortly.');
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to submit report:', error);
      toast.error(error.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setReportType('');
    setDescription('');
    setEvidenceFiles([]);
    evidencePreviews.forEach(preview => URL.revokeObjectURL(preview.preview));
    setEvidencePreviews([]);
    setSeverity('medium');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center">
              <i className="fas fa-shield-alt mr-2"></i>
              Report Safety Concern
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
          <p className="text-red-100 text-sm mt-1">
            Your report helps keep our community safe
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Report Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What happened? *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {reportTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setReportType(type.value)}
                  className={`text-left p-3 rounded-lg border-2 transition-all ${
                    reportType === type.value
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-red-300'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-2xl">{type.icon}</span>
                    <div>
                      <div className={`font-medium ${
                        reportType === type.value ? 'text-red-700' : 'text-gray-900'
                      }`}>
                        {type.label}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {type.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severity Level
            </label>
            <div className="flex gap-2">
              {[
                { value: 'low', label: 'Low', color: 'yellow' },
                { value: 'medium', label: 'Medium', color: 'orange' },
                { value: 'high', label: 'High', color: 'red' },
                { value: 'critical', label: 'Critical', color: 'red' }
              ].map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setSeverity(level.value)}
                  className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    severity === level.value
                      ? `border-${level.color}-500 bg-${level.color}-50 text-${level.color}-700`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={6}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Please describe what happened in detail. Include dates, times, and any specific incidents..."
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {description.length}/1000 characters
            </div>
          </div>

          {/* Evidence Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Evidence (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Upload screenshots, photos, or other evidence (max 5 files, 5MB each)
            </p>
            
            <input
              type="file"
              accept="image/*,.pdf"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="evidence-upload"
            />
            
            <label
              htmlFor="evidence-upload"
              className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <i className="fas fa-upload mr-2"></i>
              Upload Files
            </label>

            {evidencePreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                {evidencePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    {preview.type === 'image' ? (
                      <img
                        src={preview.preview}
                        alt={`Evidence ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="w-full h-24 flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
                        <i className="fas fa-file text-2xl text-gray-400"></i>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Emergency Warning */}
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <div className="flex">
              <i className="fas fa-exclamation-triangle text-red-600 mt-0.5 mr-3"></i>
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">🚨 Emergency Situations</p>
                <p className="text-xs text-red-700">
                  If you are in immediate danger or witnessed a crime, please call 911 first. 
                  This report is for our internal review and does not replace emergency services.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
            <div className="flex">
              <i className="fas fa-lock text-blue-600 mt-0.5 mr-3"></i>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Privacy & Confidentiality</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Your report will be reviewed by our safety team</li>
                  <li>• Your identity will be kept confidential</li>
                  <li>• False reports may result in account suspension</li>
                  <li>• We may contact you for additional information</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !reportType || !description.trim()}
              className="px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  <span>Submit Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

SafetyReportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  reportedUserId: PropTypes.string.isRequired,
  transactionId: PropTypes.string
};

export default SafetyReportModal;
