# Food Safety Checklist System - Complete Documentation

## Overview

The Food Safety Checklist System ensures food shared on DoGoods meets safety standards through comprehensive tracking of storage requirements, temperature monitoring, packaging validation, and expiration management. This system protects both donors and recipients by enforcing food safety best practices.

## Architecture

### Database Schema

#### Food Listings Extensions
```sql
-- Additional columns in food_listings table
storage_requirements storage_type           -- Required storage type
packaging_type packaging_type               -- Packaging condition
current_condition food_condition            -- Food quality state
requires_refrigeration BOOLEAN              -- Needs refrigeration
requires_freezing BOOLEAN                   -- Needs freezing
allergen_info TEXT[]                        -- Allergen list
expiry_date DATE                            -- Expiration date
days_until_expiry INTEGER                   -- Auto-calculated days left
preparation_date DATE                       -- When food was prepared
storage_temperature_min DECIMAL(5,2)        -- Min safe temp (°F)
storage_temperature_max DECIMAL(5,2)        -- Max safe temp (°F)
current_storage_temp DECIMAL(5,2)           -- Current temp
is_perishable BOOLEAN                       -- Perishable flag
safe_handling_instructions TEXT             -- Handling notes
reheating_instructions TEXT                 -- Reheating info
safety_notes TEXT                           -- Additional safety info
passed_safety_check BOOLEAN                 -- Safety validation result
safety_check_date TIMESTAMP                 -- Last check time
safety_checked_by UUID                      -- Checker user ID
```

#### New Tables

**food_safety_checks**
- Comprehensive safety inspections
- Temperature, packaging, condition checks
- Donor and recipient inspections
- Photo evidence support
- Safety scores (0-100)

**storage_requirements_catalog**
- Template storage requirements by food category
- Temperature ranges
- Max storage days
- Packaging requirements
- Safety guidelines

**temperature_logs**
- Time-series temperature tracking
- Location tracking (refrigerator, freezer, etc.)
- Safe range validation
- Automatic alerts

**food_safety_violations**
- Safety violation tracking
- Severity levels (low, medium, high, critical)
- Resolution workflow
- Admin oversight

### Enums

```sql
-- Storage types
storage_type: refrigerated, frozen, room_temperature, cool_dry, heated

-- Packaging types
packaging_type: sealed_original, sealed_container, wrapped, 
                open_container, unwrapped, vacuum_sealed

-- Food condition
food_condition: excellent, good, fair, poor, unsafe
```

### Safety Score Calculation

Safety scores (0-100) are auto-calculated:

```javascript
Base Score = 100

Temperature Issues:
- Out of range: -30 points

Expiration Issues:
- Expired: -40 points
- Expires today: -20 points
- Expires tomorrow: -10 points
- Expires ≤3 days: -5 points

Packaging Issues:
- Unwrapped: -15 points
- Open container (perishable): -10 points
- Wrapped: -5 points

Condition Issues:
- Unsafe: Score = 0 (automatic fail)
- Poor: -15 points
- Fair: -8 points
- Good: -3 points

Inspection Failures:
- Mold detected: -50 points
- Abnormal smell: -30 points
- Damaged packaging: -20 points

Minimum passing score: 70/100
```

## Components

### 1. FoodSafetyChecklist Component

**Location:** `components/food/FoodSafetyChecklist.jsx`

**Usage:**
```jsx
import FoodSafetyChecklist from './components/food/FoodSafetyChecklist';

<FoodSafetyChecklist
  listingId="listing-id"
  listingData={existingData}
  onUpdate={(safetyData) => handleSafetyUpdate(safetyData)}
  mode="create" // or "edit" or "view"
/>
```

**Features:**
- Storage type selector with temperature ranges
- Current temperature input with validation
- Packaging type selection (6 types)
- Food condition rating (5 levels)
- Expiration date picker with warnings
- Perishable toggle
- Allergen multi-select (12 common allergens)
- Safety notes field
- Real-time safety score calculation
- Issue detection and warnings

**Props:**
- `listingId` (string): Food listing ID
- `listingData` (object): Existing food data
- `onUpdate` (function): Callback with safety data
- `mode` (string): 'create' | 'edit' | 'view'

### 2. SafetyBadge Component

**Location:** `components/food/FoodSafetyChecklist.jsx` (exported)

**Usage:**
```jsx
import { SafetyBadge } from './components/food/FoodSafetyChecklist';

<SafetyBadge score={85} size="md" showLabel={true} />
```

**Score Levels:**
- 90-100: Excellent (Green)
- 70-89: Good (Blue)
- 50-69: Fair (Yellow)
- 30-49: Poor (Orange)
- 0-29: Unsafe (Red)

### 3. TemperatureMonitor Component

**Location:** `components/food/FoodSafetyChecklist.jsx` (exported)

**Usage:**
```jsx
import { TemperatureMonitor } from './components/food/FoodSafetyChecklist';

<TemperatureMonitor
  listingId="listing-id"
  storageType="refrigerated"
/>
```

**Features:**
- Temperature logging interface
- Safe range display
- Recent temperature history
- Location tracking (refrigerator, freezer, cooler, ambient)
- Visual safe/unsafe indicators

### 4. SafetyInspectionModal Component

**Location:** `components/food/SafetyInspectionModal.jsx`

**Usage:**
```jsx
import SafetyInspectionModal from './components/food/SafetyInspectionModal';

<SafetyInspectionModal
  isOpen={showInspection}
  onClose={(result) => handleInspectionComplete(result)}
  listingId="listing-id"
  listingData={foodData}
/>
```

**Features:**
- Multi-step inspection wizard (4 sections)
- Temperature check
- Packaging inspection (4 criteria)
- Food condition assessment (5 criteria)
- Expiration & safety verification (4 criteria)
- Critical issue warnings
- Photo evidence upload
- Overall safety determination

**Inspection Sections:**
1. **Temperature Check**
   - Record current temperature
   - Validate against safe range

2. **Packaging Inspection**
   - Packaging intact
   - Properly sealed
   - Clean appearance
   - Contents labeled

3. **Food Condition**
   - Normal appearance
   - Normal smell
   - No mold
   - No discoloration
   - Normal texture

4. **Expiration & Safety**
   - Expiration date visible
   - Within expiration date
   - Allergens labeled
   - Stored properly

### 5. Admin Food Safety Monitoring

**Location:** `pages/admin/FoodSafetyMonitoring.jsx`

**Features:**
- Safety statistics dashboard
- Violation tracking and resolution
- Safety check history
- Compliance monitoring
- Storage type distribution
- Real-time metrics

## Service Layer

### FoodSafetyService

**Location:** `utils/foodSafetyService.js`

**Key Methods:**

```javascript
// Get storage requirements for category
const requirements = await FoodSafetyService.getStorageRequirements('dairy');

// Perform safety check
await FoodSafetyService.performSafetyCheck(listingId, {
  checkType: 'donor',
  temperature: 38,
  temperatureInRange: true,
  packagingIntact: true,
  // ... other checks
  overallSafe: true,
  safetyScore: 95
});

// Calculate safety score
const result = FoodSafetyService.calculateSafetyScore(listing, checkData);
// Returns: { score: 85, issues: [...], passed: true }

// Log temperature
await FoodSafetyService.logTemperature(listingId, 38, 'refrigerator');

// Get temperature logs
const logs = await FoodSafetyService.getTemperatureLogs(listingId, 10);

// Report violation
await FoodSafetyService.reportViolation(
  listingId,
  'temperature_abuse',
  'Temperature exceeded safe range',
  'high'
);

// Validate listing before submission
const validation = await FoodSafetyService.validateFoodListing(listingData);
// Returns: { isValid: true, errors: [], warnings: [] }

// Get safety statistics (admin)
const stats = await FoodSafetyService.getSafetyStatistics();

// Format temperature display
const formatted = FoodSafetyService.formatTemperature(38);
// Returns: "38°F (3.3°C)"

// Get recommended storage
const storage = FoodSafetyService.getRecommendedStorage('dairy');
```

**Constants:**

```javascript
// Storage temperature ranges
STORAGE_TEMPS = {
  refrigerated: { min: 32, max: 40, label: 'Refrigerated (32-40°F)' },
  frozen: { min: -10, max: 0, label: 'Frozen (0°F or below)' },
  room_temperature: { min: 50, max: 70, label: 'Room Temperature (50-70°F)' },
  cool_dry: { min: 50, max: 70, label: 'Cool & Dry (below 70°F)' },
  heated: { min: 140, max: 165, label: 'Hot (140°F or above)' }
};

// Food categories with defaults
FOOD_CATEGORIES = {
  dairy: { storage: 'refrigerated', perishable: true, maxDays: 7 },
  meat: { storage: 'refrigerated', perishable: true, maxDays: 2 },
  produce_cold: { storage: 'refrigerated', perishable: true, maxDays: 7 },
  // ... more categories
};

// Common allergens
COMMON_ALLERGENS = [
  'dairy', 'eggs', 'fish', 'shellfish', 'tree nuts', 'peanuts',
  'wheat', 'gluten', 'soy', 'sesame', 'mustard', 'celery'
];
```

## Integration Examples

### 1. Add Safety Checklist to Food Listing Form

```jsx
// In ShareFoodPage.jsx
import FoodSafetyChecklist from '../components/food/FoodSafetyChecklist';

const [safetyData, setSafetyData] = useState(null);

// In form JSX:
<FoodSafetyChecklist
  onUpdate={(data) => setSafetyData(data)}
  mode="create"
/>

// On form submit:
const submitListing = async () => {
  const listingData = {
    ...formData,
    ...safetyData // Merge safety data
  };
  
  // Validate first
  const validation = await FoodSafetyService.validateFoodListing(listingData);
  if (!validation.isValid) {
    toast.error(validation.errors.join(', '));
    return;
  }
  
  if (validation.warnings.length > 0) {
    toast.warning(validation.warnings.join(', '));
  }
  
  // Submit listing
  await createListing(listingData);
};
```

### 2. Show Safety Badge on Food Cards

```jsx
// In FoodCard.jsx
import { SafetyBadge } from './FoodSafetyChecklist';

<div className="food-card">
  <h3>{food.title}</h3>
  {food.passed_safety_check !== null && (
    <SafetyBadge 
      score={food.safety_score || 0} 
      size="sm" 
      showLabel={true} 
    />
  )}
</div>
```

### 3. Recipient Safety Inspection Before Pickup

```jsx
// In FoodDetailPage.jsx or claim flow
import SafetyInspectionModal from './SafetyInspectionModal';

const [showInspection, setShowInspection] = useState(false);

<button onClick={() => setShowInspection(true)}>
  Inspect Food Safety
</button>

<SafetyInspectionModal
  isOpen={showInspection}
  onClose={(result) => {
    setShowInspection(false);
    if (result?.passed) {
      // Allow claim/pickup
      proceedWithClaim();
    } else {
      // Warn user
      toast.warning('Safety concerns detected. Review before accepting.');
    }
  }}
  listingId={foodId}
  listingData={food}
/>
```

### 4. Temperature Monitoring for Donors

```jsx
// In UserDashboard.jsx or UserListings.jsx
import { TemperatureMonitor } from './FoodSafetyChecklist';

{userListings.map(listing => (
  <div key={listing.id}>
    <h4>{listing.title}</h4>
    {listing.is_perishable && (
      <TemperatureMonitor
        listingId={listing.id}
        storageType={listing.storage_requirements}
      />
    )}
  </div>
))}
```

### 5. Admin Route for Safety Monitoring

```jsx
// In app.jsx
import FoodSafetyMonitoring from './pages/admin/FoodSafetyMonitoring';

<Route
  path="/admin/food-safety"
  element={
    <AdminRoute>
      <FoodSafetyMonitoring />
    </AdminRoute>
  }
/>
```

## Workflow Examples

### Complete Food Sharing with Safety Checks

```
1. Donor creates listing
   → Fills out FoodSafetyChecklist
   → Selects storage type: refrigerated
   → Records current temp: 38°F ✓
   → Sets packaging: sealed_original
   → Sets condition: excellent
   → Sets expiry: 7 days from now
   → Marks allergens: dairy
   → Safety score calculated: 95/100 ✓
   → Listing approved

2. System monitors temperature
   → Donor logs temps daily
   → All within safe range ✓
   → Automatic alerts if out of range

3. Recipient browses listings
   → Sees SafetyBadge: 95 - Excellent
   → Views full safety details
   → Checks allergen info: dairy ⚠️ (allergic)
   → Skips this item

4. Different recipient claims food
   → Before pickup, opens SafetyInspectionModal
   → Section 1: Temperature check
     • Records 37°F ✓ Within range
   → Section 2: Packaging inspection
     • Intact ✓, Sealed ✓, Clean ✓, Labeled ✓
   → Section 3: Food condition
     • Appearance ✓, Smell ✓, No mold ✓
   → Section 4: Expiration & Safety
     • Date visible ✓, Within date ✓
   → Overall: PASSED ✓
   → Proceeds with pickup

5. After pickup
   → Verification photos taken
   → Safety check recorded
   → Trust score updated for both users
```

### Temperature Violation Workflow

```
1. Donor creates listing
   → Food: Fresh chicken
   → Storage: refrigerated (32-40°F)
   → Current temp: 45°F ⚠️ Out of range!
   → Safety score: 70/100 (borderline)
   → Warning shown: "Temperature too high"

2. Donor logs correction
   → Moves to colder part of fridge
   → New temp: 38°F ✓
   → Score improves to 95/100

3. If temperature stays high
   → Automatic violation created
   → Severity: high
   → Admin notified
   → Listing may be suspended
```

### Expired Food Prevention

```
1. Donor tries to list food
   → Expiry date: yesterday
   → Validation fails: "Food has already expired"
   → Cannot submit listing

2. Food expiring soon
   → Expiry: tomorrow
   → Urgency level: critical
   → Warning: "Food expires very soon"
   → Listing allowed with warning
   → Shown prominently to recipients
```

## Database Migration

**File:** `supabase/migrations/031_add_food_safety_checklist.sql`

**Apply Migration:**

```bash
# Local Supabase
npm run supabase:reset

# Remote Supabase
supabase db push
```

**Migration includes:**
- 3 new enums (storage_type, packaging_type, food_condition)
- 4 new tables (food_safety_checks, storage_requirements_catalog, temperature_logs, food_safety_violations)
- Extended food_listings table (19 new columns)
- Auto-safety-check function and trigger
- Temperature logging function
- Safety score calculation function
- 10 default storage requirement templates
- Complete RLS policies
- Performance indexes

## Safety Guidelines & Best Practices

### Storage Temperature Ranges

| Storage Type | Temperature Range | Use For |
|-------------|------------------|---------|
| Refrigerated | 32-40°F (0-4°C) | Dairy, meat, produce |
| Frozen | 0°F (-18°C) or below | Long-term storage |
| Room Temp | 50-70°F (10-21°C) | Canned goods, bakery |
| Cool & Dry | Below 70°F | Grains, cereals |
| Heated | 140-165°F (60-74°C) | Hot prepared foods |

### Food Storage Maximums

| Category | Refrigerated | Frozen | Room Temp |
|----------|-------------|--------|-----------|
| Dairy | 7 days | N/A | N/A |
| Fresh Meat | 1-2 days | 180 days | N/A |
| Cooked Meat | 3-4 days | 90 days | N/A |
| Produce (cold) | 5-7 days | Varies | N/A |
| Produce (room) | N/A | N/A | 3-5 days |
| Bakery | 5 days | 90 days | 5 days |
| Prepared Cold | 3-4 days | 90 days | N/A |
| Eggs | 21 days | N/A | N/A |

### Critical Safety Rules

1. **Never list expired food** - System prevents this
2. **Monitor temperature** - Log daily for perishables
3. **Proper packaging** - Always seal perishable foods
4. **Label allergens** - Protect recipients from allergic reactions
5. **When in doubt, throw it out** - Safety over waste

### Packaging Requirements

- **Sealed Original**: Best for pre-packaged foods
- **Sealed Container**: Food-grade containers with tight lids
- **Wrapped**: Plastic wrap, aluminum foil (minimum for cooked foods)
- **Vacuum Sealed**: Ideal for freezing, extends shelf life
- **Open Container**: Only for non-perishable items
- **Unwrapped**: Avoid for shared food (safety risk)

## Testing

### Manual Testing Checklist

**Safety Checklist Component:**
- [ ] All storage types selectable
- [ ] Temperature validation works
- [ ] Out-of-range temps show warning
- [ ] Packaging types all selectable
- [ ] Condition levels all work
- [ ] Expired date prevents listing
- [ ] Expiry warnings show correctly
- [ ] Allergen multi-select works
- [ ] Safety score calculates correctly
- [ ] Issues display for problems

**Safety Inspection Modal:**
- [ ] All 4 sections accessible
- [ ] Boolean checks toggle correctly
- [ ] Temperature input works
- [ ] Critical failures show warnings
- [ ] Overall safety calculates correctly
- [ ] Modal submits successfully
- [ ] Result passed to parent

**Temperature Monitor:**
- [ ] Temperature logging works
- [ ] Safe range displays
- [ ] Out-of-range detection works
- [ ] Recent logs display
- [ ] Location selection works

**Admin Dashboard:**
- [ ] Statistics load correctly
- [ ] Violations display
- [ ] Resolve violation works
- [ ] Safety checks table loads
- [ ] Storage breakdown shows

### Automated Tests

```javascript
// tests/FoodSafety.test.js
import { render, fireEvent } from '@testing-library/react';
import FoodSafetyService from '../utils/foodSafetyService';

test('calculates safety score correctly', () => {
  const listing = {
    storage_requirements: 'refrigerated',
    packaging_type: 'sealed_original',
    current_condition: 'excellent',
    expiry_date: '2024-12-31',
    is_perishable: true
  };
  
  const result = FoodSafetyService.calculateSafetyScore(listing, {
    temperature: 38
  });
  
  expect(result.score).toBeGreaterThanOrEqual(90);
  expect(result.passed).toBe(true);
  expect(result.issues).toHaveLength(0);
});

test('detects expired food', () => {
  const listing = {
    expiry_date: '2020-01-01', // Expired
    storage_requirements: 'refrigerated',
    packaging_type: 'sealed_original',
    current_condition: 'good'
  };
  
  const result = FoodSafetyService.calculateSafetyScore(listing);
  expect(result.score).toBeLessThan(70);
  expect(result.issues).toContain('Food has expired');
});
```

## Troubleshooting

### "Safety score not calculating"
**Solution:** Ensure all required fields are set (storage_requirements, packaging_type, current_condition)

### "Temperature out of range but listing still submitted"
**Solution:** Check auto_check_food_safety trigger is active:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'trigger_auto_food_safety';
```

### "Can't log temperature"
**Solution:** Verify user owns the listing and listing exists:
```sql
SELECT * FROM food_listings WHERE id = 'listing-id' AND user_id = 'user-id';
```

### "Allergen warnings not showing"
**Solution:** Ensure allergen_info array is properly formatted:
```javascript
allergen_info: ['dairy', 'eggs'] // Not 'dairy, eggs'
```

## Future Enhancements

- [ ] IoT temperature sensor integration
- [ ] Barcode scanning for expiration dates
- [ ] AI-powered food condition assessment from photos
- [ ] Automatic expiry reminders
- [ ] Food safety certification badges
- [ ] Integration with USDA food safety database
- [ ] Multi-language safety guidelines
- [ ] Mobile app push notifications for temp alerts

## Support & Resources

- **User Guide:** See food safety section in USER_HANDBOOK.md
- **Admin Guide:** Admin safety procedures documented above
- **Quick Reference:** Storage temp chart in app Help section
- **API Reference:** Service methods documented in foodSafetyService.js

---

**Food Safety is Everyone's Responsibility!** 🍎✅

By following these guidelines and using the safety checklist system, we create a safer food sharing community for everyone.

