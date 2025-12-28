# Donation Schedules & Reminders System

## Overview

The donation scheduling system allows users to set up recurring donations to support the community on a regular basis. The system includes:

- **Flexible Scheduling**: Daily, weekly, monthly, or yearly donations
- **Automated Reminders**: Get notified before donations are due
- **Donation Tracking**: View complete history of all donations
- **Easy Management**: Pause, resume, edit, or cancel schedules anytime

## Features

### 1. Create Donation Schedules
Users can create custom donation schedules with:
- Custom title/name for the schedule
- Donation amount
- Frequency (daily, weekly, monthly, yearly)
- Start and optional end dates
- Recipient type (general fund, organization, food bank, etc.)
- Payment method preference
- Optional notes

### 2. Reminder System
- Enable/disable reminders per schedule
- Choose how many days before to receive reminders
- Automatic notification creation before donation dates

### 3. Schedule Management
- View all donation schedules in one place
- Filter by status (all, active, paused)
- Pause schedules temporarily
- Resume paused schedules
- Edit schedule details
- Delete schedules

### 4. Donation Statistics
- Total amount donated
- Number of donations made
- Active schedule count
- Per-schedule statistics

## Database Structure

### Tables

#### `donation_schedules`
Stores recurring donation configurations:
- User information and schedule details
- Amount and frequency settings
- Status tracking (active, paused, cancelled, completed)
- Reminder preferences
- Running totals and counts

#### `donation_history`
Logs all processed donations:
- Links to parent schedule
- Transaction details
- Status (completed, failed, pending, cancelled)
- Error tracking

## User Interface

### Accessing Donation Schedules
1. Log in to your account
2. Go to your dashboard
3. Click "Donation Schedules" in Quick Actions
   - Or navigate directly to `/donations`

### Creating a Schedule
1. Click "Create New Schedule" button
2. Fill in the form:
   - **Schedule Name**: Give it a descriptive name
   - **Amount**: Enter donation amount in dollars
   - **Frequency**: Choose how often to donate
   - **Start Date**: When to begin donations
   - **End Date** (optional): When to stop donations
   - **Donation To**: Select recipient type
   - **Payment Method**: Choose preferred payment method
   - **Reminders**: Enable and configure reminders
   - **Notes** (optional): Add any additional information
3. Click "Create Schedule"

### Managing Schedules
Each schedule card shows:
- Title and status badge
- Amount and frequency
- Next donation date
- Total donated and donation count
- Recipient type
- Action buttons (Edit, Pause/Resume, Delete)

### Filters
- **All**: Show all schedules regardless of status
- **Active**: Show only active schedules
- **Paused**: Show only paused schedules

## Automated Processing

### Edge Function: `process-donation-schedules`

This Supabase Edge Function handles:

1. **Reminder Creation**
   - Checks all active schedules daily
   - Creates notifications X days before donation date
   - Based on user's reminder preferences

2. **Donation Processing**
   - Identifies due donations
   - Creates donation history records
   - Updates schedule statistics
   - Calculates next donation date

### Running the Edge Function

The function can be triggered:
- Manually via HTTP request
- Via Supabase cron job (recommended for production)
- Through scheduled tasks

#### Manual Trigger
```bash
curl -X POST https://[PROJECT_REF].supabase.co/functions/v1/process-donation-schedules \
  -H "Authorization: Bearer [ANON_KEY]"
```

#### Setting Up Cron Job
Add to your Supabase project dashboard:
1. Go to Edge Functions
2. Select `process-donation-schedules`
3. Configure cron: `0 0 * * *` (runs daily at midnight)

## Security

### Row Level Security (RLS)
All tables have RLS enabled with policies:

**Users can:**
- View their own schedules and history
- Create their own schedules
- Update their own schedules
- Delete their own schedules

**Admins can:**
- View all schedules and history
- Update any schedule
- Process donations (via service role)

### Data Validation
- Amounts must be positive numbers
- Dates must be valid and logical
- Frequencies restricted to allowed values
- Status changes validated

## Components

### Core Components

1. **DonationScheduleForm** (`components/donations/DonationScheduleForm.jsx`)
   - Form for creating/editing schedules
   - Validates input data
   - Calculates next donation dates

2. **DonationScheduleList** (`components/donations/DonationScheduleList.jsx`)
   - Displays all user schedules
   - Provides management actions
   - Filters and status indicators

3. **DonationSchedules** (`pages/DonationSchedules.jsx`)
   - Main page component
   - Combines form and list
   - Shows donation statistics

### Data Service Methods

Located in `utils/dataService.js`:

```javascript
// Create a new schedule
await dataService.createDonationSchedule(scheduleData)

// Get user's schedules
await dataService.getUserDonationSchedules(userId)

// Get single schedule
await dataService.getDonationSchedule(scheduleId)

// Update schedule
await dataService.updateDonationSchedule(scheduleId, updates)

// Delete schedule
await dataService.deleteDonationSchedule(scheduleId)

// Pause/Resume
await dataService.pauseDonationSchedule(scheduleId)
await dataService.resumeDonationSchedule(scheduleId)

// Get donation history
await dataService.getDonationHistory(userId, scheduleId)

// Get statistics
await dataService.getUserDonationStats(userId)

// Calculate next date
dataService.calculateNextDonationDate(startDate, frequency)
```

## Future Enhancements

Potential improvements for the system:

1. **Payment Integration**
   - Connect to Stripe or other payment processors
   - Automatically charge scheduled donations
   - Handle payment failures and retries

2. **Email Notifications**
   - Send email reminders in addition to in-app notifications
   - Donation receipts via email
   - Monthly donation summaries

3. **Analytics Dashboard**
   - Visualize donation trends
   - Impact reports
   - Tax deduction summaries

4. **Flexible Recipients**
   - Allow users to split donations
   - Donate to multiple causes
   - Support specific fundraising campaigns

5. **Social Features**
   - Share donation milestones
   - Challenge friends to match donations
   - Public donation leaderboards

## Troubleshooting

### Schedules Not Processing
1. Check if edge function is deployed
2. Verify cron job is configured
3. Check edge function logs in Supabase dashboard

### Reminders Not Appearing
1. Ensure reminder_enabled is true
2. Check reminder_days_before value
3. Verify notifications table has proper RLS policies

### Cannot Create Schedule
1. Check user authentication
2. Verify form validation passes
3. Check browser console for errors
4. Ensure database RLS policies allow inserts

## Support

For issues or questions:
1. Check browser console for error messages
2. Review Supabase logs for backend errors
3. Verify all environment variables are set
4. Contact system administrator

---

*Last Updated: December 28, 2025*
