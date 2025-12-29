import supabase from './supabaseClient';
import { reportError } from './helpers';

/**
 * Food Safety Service
 * Manages food safety checks, temperature logging, and compliance
 */

// Storage temperature ranges (in Fahrenheit)
export const STORAGE_TEMPS = {
  refrigerated: { min: 32, max: 40, label: 'Refrigerated (32-40°F)' },
  frozen: { min: -10, max: 0, label: 'Frozen (0°F or below)' },
  room_temperature: { min: 50, max: 70, label: 'Room Temperature (50-70°F)' },
  cool_dry: { min: 50, max: 70, label: 'Cool & Dry (below 70°F)' },
  heated: { min: 140, max: 165, label: 'Hot (140°F or above)' }
};

// Food categories with default storage
export const FOOD_CATEGORIES = {
  dairy: { storage: 'refrigerated', perishable: true, maxDays: 7 },
  meat: { storage: 'refrigerated', perishable: true, maxDays: 2 },
  produce_cold: { storage: 'refrigerated', perishable: true, maxDays: 7 },
  produce_room: { storage: 'room_temperature', perishable: false, maxDays: 5 },
  bakery: { storage: 'room_temperature', perishable: false, maxDays: 5 },
  canned: { storage: 'room_temperature', perishable: false, maxDays: 730 },
  frozen: { storage: 'frozen', perishable: true, maxDays: 90 },
  prepared_hot: { storage: 'heated', perishable: true, maxDays: 0 },
  prepared_cold: { storage: 'refrigerated', perishable: true, maxDays: 3 },
  eggs: { storage: 'refrigerated', perishable: true, maxDays: 21 }
};

// Common allergens
export const COMMON_ALLERGENS = [
  'dairy', 'eggs', 'fish', 'shellfish', 'tree nuts', 'peanuts', 
  'wheat', 'gluten', 'soy', 'sesame', 'mustard', 'celery'
];

class FoodSafetyService {
  /**
   * Get storage requirements for a food category
   */
  async getStorageRequirements(category) {
    try {
      const { data, error } = await supabase
        .from('storage_requirements_catalog')
        .select('*')
        .eq('food_category', category)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get storage requirements:', error);
      // Return defaults if not found
      return FOOD_CATEGORIES[category] || null;
    }
  }

  /**
   * Get all storage requirements catalog
   */
  async getAllStorageRequirements() {
    try {
      const { data, error } = await supabase
        .from('storage_requirements_catalog')
        .select('*')
        .eq('is_active', true)
        .order('food_category');

      if (error) throw error;
      return data || [];
    } catch (error) {
      reportError(error);
      return [];
    }
  }

  /**
   * Perform safety check on food listing
   */
  async performSafetyCheck(listingId, checkData) {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser?.user) throw new Error('Not authenticated');

      const safetyCheck = {
        listing_id: listingId,
        checker_id: currentUser.user.id,
        check_type: checkData.checkType || 'donor',
        
        // Temperature
        temperature_recorded: checkData.temperature,
        temperature_in_range: checkData.temperatureInRange,
        
        // Packaging
        packaging_intact: checkData.packagingIntact,
        packaging_sealed: checkData.packagingSealed,
        packaging_clean: checkData.packagingClean,
        packaging_labeled: checkData.packagingLabeled,
        
        // Condition
        appearance_good: checkData.appearanceGood,
        smell_normal: checkData.smellNormal,
        no_mold: checkData.noMold,
        no_discoloration: checkData.noDiscoloration,
        texture_normal: checkData.textureNormal,
        
        // Expiration
        expiry_date_visible: checkData.expiryDateVisible,
        within_expiry_date: checkData.withinExpiryDate,
        best_before_date: checkData.bestBeforeDate,
        
        // Allergens
        allergens_labeled: checkData.allergensLabeled,
        allergen_list: checkData.allergenList,
        
        // Storage
        stored_properly: checkData.storedProperly,
        storage_duration_appropriate: checkData.storageDurationAppropriate,
        
        // Overall
        overall_safe: checkData.overallSafe,
        safety_score: checkData.safetyScore,
        issues_found: checkData.issuesFound || [],
        recommendations: checkData.recommendations || [],
        notes: checkData.notes,
        check_photos: checkData.checkPhotos || []
      };

      const { data, error } = await supabase
        .from('food_safety_checks')
        .insert([safetyCheck])
        .select()
        .single();

      if (error) throw error;

      // Update listing safety status
      await supabase
        .from('food_listings')
        .update({
          passed_safety_check: checkData.overallSafe,
          safety_check_date: new Date().toISOString(),
          safety_checked_by: currentUser.user.id
        })
        .eq('id', listingId);

      return data;
    } catch (error) {
      reportError(error);
      throw error;
    }
  }

  /**
   * Calculate safety score for food listing
   */
  calculateSafetyScore(listing, checkData = {}) {
    let score = 100;
    const issues = [];

    // Temperature check (30 points)
    if (checkData.temperature !== undefined) {
      const tempRange = STORAGE_TEMPS[listing.storage_requirements];
      if (tempRange) {
        if (checkData.temperature < tempRange.min || checkData.temperature > tempRange.max) {
          score -= 30;
          issues.push(`Temperature out of safe range (should be ${tempRange.label})`);
        }
      }
    }

    // Expiration check (40 points)
    if (listing.expiry_date) {
      const daysUntilExpiry = Math.floor(
        (new Date(listing.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntilExpiry < 0) {
        score -= 40;
        issues.push('Food has expired');
      } else if (daysUntilExpiry === 0) {
        score -= 20;
        issues.push('Food expires today - use immediately');
      } else if (daysUntilExpiry === 1) {
        score -= 10;
        issues.push('Food expires tomorrow');
      } else if (daysUntilExpiry <= 3) {
        score -= 5;
        issues.push('Nearing expiration (3 days or less)');
      }
    }

    // Packaging check (15 points)
    if (listing.packaging_type === 'unwrapped') {
      score -= 15;
      issues.push('Food should be properly packaged');
    } else if (listing.packaging_type === 'open_container' && listing.is_perishable) {
      score -= 10;
      issues.push('Perishable food should be sealed');
    }

    // Condition check (15 points)
    if (listing.current_condition === 'unsafe') {
      score = 0;
      issues.push('Food marked as unsafe - do not consume');
    } else if (listing.current_condition === 'poor') {
      score -= 15;
      issues.push('Food quality is poor - use with caution');
    } else if (listing.current_condition === 'fair') {
      score -= 8;
      issues.push('Food quality is fair - use soon');
    }

    // Additional checks from manual inspection
    if (checkData.noMold === false) {
      score -= 50;
      issues.push('Mold detected - unsafe to consume');
    }

    if (checkData.smellNormal === false) {
      score -= 30;
      issues.push('Abnormal smell detected');
    }

    if (checkData.packagingIntact === false) {
      score -= 20;
      issues.push('Packaging is damaged');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      passed: score >= 70
    };
  }

  /**
   * Log temperature reading
   */
  async logTemperature(listingId, temperature, location = 'refrigerator') {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser?.user) throw new Error('Not authenticated');

      // Get listing to check safe temperature range
      const { data: listing } = await supabase
        .from('food_listings')
        .select('storage_temperature_min, storage_temperature_max, storage_requirements')
        .eq('id', listingId)
        .single();

      const tempRange = listing ? STORAGE_TEMPS[listing.storage_requirements] : null;
      const withinRange = tempRange
        ? temperature >= tempRange.min && temperature <= tempRange.max
        : true;

      const { data, error } = await supabase
        .from('temperature_logs')
        .insert([{
          listing_id: listingId,
          temperature,
          location,
          recorded_by: currentUser.user.id,
          within_safe_range: withinRange
        }])
        .select()
        .single();

      if (error) throw error;

      // Update current temperature on listing
      await supabase
        .from('food_listings')
        .update({ current_storage_temp: temperature })
        .eq('id', listingId);

      return data;
    } catch (error) {
      reportError(error);
      throw error;
    }
  }

  /**
   * Get temperature logs for a listing
   */
  async getTemperatureLogs(listingId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('temperature_logs')
        .select('*')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      reportError(error);
      return [];
    }
  }

  /**
   * Report food safety violation
   */
  async reportViolation(listingId, violationType, description, severity = 'medium') {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser?.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('food_safety_violations')
        .insert([{
          listing_id: listingId,
          violation_type: violationType,
          severity,
          description,
          detected_by: currentUser.user.id,
          detection_method: 'manual'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      reportError(error);
      throw error;
    }
  }

  /**
   * Get safety violations for a listing
   */
  async getViolations(listingId) {
    try {
      const { data, error } = await supabase
        .from('food_safety_violations')
        .select('*')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      reportError(error);
      return [];
    }
  }

  /**
   * Get all safety checks for a listing
   */
  async getSafetyChecks(listingId) {
    try {
      const { data, error } = await supabase
        .from('food_safety_checks')
        .select('*, checker:checker_id(email)')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      reportError(error);
      return [];
    }
  }

  /**
   * Validate food listing before submission
   */
  async validateFoodListing(listingData) {
    const errors = [];
    const warnings = [];

    // Check expiration date
    if (listingData.expiry_date) {
      const expiryDate = new Date(listingData.expiry_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (expiryDate < today) {
        errors.push('Food has already expired');
      } else {
        const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 1) {
          warnings.push('Food expires very soon - ensure quick pickup');
        }
      }
    }

    // Check storage requirements
    if (listingData.requires_refrigeration && listingData.storage_requirements !== 'refrigerated') {
      warnings.push('Food requires refrigeration but storage type may not match');
    }

    // Check temperature
    if (listingData.current_storage_temp && listingData.storage_requirements) {
      const tempRange = STORAGE_TEMPS[listingData.storage_requirements];
      if (tempRange) {
        if (listingData.current_storage_temp < tempRange.min || 
            listingData.current_storage_temp > tempRange.max) {
          errors.push(`Temperature out of safe range (should be ${tempRange.label})`);
        }
      }
    }

    // Check condition
    if (listingData.current_condition === 'unsafe' || listingData.current_condition === 'poor') {
      errors.push('Food condition is not safe for sharing');
    }

    // Check packaging for perishables
    if (listingData.is_perishable && 
        (listingData.packaging_type === 'unwrapped' || listingData.packaging_type === 'open_container')) {
      warnings.push('Perishable food should be properly sealed');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get safety statistics for admin dashboard
   */
  async getSafetyStatistics() {
    try {
      const { data: checks } = await supabase
        .from('food_safety_checks')
        .select('overall_safe, safety_score');

      const { data: violations } = await supabase
        .from('food_safety_violations')
        .select('severity, resolved');

      const { data: listings } = await supabase
        .from('food_listings')
        .select('passed_safety_check, storage_requirements');

      const stats = {
        totalChecks: checks?.length || 0,
        passedChecks: checks?.filter(c => c.overall_safe).length || 0,
        averageSafetyScore: checks?.length 
          ? (checks.reduce((sum, c) => sum + (c.safety_score || 0), 0) / checks.length).toFixed(1)
          : 0,
        
        totalViolations: violations?.length || 0,
        unresolvedViolations: violations?.filter(v => !v.resolved).length || 0,
        criticalViolations: violations?.filter(v => v.severity === 'critical').length || 0,
        
        totalListings: listings?.length || 0,
        safeListings: listings?.filter(l => l.passed_safety_check === true).length || 0,
        unsafeListings: listings?.filter(l => l.passed_safety_check === false).length || 0,
        
        storageBreakdown: listings?.reduce((acc, l) => {
          acc[l.storage_requirements] = (acc[l.storage_requirements] || 0) + 1;
          return acc;
        }, {}) || {}
      };

      return stats;
    } catch (error) {
      reportError(error);
      return null;
    }
  }

  /**
   * Get recommended storage for food item
   */
  getRecommendedStorage(foodCategory) {
    const category = FOOD_CATEGORIES[foodCategory];
    if (!category) return null;

    return {
      storageType: category.storage,
      temperatureRange: STORAGE_TEMPS[category.storage],
      maxStorageDays: category.maxDays,
      isPerishable: category.perishable
    };
  }

  /**
   * Format temperature display
   */
  formatTemperature(tempF) {
    if (tempF === null || tempF === undefined) return 'N/A';
    const tempC = ((tempF - 32) * 5 / 9).toFixed(1);
    return `${tempF}°F (${tempC}°C)`;
  }

  /**
   * Get safety badge color based on score
   */
  getSafetyBadgeColor(score) {
    if (score >= 90) return 'green';
    if (score >= 70) return 'blue';
    if (score >= 50) return 'yellow';
    if (score >= 30) return 'orange';
    return 'red';
  }

  /**
   * Get safety badge label
   */
  getSafetyBadgeLabel(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    if (score >= 30) return 'Poor';
    return 'Unsafe';
  }
}

export default new FoodSafetyService();
