import React, { useState } from 'react';
import PropTypes from 'prop-types';
import SafetyService from '../../utils/safetyService';
import { toast } from 'react-toastify';

/**
 * ReviewModal Component
 * Modal for submitting user reviews after transactions
 */
function ReviewModal({ isOpen, onClose, revieweeId, transactionId, foodItemTitle }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [wouldTransactAgain, setWouldTransactAgain] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const safetyTags = [
    { value: 'punctual', label: 'Punctual', icon: '⏰' },
    { value: 'respectful', label: 'Respectful', icon: '🤝' },
    { value: 'communicative', label: 'Good Communication', icon: '💬' },
    { value: 'clean', label: 'Clean & Hygienic', icon: '✨' },
    { value: 'accurate_description', label: 'Accurate Description', icon: '✅' },
    { value: 'safe_location', label: 'Safe Meeting Location', icon: '📍' },
    { value: 'friendly', label: 'Friendly', icon: '😊' },
    { value: 'professional', label: 'Professional', icon: '👔' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      await SafetyService.submitReview({
        revieweeId,
        transactionId,
        rating,
        comment,
        safetyTags: selectedTags,
        wouldTransactAgain
      });

      toast.success('Review submitted successfully!');
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setRating(0);
    setHoverRating(0);
    setComment('');
    setSelectedTags([]);
    setWouldTransactAgain(true);
  };

  const toggleTag = (tagValue) => {
    setSelectedTags(prev =>
      prev.includes(tagValue)
        ? prev.filter(t => t !== tagValue)
        : [...prev, tagValue]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center">
              <i className="fas fa-star mr-2"></i>
              Leave a Review
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
          {foodItemTitle && (
            <p className="text-green-100 text-sm mt-1">
              Transaction: {foodItemTitle}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Rating Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Rating *
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="text-3xl transition-transform hover:scale-110 focus:outline-none"
                >
                  {(hoverRating || rating) >= star ? (
                    <i className="fas fa-star text-yellow-400"></i>
                  ) : (
                    <i className="far fa-star text-gray-300"></i>
                  )}
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {rating === 0 && 'Select a rating'}
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </span>
            </div>
          </div>

          {/* Safety Tags */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Safety & Quality Tags
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Select all that apply to help others know what to expect
            </p>
            <div className="grid grid-cols-2 gap-2">
              {safetyTags.map((tag) => (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => toggleTag(tag.value)}
                  className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    selectedTags.includes(tag.value)
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
                  }`}
                >
                  <span className="mr-1">{tag.icon}</span>
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Share your experience with this user..."
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {comment.length}/500 characters
            </div>
          </div>

          {/* Would Transact Again */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={wouldTransactAgain}
                onChange={(e) => setWouldTransactAgain(e.target.checked)}
                className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">
                I would exchange food with this user again
              </span>
            </label>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
            <div className="flex">
              <i className="fas fa-info-circle text-blue-600 mt-0.5 mr-3"></i>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Review Guidelines</p>
                <ul className="text-xs space-y-1 text-blue-700">
                  <li>• Be honest and constructive</li>
                  <li>• Focus on your transaction experience</li>
                  <li>• Avoid personal attacks or offensive language</li>
                  <li>• Reviews help build trust in our community</li>
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
              disabled={submitting || rating === 0}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane"></i>
                  <span>Submit Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

ReviewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  revieweeId: PropTypes.string.isRequired,
  transactionId: PropTypes.string,
  foodItemTitle: PropTypes.string
};

/**
 * ReviewList Component
 * Display list of reviews for a user
 */
export function ReviewList({ userId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadReviews();
  }, [userId]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const profile = await SafetyService.getUserSafetyProfile(userId);
      setReviews(profile.recentReviews || []);
      setStats({
        averageRating: profile.safetyRating || 0,
        totalReviews: profile.totalReviews || 0,
        wouldTransactAgain: profile.wouldTransactAgainPercentage || 0
      });
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      {stats && stats.totalReviews > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">Average Rating</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalReviews}
              </div>
              <div className="text-xs text-gray-600">Total Reviews</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {stats.wouldTransactAgain}%
              </div>
              <div className="text-xs text-gray-600">Would Exchange Again</div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <i className="fas fa-comment-slash text-4xl mb-3"></i>
          <p>No reviews yet</p>
        </div>
      )}
    </div>
  );
}

/**
 * ReviewCard Component
 * Individual review card
 */
function ReviewCard({ review }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold">
            {review.reviewer_name ? review.reviewer_name[0].toUpperCase() : 'U'}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-medium text-gray-900">
                {review.reviewer_name || 'Anonymous User'}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <i
                      key={star}
                      className={`fas fa-star text-sm ${
                        star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    ></i>
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            {review.would_transact_again && (
              <div className="flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded">
                <i className="fas fa-check-circle"></i>
                <span>Would exchange again</span>
              </div>
            )}
          </div>

          {review.comment && (
            <p className="text-sm text-gray-700 mb-2">{review.comment}</p>
          )}

          {review.safety_tags && review.safety_tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {review.safety_tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

ReviewList.propTypes = {
  userId: PropTypes.string.isRequired
};

ReviewCard.propTypes = {
  review: PropTypes.shape({
    id: PropTypes.string.isRequired,
    reviewer_name: PropTypes.string,
    rating: PropTypes.number.isRequired,
    comment: PropTypes.string,
    safety_tags: PropTypes.arrayOf(PropTypes.string),
    would_transact_again: PropTypes.bool,
    created_at: PropTypes.string.isRequired
  }).isRequired
};

export default ReviewModal;
