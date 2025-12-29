# Safety & Trust System - Quick Start Guide

## 5-Minute Setup

### 1. Apply Database Migration

```bash
# Copy migration to Supabase migrations folder (if not already there)
# Migration file: supabase/migrations/030_add_safety_trust_system.sql

# Apply to local Supabase
npm run supabase:reset

# OR apply to remote Supabase
supabase db push
```

### 2. Verify Migration Success

```bash
# Check new tables exist
supabase db show

# You should see:
# - user_reviews
# - safety_reports
# - safety_guidelines
# - safe_meeting_locations
```

### 3. Test in Browser

```javascript
// Open browser console on your app
import SafetyService from './utils/safetyService';

// Test getting safety guidelines
const guidelines = await SafetyService.getSafetyGuidelines();
console.log('Guidelines:', guidelines);

// Test getting user safety profile
const profile = await SafetyService.getUserSafetyProfile('your-user-id');
console.log('Safety Profile:', profile);
```

## Quick Integration Examples

### Add Trust Badge to Food Cards

**File:** `components/food/FoodCard.jsx`

```jsx
// 1. Import component
import { TrustBadge } from '../user/TrustBadge';

// 2. Add to JSX (inside your card component)
<div className="donor-info">
  <span>{food.donor_name}</span>
  <TrustBadge trustScore={food.donor_trust_score || 50} size="sm" />
</div>
```

### Add Review Prompt After Pickup

**File:** `pages/FoodDetailPage.jsx` or wherever pickup completion occurs

```jsx
// 1. Import components
import { useState } from 'react';
import ReviewModal from '../components/user/ReviewModal';

// 2. Add state
const [showReviewModal, setShowReviewModal] = useState(false);

// 3. Show modal after successful pickup
useEffect(() => {
  if (pickupVerified && !hasReviewed) {
    setShowReviewModal(true);
  }
}, [pickupVerified]);

// 4. Add modal to JSX
<ReviewModal
  isOpen={showReviewModal}
  onClose={() => setShowReviewModal(false)}
  revieweeId={donorUserId}
  transactionId={foodId}
  foodItemTitle={food.title}
/>
```

### Add Report Button to User Profiles

**File:** `pages/ProfilePage.jsx`

```jsx
// 1. Import components
import { useState } from 'react';
import SafetyReportModal from '../components/user/SafetyReportModal';

// 2. Add state
const [showReportModal, setShowReportModal] = useState(false);

// 3. Add button
<button
  onClick={() => setShowReportModal(true)}
  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
>
  <i className="fas fa-flag mr-2"></i>
  Report User
</button>

// 4. Add modal
<SafetyReportModal
  isOpen={showReportModal}
  onClose={() => setShowReportModal(false)}
  reportedUserId={profileUserId}
/>
```

### Show Safety Guidelines on First Visit

**File:** `pages/HomePage.jsx` or `components/layout/MainLayout.jsx`

```jsx
// 1. Import component
import SafetyGuidelines from '../components/common/SafetyGuidelines';

// 2. Show for new users
{user && user.transaction_count === 0 && (
  <div className="mb-6">
    <h2 className="text-xl font-bold mb-3">Safety First!</h2>
    <SafetyGuidelines category="meeting" compact={true} />
  </div>
)}
```

### Add Admin Safety Dashboard to Routes

**File:** `app.jsx`

```jsx
// 1. Import component
import SafetyManagement from './pages/admin/SafetyManagement';

// 2. Add route (inside admin routes section)
<Route
  path="/admin/safety"
  element={
    <AdminRoute>
      <SafetyManagement />
    </AdminRoute>
  }
/>
```

## Essential Service Methods

### Get User Safety Profile
```javascript
const profile = await SafetyService.getUserSafetyProfile(userId);
// Returns: { trustScore, safetyRating, totalReviews, recentReviews, verificationLevel, ... }
```

### Submit Review
```javascript
await SafetyService.submitReview({
  revieweeId: 'user-id-to-review',
  transactionId: 'food-item-id',
  rating: 5,                          // 1-5 stars
  comment: 'Great experience!',       // Optional
  safetyTags: ['punctual', 'clean'],  // Optional
  wouldTransactAgain: true            // Optional
});
```

### Report Safety Concern
```javascript
await SafetyService.reportSafetyConcern({
  reportedUserId: 'user-id',
  reportType: 'inappropriate_behavior',  // See report types below
  description: 'Detailed description',
  severity: 'high',                      // low, medium, high, critical
  evidenceFiles: [file1, file2]          // Optional
});
```

### Check if User is Trusted
```javascript
const isTrusted = await SafetyService.isTrustedUser(userId);
// Returns true if trust_score >= 80
```

## Report Types

- `inappropriate_behavior` - Rude or offensive conduct
- `unsafe_meeting` - Unsafe meeting location
- `food_safety` - Food safety concerns
- `no_show` - User didn't show up
- `misrepresentation` - False description
- `threatening` - Threatening behavior
- `scam` - Fraud attempt
- `other` - Other safety concerns

## Safety Tags for Reviews

- `punctual` - On time ⏰
- `respectful` - Respectful behavior 🤝
- `communicative` - Good communication 💬
- `clean` - Clean and hygienic ✨
- `accurate_description` - Accurate food description ✅
- `safe_location` - Safe meeting location 📍
- `friendly` - Friendly demeanor 😊
- `professional` - Professional conduct 👔

## Trust Score Levels

| Score | Level | Badge | Meaning |
|-------|-------|-------|---------|
| 90-100 | Excellent | 🏆 | Highly trusted, many positive reviews |
| 80-89 | Trusted | ✓ | Reliable, good track record |
| 60-79 | Good | 👍 | Positive history |
| 40-59 | Fair | ⚠️ | Limited history or mixed reviews |
| 0-39 | New/Low | 🆕 | New user or concerns present |

## Default Safety Guidelines

The migration creates 13 default guidelines:

**Meeting Safety:**
1. Meet in well-lit public places
2. Tell someone your meeting location
3. Schedule during daylight hours
4. Trust your instincts

**Pickup Tips:**
5. Verify food appearance before accepting
6. Bring your own bag/container
7. Communicate pickup time clearly
8. Be on time and respectful

**Food Handling:**
9. Check expiration dates
10. Inspect food for freshness
11. Store perishables immediately
12. When in doubt, throw it out

**General:**
13. Use in-app messaging when possible

## Admin Quick Actions

### View Pending Reports
```
1. Go to /admin/safety
2. Click "Safety Reports" tab
3. Filter: Status = "Pending"
4. Review and take action
```

### Issue Warning to User
```
1. Click "View Details" on report
2. Add admin notes
3. Click "Warn User"
4. User's safety_warnings increments
5. Trust score decreases
```

### Ban User
```
1. Click "View Details" on report
2. Add ban reason in notes
3. Click "Ban User"
4. User's is_banned = true
5. User cannot access app
```

### View User Trust Levels
```
1. Go to /admin/safety
2. Click "User Trust" tab
3. Sort by trust_score
4. Review users with low scores or high warnings
```

## Testing Checklist

Quick tests to verify system works:

- [ ] **Trust Badge**
  - View food card → see donor's trust badge
  - Different trust scores show different colors

- [ ] **Reviews**
  - Complete a food pickup
  - Review modal appears
  - Submit 5-star review
  - Check recipient's trust score increased

- [ ] **Safety Reports**
  - Click "Report User" on profile
  - Select report type
  - Upload evidence photo
  - Submit report
  - Admin sees report in dashboard

- [ ] **Safety Guidelines**
  - View guidelines page
  - Switch between category tabs
  - See all 13 default guidelines

- [ ] **Admin Dashboard**
  - Login as admin
  - Go to /admin/safety
  - See statistics cards
  - View pending reports
  - Update report status

## Common Issues & Fixes

### "Trust score not updating after review"
```sql
-- Manually trigger recalculation
UPDATE users 
SET trust_score = calculate_trust_score(id) 
WHERE id = 'user-id';
```

### "Reviews not appearing"
```javascript
// Check RLS policies
// User must be authenticated to view reviews
const { data, error } = await supabase
  .from('user_reviews')
  .select('*')
  .eq('reviewee_id', userId);

console.log('Reviews:', data, 'Error:', error);
```

### "Admin can't see reports"
```sql
-- Verify admin status
SELECT id, email, is_admin FROM users WHERE email = 'admin@example.com';

-- Set admin flag if needed
UPDATE users SET is_admin = true WHERE email = 'admin@example.com';
```

### "Evidence upload fails"
```javascript
// Check Storage bucket exists
// Bucket name: 'food-images'
// Storage policies must allow authenticated uploads

// Test upload
const { data, error } = await supabase.storage
  .from('food-images')
  .upload('test.jpg', file);

console.log('Upload:', data, 'Error:', error);
```

## Next Steps

1. **Customize Safety Guidelines**
   - Add location-specific tips
   - Update based on community feedback
   - Add seasonal safety tips

2. **Configure Email Notifications**
   - Notify users of new reviews
   - Alert admins of critical reports
   - Remind users to review after pickup

3. **Add Verification Levels**
   - Implement email verification
   - Phone number verification
   - ID verification workflow
   - Background check integration

4. **Enhance Trust Algorithm**
   - Adjust trust score weights
   - Add time-based decay
   - Consider transaction value
   - Factor in response time

5. **Monitor & Improve**
   - Review safety statistics weekly
   - Analyze report patterns
   - Update guidelines based on incidents
   - Survey users about safety experience

## Resources

- **Full Documentation:** `SAFETY_FEATURE.md`
- **User Handbook:** `USER_HANDBOOK.md`
- **Admin Guide:** `ADMIN_SAFETY_MANAGEMENT.md` (if exists)
- **Database Schema:** `supabase/migrations/030_add_safety_trust_system.sql`
- **Service Code:** `utils/safetyService.js`

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify database migration applied successfully
3. Check RLS policies allow required access
4. Review component props and imports
5. Test API methods in browser console

---

**Ready to make your community safer!** 🛡️✨
