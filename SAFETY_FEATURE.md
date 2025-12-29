# Safety & Trust System - Complete Documentation

## Overview

The Safety & Trust System is a comprehensive security framework that protects DoGoods users through peer reviews, trust scores, safety reporting, and community guidelines. This feature enables users to build reputation, report concerns, and make informed decisions about food exchanges.

## Architecture

### Database Schema

#### Users Table Extensions
```sql
-- Additional columns in users table
trust_score INTEGER DEFAULT 50          -- 0-100 trust score
safety_rating NUMERIC(3,2) DEFAULT 0    -- 0-5 star average rating
total_reviews INTEGER DEFAULT 0         -- Count of reviews received
safety_warnings INTEGER DEFAULT 0       -- Count of safety warnings
verification_level TEXT DEFAULT 'none'  -- none, email, phone, id, background_check
is_banned BOOLEAN DEFAULT false         -- Ban status
ban_reason TEXT                         -- Reason for ban
last_background_check TIMESTAMP         -- Last background check date
```

#### New Tables

**user_reviews**
- Peer-to-peer reviews after transactions
- 1-5 star ratings with safety tags
- Optional comments
- Would transact again flag

**safety_reports**
- User-submitted safety concerns
- Report types: inappropriate_behavior, unsafe_meeting, food_safety, no_show, etc.
- Severity levels: low, medium, high, critical
- Evidence upload support (screenshots, photos)
- Status tracking: pending, investigating, resolved, dismissed

**safety_guidelines**
- Category-based safety tips
- Categories: meeting, pickup, food_handling, general
- Icon support for visual presentation
- Priority ordering

**safe_meeting_locations**
- Verified public meeting places
- Location types: police_station, library, school, community_center
- Address and hours of operation
- Verification status

### Trust Score Calculation

Trust scores (0-100) are auto-calculated using:

```sql
-- Trust score formula:
Base Score = 50
+ (Positive Reviews × 5)
- (Negative Reviews × 10)
+ (Email Verified × 5)
+ (Phone Verified × 5)
+ (ID Verified × 10)
+ (Background Check × 20)
+ (Completed Transactions × 2)
+ (Successful Verifications × 3)
- (Safety Warnings × 15)
- (Reports Against User × 10)

Clamped to 0-100 range
```

**Trust Levels:**
- 90-100: Excellent 🏆
- 80-89: Trusted ✓
- 60-79: Good 👍
- 40-59: Fair ⚠️
- 0-39: New/Low 🆕

## Components

### 1. TrustBadge Component

**Location:** `components/user/TrustBadge.jsx`

**Usage:**
```jsx
import { TrustBadge, SafetyRating, TrustedUserBadge } from './components/user/TrustBadge';

// Basic trust badge
<TrustBadge trustScore={85} size="md" />

// Safety rating (stars)
<SafetyRating rating={4.5} reviewCount={23} />

// Special badge for trusted users
<TrustedUserBadge />

// Complete safety profile card
<UserSafetyProfile userId="user-id" />
```

**Props:**
- `trustScore` (number): 0-100 trust score
- `size` (string): 'sm' | 'md' | 'lg'
- `showLabel` (boolean): Show text label
- `rating` (number): 0-5 star rating
- `reviewCount` (number): Number of reviews

### 2. SafetyGuidelines Component

**Location:** `components/common/SafetyGuidelines.jsx`

**Usage:**
```jsx
import SafetyGuidelines, { SafeMeetingLocations } from './components/common/SafetyGuidelines';

// Full guidelines with tabs
<SafetyGuidelines />

// Single category
<SafetyGuidelines category="meeting" />

// Compact version
<SafetyGuidelines compact={true} />

// Safe meeting locations
<SafeMeetingLocations city="Austin" state="TX" />
```

**Features:**
- Tabbed interface for different safety categories
- Icon-based guideline cards
- Emergency contact information
- Nearby safe meeting locations

### 3. ReviewModal Component

**Location:** `components/user/ReviewModal.jsx`

**Usage:**
```jsx
import ReviewModal, { ReviewList } from './components/user/ReviewModal';

// Review submission modal
<ReviewModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  revieweeId="user-to-review-id"
  transactionId="transaction-id"
  foodItemTitle="Fresh Apples"
/>

// Display reviews
<ReviewList userId="user-id" />
```

**Features:**
- 5-star rating system
- Safety tags (punctual, respectful, clean, etc.)
- Optional text review (500 chars)
- "Would transact again" checkbox
- Review statistics display

### 4. SafetyReportModal Component

**Location:** `components/user/SafetyReportModal.jsx`

**Usage:**
```jsx
import SafetyReportModal from './components/user/SafetyReportModal';

<SafetyReportModal
  isOpen={showReportModal}
  onClose={() => setShowReportModal(false)}
  reportedUserId="user-to-report-id"
  transactionId="transaction-id"
/>
```

**Features:**
- 8 report types (inappropriate behavior, unsafe meeting, etc.)
- Severity level selection
- Evidence upload (up to 5 files)
- Emergency warning notice
- Privacy & confidentiality information

### 5. Admin Safety Dashboard

**Location:** `pages/admin/SafetyManagement.jsx`

**Features:**
- Safety report management
- User trust level monitoring
- Verification status tracking
- Report status updates (pending → investigating → resolved/dismissed)
- User moderation actions (warn, ban)
- Statistics overview

## Service Layer

### SafetyService

**Location:** `utils/safetyService.js`

**Key Methods:**

```javascript
// Get user safety profile
const profile = await SafetyService.getUserSafetyProfile(userId);

// Submit review after transaction
await SafetyService.submitReview({
  revieweeId: 'user-id',
  transactionId: 'txn-id',
  rating: 5,
  comment: 'Great experience!',
  safetyTags: ['punctual', 'respectful'],
  wouldTransactAgain: true
});

// Report safety concern
await SafetyService.reportSafetyConcern({
  reportedUserId: 'user-id',
  reportType: 'inappropriate_behavior',
  description: 'Detailed description',
  severity: 'high',
  evidenceFiles: [file1, file2]
});

// Get safety guidelines
const guidelines = await SafetyService.getSafetyGuidelines('meeting');

// Get safe meeting locations
const locations = await SafetyService.getSafeMeetingLocations('Austin', 'TX');

// Check if user is trusted
const isTrusted = await SafetyService.isTrustedUser(userId); // trust_score >= 80

// Admin: Get safety statistics
const stats = await SafetyService.getSafetyStatistics();

// Admin: Update report status
await SafetyService.updateReportStatus(reportId, 'resolved');

// Admin: Issue warning to user
await SafetyService.warnUser(userId, 'Reason for warning');

// Admin: Ban user
await SafetyService.banUser(userId, 'Reason for ban');
```

## Integration Examples

### 1. Show Trust Badge on Food Cards

```jsx
// In FoodCard.jsx
import { TrustBadge } from './components/user/TrustBadge';

<div className="food-card">
  <h3>{food.title}</h3>
  <div className="donor-info">
    <span>{food.donor_name}</span>
    <TrustBadge trustScore={food.donor_trust_score} size="sm" />
  </div>
</div>
```

### 2. Prompt for Review After Pickup

```jsx
// In FoodDetail.jsx or completion flow
import ReviewModal from './components/user/ReviewModal';

const [showReviewModal, setShowReviewModal] = useState(false);

useEffect(() => {
  // After successful pickup verification
  if (pickupCompleted && !reviewSubmitted) {
    setShowReviewModal(true);
  }
}, [pickupCompleted]);

<ReviewModal
  isOpen={showReviewModal}
  onClose={() => setShowReviewModal(false)}
  revieweeId={donorId}
  transactionId={transactionId}
  foodItemTitle={foodItem.title}
/>
```

### 3. Show Safety Guidelines Before First Transaction

```jsx
// In user onboarding or first food claim
import SafetyGuidelines from './components/common/SafetyGuidelines';

{isFirstTransaction && (
  <div className="safety-tips">
    <SafetyGuidelines category="meeting" compact={true} />
  </div>
)}
```

### 4. Add Report Button to User Profiles

```jsx
// In UserProfile.jsx
import SafetyReportModal from './components/user/SafetyReportModal';

const [showReportModal, setShowReportModal] = useState(false);

<button
  onClick={() => setShowReportModal(true)}
  className="report-user-btn"
>
  <i className="fas fa-flag"></i>
  Report User
</button>

<SafetyReportModal
  isOpen={showReportModal}
  onClose={() => setShowReportModal(false)}
  reportedUserId={profileUserId}
/>
```

### 5. Display Safe Meeting Locations on Food Detail

```jsx
// In FoodDetailPage.jsx
import { SafeMeetingLocations } from './components/common/SafetyGuidelines';

<div className="pickup-info">
  <h3>Pickup Location</h3>
  <p>{food.pickup_location}</p>
  
  <SafeMeetingLocations
    city={food.pickup_city}
    state={food.pickup_state}
  />
</div>
```

## Workflow Examples

### Complete Food Exchange with Safety Features

```
1. User browses food listings
   → See TrustBadge on each donor's card
   
2. User views food details
   → See donor's full SafetyRating
   → View SafeMeetingLocations nearby
   → Read SafetyGuidelines for meetings
   
3. User claims food
   → System shows safety tips for first-time users
   
4. Pickup occurs
   → Before photo verification (existing feature)
   → After photo verification (existing feature)
   
5. After successful pickup
   → ReviewModal automatically opens
   → User rates donor (1-5 stars)
   → Selects safety tags
   → Submits review
   
6. Donor's trust_score auto-updates
   → Trust score recalculated
   → New review appears on profile
   
7. If issues occur
   → User opens SafetyReportModal
   → Selects report type & severity
   → Uploads evidence
   → Submits to admin review
```

### Admin Safety Management Workflow

```
1. Admin logs in → SafetyManagement dashboard
2. View statistics:
   - Pending reports count
   - Critical issues
   - Trusted users count
   - Average trust score

3. Safety Reports Tab:
   - Filter by status/severity
   - Click "View Details" on report
   - Review description & evidence
   - Add admin notes
   - Take action:
     * Mark as investigating
     * Warn user
     * Ban user
     * Dismiss report
     
4. User Trust Tab:
   - View all users sorted by trust score
   - See reviews, warnings, ratings
   - Manually adjust trust scores if needed
   
5. Verification Tab:
   - Review verification requests
   - Approve/reject ID verification
   - Schedule background checks
```

## Database Migration

**File:** `supabase/migrations/030_add_safety_trust_system.sql`

**Apply Migration:**

```bash
# Local Supabase
npm run supabase:reset

# Remote Supabase
supabase db push
```

**Migration Contents:**
- User table extensions (trust_score, safety_rating, etc.)
- user_reviews table
- safety_reports table
- safety_guidelines table
- safe_meeting_locations table
- Enums: verification_level, report_type, report_status, report_severity
- Triggers: auto-update trust_score on reviews
- RLS policies for all new tables
- Default safety guidelines (13 guidelines across 4 categories)
- Indexes for performance

## Testing

### Manual Testing Checklist

**Trust Badges:**
- [ ] Trust badge displays correct level for score ranges
- [ ] Color coding matches trust level
- [ ] Size variants (sm/md/lg) render correctly
- [ ] SafetyRating shows correct star count

**Review System:**
- [ ] Can submit review with rating and tags
- [ ] Comment character limit enforced (500)
- [ ] "Would transact again" checkbox works
- [ ] Reviews appear in ReviewList
- [ ] Trust score updates after review

**Safety Reporting:**
- [ ] Can select all report types
- [ ] Severity levels selectable
- [ ] Evidence upload works (max 5 files)
- [ ] Report submits successfully
- [ ] Admin receives report

**Safety Guidelines:**
- [ ] Category tabs switch content
- [ ] All guidelines display with icons
- [ ] Compact mode shows 3 tips
- [ ] Safe meeting locations load based on city/state

**Admin Dashboard:**
- [ ] Statistics cards show correct counts
- [ ] Report filtering works
- [ ] Can update report status
- [ ] Warn/ban user actions work
- [ ] User trust table displays correctly

### Automated Tests

```javascript
// tests/SafetySystem.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import { TrustBadge } from '../components/user/TrustBadge';
import ReviewModal from '../components/user/ReviewModal';

test('TrustBadge shows correct level', () => {
  render(<TrustBadge trustScore={85} />);
  expect(screen.getByText('Trusted')).toBeInTheDocument();
});

test('ReviewModal validates rating', async () => {
  const onClose = jest.fn();
  render(<ReviewModal isOpen={true} onClose={onClose} revieweeId="123" />);
  
  fireEvent.click(screen.getByText('Submit Review'));
  expect(await screen.findByText('Please select a rating')).toBeInTheDocument();
});
```

## Security Considerations

### RLS Policies

All safety tables have Row Level Security:

```sql
-- Users can view all reviews
CREATE POLICY "Reviews are viewable by all"
  ON user_reviews FOR SELECT
  USING (true);

-- Users can only create reviews for themselves
CREATE POLICY "Users can create reviews"
  ON user_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- Only view own reports and reports about self
CREATE POLICY "Users can view relevant reports"
  ON safety_reports FOR SELECT
  USING (
    auth.uid() = reporter_id OR 
    auth.uid() = reported_user_id OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- Anyone can create reports
CREATE POLICY "Anyone can create reports"
  ON safety_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Only admins can update reports
CREATE POLICY "Admins can update reports"
  ON safety_reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true));
```

### Trust Score Integrity

- Trust scores auto-calculate via database triggers
- No direct user manipulation possible
- Admins can override via manual SQL if needed
- All changes logged in audit trail

### Evidence Storage

- Evidence files stored in Supabase Storage
- Files scoped to report ID
- Only reporter and admins can access
- Automatic expiration after 90 days (configurable)

## Performance Optimization

### Indexes

```sql
-- Fast trust score lookups
CREATE INDEX idx_users_trust_score ON users(trust_score DESC);

-- Fast report filtering
CREATE INDEX idx_safety_reports_status ON safety_reports(status, created_at DESC);
CREATE INDEX idx_safety_reports_severity ON safety_reports(severity, created_at DESC);

-- Fast review lookups
CREATE INDEX idx_user_reviews_reviewee ON user_reviews(reviewee_id, created_at DESC);
```

### Caching Strategy

```javascript
// Cache user safety profiles for 5 minutes
const CACHE_TTL = 5 * 60 * 1000;
const safetyProfileCache = new Map();

async function getCachedSafetyProfile(userId) {
  const cached = safetyProfileCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const profile = await SafetyService.getUserSafetyProfile(userId);
  safetyProfileCache.set(userId, { data: profile, timestamp: Date.now() });
  return profile;
}
```

## Troubleshooting

### Trust Score Not Updating

**Symptom:** Trust score remains unchanged after review

**Solutions:**
1. Check trigger is active:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_update_trust_score';
   ```

2. Manually recalculate:
   ```sql
   UPDATE users SET trust_score = calculate_trust_score(id) WHERE id = 'user-id';
   ```

3. Check RLS policies allow review insert

### Reviews Not Appearing

**Symptom:** Submitted reviews don't show in ReviewList

**Solutions:**
1. Check RLS policy:
   ```sql
   SELECT * FROM user_reviews WHERE reviewee_id = 'user-id';
   ```

2. Verify reviewer_id matches auth.uid()

3. Check for JavaScript errors in console

### Safety Reports Not Reaching Admin

**Symptom:** Admin dashboard shows no pending reports

**Solutions:**
1. Check report was inserted:
   ```sql
   SELECT * FROM safety_reports WHERE status = 'pending';
   ```

2. Verify admin has is_admin = true:
   ```sql
   SELECT is_admin FROM users WHERE id = 'admin-user-id';
   ```

3. Check RLS policies allow admin access

## Best Practices

### For Users

1. **Build Trust Gradually**
   - Start with small exchanges
   - Always verify before/after pickup
   - Leave honest reviews
   - Meet in public places

2. **Review Thoughtfully**
   - Be honest but constructive
   - Use safety tags accurately
   - Report serious issues promptly

3. **Stay Safe**
   - Read safety guidelines before first transaction
   - Meet at verified safe locations
   - Trust your instincts
   - Report suspicious behavior immediately

### For Admins

1. **Review Reports Promptly**
   - Prioritize critical/high severity
   - Investigate thoroughly before action
   - Document decisions in notes
   - Follow up with reporters

2. **Monitor Trust Trends**
   - Watch for sudden trust score drops
   - Investigate users with multiple warnings
   - Review high-volume users regularly

3. **Update Safety Guidelines**
   - Keep guidelines current
   - Add location-specific tips
   - Update based on incident patterns

## Future Enhancements

- [ ] Background check integration (Checkr API)
- [ ] ID verification via third-party service
- [ ] Automated fraud detection ML model
- [ ] Safety score prediction for transactions
- [ ] Community safety ambassadors program
- [ ] Safety incident heatmap
- [ ] Anonymous safety alerts
- [ ] Integration with local police departments
- [ ] Safety certification program

## Support & Resources

- **User Guide:** See `USER_HANDBOOK.md` for user-facing safety tips
- **Admin Guide:** See `ADMIN_SAFETY_MANAGEMENT.md` for admin procedures
- **Quick Start:** See `SAFETY_QUICKSTART.md` for basic setup
- **API Reference:** See service methods in `utils/safetyService.js`

## Version History

- **v1.0.0** (2024-01-15) - Initial release
  - Trust scores
  - User reviews
  - Safety reporting
  - Safety guidelines
  - Safe meeting locations
  - Admin dashboard

---

**Questions or Issues?**
Contact the development team or file an issue in the project repository.
