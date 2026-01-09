# Dietary Needs Feature - Quick Start Guide

## What Was Implemented

✅ **Database Migration** - Adds dietary fields to users and food_listings tables
✅ **User Dietary Preferences** - Users can set restrictions, allergies, and preferences
✅ **Food Dietary Tags** - Donors can tag food with dietary information and allergens
✅ **Compatibility Checking** - Automatic matching of food to user dietary needs
✅ **Visual Indicators** - Color-coded badges show compatibility scores

## Setup Steps

### 1. Apply Database Migration

```bash
# For local development with Supabase
npm run supabase:reset

# Or manually in Supabase SQL Editor
# Run: supabase/migrations/027_add_dietary_preferences.sql
```

### 2. Start the App

```bash
npm run dev
```

## How to Use

### For Recipients (Setting Dietary Preferences)

1. **Navigate to Settings**
   - Login to your account
   - Go to Settings page

2. **Set Dietary Profile**
   - Scroll to "Dietary Preferences & Allergies" section
   - Click through tabs:
     - **Dietary Restrictions**: Select your diet type (vegetarian, vegan, halal, etc.)
     - **Allergies**: ⚠️ CRITICAL - Select all allergens you're allergic to
     - **Preferences**: Optional food preferences (organic, local, etc.)
   - Click "Save Dietary Preferences"

3. **Browse Compatible Food**
   - Visit "Find Food" page
   - Food listings now show compatibility badges:
     - 🟢 Green (90-100%): Perfect match!
     - 🔵 Blue (70-89%): Good match
     - 🟡 Yellow (50-69%): Moderate match
     - 🟠 Orange (<50%): Low compatibility
     - 🔴 Red (0%): ❌ ALLERGEN ALERT - Do not consume!

### For Donors (Adding Dietary Information)

1. **Share Food**
   - Go to "Share Food" page
   - Fill in food details (title, description, quantity, etc.)

2. **Add Dietary Information**
   - Scroll to "🥗 Dietary Information & Allergens" section
   - **Dietary Tags**: Select all that apply
     - Examples: Vegetarian, Vegan, Gluten-Free, Halal, Organic
   - **Allergen Warning**: ⚠️ Check all allergens present
     - Examples: Nuts, Dairy, Eggs, Gluten, Shellfish
   - **Ingredients** (Optional): List main ingredients

3. **Submit Listing**
   - Your food will be matched with compatible recipients
   - Recipients with allergies will see warnings

## Key Components

### 1. DietaryPreferences Component
**Location**: `components/profile/DietaryPreferences.jsx`
**Used in**: UserSettings page
**Purpose**: UI for selecting dietary restrictions, allergies, and preferences

### 2. FoodDietaryTags Component
**Location**: `components/food/FoodDietaryTags.jsx`
**Used in**: FoodForm (Share Food page)
**Purpose**: UI for donors to tag food with dietary information

### 3. DietaryCompatibilityBadge Component
**Location**: `components/food/DietaryCompatibilityBadge.jsx`
**Usage**:
```jsx
import DietaryCompatibilityBadge from '../components/food/DietaryCompatibilityBadge';

<DietaryCompatibilityBadge
    foodListing={food}
    userProfile={currentUser}
    showDetails={true}
/>
```

### 4. DietaryCompatibilityService
**Location**: `utils/dietaryCompatibilityService.js`
**Usage**:
```javascript
import DietaryCompatibilityService from '../utils/dietaryCompatibilityService';

// Check compatibility
const result = DietaryCompatibilityService.checkCompatibility(
    userProfile,
    foodListing
);

// Filter and sort listings
const compatibleFoods = DietaryCompatibilityService.filterFoodListings(
    allFoods,
    userProfile,
    strictMode  // true = only show allergen-safe foods
);
```

## Integration Examples

### Example 1: Add to FindFoodPage

```jsx
import { useAuthContext } from '../utils/AuthContext';
import DietaryCompatibilityService from '../utils/dietaryCompatibilityService';
import DietaryCompatibilityBadge from '../components/food/DietaryCompatibilityBadge';

function FindFoodPage() {
    const { user } = useAuthContext();
    const [foodListings, setFoodListings] = useState([]);
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        // Load user profile with dietary info
        async function loadProfile() {
            const { data } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();
            setUserProfile(data);
        }
        loadProfile();
    }, [user]);

    // Filter and sort by compatibility
    const compatibleFoods = useMemo(() => {
        if (!userProfile) return foodListings;
        return DietaryCompatibilityService.filterFoodListings(
            foodListings,
            userProfile,
            false  // set to true for strict allergen filtering
        );
    }, [foodListings, userProfile]);

    return (
        <div>
            {compatibleFoods.map(food => (
                <div key={food.id}>
                    <h3>{food.title}</h3>
                    <DietaryCompatibilityBadge
                        foodListing={food}
                        userProfile={userProfile}
                        showDetails={true}
                    />
                </div>
            ))}
        </div>
    );
}
```

### Example 2: Add to FoodCard Component

```jsx
import DietaryCompatibilityBadge from './DietaryCompatibilityBadge';

function FoodCard({ food, userProfile }) {
    return (
        <div className="food-card">
            <img src={food.image_url} alt={food.title} />
            <h3>{food.title}</h3>
            
            {/* Add compatibility badge */}
            <DietaryCompatibilityBadge
                foodListing={food}
                userProfile={userProfile}
                showDetails={false}  // compact view
            />
            
            <p>{food.description}</p>
        </div>
    );
}
```

## Testing Checklist

- [ ] Apply migration successfully
- [ ] Set dietary preferences in Settings
- [ ] Create food listing with dietary tags
- [ ] Browse food and see compatibility badges
- [ ] Test allergen warnings (should show red badge)
- [ ] Verify perfect matches (should show green badge)
- [ ] Check mobile responsiveness

## Database Schema Reference

### Users Table (New Columns)
```sql
dietary_restrictions TEXT[]  -- ['vegetarian', 'gluten-free']
allergies TEXT[]             -- ['nuts', 'dairy']
dietary_preferences TEXT[]   -- ['organic', 'local']
preferred_categories TEXT[]  -- ['produce', 'dairy']
```

### Food Listings Table (New Columns)
```sql
dietary_tags TEXT[]    -- ['vegetarian', 'gluten-free']
allergens TEXT[]       -- ['dairy', 'eggs']
ingredients TEXT       -- "Flour, eggs, milk..."
```

## Troubleshooting

### Issue: Dietary preferences not saving
**Solution**: Check Supabase connection and ensure migration ran successfully

### Issue: Compatibility badges not showing
**Solution**: Make sure user has set dietary preferences in Settings

### Issue: Food tags not displaying
**Solution**: Ensure FoodForm includes FoodDietaryTags component

## Next Steps

1. **Apply migration**: `npm run supabase:reset`
2. **Test locally**: Set preferences and create listings
3. **Integrate badges**: Add DietaryCompatibilityBadge to FindFoodPage and FoodCard
4. **Deploy**: Push changes and run migration on production

## File Structure

```
├── components/
│   ├── food/
│   │   ├── DietaryCompatibilityBadge.jsx  # Display compatibility
│   │   ├── FoodDietaryTags.jsx            # Tag food (donor)
│   │   └── FoodForm.jsx                   # Updated with dietary section
│   └── profile/
│       └── DietaryPreferences.jsx         # Set preferences (user)
├── pages/
│   └── UserSettings.jsx                   # Updated with dietary section
├── utils/
│   └── dietaryCompatibilityService.js     # Matching logic
├── supabase/
│   └── migrations/
│       └── 027_add_dietary_preferences.sql
└── DIETARY_NEEDS_FEATURE.md              # Full documentation
```

## Support

For questions or issues, refer to:
- Full documentation: `DIETARY_NEEDS_FEATURE.md`
- Database migration: `supabase/migrations/027_add_dietary_preferences.sql`
- Compatibility service: `utils/dietaryCompatibilityService.js`
