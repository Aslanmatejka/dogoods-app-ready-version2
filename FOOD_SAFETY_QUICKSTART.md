# Food Safety Checklist - Quick Start Guide

## 🚀 5-Minute Setup

### 1. Apply Database Migration

```bash
# Apply migration
npm run supabase:reset

# OR for remote Supabase
supabase db push
```

### 2. Verify Tables Created

```bash
# Check new tables exist
supabase db show

# You should see:
# - food_safety_checks
# - storage_requirements_catalog
# - temperature_logs
# - food_safety_violations
```

### 3. Test Safety Service

```javascript
// Open browser console
import FoodSafetyService from './utils/foodSafetyService';

// Test storage requirements
const dairy = await FoodSafetyService.getStorageRequirements('dairy');
console.log('Dairy storage:', dairy);

// Test safety score calculation
const mockListing = {
  storage_requirements: 'refrigerated',
  packaging_type: 'sealed_original',
  current_condition: 'excellent',
  expiry_date: '2024-12-31',
  is_perishable: true
};

const score = FoodSafetyService.calculateSafetyScore(mockListing, { temperature: 38 });
console.log('Safety score:', score);
```

## Quick Integration

### Add Safety Checklist to Food Form

**File:** `pages/ShareFoodPage.jsx`

```jsx
// 1. Import component
import FoodSafetyChecklist from '../components/food/FoodSafetyChecklist';

// 2. Add state
const [safetyData, setSafetyData] = useState(null);

// 3. Add to form (before submit button)
<FoodSafetyChecklist
  onUpdate={(data) => setSafetyData(data)}
  mode="create"
/>

// 4. Merge safety data on submit
const handleSubmit = async () => {
  const listingData = {
    ...formData,
    ...safetyData  // Add safety info
  };
  
  // Validate
  const validation = await FoodSafetyService.validateFoodListing(listingData);
  if (!validation.isValid) {
    toast.error(validation.errors.join(', '));
    return;
  }
  
  // Submit
  await createListing(listingData);
};
```

### Add Safety Badge to Food Cards

**File:** `components/food/FoodCard.jsx`

```jsx
// 1. Import badge
import { SafetyBadge } from './FoodSafetyChecklist';

// 2. Add to card (after title)
{food.passed_safety_check !== null && (
  <SafetyBadge 
    score={food.safety_score || 0} 
    size="sm" 
  />
)}
```

### Add Safety Inspection Before Pickup

**File:** `pages/FoodDetailPage.jsx`

```jsx
// 1. Import modal
import SafetyInspectionModal from '../components/food/SafetyInspectionModal';

// 2. Add state
const [showInspection, setShowInspection] = useState(false);

// 3. Add button
<button onClick={() => setShowInspection(true)}>
  <i className="fas fa-clipboard-check mr-2"></i>
  Inspect Safety
</button>

// 4. Add modal
<SafetyInspectionModal
  isOpen={showInspection}
  onClose={(result) => {
    setShowInspection(false);
    if (result?.passed) {
      // Safe to claim
      handleClaim();
    }
  }}
  listingId={foodId}
  listingData={food}
/>
```

### Add Temperature Monitoring

**File:** `pages/UserDashboard.jsx`

```jsx
// 1. Import component
import { TemperatureMonitor } from '../components/food/FoodSafetyChecklist';

// 2. Add to perishable listings
{listing.is_perishable && (
  <div className="mt-4">
    <TemperatureMonitor
      listingId={listing.id}
      storageType={listing.storage_requirements}
    />
  </div>
)}
```

### Add Admin Safety Route

**File:** `app.jsx`

```jsx
// 1. Import dashboard
import FoodSafetyMonitoring from './pages/admin/FoodSafetyMonitoring';

// 2. Add route
<Route
  path="/admin/food-safety"
  element={
    <AdminRoute>
      <FoodSafetyMonitoring />
    </AdminRoute>
  }
/>
```

## Essential Service Methods

### Calculate Safety Score
```javascript
const result = FoodSafetyService.calculateSafetyScore(listing, checkData);
// Returns: { score: 85, issues: [...], passed: true }
```

### Validate Listing
```javascript
const validation = await FoodSafetyService.validateFoodListing(listingData);
// Returns: { isValid: true, errors: [], warnings: [] }
```

### Log Temperature
```javascript
await FoodSafetyService.logTemperature(listingId, 38, 'refrigerator');
```

### Perform Safety Check
```javascript
await FoodSafetyService.performSafetyCheck(listingId, {
  checkType: 'donor',
  temperature: 38,
  temperatureInRange: true,
  packagingIntact: true,
  overallSafe: true,
  safetyScore: 95
});
```

## Storage Temperature Quick Reference

| Type | Temperature | Examples |
|------|------------|----------|
| Refrigerated | 32-40°F | Dairy, meat, produce |
| Frozen | 0°F or below | Long-term storage |
| Room Temp | 50-70°F | Canned goods, bakery |
| Heated | 140-165°F | Hot prepared foods |

## Common Allergens

Select from 12 common allergens:
- dairy, eggs, fish, shellfish
- tree nuts, peanuts, wheat, gluten
- soy, sesame, mustard, celery

## Safety Score Levels

| Score | Level | Color | Meaning |
|-------|-------|-------|---------|
| 90-100 | Excellent | Green | Optimal safety |
| 70-89 | Good | Blue | Safe to share |
| 50-69 | Fair | Yellow | Use caution |
| 30-49 | Poor | Orange | Not recommended |
| 0-29 | Unsafe | Red | Do not share |

## Food Condition Ratings

- **Excellent** ⭐ - Fresh, perfect condition
- **Good** 👍 - Good quality
- **Fair** ⚠️ - Acceptable, nearing expiration
- **Poor** 😟 - Past prime, use immediately
- **Unsafe** 🚫 - Not safe for consumption

## Packaging Types

- **Sealed Original** 📦 - Original packaging (best)
- **Sealed Container** 🥡 - Food-grade container with lid
- **Wrapped** 🎁 - Plastic wrap/foil
- **Vacuum Sealed** 🔒 - Vacuum sealed (best for freezing)
- **Open Container** 🥣 - Open but covered
- **Unwrapped** ⚠️ - No packaging (not recommended)

## Testing Checklist

Quick tests to verify system works:

- [ ] **Create Listing with Safety Checklist**
  - Select storage type → see temp range
  - Enter temperature → see validation
  - Set expiry date → see days until expiry
  - Select packaging → updates score
  - Set condition → affects score
  - Check allergens → saves to list
  - View calculated safety score

- [ ] **Safety Inspection Modal**
  - Open modal from food detail
  - Complete 4-section inspection
  - Check temperature validation
  - Mark critical failures → see warnings
  - Submit inspection → saves to database

- [ ] **Temperature Monitoring**
  - Log temperature for perishable item
  - See if in safe range
  - View recent logs
  - Check out-of-range warning

- [ ] **Safety Badge Display**
  - Food card shows safety badge
  - Color matches score level
  - Label shows correct level

- [ ] **Admin Dashboard**
  - View safety statistics
  - See active violations
  - Check safety checks history
  - View storage breakdown

## Common Issues & Fixes

### "Safety score shows 0"
**Solution:** Ensure all required fields are set:
```javascript
{
  storage_requirements: 'refrigerated', // Required
  packaging_type: 'sealed_original',    // Required
  current_condition: 'good'             // Required
}
```

### "Can't submit expired food"
**Solution:** This is intentional! System prevents listing expired food:
```javascript
// Validation will fail with:
{ isValid: false, errors: ['Food has already expired'] }
```

### "Temperature out of range warning"
**Solution:** Temperature is outside safe range. Either:
1. Adjust storage to correct temperature
2. Log new temperature reading
3. Change storage type if needed

### "Allergen list not saving"
**Solution:** Ensure allergens is an array:
```javascript
allergen_info: ['dairy', 'eggs']  // Correct
// NOT: 'dairy, eggs' or 'dairy'
```

### "Safety check not appearing in admin"
**Solution:** Check RLS policies allow admin access:
```sql
SELECT * FROM food_safety_checks 
WHERE listing_id = 'your-listing-id';

-- If empty, check your admin status
SELECT is_admin FROM users WHERE id = auth.uid();
```

## Integration Workflow

### Complete Food Sharing with Safety

```
1. Donor creates listing
   └─> Fills FoodSafetyChecklist
       ├─ Storage: refrigerated
       ├─ Temp: 38°F ✓
       ├─ Packaging: sealed_original
       ├─ Condition: excellent
       ├─ Expiry: 7 days
       ├─ Allergens: dairy
       └─ Score: 95/100 ✓

2. System auto-validates
   └─> passed_safety_check = true
       └─> Listing goes live

3. Donor monitors temp
   └─> Logs daily temperatures
       └─> All within 32-40°F ✓

4. Recipient views listing
   └─> Sees Safety Badge: 95 - Excellent
       └─> Checks allergens: dairy ⚠️
           └─> Skips (allergic)

5. Other recipient claims
   └─> Opens SafetyInspectionModal
       ├─ Section 1: Temperature ✓
       ├─ Section 2: Packaging ✓
       ├─ Section 3: Condition ✓
       └─ Section 4: Expiration ✓
           └─> Overall: PASSED ✓
               └─> Proceeds with pickup

6. After pickup
   └─> Verification photos
       └─> Safety check recorded
           └─> Trust scores updated
```

## Default Storage Requirements

The system includes 10 pre-configured food categories:

1. **Dairy** - Refrigerated, 7 days max
2. **Fresh Meat** - Refrigerated, 2 days max
3. **Frozen Meat** - Frozen, 180 days max
4. **Refrigerated Produce** - Refrigerated, 7 days
5. **Room Temp Produce** - Room temp, 5 days
6. **Bakery** - Room temp, 5 days
7. **Canned Goods** - Room temp, 730 days
8. **Prepared Hot** - Heated, use immediately
9. **Prepared Cold** - Refrigerated, 3 days
10. **Eggs** - Refrigerated, 21 days

Each includes:
- Temperature ranges
- Max storage days
- Packaging requirements
- Safety guidelines
- Allergen warnings

## Next Steps

1. **Customize Categories**
   - Add more food categories in storage_requirements_catalog
   - Update temperature ranges for your region
   - Add location-specific guidelines

2. **Configure Alerts**
   - Set up email notifications for temp violations
   - Alert donors when food nearing expiry
   - Notify admin of critical violations

3. **Add IoT Integration**
   - Connect temperature sensors
   - Auto-log temperatures
   - Real-time monitoring

4. **Enhance Inspection**
   - Add photo requirements
   - Barcode scanning for expiry dates
   - AI condition assessment

5. **Monitor & Improve**
   - Review safety statistics weekly
   - Analyze violation patterns
   - Update guidelines based on data

## Resources

- **Full Documentation:** `FOOD_SAFETY_FEATURE.md`
- **User Guide:** Food safety section in `USER_HANDBOOK.md`
- **Database Schema:** `supabase/migrations/031_add_food_safety_checklist.sql`
- **Service Code:** `utils/foodSafetyService.js`
- **Components:** `components/food/FoodSafetyChecklist.jsx`

## Support

Having issues? Check:

1. Browser console for errors
2. Database migration applied successfully
3. RLS policies allow required access
4. All required fields provided
5. Service methods match documentation

---

**Keep Food Safe! Keep Community Safe!** 🍎✅🛡️

