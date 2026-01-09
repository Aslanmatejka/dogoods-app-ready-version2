# Hero Slideshow Setup

## Overview
Admin-editable slideshow at the top of the homepage with automatic transitions and manual navigation.

## Features
- ✅ Auto-advancing slideshow (5-second intervals)
- ✅ Manual navigation (previous/next arrows)
- ✅ Dot indicators for slide position
- ✅ Admin-only management UI
- ✅ Add/remove slides with image URLs and captions
- ✅ Smooth fade transitions between slides
- ✅ Responsive design with overlay gradient
- ✅ Database persistence with default fallback

## Quick Setup

### Step 1: Run the Database Migration

Open your Supabase dashboard → SQL Editor and run:

```sql
-- Create hero_slides table for homepage slideshow
CREATE TABLE IF NOT EXISTS hero_slides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url TEXT NOT NULL,
    caption TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_hero_slides_order ON hero_slides(order_index);
CREATE INDEX IF NOT EXISTS idx_hero_slides_active ON hero_slides(is_active);

-- Enable Row Level Security
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to active slides
CREATE POLICY "Allow public read access to hero_slides"
    ON hero_slides
    FOR SELECT
    USING (is_active = true);

-- Policy: Allow admins to manage all slides
CREATE POLICY "Allow admins to manage hero_slides"
    ON hero_slides
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

-- Insert default slides
INSERT INTO hero_slides (image_url, caption, order_index) VALUES
    ('https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1920&q=80', 'Share Food, Reduce Waste, Build Community', 0),
    ('https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1920&q=80', 'Fighting Food Waste Together', 1),
    ('https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1920&q=80', 'Connecting Communities Through Food', 2)
ON CONFLICT DO NOTHING;
```

### Step 2: Make Your User an Admin

In Supabase dashboard → Table Editor → users table:
- Find your user and set `is_admin = true`

### Step 3: Manage Slides

1. Visit the homepage at `/`
2. You'll see the slideshow at the top
3. As an admin, click the "Manage Slides" button (top-right of slideshow)
4. Add new slides by entering:
   - **Image URL**: Direct link to an image (e.g., from Unsplash, Imgur, or your own hosting)
   - **Caption**: Optional text overlay for the slide
5. Remove slides by clicking the trash icon next to each slide
6. Changes are saved immediately to the database

## Database Schema

### Table: `hero_slides`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `image_url` | TEXT | URL to the slide image |
| `caption` | TEXT | Optional text overlay |
| `order_index` | INTEGER | Display order (0 = first) |
| `is_active` | BOOLEAN | Whether slide is visible (default: true) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Row Level Security (RLS)
- **Public**: Can read active slides (`is_active = true`)
- **Admins**: Can create, read, update, delete all slides

## Finding Good Images

### Free Image Sources
1. **Unsplash** (https://unsplash.com/) - Free high-quality photos
   - Right-click image → Copy image address
   - Paste URL into slideshow manager
   
2. **Pexels** (https://pexels.com/) - Free stock photos
   - Click image → Download → Copy URL from browser
   
3. **Pixabay** (https://pixabay.com/) - Free images and videos
   - Click image → Get share link

### Recommended Image Specs
- **Dimensions**: 1920x600px or higher (wide format)
- **Aspect Ratio**: 16:9 or wider
- **File Size**: Optimize for web (< 500KB if possible)
- **Format**: JPEG or PNG

### Example Image URLs (Food-related)
```
https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1920&q=80
https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1920&q=80
https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1920&q=80
https://images.unsplash.com/photo-1542838132-92c53300491e?w=1920&q=80
https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=1920&q=80
```

## Usage

### For Visitors
- Slideshow auto-advances every 5 seconds
- Click arrows to navigate manually
- Click dots at bottom to jump to specific slide
- Captions appear at bottom center of each slide

### For Admins
1. **Add a Slide**:
   - Click "Manage Slides"
   - Enter image URL and caption
   - Click "Add Slide"
   - New slide appears at the end

2. **Remove a Slide**:
   - Click "Manage Slides"
   - Find the slide in the list
   - Click the trash icon
   - Confirm deletion

3. **Reorder Slides**:
   - Currently: Remove and re-add in desired order
   - Future: Drag-and-drop reordering

## Technical Details

### Component: `HeroSlideshow.jsx`
- Located in `components/common/`
- Uses React hooks for state management
- Connects to Supabase for data persistence
- Falls back to default slides if database is empty

### Auto-Advance
- Interval: 5000ms (5 seconds)
- Pauses when user interacts with navigation
- Resumes automatically after interaction

### Transitions
- Fade effect with 1-second duration
- CSS opacity transitions for smooth animation
- Dark gradient overlay for text readability

### Responsive Design
- Full-width on all screen sizes
- Height: 500px fixed
- Images use `object-cover` to maintain aspect ratio
- Navigation arrows hide on mobile for cleaner look

## Customization

### Change Slide Duration
Edit `HeroSlideshow.jsx` line 70:
```javascript
}, 5000); // Change to desired milliseconds
```

### Change Height
Edit `HeroSlideshow.jsx` line 154:
```javascript
<div className="relative h-[500px] overflow-hidden bg-gray-900">
```

### Change Overlay Color
Edit `HeroSlideshow.jsx` line 172:
```javascript
<div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/30" />
```

### Caption Styling
Edit `HeroSlideshow.jsx` lines 175-180 to customize font, size, position

## Troubleshooting

### Slideshow Not Showing
- Check that migration ran successfully
- Verify default slides were inserted
- Check browser console for errors
- Clear browser cache and refresh

### Manage Button Not Visible
- Verify you're logged in as admin (`is_admin = true`)
- Check browser console for auth errors
- Refresh the page

### Images Not Loading
- Verify image URLs are valid and publicly accessible
- Check for HTTPS URLs (HTTP may be blocked)
- Try a different image URL
- Check browser console for CORS errors

### Slides Not Saving
- Verify you're logged in as admin
- Check Supabase connection in console
- Verify RLS policies are enabled
- Check that table exists in Supabase

## Future Enhancements
- [ ] Drag-and-drop slide reordering
- [ ] Image upload directly from computer (Supabase Storage)
- [ ] Schedule slides (start/end dates)
- [ ] Slide-specific links/buttons
- [ ] Video slides support
- [ ] Animation effects (slide, zoom, pan)
- [ ] Mobile-optimized images
- [ ] Analytics (view counts, click tracking)

## Files Created/Modified
- `components/common/HeroSlideshow.jsx` - Slideshow component
- `pages/HomePage.jsx` - Integrated slideshow at top
- `supabase/migrations/022_create_hero_slides.sql` - Database schema

## Security
- ✅ RLS policies enforce admin-only writes
- ✅ Public read access for active slides only
- ✅ Input validation for image URLs
- ✅ Confirmation dialogs for destructive actions
