# Impact Story Page - Admin Edit Guide

## Overview

The Impact Story page is now **fully editable** by admin users. All text content, buttons, headings, testimonials, and descriptions can be edited inline without touching any code.

## How to Edit Content

### 1. Access Admin Edit Mode

1. **Log in as an admin user** (user with `is_admin = true` in the database)
2. **Navigate to the Impact Story page** at `/impact-story`
3. **Click the floating blue edit button** in the bottom-right corner of the page
   - The button has a pencil icon
   - When edit mode is active, it turns red

### 2. Edit Content

Once edit mode is active:

- **All editable sections** will have a dashed blue outline
- **Click on any section** to edit the text directly
- **Type or modify** the content as needed
- **Hover over sections** to highlight them (light blue background)
- **Click outside** or press Tab to finish editing that section

### 3. Save Your Changes

- Click the **"Save Changes"** green button in the toolbar (top-right)
- Your changes will be saved to both:
  - **Supabase database** (`page_content` table)
  - **Browser localStorage** (as backup)
- You'll see a success message when saved

### 4. Cancel Edits

- Click the **"Cancel"** gray button in the toolbar to discard all unsaved changes
- The page will revert to the last saved state

---

## Editable Content Sections

### Hero Section
- **Title**: "Our Impact Story"
- **Subtitle**: Main tagline about the platform

### Featured Section
- **Title**: "Bridging the Gap Between Surplus and Need"
- **Paragraph 1**: First featured description
- **Paragraph 2**: Second featured description
- **Button Text**: "Join Our Network →"

### Stories Section
- **Sarah's Story**:
  - Title: "Sarah's Story: From Volunteer to Champion"
  - Quote: Full testimonial text
  - Attribution: "— Sarah Martinez, Community Coordinator, Alameda"

- **Restaurant Partnership Story**:
  - Title: "Restaurant Partnership: A Win-Win Solution"
  - Quote: Michael Chen's testimonial
  - Attribution: "— Michael Chen, Owner, Golden Wok Restaurant"

### News Section
- **Quote**: Food bank director testimonial
- **Attribution**: "Director of Community Services"
- **Organization**: "Alameda County Food Bank"
- **Statistics**: Network stats paragraph
- **Button Text**: "Support Our Mission"

### Gallery Section
- **Community Centers**:
  - Title: "Community Centers"
  - Description: Stats about community partnerships

- **Restaurant Partners**:
  - Title: "Restaurant Partners"
  - Description: Restaurant network details

- **Environmental Impact**:
  - Title: "Environmental Impact"
  - Description: CO2 and water conservation stats

- **Button Text**: "View All Stories"

### Call-to-Action (CTA) Section
- **Title**: "Be Part of Our Story"
- **Subtitle**: Motivational message
- **Button 1 Text**: "Join the Platform"
- **Button 2 Text**: "Support Our Mission"

### Newsletter Section
- **Title**: "Stay Updated on Our Impact"
- **Description**: Newsletter signup description
- **Form Labels**:
  - First Name Label: "First Name *"
  - Last Name Label: "Last Name *"
  - Email Label: "Email Address *"
- **Consent Text**: Privacy agreement text
- **Button Text**: "Subscribe to Newsletter"
- **Button Submitting Text**: "Subscribing..."

---

## Database Storage

All edits are stored in the **`page_content`** table in Supabase:

```sql
SELECT * FROM page_content WHERE page_name = 'impact-story';
```

**Table Structure:**
- `id` (UUID): Unique identifier
- `page_name` (VARCHAR): Always "impact-story" for this page
- `content` (JSONB): All editable content as key-value pairs
- `created_at` (TIMESTAMP): First creation time
- `updated_at` (TIMESTAMP): Last edit time

**Content Keys Examples:**
- `heroTitle`: Hero section title
- `heroSubtitle`: Hero section subtitle
- `featuredTitle`: Featured section heading
- `sarahQuote`: Sarah's testimonial
- `newsQuote`: News section quote
- And many more...

---

## Fallback Behavior

The page has a **dual-storage system** for reliability:

1. **Primary**: Saves to Supabase `page_content` table
2. **Backup**: Also saves to browser `localStorage`

If Supabase is unavailable:
- Changes save to localStorage automatically
- Content loads from localStorage on next visit
- Admins will see a warning that changes may not persist

---

## Best Practices

### Content Guidelines
1. **Keep it concise**: Shorter testimonials are more impactful
2. **Update stats regularly**: Refresh numbers monthly/quarterly
3. **Test links**: Ensure all buttons point to correct URLs
4. **Check mobile**: View changes on mobile devices

### Technical Tips
1. **Save frequently**: Click "Save Changes" after each major edit
2. **Preview before saving**: Review all changes in edit mode
3. **Use Cancel wisely**: If you make a mistake, click "Cancel" to revert
4. **Check the database**: Verify changes persisted with SQL query above

### Common Issues
- **Changes not saving**: Check browser console for errors
- **Content not loading**: Verify you're logged in as admin
- **Edit button not visible**: Confirm `is_admin = true` in `users` table
- **Styles breaking**: Avoid pasting rich text; use plain text only

---

## Permissions

### Admin Access Required
Only users with **`is_admin = true`** can:
- See the floating edit button
- Enter edit mode
- Save content changes

### Setting Admin Status

To make a user an admin, run this SQL in Supabase:

```sql
UPDATE users 
SET is_admin = true, role = 'admin' 
WHERE email = 'admin@example.com';
```

---

## Migration Table Setup

The `page_content` table is already created. If you need to recreate it:

```sql
CREATE TABLE IF NOT EXISTS page_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_name VARCHAR(255) NOT NULL UNIQUE,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read
CREATE POLICY "Public can view page content"
    ON page_content FOR SELECT
    USING (true);

-- Policy: Only admins can update
CREATE POLICY "Only admins can update page content"
    ON page_content FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );
```

---

## Feature Highlights

✅ **Inline Editing**: Edit content directly on the page  
✅ **Auto-Save to Database**: Changes persist across sessions  
✅ **LocalStorage Backup**: Offline fallback for reliability  
✅ **Visual Feedback**: Dashed outlines show editable areas  
✅ **Cancel Option**: Revert changes before saving  
✅ **Admin-Only**: Secured with role-based access control  
✅ **No Code Required**: Content team can edit without developers  
✅ **Mobile Friendly**: Edit toolbar adapts to screen size  

---

## Future Enhancements

Potential improvements for future versions:

- [ ] Image upload capability for story photos
- [ ] Rich text editor for formatting (bold, italic, lists)
- [ ] Version history and rollback
- [ ] Multi-language support
- [ ] Preview mode before saving
- [ ] Scheduled content publishing
- [ ] Analytics on edited sections

---

## Support

If you encounter issues with the editing feature:

1. **Check browser console** for error messages
2. **Verify admin status** in the database
3. **Clear localStorage** if content seems corrupted
4. **Contact development team** for database-level issues

**Last Updated**: January 10, 2026  
**Feature Status**: ✅ Production Ready
