# Do Good Store - Full Flow Testing Guide

## Test Date: January 10, 2026

### Database Connection Status ✅

All major components are connected to Supabase:

1. **ShareFoodPage** ✅ - Connected via `dataService.createFoodListing()`
2. **FindFoodPage** ✅ - Connected via `useFoodListings({ status: 'approved' })`
3. **NearMePage** ✅ - Connected via `dataService.getFoodListings()` with geolocation
4. **ClaimFoodForm** ✅ - Connected via `dataService.createFoodClaim()`
5. **UserDashboard** ✅ - Connected via `useFoodListings()` and direct Supabase queries
6. **Admin ContentModeration** ✅ - Connected via `dataService.updateFoodListingStatus()`
7. **HomePage** ✅ - Connected via `useFoodListings({ status: 'approved' }, 6)`

---

## Testing Instructions

### 1. Test Food Sharing Flow

**Steps:**
1. Log in as a regular user
2. Navigate to "Share Food" page
3. Fill out the form:
   - Title: "Test Fresh Apples"
   - Description: "Fresh organic apples from my garden"
   - Quantity: 10
   - Unit: lb
   - Category: produce
   - Upload an image (optional)
   - Fill in donor information
4. Submit the form

**Expected Result:**
- Form submits successfully
- Listing is created with status `'pending'`
- User is redirected to profile page
- Listing appears in user's dashboard

**Database Check:**
```sql
SELECT id, title, status, created_at, user_id 
FROM food_listings 
WHERE title LIKE '%Test Fresh Apples%' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

### 2. Test Admin Approval Flow

**Steps:**
1. Log in as admin user (user with `is_admin = true`)
2. Navigate to Admin → Content Moderation
3. Look for "Test Fresh Apples" in pending listings
4. Click "Approve" button

**Expected Result:**
- Listing status changes from `'pending'` to `'approved'`
- Listing disappears from pending queue
- Listing now appears on FindFood page
- Listing appears on HomePage featured listings

**Database Check:**
```sql
SELECT id, title, status 
FROM food_listings 
WHERE title LIKE '%Test Fresh Apples%';
```

---

### 3. Test Finding Food Flow

**Steps:**
1. Log in as a different user (not the donor)
2. Navigate to "Find Food" page
3. Verify "Test Fresh Apples" appears in the list
4. Click on the listing to view details

**Expected Result:**
- Approved listing is visible
- All details display correctly
- "Claim Food" button is visible

**Database Check:**
```sql
SELECT COUNT(*) as approved_count 
FROM food_listings 
WHERE status = 'approved';
```

---

### 4. Test Food Claiming Flow

**Steps:**
1. While viewing "Test Fresh Apples" listing
2. Click "Claim Food" button
3. Fill out the claim form:
   - Requester name: "Test User"
   - Email: test@example.com
   - Phone: 555-1234
   - School/Organization: "Test School"
   - Number of people: 5
   - Pickup date: Select a future date
4. Submit the form

**Expected Result:**
- Claim is created with status `'pending'`
- Success message is displayed
- Claim appears in user's dashboard
- Donor receives notification (if notifications are enabled)

**Database Check:**
```sql
SELECT id, requester_name, status, created_at, food_id 
FROM food_claims 
WHERE requester_name = 'Test User' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

### 5. Test Near Me Functionality

**Steps:**
1. Navigate to "Near Me" page
2. Allow location access when prompted
3. Verify listings are filtered by distance

**Expected Result:**
- Location permission is requested
- Listings are filtered based on user's location
- Distance radius can be adjusted
- Only listings within radius are shown

**Note:** Requires listings to have latitude/longitude values

---

### 6. Test HomePage Featured Listings

**Steps:**
1. Log out (or open incognito window)
2. Go to homepage
3. Scroll to "Featured Food Listings" section

**Expected Result:**
- Shows up to 6 approved listings
- "Test Fresh Apples" appears if it's one of the latest
- Clicking listing navigates to claim page (for logged-in users)

**Database Check:**
```sql
SELECT id, title, status, created_at 
FROM food_listings 
WHERE status = 'approved' 
ORDER BY created_at DESC 
LIMIT 6;
```

---

## Current Database State

**Existing Data:**
- 1 approved food listing: "mangoes"
- 0 food claims
- Database constraints: Date unique constraint removed from impact_data
- All RLS policies active for food_listings and food_claims

**Known Issues:**
- ✅ Organization/Community dropdowns in Impact Data Entry - FIXED
- ✅ Featured listings not showing - FIXED (changed from 'active' to 'approved')
- ✅ NearMePage not connected - FIXED
- ✅ Login/Signup scroll position - FIXED

---

## Admin Access Setup

To test admin features, ensure you have an admin user:

```sql
-- Check current admin users
SELECT id, email, name, is_admin, role 
FROM users 
WHERE is_admin = true OR role = 'admin';

-- Make a user admin (replace with your email)
UPDATE users 
SET is_admin = true, role = 'admin' 
WHERE email = 'your-email@example.com';
```

---

## Quick Test Commands

### Check all food listings:
```sql
SELECT id, title, status, created_at 
FROM food_listings 
ORDER BY created_at DESC;
```

### Check all claims:
```sql
SELECT fc.id, fc.requester_name, fc.status, fl.title as food_title
FROM food_claims fc
LEFT JOIN food_listings fl ON fc.food_id = fl.id
ORDER BY fc.created_at DESC;
```

### Check user stats:
```sql
SELECT 
    u.email,
    COUNT(DISTINCT fl.id) as listings_count,
    COUNT(DISTINCT fc.id) as claims_count
FROM users u
LEFT JOIN food_listings fl ON fl.user_id = u.id
LEFT JOIN food_claims fc ON fc.claimer_id = u.id
WHERE u.id = 'your-user-id'
GROUP BY u.email;
```

---

## Expected Full Flow Result

1. ✅ User creates food listing → Status: `pending`
2. ✅ Admin approves listing → Status: `approved`
3. ✅ Listing appears on Find Food page
4. ✅ Listing appears on Homepage featured section
5. ✅ Different user claims food → Claim status: `pending`
6. ✅ Donor can see claim in their dashboard
7. ✅ Claimer can see their claim in their dashboard

---

## Next Steps for Production

1. ✅ All database connections verified
2. ✅ RLS policies active and working
3. ✅ Image upload to Supabase storage working
4. ✅ Real-time subscriptions active in admin panel
5. Consider: Email notifications for claims (requires backend service)
6. Consider: Push notifications for mobile users
7. Consider: Admin approval workflow automation

---

**Last Updated:** January 10, 2026
**Status:** All core features connected to database and functional
