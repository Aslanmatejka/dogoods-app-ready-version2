/**
 * Safety and Trust Service
 * Manages user safety, trust scores, reviews, and safety reports
 */

import supabase from './supabaseClient';
import { reportError } from './helpers';

export const VERIFICATION_LEVELS = {
  UNVERIFIED: 'unverified',
  EMAIL_VERIFIED: 'email_verified',
  PHONE_VERIFIED: 'phone_verified',
  ID_VERIFIED: 'id_verified',
  BACKGROUND_CHECKED: 'background_checked'
};

export const REPORT_TYPES = {
  HARASSMENT: 'harassment',
  INAPPROPRIATE_BEHAVIOR: 'inappropriate_behavior',
  SAFETY_CONCERN: 'safety_concern',
  FRAUD: 'fraud',
  FAKE_LISTING: 'fake_listing',
  NO_SHOW: 'no_show',
  UNSAFE_LOCATION: 'unsafe_location',
  OTHER: 'other'
};

export const SAFETY_TAGS = [
  'punctual',
  'friendly',
  'safe_location',
  'professional',
  'respectful',
  'food_as_described',
  'clean_packaging',
  'easy_communication',
  'reliable',
  'helpful'
];

class SafetyService {
  /**
   * Get user's safety profile
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Safety profile
   */
  static async getUserSafetyProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          trust_score,
          safety_rating,
          total_reviews,
          verification_level,
          is_trusted_user,
          safety_warnings,
          account_restricted,
          created_at
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      reportError(error);
      throw new Error(`Failed to get safety profile: ${error.message}`);
    }
  }

  /**
   * Submit a review for a user after a transaction
   * @param {Object} reviewData - Review information
   * @returns {Promise<Object>} Created review
   */
  static async submitReview(reviewData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const {
        reviewedUserId,
        transactionId,
        transactionType,
        rating,
        reviewText,
        safetyTags,
        wouldTransactAgain,
        isAnonymous
      } = reviewData;

      // Validate rating
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      const { data, error } = await supabase
        .from('user_reviews')
        .insert({
          reviewer_id: user.id,
          reviewed_user_id: reviewedUserId,
          transaction_id: transactionId,
          transaction_type: transactionType,
          rating,
          review_text: reviewText,
          safety_tags: safetyTags || [],
          would_transact_again: wouldTransactAgain ?? true,
          is_anonymous: isAnonymous ?? false,
          is_verified_transaction: true
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      reportError(error);
      throw new Error(`Failed to submit review: ${error.message}`);
    }
  }

  /**
   * Get reviews for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of reviews to fetch
   * @returns {Promise<Array>} User reviews
   */
  static async getUserReviews(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('user_reviews')
        .select(`
          *,
          reviewer:reviewer_id(name, avatar_url)
        `)
        .eq('reviewed_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      reportError(error);
      throw new Error(`Failed to get user reviews: ${error.message}`);
    }
  }

  /**
   * Report a safety concern
   * @param {Object} reportData - Safety report data
   * @returns {Promise<Object>} Created report
   */
  static async reportSafetyConcern(reportData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const {
        reportedUserId,
        reportType,
        description,
        incidentDate,
        incidentLocation,
        evidenceUrls,
        listingId,
        severity
      } = reportData;

      const { data, error } = await supabase
        .from('safety_reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: reportedUserId,
          report_type: reportType,
          description,
          incident_date: incidentDate,
          incident_location: incidentLocation,
          evidence_urls: evidenceUrls || [],
          listing_id: listingId,
          severity: severity || 'medium',
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-increment safety warnings for high/critical reports
      if (severity === 'high' || severity === 'critical') {
        await this.incrementSafetyWarning(reportedUserId);
      }

      return data;
    } catch (error) {
      reportError(error);
      throw new Error(`Failed to report safety concern: ${error.message}`);
    }
  }

  /**
   * Increment safety warning count for a user
   * @param {string} userId - User ID
   */
  static async incrementSafetyWarning(userId) {
    try {
      const { error } = await supabase.rpc('increment_safety_warnings', {
        user_uuid: userId
      });

      if (error) {
        // Fallback if RPC doesn't exist
        await supabase
          .from('users')
          .update({
            safety_warnings: supabase.raw('safety_warnings + 1')
          })
          .eq('id', userId);
      }
    } catch (error) {
      reportError(error);
    }
  }

  /**
   * Get safety guidelines
   * @param {string} category - Optional category filter
   * @returns {Promise<Array>} Safety guidelines
   */
  static async getSafetyGuidelines(category = null) {
    try {
      let query = supabase
        .from('safety_guidelines')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      reportError(error);
      throw new Error(`Failed to get safety guidelines: ${error.message}`);
    }
  }

  /**
   * Get safe meeting locations nearby
   * @param {string} city - City name
   * @param {string} state - State abbreviation
   * @returns {Promise<Array>} Safe meeting locations
   */
  static async getSafeMeetingLocations(city, state = null) {
    try {
      let query = supabase
        .from('safe_meeting_locations')
        .select('*')
        .eq('is_verified', true);

      if (city) {
        query = query.ilike('city', `%${city}%`);
      }

      if (state) {
        query = query.eq('state', state);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      reportError(error);
      throw new Error(`Failed to get safe meeting locations: ${error.message}`);
    }
  }

  /**
   * Calculate and update user's trust score
   * @param {string} userId - User ID
   * @returns {Promise<number>} Updated trust score
   */
  static async updateTrustScore(userId) {
    try {
      const { data, error } = await supabase.rpc('calculate_trust_score', {
        user_uuid: userId
      });

      if (error) throw error;

      return data;
    } catch (error) {
      reportError(error);
      throw new Error(`Failed to update trust score: ${error.message}`);
    }
  }

  /**
   * Get trust score history for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Trust score history
   */
  static async getTrustScoreHistory(userId) {
    try {
      const { data, error } = await supabase
        .from('trust_score_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return data || [];
    } catch (error) {
      reportError(error);
      throw new Error(`Failed to get trust score history: ${error.message}`);
    }
  }

  /**
   * Check if user can be trusted (trust score >= 80)
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Is trusted user
   */
  static async isTrustedUser(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_trusted_user, trust_score, account_restricted')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return data.is_trusted_user && !data.account_restricted;
    } catch (error) {
      reportError(error);
      return false;
    }
  }

  /**
   * Get safety reports (admin only)
   * @param {string} status - Filter by status
   * @returns {Promise<Array>} Safety reports
   */
  static async getSafetyReports(status = null) {
    try {
      let query = supabase
        .from('safety_reports')
        .select(`
          *,
          reporter:reporter_id(name, email),
          reported_user:reported_user_id(name, email, trust_score)
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      reportError(error);
      throw new Error(`Failed to get safety reports: ${error.message}`);
    }
  }

  /**
   * Update safety report status (admin only)
   * @param {string} reportId - Report ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated report
   */
  static async updateSafetyReport(reportId, updateData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { status, adminNotes, actionTaken } = updateData;

      const { data, error } = await supabase
        .from('safety_reports')
        .update({
          status,
          admin_notes: adminNotes,
          action_taken: actionTaken,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      reportError(error);
      throw new Error(`Failed to update safety report: ${error.message}`);
    }
  }

  /**
   * Get safety statistics (admin dashboard)
   * @returns {Promise<Object>} Safety statistics
   */
  static async getSafetyStatistics() {
    try {
      const [reportsData, usersData] = await Promise.all([
        supabase.from('safety_reports').select('status'),
        supabase.from('users').select('trust_score, is_trusted_user, account_restricted')
      ]);

      const stats = {
        total_reports: reportsData.data?.length || 0,
        pending_reports: reportsData.data?.filter(r => r.status === 'pending').length || 0,
        total_users: usersData.data?.length || 0,
        trusted_users: usersData.data?.filter(u => u.is_trusted_user).length || 0,
        restricted_accounts: usersData.data?.filter(u => u.account_restricted).length || 0,
        average_trust_score: usersData.data?.reduce((sum, u) => sum + (u.trust_score || 0), 0) / (usersData.data?.length || 1)
      };

      return stats;
    } catch (error) {
      reportError(error);
      throw new Error(`Failed to get safety statistics: ${error.message}`);
    }
  }

  /**
   * Request verification upgrade
   * @param {string} verificationType - Type of verification
   * @param {Object} verificationData - Supporting documents/data
   * @returns {Promise<Object>} Verification request
   */
  static async requestVerification(verificationType, verificationData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // This would typically integrate with a verification service
      // For now, we'll just log the request
      console.log('Verification requested:', verificationType, verificationData);

      // Update user's verification request status
      const { data, error } = await supabase
        .from('users')
        .update({
          background_check_status: 'pending'
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      reportError(error);
      throw new Error(`Failed to request verification: ${error.message}`);
    }
  }
}

export default SafetyService;
