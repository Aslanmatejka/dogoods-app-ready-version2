import React from 'react';
import PropTypes from 'prop-types';
import { VERIFICATION_LEVELS } from '../../utils/safetyService';

/**
 * TrustBadge Component
 * Displays user's trust score and verification level
 */
function TrustBadge({ trustScore, verificationLevel, size = 'md', showScore = true }) {
  const getTrustLevel = (score) => {
    if (score >= 90) return { label: 'Excellent', color: 'green', icon: '🏆' };
    if (score >= 80) return { label: 'Trusted', color: 'blue', icon: '✓' };
    if (score >= 60) return { label: 'Good', color: 'yellow', icon: '👍' };
    if (score >= 40) return { label: 'Fair', color: 'orange', icon: '⚠️' };
    return { label: 'New', color: 'gray', icon: '🆕' };
  };

  const getVerificationBadge = (level) => {
    const badges = {
      [VERIFICATION_LEVELS.BACKGROUND_CHECKED]: { icon: '🛡️', label: 'Background Checked', color: 'green' },
      [VERIFICATION_LEVELS.ID_VERIFIED]: { icon: '🪪', label: 'ID Verified', color: 'blue' },
      [VERIFICATION_LEVELS.PHONE_VERIFIED]: { icon: '📱', label: 'Phone Verified', color: 'purple' },
      [VERIFICATION_LEVELS.EMAIL_VERIFIED]: { icon: '✉️', label: 'Email Verified', color: 'gray' },
      [VERIFICATION_LEVELS.UNVERIFIED]: { icon: '−', label: 'Unverified', color: 'gray' }
    };
    return badges[level] || badges[VERIFICATION_LEVELS.UNVERIFIED];
  };

  const trustLevel = getTrustLevel(trustScore);
  const verificationBadge = getVerificationBadge(verificationLevel);

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const colorClasses = {
    green: 'bg-green-100 text-green-800 border-green-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    orange: 'bg-orange-100 text-orange-800 border-orange-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    gray: 'bg-gray-100 text-gray-600 border-gray-300'
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Trust Score Badge */}
      {showScore && (
        <div className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${sizeClasses[size]} ${colorClasses[trustLevel.color]}`}>
          <span>{trustLevel.icon}</span>
          <span>{trustLevel.label}</span>
          <span className="font-bold">{trustScore}</span>
        </div>
      )}

      {/* Verification Badge */}
      {verificationLevel !== VERIFICATION_LEVELS.UNVERIFIED && (
        <div className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizeClasses[size]} ${colorClasses[verificationBadge.color]}`}>
          <span>{verificationBadge.icon}</span>
          <span className="hidden sm:inline">{verificationBadge.label}</span>
        </div>
      )}
    </div>
  );
}

TrustBadge.propTypes = {
  trustScore: PropTypes.number.isRequired,
  verificationLevel: PropTypes.oneOf(Object.values(VERIFICATION_LEVELS)),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showScore: PropTypes.bool
};

/**
 * SafetyRating Component
 * Displays user's safety rating with stars
 */
export function SafetyRating({ rating, totalReviews, size = 'md', showCount = true }) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<i key={i} className="fas fa-star text-yellow-400"></i>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<i key={i} className="fas fa-star-half-alt text-yellow-400"></i>);
      } else {
        stars.push(<i key={i} className="far fa-star text-gray-300"></i>);
      }
    }
    return stars;
  };

  return (
    <div className={`flex items-center gap-2 ${sizeClasses[size]}`}>
      <div className="flex gap-0.5">
        {renderStars()}
      </div>
      <span className="font-semibold text-gray-700">{rating.toFixed(1)}</span>
      {showCount && totalReviews > 0 && (
        <span className="text-gray-500 text-sm">({totalReviews})</span>
      )}
    </div>
  );
}

SafetyRating.propTypes = {
  rating: PropTypes.number.isRequired,
  totalReviews: PropTypes.number,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showCount: PropTypes.bool
};

/**
 * TrustedUserBadge Component
 * Special badge for highly trusted users (trust score >= 80)
 */
export function TrustedUserBadge({ size = 'md' }) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-2'
  };

  return (
    <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-full font-bold shadow-md ${sizeClasses[size]}`}>
      <i className="fas fa-shield-check"></i>
      <span>Trusted User</span>
    </div>
  );
}

TrustedUserBadge.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg'])
};

/**
 * SafetyWarningBadge Component
 * Displays if user has safety warnings
 */
export function SafetyWarningBadge({ warningCount }) {
  if (warningCount === 0) return null;

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-sm font-semibold border border-red-300">
      <i className="fas fa-exclamation-triangle"></i>
      <span>{warningCount} Safety Warning{warningCount > 1 ? 's' : ''}</span>
    </div>
  );
}

SafetyWarningBadge.propTypes = {
  warningCount: PropTypes.number.isRequired
};

/**
 * UserSafetyProfile Component
 * Complete safety profile display for user pages
 */
export function UserSafetyProfile({ user, showDetails = true }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        <i className="fas fa-shield-alt text-green-600 mr-2"></i>
        Safety & Trust
      </h3>

      {/* Trust Badge and Rating */}
      <div className="space-y-3 mb-4">
        <TrustBadge
          trustScore={user.trust_score || 50}
          verificationLevel={user.verification_level}
          size="lg"
        />
        
        {user.is_trusted_user && <TrustedUserBadge />}
        
        {user.safety_rating > 0 && (
          <SafetyRating
            rating={user.safety_rating}
            totalReviews={user.total_reviews}
          />
        )}

        {user.safety_warnings > 0 && (
          <SafetyWarningBadge warningCount={user.safety_warnings} />
        )}
      </div>

      {/* Details */}
      {showDetails && (
        <div className="space-y-2 text-sm text-gray-600 border-t border-gray-200 pt-4">
          <div className="flex justify-between">
            <span>Member since:</span>
            <span className="font-medium">{new Date(user.created_at).getFullYear()}</span>
          </div>
          <div className="flex justify-between">
            <span>Trust score:</span>
            <span className="font-medium">{user.trust_score}/100</span>
          </div>
          {user.total_reviews > 0 && (
            <div className="flex justify-between">
              <span>Reviews:</span>
              <span className="font-medium">{user.total_reviews}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

UserSafetyProfile.propTypes = {
  user: PropTypes.shape({
    trust_score: PropTypes.number,
    safety_rating: PropTypes.number,
    total_reviews: PropTypes.number,
    verification_level: PropTypes.string,
    is_trusted_user: PropTypes.bool,
    safety_warnings: PropTypes.number,
    created_at: PropTypes.string
  }).isRequired,
  showDetails: PropTypes.bool
};

export default TrustBadge;
