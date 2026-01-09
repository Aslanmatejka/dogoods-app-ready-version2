# Slideshow Troubleshooting - Quick Fix

## ✅ Issue Fixed
The slideshow wasn't showing because of an incorrect Supabase import. This has been fixed in the latest commit.

## Current Status
The slideshow should now display with **default slides** even before running the database migration.

## What You Should See Now

### 1. Refresh Your Browser
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- You should see 3 default slides auto-rotating every 5 seconds
- Navigation arrows on left/right sides
- Dot indicators at the bottom

### 2. Default Slides (No Database Required)
Even without running the migration, you'll see these default slides:
1. "Share Food, Reduce Waste, Build Community"
2. "Fighting Food Waste Together"
3. "Connecting Communities Through Food"

### 3. For Admin Features (Add/Remove Slides)
To manage slides, you need to:

**Step 1: Run the Migration**
```bash
# Copy the SQL from: supabase/migrations/022_create_hero_slides.sql
# Paste into Supabase Dashboard → SQL Editor → Run
```

**Step 2: Make Yourself Admin**
```sql
-- In Supabase Dashboard → Table Editor → users table
-- Find your user row and set: is_admin = true
```

**Step 3: Test Admin Features**
- Refresh homepage
- You should see "Manage Slides" button (top-right of slideshow)
- Click it to add/remove slides

## Still Not Seeing the Slideshow?

### Check 1: Browser Console
1. Open browser dev tools (F12)
2. Go to Console tab
3. Look for errors
4. Share any errors you see

### Check 2: Clear Cache
```bash
# In browser:
- Ctrl+Shift+Delete (Chrome/Edge)
- Clear cached images and files
- Reload page
```

### Check 3: Check Network Tab
1. Open dev tools (F12)
2. Go to Network tab
3. Refresh page
4. Look for failed requests to image URLs

### Check 4: Verify Component is Loaded
In browser console, type:
```javascript
// Should see the HeroSlideshow component in the page
document.querySelector('.relative.h-\\[500px\\]')
```

## Common Issues & Solutions

### "Manage Slides" Button Not Showing
- **Cause**: Not logged in as admin
- **Fix**: Set `is_admin = true` in users table

### Images Not Loading
- **Cause**: Image URLs blocked or invalid
- **Fix**: Check if images load directly in browser tab

### Slideshow Area is Blank/Gray
- **Cause**: JavaScript error preventing render
- **Fix**: Check browser console for errors

### Slides Not Saving
- **Cause**: Database table doesn't exist
- **Fix**: Run the migration SQL

## Test the Fix

### Quick Test (No Database)
1. Visit: http://localhost:3001
2. You should immediately see the slideshow with 3 default slides
3. Slides should auto-rotate every 5 seconds
4. Arrow buttons should work

### Full Test (With Database)
1. Run migration in Supabase
2. Set your user as admin
3. Visit homepage
4. Click "Manage Slides"
5. Add a new slide with this URL:
   ```
   https://images.unsplash.com/photo-1542838132-92c53300491e?w=1920&q=80
   ```
6. Caption: "Community Food Sharing"
7. Click "Add Slide"
8. New slide should appear in rotation

## Need More Help?

Share:
1. Browser console errors (if any)
2. Screenshot of what you see
3. Whether you've run the migration
4. Whether you're logged in as admin

The default slides should work immediately without any database setup! 🎉
