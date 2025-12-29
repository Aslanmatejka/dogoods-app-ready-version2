# UI Integration Checklist

## Current Integration Status

### ✅ Already Integrated
- [x] DietaryPreferences in UserSettings
- [x] UrgencyBadge in FoodCard
- [x] VerificationStatus in FoodCard
- [x] UserFeedback admin page in app.jsx routes

### ❌ Missing Integrations

## 1. ShareFoodPage - Add Food Safety Checklist

**File:** `pages/ShareFoodPage.jsx`

**What to add:**
- Import FoodSafetyChecklist
- Add safety data state
- Integrate checklist into form
- Validate safety data before submit

## 2. FoodCard - Add Safety Badge & Dietary Tags

**File:** `components/food/FoodCard.jsx`

**What to add:**
- Import SafetyBadge from FoodSafetyChecklist
- Import FoodDietaryTags
- Display safety score badge
- Show dietary compatibility tags
- Display allergen warnings

## 3. Food Detail Page - Add Inspection & Verification Modals

**Need to create:** `pages/FoodDetailPage.jsx` or integrate into existing detail view

**What to add:**
- SafetyInspectionModal for recipients
- VerificationModal for pickup verification
- Temperature monitoring display
- Safety check history

## 4. UserDashboard - Add Trust Badge & Reviews

**File:** `pages/UserDashboard.jsx`

**What to add:**
- TrustBadge display
- Recent reviews section
- Safety reports section
- Temperature monitoring for active listings

## 5. FindFoodPage - Add Dietary Filters

**File:** `pages/FindFoodPage.jsx`

**What to add:**
- Dietary preference filters
- Allergen exclusion filters
- Safety score minimum filter
- Urgency level filter

## 6. Admin Routes - Add New Dashboards

**File:** `app.jsx`

**What to add:**
```jsx
import SafetyManagement from './pages/admin/SafetyManagement.jsx';
import VerificationManagement from './pages/admin/VerificationManagement.jsx';
import FoodSafetyMonitoring from './pages/admin/FoodSafetyMonitoring.jsx';

// Add routes:
<Route path="/admin/safety" element={<AdminRoute><SafetyManagement /></AdminRoute>} />
<Route path="/admin/verifications" element={<AdminRoute><VerificationManagement /></AdminRoute>} />
<Route path="/admin/food-safety" element={<AdminRoute><FoodSafetyMonitoring /></AdminRoute>} />
```

## 7. Profile Page - Add Trust Score & Reviews

**File:** `pages/ProfilePage.jsx`

**What to add:**
- TrustBadge prominent display
- Reviews received section
- Safety compliance stats
- Verification success rate

## 8. Main Navigation - Add Quick Actions

**File:** `components/layout/MainLayout.jsx` or Header

**What to add:**
- Feedback button (already added via FeedbackButton)
- Safety guidelines link
- Verification pending count badge

## Quick Implementation Commands

Run these integrations in order:

### Step 1: Add Safety Checklist to Share Food Form
```bash
# Edit pages/ShareFoodPage.jsx
```

### Step 2: Enhance Food Cards
```bash
# Edit components/food/FoodCard.jsx  
```

### Step 3: Add Admin Routes
```bash
# Edit app.jsx
```

### Step 4: Add Filters to Find Food
```bash
# Edit pages/FindFoodPage.jsx
```

### Step 5: Enhance User Dashboard
```bash
# Edit pages/UserDashboard.jsx
```

## Testing Each Integration

After each integration, test:

1. **ShareFoodPage**: Create listing with safety data → verify it saves
2. **FoodCard**: View food list → see safety badges, dietary tags, urgency indicators
3. **Admin**: Navigate to /admin/safety, /admin/verifications, /admin/food-safety
4. **Filters**: Use dietary filters → see filtered results
5. **Dashboard**: View trust score, reviews, safety stats

## Priority Order

1. **HIGH**: FoodCard enhancements (most visible to users)
2. **HIGH**: Admin routes (for monitoring)
3. **MEDIUM**: ShareFoodPage safety checklist
4. **MEDIUM**: FindFoodPage filters
5. **LOW**: Profile/Dashboard enhancements

