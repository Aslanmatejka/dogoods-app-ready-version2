# User Feedback System

## Overview
The DoGoods app now includes a comprehensive user feedback system that allows users to report errors, bugs, suggest improvements, and request new features directly from the app.

## Features

### For Users
- **Floating Feedback Button**: Always accessible from any page in the app (bottom right corner)
- **Multiple Feedback Types**:
  - 🐛 Error/Bug Report - Something is broken or not working
  - ⚠️ Bug - Unexpected behavior
  - 💡 Suggestion - Ideas for improvement
  - ✨ Feature Request - New features you'd like to see
  - 📝 Other - General feedback
- **Anonymous or Authenticated**: Users can submit feedback whether logged in or not
- **Automatic Context Capture**: Automatically includes current page URL and browser information

### For Admins
- **Centralized Dashboard**: View all user feedback at `/admin/feedback`
- **Statistics Overview**: See total feedback counts by status, type, and priority
- **Advanced Filtering**: Filter by status, type, and priority
- **Status Management**: Track feedback through stages (New → In Progress → Resolved → Closed)
- **Priority Levels**: Set priority (Low, Medium, High, Urgent)
- **Admin Notes**: Add internal notes for team collaboration
- **Full CRUD Operations**: View, update, and delete feedback

## Database Schema

```sql
user_feedback table:
- id (UUID, primary key)
- user_id (UUID, nullable, references auth.users)
- user_email (TEXT, nullable)
- feedback_type (TEXT: error, bug, suggestion, feature, other)
- subject (TEXT, required)
- message (TEXT, required)
- page_url (TEXT)
- browser_info (JSONB)
- screenshot_url (TEXT, nullable)
- status (TEXT: new, in-progress, resolved, closed)
- priority (TEXT: low, medium, high, urgent)
- admin_notes (TEXT)
- resolved_by (UUID, nullable)
- resolved_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Components

### Frontend Components
1. **FeedbackButton** (`components/common/FeedbackButton.jsx`)
   - Floating action button
   - Integrated into MainLayout

2. **FeedbackModal** (`components/common/FeedbackModal.jsx`)
   - Form for submitting feedback
   - Validation and submission handling

3. **UserFeedback** (`pages/admin/UserFeedback.jsx`)
   - Admin dashboard for managing feedback
   - Filtering, statistics, and CRUD operations

### Backend Service
**feedbackService** (`utils/feedbackService.js`)
- `submitFeedback(feedbackData)` - Submit new feedback
- `getUserFeedback()` - Get user's own feedback
- `getAllFeedback(filters)` - Get all feedback (admin only)
- `updateFeedback(id, updates)` - Update feedback status/priority
- `deleteFeedback(id)` - Delete feedback
- `getFeedbackStats()` - Get statistics

## Usage

### Submitting Feedback (User)
1. Click the floating feedback button (bottom right)
2. Select feedback type
3. Enter subject and detailed message
4. Submit

### Managing Feedback (Admin)
1. Navigate to Admin Dashboard → User Feedback
2. View statistics and filter feedback
3. Click "Manage" on any feedback item
4. Update status, priority, or add admin notes
5. Mark as resolved when complete

## Setup

### Database Migration
Run the migration to create the feedback table:
```bash
npm run supabase:reset  # For local development
# Or apply migration 026_create_user_feedback.sql to your remote Supabase project
```

### Verify Installation
1. Start the app: `npm run dev`
2. Look for the feedback button (bottom right, green circular button with chat icon)
3. Admin can access feedback management at `/admin/feedback`

## Row Level Security (RLS)

The feedback table has the following RLS policies:
- **Users can view their own feedback** (matched by user_id or email)
- **Anyone can submit feedback** (including anonymous users)
- **Admins can view all feedback** (requires is_admin = true)
- **Admins can update/delete feedback**

## Future Enhancements
- Email notifications to admins on new feedback
- Screenshot capture functionality
- Feedback voting/upvoting system
- Automated categorization using AI
- Integration with issue tracking systems (e.g., GitHub Issues, Jira)
