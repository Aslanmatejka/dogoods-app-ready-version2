# Food Urgency & Expiration Tracking - Feature Documentation

## Overview
Complete urgency tracking system for food listings with real-time countdown timers and visual indicators. Helps recipients prioritize items that need to be claimed soon, reducing food waste.

## What Was Implemented

✅ **Database Migration** - Adds `pickup_by` timestamp and auto-calculated `urgency_level` fields
✅ **Urgency Calculation Service** - Smart algorithms to calculate urgency and countdown timers
✅ **Visual Components** - Color-coded badges, countdown timers, and urgency indicators
✅ **Form Integration** - Donors can set specific pickup deadlines
✅ **Smart Sorting** - Listings automatically sorted by urgency (most urgent first)

---

## Database Schema

### Migration: `028_add_urgency_tracking.sql`

**New Fields:**
- `pickup_by` (TIMESTAMP): Specific deadline for pickup (optional, more precise than expiry_date)
- `urgency_level` (TEXT): Auto-calculated urgency level (critical/high/medium/normal/none)

**Urgency Levels:**
- **Critical** 🚨: Less than 6 hours remaining
- **High** ⚠️: Less than 24 hours remaining
- **Medium** ⏰: Less than 72 hours (3 days) remaining
- **Normal** ✓: More than 72 hours remaining
- **None** −: No deadline set or expired

**Auto-Calculation:**
```sql
-- Trigger automatically updates urgency_level on insert/update
CREATE TRIGGER trigger_update_urgency
    BEFORE INSERT OR UPDATE OF pickup_by, expiry_date
    ON food_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_urgency_level();
```

**Database Function:**
```sql
-- PostgreSQL function to calculate urgency
calculate_urgency_level(pickup_deadline, expiry_date) 
-- Returns: 'critical', 'high', 'medium', 'normal', or 'none'
```

---

## Setup Steps

### 1. Apply Database Migration

```bash
# For local development with Supabase
npm run supabase:reset

# Or manually in Supabase SQL Editor
# Run: supabase/migrations/028_add_urgency_tracking.sql
```

### 2. Verify Tables Updated

```sql
-- Check new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'food_listings' 
AND column_name IN ('pickup_by', 'urgency_level');

-- Test urgency calculation
SELECT id, title, pickup_by, expiry_date, urgency_level 
FROM food_listings 
WHERE status = 'active' 
LIMIT 10;
```

### 3. Start the App

```bash
npm run dev
```

---

## Components Reference

### 1. UrgencyService (`utils/urgencyService.js`)

**Purpose**: Calculate urgency levels and format countdown timers

**Key Methods:**

```javascript
import UrgencyService from '../utils/urgencyService';

// Calculate urgency level for a food listing
const urgencyLevel = UrgencyService.calculateUrgencyLevel(foodListing);
// Returns: 'critical', 'high', 'medium', 'normal', or 'none'

// Get complete urgency information
const urgencyInfo = UrgencyService.getUrgencyInfo(foodListing);
// Returns: { urgencyLevel, deadline, secondsRemaining, countdown, config, isExpired, isUrgent, shouldShowCountdown }

// Sort listings by urgency (most urgent first)
const sortedListings = UrgencyService.sortByUrgency(allListings);

// Filter out expired listings
const activeListings = UrgencyService.filterExpired(allListings);

// Get only critical/high priority items
const urgentListings = UrgencyService.getUrgentListings(allListings);
```

**Countdown Format:**
```javascript
const countdown = UrgencyService.formatCountdown(secondsRemaining);
// Returns: { expired: false, text: "2h 30m remaining", value: 2, unit: "hours", detailed: {...} }
```

---

### 2. UrgencyBadge Component (`components/food/UrgencyBadge.jsx`)

**Purpose**: Display urgency with countdown timer (full version)

**Usage:**
```jsx
import UrgencyBadge from '../components/food/UrgencyBadge';

<UrgencyBadge 
    foodListing={food}        // Required: food listing object
    showCountdown={true}      // Optional: show countdown timer (default: true)
    compact={false}           // Optional: compact version (default: false)
/>
```

**Appearance:**
- Critical: Red border, pulsing effect, urgent message
- High: Orange border, shows hours remaining
- Medium: Yellow border, shows days/hours
- Normal: Green border, simple "Available" badge

---

### 3. UrgencyIndicator Component (`components/food/UrgencyBadge.jsx`)

**Purpose**: Compact inline indicator (for food cards/lists)

**Usage:**
```jsx
import { UrgencyIndicator } from '../components/food/UrgencyBadge';

<UrgencyIndicator foodListing={food} />
```

**Features:**
- Only shows for critical/high priority items
- Compact badge with icon and countdown
- Color-coded (red for critical, orange for high)

---

### 4. CountdownTimer Component (`components/food/UrgencyBadge.jsx`)

**Purpose**: Real-time countdown display

**Usage:**
```jsx
import { CountdownTimer } from '../components/food/UrgencyBadge';

<CountdownTimer deadline={food.pickup_by || food.expiry_date} />
```

**Features:**
- Updates every second for critical items (<6 hours)
- Updates every minute for other items
- Pulse animation for urgent items
- Shows clock icon

---

## Usage Examples

### Example 1: For Donors (Setting Pickup Deadline)

**FoodForm Component** (`components/food/FoodForm.jsx`)

Donors can now set a specific pickup deadline:

```jsx
<Input
    label="Pickup Deadline (Optional)"
    name="pickup_by"
    type="datetime-local"
    value={formData.pickup_by}
    onChange={handleChange}
    min={new Date().toISOString().slice(0, 16)}
    helperText="Set a specific time when food must be picked up by. Creates urgency for recipients!"
/>
```

**How Donors Use It:**
1. Fill in food details (title, quantity, category)
2. Set expiry date (if applicable)
3. **NEW:** Optionally set pickup deadline for more precise urgency
4. Submit listing
5. System automatically calculates and displays urgency level

---

### Example 2: For Recipients (Viewing Urgency)

**FoodCard Component** (`components/food/FoodCard.jsx`)

Recipients see urgency indicators on food cards:

```jsx
import { UrgencyIndicator } from './UrgencyBadge';

<div className="flex items-center space-x-2 flex-wrap gap-2">
    {/* Shows only for critical/high priority items */}
    <UrgencyIndicator foodListing={food} />
    
    {/* Existing expiration badge */}
    <span className="badge badge-fresh">Fresh</span>
</div>
```

---

### Example 3: Sorting by Urgency (FindFoodPage)

**FindFoodPage Component** (`pages/FindFoodPage.jsx`)

Recipients can sort listings by urgency:

```jsx
import UrgencyService from '../utils/urgencyService';

// Add sorting dropdown
<select name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
    <option value="urgency">🚨 Most Urgent</option>
    <option value="newest">🆕 Newest First</option>
    <option value="distance">📍 Nearest</option>
</select>

// In filteredFoods useMemo
if (filters.sortBy === 'urgency') {
    result = UrgencyService.sortByUrgency(result);
}
```

**Default Behavior:**
- Listings are sorted by urgency (most urgent first) by default
- Critical items appear at the top
- Expired items are automatically hidden

---

### Example 4: Dashboard Urgent Items Widget

Create a widget to show only urgent items:

```jsx
import UrgencyService from '../utils/urgencyService';
import UrgencyBadge from '../components/food/UrgencyBadge';

function UrgentFoodWidget({ listings }) {
    const urgentItems = UrgencyService.getUrgentListings(listings);
    
    if (urgentItems.length === 0) {
        return <p>No urgent items at this time.</p>;
    }
    
    return (
        <div className="urgent-food-widget">
            <h3 className="text-lg font-bold text-red-600 mb-4">
                🚨 Urgent Food Items ({urgentItems.length})
            </h3>
            {urgentItems.map(food => (
                <div key={food.id} className="mb-3">
                    <h4>{food.title}</h4>
                    <UrgencyBadge foodListing={food} compact={true} />
                </div>
            ))}
        </div>
    );
}
```

---

## User Flows

### Donor Flow
1. **Share Food** → Navigate to Share Food page
2. **Fill Details** → Enter title, quantity, category, etc.
3. **Set Expiry** → Enter expiration date (required for most categories)
4. **Set Pickup Deadline (NEW)** → Optionally set specific pickup time
5. **Submit** → System calculates urgency automatically
6. **Recipients See Urgency** → Food appears with urgency badge

### Recipient Flow
1. **Find Food** → Navigate to Find Food page
2. **Sort by Urgency (NEW)** → Select "Most Urgent" from dropdown
3. **See Critical Items First** → Red/orange badges at top
4. **View Countdown** → Real-time countdown shows time remaining
5. **Claim Quickly** → Act fast on critical items
6. **Reduce Waste** → Help prevent food from expiring

---

## Visual Design

### Color Coding
- **Critical (Red)**: `bg-red-100`, `text-red-800`, `border-red-300`
- **High (Orange)**: `bg-orange-100`, `text-orange-800`, `border-orange-300`
- **Medium (Yellow)**: `bg-yellow-100`, `text-yellow-800`, `border-yellow-300`
- **Normal (Green)**: `bg-green-50`, `text-green-700`, `border-green-200`

### Icons
- Critical: 🚨
- High: ⚠️
- Medium: ⏰
- Normal: ✓

### Animations
- Critical items: Subtle pulse animation
- Countdown timer: Updates every second for critical, every minute for others

---

## Testing Checklist

### Database Tests
- [ ] Migration applies successfully
- [ ] New columns exist: `pickup_by`, `urgency_level`
- [ ] Trigger calculates urgency correctly
- [ ] Existing listings updated with urgency levels

### UI Tests
- [ ] Pickup deadline field appears in food donation form
- [ ] Can select date/time for pickup deadline
- [ ] UrgencyIndicator shows on food cards (critical/high only)
- [ ] Full UrgencyBadge displays with countdown
- [ ] Countdown updates in real-time
- [ ] Sorting dropdown includes urgency option

### Functional Tests
- [ ] Create listing without pickup deadline (uses expiry_date)
- [ ] Create listing with pickup deadline (uses pickup_by)
- [ ] Listings sorted by urgency (critical first)
- [ ] Expired items don't show urgency badges
- [ ] Countdown format correct (days/hours/minutes)
- [ ] Mobile responsive design works

### Edge Cases
- [ ] No expiry date or pickup deadline → urgency_level = 'none'
- [ ] Pickup deadline in past → urgency_level = 'none'
- [ ] Exactly 6 hours remaining → urgency_level = 'critical'
- [ ] Both pickup_by and expiry_date set → pickup_by takes precedence

---

## Troubleshooting

### Issue: Urgency level not updating
**Solution**: 
```sql
-- Manually trigger urgency recalculation
UPDATE food_listings 
SET urgency_level = calculate_urgency_level(pickup_by, expiry_date)
WHERE status = 'active';
```

### Issue: Countdown not showing
**Checklist**:
1. Food listing has `pickup_by` or `expiry_date` set
2. Deadline is in the future (not expired)
3. Component receiving correct props
4. Check browser console for errors

### Issue: Sorting not working
**Solution**:
```javascript
// Ensure UrgencyService is imported
import UrgencyService from '../utils/urgencyService';

// Check filter state
console.log('Current sortBy:', filters.sortBy);

// Verify sorting logic
const sorted = UrgencyService.sortByUrgency(listings);
console.log('Sorted:', sorted);
```

---

## Performance Considerations

### Database Indexes
Migration creates indexes for efficient queries:
```sql
CREATE INDEX idx_food_listings_urgency 
ON food_listings(urgency_level, created_at) 
WHERE status = 'active';

CREATE INDEX idx_food_listings_pickup_by 
ON food_listings(pickup_by) 
WHERE status = 'active' AND pickup_by IS NOT NULL;
```

### Real-Time Updates
- Critical items: Countdown updates every second
- Other items: Countdown updates every minute
- Component unmounts clear intervals automatically

### Optimization Tips
- Use `compact` prop for food cards/lists
- Use full `UrgencyBadge` only on detail pages
- Filter expired items early in data pipeline
- Consider pagination for large lists

---

## Future Enhancements

### Potential Additions
1. **Push Notifications**: Alert recipients when critical items posted
2. **Auto-Expiry**: Automatically mark listings as expired
3. **Urgency History**: Track how quickly items are claimed
4. **Smart Suggestions**: Recommend urgent items based on user preferences
5. **Email Alerts**: Daily digest of urgent items in user's area

### Integration Ideas
- Combine with dietary compatibility scoring
- Priority boost for urgent items in AI matching
- Show urgency in email notifications
- Add urgency filter to search

---

## File Structure

```
├── components/
│   └── food/
│       ├── UrgencyBadge.jsx           # Full urgency display with countdown
│       ├── FoodCard.jsx               # Updated with UrgencyIndicator
│       └── FoodForm.jsx               # Updated with pickup_by field
├── pages/
│   └── FindFoodPage.jsx               # Updated with urgency sorting
├── utils/
│   └── urgencyService.js              # Urgency calculation logic
├── supabase/
│   └── migrations/
│       └── 028_add_urgency_tracking.sql
└── URGENCY_FEATURE.md                 # This documentation
```

---

## API Reference

### UrgencyService Static Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `calculateUrgencyLevel(foodListing)` | `foodListing` object | String | Calculate urgency level |
| `getDeadline(foodListing)` | `foodListing` object | Date \| null | Get deadline (pickup_by or expiry_date) |
| `getSecondsRemaining(deadline)` | Date | Number | Calculate seconds until deadline |
| `formatCountdown(seconds)` | Number | Object | Format countdown text |
| `getUrgencyInfo(foodListing)` | `foodListing` object | Object | Complete urgency information |
| `sortByUrgency(listings)` | Array | Array | Sort by urgency (most urgent first) |
| `filterExpired(listings)` | Array | Array | Remove expired listings |
| `getUrgentListings(listings)` | Array | Array | Get only critical/high priority items |

### URGENCY_LEVELS Constants

```javascript
export const URGENCY_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  NORMAL: 'normal',
  NONE: 'none'
};
```

### URGENCY_CONFIG Constants

Each urgency level has configuration:
```javascript
{
  label: 'Critical - Expires Soon!',
  icon: '🚨',
  color: 'red',
  bgClass: 'bg-red-100',
  textClass: 'text-red-800',
  borderClass: 'border-red-300',
  badgeClass: 'bg-red-500 text-white',
  threshold: 21600 // seconds
}
```

---

## Support

For questions or issues:
- **Migration**: `supabase/migrations/028_add_urgency_tracking.sql`
- **Service Logic**: `utils/urgencyService.js`
- **Components**: `components/food/UrgencyBadge.jsx`
- **Integration**: This documentation file

## Quick Links
- [Dietary Needs Feature](DIETARY_NEEDS_FEATURE.md)
- [User Feedback System](FEEDBACK_QUICKSTART.md)
- [Copilot Instructions](.github/copilot-instructions.md)
