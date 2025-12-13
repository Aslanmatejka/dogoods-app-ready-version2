# Admin Edit Mode Setup for Impact Story Page

## Overview
Admin users can now edit content directly on the Impact Story page using an inline CMS-like editing interface.

## Features
- ✅ Admin-only edit button (visible only to users with `is_admin = true`)
- ✅ Inline content editing with contentEditable
- ✅ Visual indicators for editable sections (blue outline on hover/focus)
- ✅ Edit toolbar with Save and Cancel buttons
- ✅ Content persistence to Supabase with localStorage fallback
- ✅ Real-time content updates

## Editable Sections
The following content sections can be edited by admins:

### Hero Section
- `heroTitle`: Main page title
- `heroSubtitle`: Page subtitle/tagline

### Featured Content
- `featuredTitle`: "Bridging the Gap Between Surplus and Need"
- `featuredP1`: First paragraph of featured content
- `featuredP2`: Second paragraph of featured content

### Stories
- `sarahTitle`: Sarah's story title
- `sarahQuote`: Sarah's testimonial quote
- `michaelTitle`: Michael's story title
- `michaelQuote`: Michael's testimonial quote

### News Section
- `newsQuote`: Featured quote from food bank director
- `newsAttribution`: Attribution text

### Gallery
- `gallery1Title`: Community Centers title
- `gallery1Desc`: Community Centers description
- `gallery2Title`: Restaurant Partners title
- `gallery2Desc`: Restaurant Partners description
- `gallery3Title`: Environmental Impact title
- `gallery3Desc`: Environmental Impact description

## Database Setup

### 1. Run the Migration
Execute the migration file in your Supabase SQL editor:

```bash
# Navigate to Supabase dashboard -> SQL Editor
# Run the file: supabase/migrations/021_create_page_content.sql
```

Or copy and paste this SQL:

```sql
-- Create page_content table for storing editable page content
CREATE TABLE IF NOT EXISTS page_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_name VARCHAR(255) UNIQUE NOT NULL,
    content JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on page_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_page_content_page_name ON page_content(page_name);

-- Enable Row Level Security
ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Allow public read access to page_content"
    ON page_content
    FOR SELECT
    USING (true);

-- Policy: Allow only admins to manage page_content
CREATE POLICY "Allow admins to manage page_content"
    ON page_content
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

-- Add comment
COMMENT ON TABLE page_content IS 'Stores editable content for CMS-like page editing by admins';
```

### 2. Verify Table Creation
```sql
SELECT * FROM page_content;
```

## Usage Instructions

### For Admins
1. **Navigate to Impact Story Page**: Visit `/impact-story`
2. **Click Edit Button**: Floating blue button in bottom-right corner
3. **Edit Content**: 
   - Click on any section with blue outline on hover
   - Edit text directly in the browser
   - Content auto-saves on blur (when you click outside)
4. **Save Changes**: Click "Save Changes" in the toolbar (top-right)
5. **Cancel Editing**: Click "Cancel" to revert to original content
6. **Exit Edit Mode**: Click the edit button again to toggle off

### Visual Indicators
- **Edit Mode Active**: Blue "Edit Mode" badge in toolbar
- **Editable Sections**: Blue dashed outline on hover
- **Focused Section**: Solid blue outline with shadow
- **Admin Button**: Rotating blue gradient circle

## Technical Implementation

### State Management
```javascript
const [isEditMode, setIsEditMode] = useState(false);
const [editableContent, setEditableContent] = useState({});
const [originalContent, setOriginalContent] = useState({});
```

### Content Loading
Content is loaded from:
1. **Supabase** (primary): `page_content` table
2. **localStorage** (fallback): Offline or if Supabase fails
3. **Default values**: Hardcoded in `getContent()` function

### Content Saving
When "Save Changes" is clicked:
1. Attempts to save to Supabase `page_content` table
2. Falls back to localStorage if Supabase fails
3. Always saves to localStorage as backup
4. Shows success/error message to admin

### Example Code
```jsx
<h1 
    className="text-5xl font-bold text-white editable"
    contentEditable={isEditMode}
    suppressContentEditableWarning
    onBlur={(e) => handleContentEdit('heroTitle', e.target.textContent)}
>
    {getContent('heroTitle', 'Our Impact Story')}
</h1>
```

## Styling
Custom CSS classes added to `styles/components.css`:

```css
.editable {
    cursor: text;
    transition: all 0.2s;
}

.editable:hover {
    outline: 2px dashed #3b82f6;
    outline-offset: 4px;
}

.editable:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 4px;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.edit-mode .editable {
    border: 1px dashed #cbd5e1;
    padding: 8px;
    border-radius: 4px;
}

.admin-edit-btn {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;
    z-index: 1000;
}

.admin-edit-btn:hover {
    transform: scale(1.1) rotate(90deg);
}

.edit-toolbar {
    position: fixed;
    top: 80px;
    right: 2rem;
    background: white;
    padding: 1rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1000;
}
```

## Testing

### Test Edit Functionality
1. Login as admin user
2. Navigate to `/impact-story`
3. Click edit button
4. Modify hero title
5. Click save
6. Refresh page
7. Verify changes persist

### Test Permission Checks
1. Login as regular (non-admin) user
2. Navigate to `/impact-story`
3. Verify edit button is NOT visible
4. Verify content is read-only

### Test localStorage Fallback
1. Disconnect from Supabase (or simulate error)
2. Edit content and save
3. Check localStorage for `impactStoryContent` key
4. Verify content persists across page reloads

## Troubleshooting

### Edit Button Not Visible
- Verify you're logged in as admin user
- Check `users` table: `is_admin = true` for your user
- Check browser console for auth errors

### Content Not Saving
- Check browser console for Supabase errors
- Verify `page_content` table exists
- Verify RLS policies are enabled
- Check localStorage as fallback

### Content Not Loading
- Check Supabase connection in browser console
- Verify table and policies exist
- Clear localStorage: `localStorage.removeItem('impactStoryContent')`
- Hard refresh page (Ctrl+Shift+R / Cmd+Shift+R)

## Security

### Row Level Security (RLS)
- ✅ Public read access to all content
- ✅ Admin-only write access (insert/update/delete)
- ✅ Verified through `users.is_admin` column

### Content Validation
- Client-side: Basic text sanitization
- Server-side: Supabase RLS policies enforce admin-only writes

## Future Enhancements
- [ ] Rich text editing (bold, italic, links)
- [ ] Image upload for gallery
- [ ] Version history/rollback
- [ ] Preview mode before saving
- [ ] Bulk edit multiple sections
- [ ] Content scheduling (publish date)
- [ ] Multi-language support
- [ ] Content templates

## Files Modified
- `pages/ImpactStory.jsx` - Added edit mode functionality
- `styles/components.css` - Added edit mode styles (inline)
- `supabase/migrations/021_create_page_content.sql` - Created database table

## Dependencies
- `@supabase/supabase-js` - Database operations
- `utils/AuthContext.jsx` - Admin authentication check
- `utils/supabaseClient.js` - Supabase client instance
