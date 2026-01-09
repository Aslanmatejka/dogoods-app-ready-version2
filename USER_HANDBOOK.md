# DoGoods Platform - User Handbook

**Quick Reference Guide for Users and Administrators**

---

## About DoGoods

DoGoods is a community-driven food sharing platform that connects surplus food with people in need. Our mission is to reduce food waste, feed communities, and build meaningful connections through the act of sharing.

### Platform Values
- **Community First**: Building connections through food sharing
- **Zero Waste**: Reducing food waste in our communities
- **Accessibility**: Free platform for everyone
- **Safety**: Ensuring safe food handling and respectful interactions
- **Impact**: Measuring and celebrating our collective difference

---

## Quick Start Guide

### For New Users (5 Minutes)

1. **Sign Up** → Enter email, password, location
2. **Verify Email** → Click link sent to your inbox
3. **Complete Profile** → Add photo, phone, bio (optional)
4. **Start Browsing** → Click "Find Food" to see available items
5. **Claim or Share** → Either claim food you need or share surplus

### First-Time Food Sharing (10 Minutes)

1. Navigate to **"Share Food"**
2. Fill required fields: title, description, quantity, category
3. Add pickup location and available dates
4. Upload 1-3 photos of the food
5. Submit and wait for admin approval (typically 24 hours)

### First-Time Food Claiming (5 Minutes)

1. Browse **"Find Food"** or **"Near Me"**
2. Click listing → Review details
3. Click **"Claim Food"** button
4. Enter pickup date/time and quantity needed
5. Wait for donor approval notification

---

## Platform Overview

### User Roles

| Role | Access Level | Key Features |
|------|-------------|--------------|
| **Guest** | View only | Browse listings, read impact stories |
| **User** | Standard | Find food, share food, manage claims, profile |
| **Admin** | Full access | All user features + approvals, data entry, content editing |

### Main Navigation

```
Home → Landing page with slideshow and impact metrics
Share Food → Create new food listing
Find Food → Browse/search available food listings
Community → View posts, stories, and discussions
Impact Story → Community achievements and stories
Sponsors → View platform sponsors and partners
```

**Additional Pages (Protected - Require Login):**
- Near Me → Location-based food search
- Profile → Your profile and settings
- Dashboard → Your activity and statistics
- Notifications → View notifications
- Settings → Account settings

---

## Core Features Reference

### 🔍 Finding Food

**Search Options:**
- Browse all listings (map + list view)
- Search by keyword
- Filter by category (produce, bakery, dairy, pantry)
- Sort by distance, date, popularity

**Claiming Process:**
1. Select listing
2. Click "Claim Food"
3. Choose pickup time
4. Add message (optional)
5. Submit claim
6. Wait for approval
7. Pick up at scheduled time

**Claim Statuses:**
- `Pending` - Awaiting donor approval
- `Approved` - Ready for pickup
- `Completed` - Successfully picked up
- `Rejected` - Donor declined
- `Cancelled` - Claim withdrawn

### 🍎 Sharing Food

**Required Information:**
- Food title and description
- Quantity available
- Category/type
- Pickup address
- Available dates (from/until)

**Optional Information:**
- Photos (highly recommended)
- Special instructions
- Dietary/allergen info
- Serving size
- Expiration date

**Listing Statuses:**
- `Pending` - Under admin review
- `Available` - Active and claimable
- `Claimed` - Someone has claimed
- `Completed` - Successfully shared
- `Cancelled` - Removed by user
- `Rejected` - Denied by admin

### 📊 Dashboard

**Dashboard Overview:**

The User Dashboard shows your activity summary with:

**Statistics Cards:**
- Active Listings - Number of your current listings
- Food Saved - Total food you've saved (in kg)
- People Helped - Total people helped through your contributions

**Quick Actions:**
- Share Food - Quick access to create a new listing
- Find Food - Browse available items

**Recent Activity:**
- Timeline of your recent listings and claims

**Notifications:**
- Listing expiring soon alerts
- Claim requests and approvals

**Note:** To manage your listings and claims in detail:
- Go to **Profile** → View **Listings Tab**
- Check **Notifications** page for claims

---

## Admin Features

### Admin Access Requirements

**How to Access:**
1. Contact platform administrator to grant admin access
2. Admin access is set in user account settings
3. Log out and log back in after access is granted
4. "Admin Panel" option appears in profile dropdown

**Admin Dashboard Access:**
Profile Icon → **"Admin Panel"** (appears only for admin users)

### Admin Dashboard Sections

The admin dashboard has the following sections accessible from the sidebar:

- **Dashboard** - Overview and pending food listings
- **User Management** - Manage all registered users
- **Content Moderation** - Review and moderate food listings
- **Posts & Blog** - Manage community posts and blog content
- **Food Distribution** - Manage food distribution events
- **Distribution Attendees** - Track event attendees
- **Impact Data Entry** - Enter impact metrics
- **Reports & Analytics** - View platform statistics
- **Settings** - Admin settings and configuration

### Admin Capabilities

#### 1. Food Listing Management (Dashboard Tab)
**Path:** Admin Panel → Dashboard → Pending Foods Tab

**Actions:**
- Review submitted listings
- Approve (make visible to users)
- Reject (with reason)
- Edit listing details
- Delete inappropriate content

**Approval Criteria:**
- ✅ Clear, accurate description
- ✅ Appropriate photos
- ✅ Valid location information
- ✅ Safe, non-expired food
- ❌ Commercial sales attempts
- ❌ Inappropriate content
- ❌ Spam or fake listings

#### 2. Impact Data Entry
**Path:** Admin Panel → Impact Data Entry

**Data Fields (8 columns):**
1. **Date** - Entry date
2. **Food Saved from Waste (lb)** - Green metric
3. **Food Provided (lb)** - Green metric
4. **People Helped** - Green metric
5. **Schools Served** - Blue metric
6. **Non-Profits Helped** - Blue metric
7. **Total Meals Provided** - Purple metric
8. **Notes** - Optional context

**Operations:**
- **Add Row**: Fill top green row → Click **+**
- **Edit Cell**: Click any cell → Edit → Auto-saves on blur
- **Delete Row**: Click trash icon → Confirm
- **Export**: Click "Export CSV" for spreadsheet

**How It Works:**
Admin enters data → Saves to platform → Homepage updates automatically

#### 3. Homepage Slideshow Management
**Access:** Visit homepage → Click **"Manage Slides"** (top-right)

**Slide Management:**
- **Add Slide**: Enter image URL + optional caption → "Add Slide"
- **Remove Slide**: Click trash icon on slide
- **View Slides**: See all active slides in list

**Finding Images:**
- Unsplash.com (free stock photos)
- Pexels.com (free stock photos)
- Right-click image → "Copy image address"
- Paste URL into form

**Technical Notes:**
- Slides auto-advance every 5 seconds
- Default slides available if database empty
- Changes appear immediately
- No limit on number of slides

#### 4. Impact Story Page Editing
**Access:** Impact Story page → Click **"Edit Mode"** (bottom-right)

**Editable Sections (15 fields):**
- Hero title and subtitle
- Featured section (title, description)
- Story 1: title, quote, author, content
- Story 2: title, quote, author, content
- Story 3: title, quote, author, content
- Newsletter section
- Gallery description

**Editing Workflow:**
1. Click "Edit Mode" button
2. Click any text to edit (contentEditable)
3. Type changes directly
4. Click "Save Changes" (top-right toolbar)
5. Or click "Cancel" to revert

**Saving:**
- Changes are saved automatically
- Available offline with temporary storage
- All users see updates immediately after you save

#### 5. User Management
**Path:** Admin Panel → User Management

**Features:**
- View all registered users
- Search and filter users
- View user activity and statistics
- Manage user accounts

#### 6. Reports & Analytics
**Path:** Admin Panel → Reports & Analytics

**Features:**
- View platform activity reports
- Track user engagement
- Monitor food sharing statistics
- Export data for analysis

---

## Common Workflows

### Workflow 1: Sharing Food as a Donor

1. Click **"Share Food"** from main menu
2. Fill out the listing form with food details
3. Upload photos (recommended)
4. Submit and wait for admin approval notification
5. Once approved, your listing appears in **"Find Food"**
6. Recipients browse and submit claims
7. Check **"Notifications"** for claim requests
8. Review and approve/reject claims
9. Coordinate pickup with recipient
10. Complete the exchange
11. Your dashboard stats update automatically

### Workflow 2: Claiming Food as a Recipient

1. Navigate to **"Find Food"** from the main menu
2. Use search and filters to find items you need
3. Click on a listing that interests you
4. Review details (description, location, pickup times)
5. Click **"Claim Food"** button
6. Fill out claim form with pickup preferences
7. Submit and wait for donor's approval
8. Check **"Notifications"** for approval status
9. Pick up food at agreed time and location
10. Complete the exchange

### Workflow 3: Admin Managing Content

**Approving Food Listings:**
1. Profile Icon → **"Admin Panel"**
2. Dashboard shows pending foods
3. Review listing details and photos
4. Click "Approve" or "Reject"
5. Listing becomes visible to users

**Updating Impact Metrics:**
1. Admin Panel → **"Impact Data Entry"**
2. Fill in the new row with current data
3. Click the **+** button to add
4. Homepage metrics update automatically

**Managing Slideshow:**
1. Visit homepage as admin
2. Click **"Manage Slides"** button (top-right)
3. Add image URL with optional caption
4. Or remove existing slides
5. Changes appear immediately

**Editing Impact Story:**
1. Visit **"Impact Story"** page
2. Click **"Edit Mode"** button (bottom-right)
3. Click any text section to edit
4. Type changes directly
5. Click **"Save Changes"** when done

---

## Troubleshooting Guide

| Issue | Cause | Solution |
|-------|-------|----------|
| Can't log in | Invalid credentials | Use "Forgot Password" link |
| No verification email | Spam filter | Check spam/junk folder |
| Image won't upload | File too large | Compress image to under 5MB |
| Listing not visible | Pending approval | Wait for admin to approve (up to 24 hours) |
| Admin features missing | Not an admin user | Contact administrator to request admin access |
| Map not loading | Location disabled | Enable location services in browser settings |
| Claim button disabled | Already claimed | Food has been claimed by someone else |
| Changes not saving | Network issue | Check internet connection and try again |
| Photos not loading | Slow connection | Wait a moment or refresh the page |
| Dashboard empty | No activity yet | Start by sharing or claiming food |

---

## Privacy & Safety

### Your Privacy
- **Email**: Never shown publicly, used only for notifications
- **Phone**: Optional, only visible to people you're coordinating with
- **Address**: Shown only for pickup coordination on claimed food
- **Photos**: Optional for profile, recommended for food listings
- **Account**: You can delete your account and data anytime

### Platform Safety
- Passwords are securely encrypted
- All connections are secure (HTTPS)
- Personal information protected by privacy policies
- Admin moderation prevents abuse
- Report system for safety concerns

---

## Best Practices

### For Donors 👨‍🌾

**DO:**
- ✅ Share food that's fresh and safe
- ✅ Include clear photos
- ✅ Specify allergen information
- ✅ Respond to claims within 24 hours
- ✅ Package food properly for transport
- ✅ Be available during pickup window

**DON'T:**
- ❌ Share expired or spoiled food
- ❌ Ignore claims or messages
- ❌ Cancel at the last minute
- ❌ Require payment (against TOS)
- ❌ Share food unsafely stored

### For Recipients 🏘️

**DO:**
- ✅ Claim only what you need
- ✅ Show up on time
- ✅ Bring appropriate containers
- ✅ Thank the donor
- ✅ Report issues promptly
- ✅ Mark as completed after pickup

**DON'T:**
- ❌ Claim and not show up
- ❌ Take more than agreed
- ❌ Resell claimed food
- ❌ Be rude or demanding
- ❌ Waste food

### For Admins 🛡️

**DO:**
- ✅ Review listings within 24 hours
- ✅ Apply consistent approval standards
- ✅ Respond to user reports quickly
- ✅ Update impact data regularly
- ✅ Keep content fresh (slideshow, stories)
- ✅ Monitor for abuse or spam

**DON'T:**
- ❌ Approve unsafe food listings
- ❌ Show favoritism to users
- ❌ Ignore community reports
- ❌ Make arbitrary decisions
- ❌ Share user data externally

---

## Performance Optimization

### For Users
- Use **filters** to narrow search results
- **Upload compressed images** (<1MB ideal)
- **Enable notifications** for faster responses
- **Complete profile** to build trust
- **Check dashboard daily** for claims

### For Admins
- **Batch approve** listings when possible
- **Schedule data entry** weekly
- **Monitor storage usage** (images)
- **Clean up old completed** listings quarterly
- **Export reports** before they get large

---

## Support Resources

### Documentation
- 📖 [USER_GUIDE.md](USER_GUIDE.md) - Detailed step-by-step instructions for all features
- 📖 [USER_HANDBOOK.md](USER_HANDBOOK.md) - This quick reference guide (you are here)

### Help Channels
- **In-App**: Community forum for peer support
- **Email**: Contact admin through profile
- **GitHub**: Report bugs via issues
- **FAQ**: Check USER_GUIDE.md FAQ section

### Emergency Contacts
- **Food Safety Issues**: Contact admin immediately
- **Harassment/Abuse**: Report via user profile
- **Technical Outage**: Check status page
- **Data Concerns**: Email privacy officer

---

## Glossary

**Admin** - User with special permissions to approve listings and manage platform content

**Claim** - Request to receive food from a listing

**Donor** - Person sharing surplus food with the community

**Impact Metrics** - Statistics showing the community's positive contribution (food saved, people helped, etc.)

**Listing** - A food sharing post that appears in search results

**Recipient** - Person claiming and receiving shared food

**Slideshow** - Rotating images on the homepage hero section

**Edit Mode** - Admin feature to modify page content directly

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 15, 2025 | Initial handbook release |
| - | - | Admin features fully documented |
| - | - | Quick reference sections added |
| - | - | Technical reference included |

---

## Contact & Feedback

**Platform Administrators:**
- Review admin responsibilities regularly
- Keep impact data current
- Respond to user issues within 48 hours
- Update documentation as features change

**General Users:**
- Submit feedback via Community page
- Report bugs through user profile
- Suggest features in community forum
- Share success stories on Impact page

---

**DoGoods Platform Handbook v1.0**  
*Last Updated: December 15, 2025*  
*For detailed step-by-step instructions, see [USER_GUIDE.md](USER_GUIDE.md)*
