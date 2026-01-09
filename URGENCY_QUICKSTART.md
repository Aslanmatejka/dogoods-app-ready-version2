# Food Urgency System - Quick Start

## What Was Built

✅ **Urgency Tracking** - Real-time countdown for expiring food items
✅ **Visual Indicators** - Color-coded badges (🚨 Critical, ⚠️ High, ⏰ Medium)
✅ **Smart Sorting** - Automatic sorting by urgency (most urgent first)
✅ **Pickup Deadlines** - Donors can set specific pickup times
✅ **Auto-Calculation** - Database automatically calculates urgency levels

---

## Setup (2 Minutes)

### 1. Apply Database Migration
```bash
npm run supabase:reset
```

### 2. Start the App
```bash
npm run dev
```

---

## How to Use

### For Donors 🎁

**Share food with urgency:**

1. Go to **Share Food** page
2. Fill in food details
3. **NEW:** Set "Pickup Deadline" (optional)
   - Example: "Today at 5:00 PM" for fresh food that must be picked up today
4. Submit listing
5. System automatically calculates urgency and shows countdown to recipients

**When to use pickup deadlines:**
- Fresh produce with same-day pickup
- Prepared meals that need immediate pickup
- Items you need gone by specific time
- Events ending at specific time

### For Recipients 🍎

**Find urgent food quickly:**

1. Go to **Find Food** page
2. **NEW:** Use "Sort by" dropdown → Select "🚨 Most Urgent"
3. Critical items (< 6 hours) appear first with red badge
4. See real-time countdown: "2h 30m remaining"
5. Claim quickly to prevent waste!

**Urgency Levels:**
- 🚨 **Critical** (Red): Less than 6 hours - act now!
- ⚠️ **High** (Orange): Less than 24 hours - claim soon
- ⏰ **Medium** (Yellow): Less than 3 days - consider claiming
- ✓ **Normal** (Green): More than 3 days - plenty of time

---

## Testing Quick Guide

### Test Scenario 1: Create Urgent Listing
1. Share food
2. Set pickup deadline to 4 hours from now
3. Submit
4. Go to Find Food
5. ✅ Should see red "Critical" badge with countdown

### Test Scenario 2: Sorting
1. Find Food page
2. Change "Sort by" to "Most Urgent"
3. ✅ Items with red/orange badges should appear first

### Test Scenario 3: Countdown Timer
1. Find a critical item (< 6 hours)
2. Watch countdown timer
3. ✅ Should update every minute showing time remaining

---

## Components Created

### 1. Database
- **File**: `supabase/migrations/028_add_urgency_tracking.sql`
- **Fields**: `pickup_by`, `urgency_level`
- **Auto-calculation**: Trigger updates urgency on every change

### 2. Service
- **File**: `utils/urgencyService.js`
- **Methods**: `sortByUrgency()`, `getUrgencyInfo()`, `formatCountdown()`

### 3. Components
- **UrgencyBadge**: Full display with countdown (`components/food/UrgencyBadge.jsx`)
- **UrgencyIndicator**: Compact badge for cards
- **CountdownTimer**: Real-time countdown display

### 4. Integration
- **FoodForm**: Added pickup deadline field
- **FoodCard**: Shows urgency indicator
- **FindFoodPage**: Added urgency sorting

---

## Examples

### Example: Show Urgency on Food Details Page

```jsx
import UrgencyBadge from '../components/food/UrgencyBadge';

<UrgencyBadge 
    foodListing={food} 
    showCountdown={true} 
/>
```

### Example: Filter Only Urgent Items

```javascript
import UrgencyService from '../utils/urgencyService';

const urgentItems = UrgencyService.getUrgentListings(allListings);
// Returns only critical and high priority items
```

### Example: Custom Sorting

```javascript
// Sort by urgency (most urgent first)
const sorted = UrgencyService.sortByUrgency(listings);

// Remove expired items
const active = UrgencyService.filterExpired(listings);
```

---

## Troubleshooting

### Urgency not showing?
- Check that food has `pickup_by` or `expiry_date` set
- Verify deadline is in the future (not expired)
- Apply migration: `npm run supabase:reset`

### Countdown not updating?
- Check browser console for errors
- Countdown updates every minute (every second for critical items)

### Sorting not working?
- Ensure migration applied successfully
- Check `filters.sortBy` state value

---

## Full Documentation

See [URGENCY_FEATURE.md](URGENCY_FEATURE.md) for:
- Complete API reference
- Advanced usage examples
- Database schema details
- Performance optimization tips

---

## Impact

This feature helps:
- ✅ Reduce food waste by prioritizing expiring items
- ✅ Create urgency for recipients to claim quickly
- ✅ Give donors control over pickup timing
- ✅ Improve visibility of time-sensitive food
- ✅ Enhance user experience with real-time countdowns

**Default behavior**: All food listings now sorted by urgency, with most urgent items appearing first!
