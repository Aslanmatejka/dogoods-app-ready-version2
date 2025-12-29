# Dietary Needs Enhancement

## Overview
This feature enhances the DoGoods app to support dietary restrictions, food allergies, and preferences for better food matching between donors and recipients.

## Database Changes

### Migration: `027_add_dietary_preferences.sql`

#### Users Table - New Columns
- `dietary_restrictions` (TEXT[]) - Array of dietary restrictions (vegetarian, vegan, halal, kosher, gluten-free, etc.)
- `allergies` (TEXT[]) - Array of food allergies (nuts, dairy, eggs, shellfish, etc.)
- `dietary_preferences` (TEXT[]) - Array of preferences (organic, local, non-gmo, etc.)
- `preferred_categories` (TEXT[]) - Preferred food categories

#### Food Listings Table - New Columns
- `dietary_tags` (TEXT[]) - Tags like 'vegetarian', 'gluten-free', 'vegan', etc.
- `allergens` (TEXT[]) - Known allergens present in the food
- `ingredients` (TEXT) - Detailed ingredient list

#### Database Functions
- `check_dietary_compatibility()` - PostgreSQL function that checks if food is compatible with user restrictions
- Returns JSONB with compatibility score, warnings, and allergen conflicts

#### Views
- `user_compatible_food` - Shows all active food listings with compatibility info for each user

## New Components

### 1. DietaryPreferences Component (`components/profile/DietaryPreferences.jsx`)
**Purpose**: Reusable component for selecting dietary needs

**Features**:
- Tabbed interface (Restrictions, Allergies, Preferences)
- Visual icons and descriptions
- Multi-select capability
- Read-only mode for display
- Summary section

**Props**:
- `initialRestrictions` - Array of existing restrictions
- `initialAllergies` - Array of existing allergies
- `initialPreferences` - Array of existing preferences
- `onChange` - Callback when selections change
- `readOnly` - Display mode flag

**Dietary Options**:
- **Restrictions**: Vegetarian, Vegan, Pescatarian, Halal, Kosher, Gluten-Free, Dairy-Free, Low-Carb, Keto, Paleo
- **Allergies**: Nuts, Peanuts, Tree Nuts, Dairy, Eggs, Soy, Wheat/Gluten, Shellfish, Fish, Sesame, Mustard, Celery
- **Preferences**: Organic, Local, Non-GMO, Sugar-Free, Low Sodium, Whole Foods

### 2. FoodDietaryTags Component (`components/food/FoodDietaryTags.jsx`)
**Purpose**: Allow food donors to tag their listings with dietary information

**Features**:
- Dietary tag selection (vegetarian, vegan, gluten-free, etc.)
- Allergen warning checkboxes
- Ingredients text field
- Visual summary of food profile

**Props**:
- `selectedTags` - Array of dietary tags
- `selectedAllergens` - Array of allergens
- `ingredients` - Ingredient text
- `onChange` - Callback when data changes
- `readOnly` - Display mode flag

## Updated Components

### 1. UserSettings Page (`pages/UserSettings.jsx`)
**Changes**:
- Added new "Dietary Preferences & Allergies" section
- Integrates `DietaryPreferences` component
- Saves dietary data to database
- Loads existing dietary preferences on mount

### 2. FoodForm Component (`components/food/FoodForm.jsx`)
**Changes**:
- Added `FoodDietaryTags` component
- New form fields for `dietary_tags`, `allergens`, `ingredients`
- Dietary information saves with food listing

## New Services

### DietaryCompatibilityService (`utils/dietaryCompatibilityService.js`)

**Main Methods**:

1. `checkCompatibility(userProfile, foodListing)`
   - Checks if food matches user dietary needs
   - Returns: `{ compatible, score, warnings, allergenConflicts, reasons }`
   - Score: 0-100 (0 = incompatible due to allergens, 100 = perfect match)

2. `filterFoodListings(foodListings, userProfile, strictMode)`
   - Filters and sorts food by compatibility
   - StrictMode: Only shows allergen-safe foods
   - Returns: Sorted array with compatibility info

3. `getCompatibilitySummary(compatibilityResult)`
   - Returns human-readable summary

4. `getCompatibilityColor(score)` & `getCompatibilityBadge(score)`
   - Returns CSS classes for visual indicators

**Compatibility Logic**:
- **Critical**: Allergen conflicts → Score = 0 (incompatible)
- **High Impact**: Vegan/Vegetarian mismatch → -50 points
- **Medium Impact**: Halal/Kosher missing → -40 points
- **Low Impact**: Gluten/Dairy → -30 points
- **Bonus**: Matching preferences → +5 points each

## User Experience Flow

### For Recipients (Finding Food)

1. **Set Dietary Profile**:
   - Go to Settings
   - Navigate to "Dietary Preferences & Allergies"
   - Select restrictions, allergies, and preferences
   - Save settings

2. **Browse Food Listings**:
   - Food automatically sorted by compatibility
   - Color-coded badges show match quality:
     - 🔴 Red: Allergen conflict (Score 0)
     - 🟠 Orange: Low compatibility (Score < 50)
     - 🟡 Yellow: Moderate (Score 50-69)
     - 🔵 Blue: Good match (Score 70-89)
     - 🟢 Green: Perfect match (Score 90-100)

3. **View Compatibility Details**:
   - See warnings (e.g., "May not meet vegetarian requirements")
   - View allergen conflicts
   - Read matching reasons

### For Donors (Sharing Food)

1. **Create Food Listing**:
   - Fill in basic food information
   - Scroll to "Dietary Information & Allergens" section
   - Select applicable dietary tags
   - Check allergens present
   - Optionally list ingredients

2. **Better Matches**:
   - Tagged food appears higher in search results for matching users
   - Allergen warnings protect recipients

## Technical Implementation

### Database Queries

**Get Compatible Foods for User**:
```sql
SELECT *, check_dietary_compatibility(
    (SELECT dietary_restrictions FROM users WHERE id = $1),
    (SELECT allergies FROM users WHERE id = $1),
    dietary_tags,
    allergens
) as compatibility
FROM food_listings
WHERE status = 'active';
```

**User-Specific View**:
```sql
SELECT * FROM user_compatible_food
WHERE user_id = $1
AND (compatibility_info->>'compatible')::boolean = true
ORDER BY (compatibility_info->>'score')::integer DESC;
```

### Frontend Integration

**In FindFoodPage** (Example):
```javascript
import DietaryCompatibilityService from '../utils/dietaryCompatibilityService';

// Filter and sort food listings
const compatibleFoods = DietaryCompatibilityService.filterFoodListings(
    foodListings,
    userProfile,
    strictMode  // true = only show safe foods
);

// Display compatibility
{compatibleFoods.map(food => (
    <div key={food.id}>
        <span className={DietaryCompatibilityService.getCompatibilityColor(
            food.dietaryCompatibility.score
        )}>
            {DietaryCompatibilityService.getCompatibilitySummary(
                food.dietaryCompatibility
            )}
        </span>
    </div>
))}
```

## Setup Instructions

### 1. Apply Database Migration
```bash
# For local development
npm run supabase:reset

# Or manually run in Supabase SQL Editor
# Copy contents of: supabase/migrations/027_add_dietary_preferences.sql
```

### 2. Verify Installation
```bash
npm run dev
```

### 3. Test the Feature
1. Login and go to Settings
2. Set dietary restrictions and allergies
3. Create a food listing with dietary tags
4. Browse food listings - should see compatibility badges

## Future Enhancements

- [ ] AI-powered ingredient analysis
- [ ] Automatic dietary tag suggestions based on ingredients
- [ ] Nutritional information integration
- [ ] Recipe suggestions based on dietary needs
- [ ] Dietary community groups
- [ ] Saved dietary preference templates
- [ ] Multi-language dietary labels
- [ ] Integration with nutrition APIs

## Accessibility

- All dietary components have proper ARIA labels
- Keyboard navigation supported
- Color-blind friendly badges (use icons + text)
- Screen reader friendly descriptions

## Performance Notes

- GIN indexes on array columns for fast searching
- PostgreSQL compatibility function cached
- Frontend filtering for real-time updates
- Lazy loading of compatibility checks

## Security & Privacy

- User dietary info is private (RLS policies)
- Only user can see their own dietary preferences
- Allergen information is public for safety
- No personally identifiable dietary data shared
