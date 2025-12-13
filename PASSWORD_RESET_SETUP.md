# Password Reset Functionality - Setup Guide

## Overview
Complete password reset implementation using Supabase Auth with email verification and secure token handling.

## Features
- ✅ Email-based password reset flow
- ✅ Secure token verification
- ✅ Password strength validation
- ✅ Automatic session cleanup
- ✅ User-friendly error messages
- ✅ Success notifications

## Flow Diagram

```
User requests reset → Email sent → User clicks link → Token verified → New password → Login
   (ForgotPasswordPage)          (Supabase)      (ResetPasswordPage)      (LoginPage)
```

## Setup Instructions

### 1. Configure Supabase Email Settings

Go to your Supabase Dashboard → Authentication → Email Templates

#### A. Enable Email Provider
1. Navigate to **Settings** → **Authentication** → **Email**
2. Ensure **Enable Email Provider** is ON

#### B. Configure SMTP (Optional but recommended for production)
1. Go to **Settings** → **Authentication** → **SMTP**
2. Add your SMTP credentials:
   - **Host**: smtp.gmail.com (or your provider)
   - **Port**: 587
   - **Username**: your-email@gmail.com
   - **Password**: your-app-password
   - **Sender Email**: noreply@yourdomain.com
   - **Sender Name**: DoGoods

#### C. Set Redirect URLs
1. Go to **Settings** → **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   ```
   http://localhost:3001/reset-password
   http://localhost:3001/*
   https://yourdomain.com/reset-password
   https://yourdomain.com/*
   ```

#### D. Customize Email Template
1. Go to **Authentication** → **Email Templates**
2. Edit **"Reset Password"** template:

```html
<h2>Reset Your Password</h2>
<p>Hi there,</p>
<p>You recently requested to reset your password for your DoGoods account.</p>
<p>Click the button below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a></p>
<p>Or copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p><strong>This link expires in 1 hour.</strong></p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>Best regards,<br>The DoGoods Team</p>
```

### 2. Test the Implementation

#### Manual Testing
1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/forgot-password`
3. Enter your email address
4. Check your inbox for the reset email
5. Click the reset link
6. Enter and confirm your new password
7. Verify redirect to login page
8. Login with new credentials

#### Automated Testing
Run the test script:
```bash
node scripts/test-password-reset.js
```

## Code Components

### 1. ForgotPasswordPage
**Location**: `pages/ForgotPasswordPage.jsx`

**Features**:
- Email input with validation
- Supabase password reset request
- Success confirmation screen
- Error handling

**Usage**:
```jsx
// User enters email
authService.resetPassword(email)
  ↓
// Supabase sends email with reset link
supabase.auth.resetPasswordForEmail(email, { redirectTo })
```

### 2. ResetPasswordPage
**Location**: `pages/ResetPasswordPage.jsx`

**Features**:
- Token verification from URL hash
- Password strength validation
- Confirm password matching
- Session cleanup after reset
- Expired token handling

**Token Verification**:
```javascript
// Checks URL for: #access_token=...&type=recovery
const hashParams = new URLSearchParams(window.location.hash.substring(1));
const type = hashParams.get('type');
if (type === 'recovery') {
  // Valid reset token
}
```

**Password Update**:
```javascript
await supabase.auth.updateUser({ password: newPassword });
await supabase.auth.signOut(); // Security: force re-login
navigate('/login?message=password-reset-success');
```

### 3. LoginPage Enhancement
**Location**: `pages/LoginPage.jsx`

**Features**:
- Success message display
- URL parameter handling

**Success Message**:
```jsx
// Checks for ?message=password-reset-success
const message = searchParams.get('message');
if (message === 'password-reset-success') {
  setSuccessMessage('Password reset successful!');
}
```

### 4. Auth Service
**Location**: `utils/authService.js`

**Methods**:
```javascript
// Request password reset email
async resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });
}

// Update password
async updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
}
```

## Security Features

### 1. Token Expiration
- Reset links expire after 1 hour (configurable in Supabase)
- Tokens are one-time use only
- Invalid tokens show clear error messages

### 2. Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### 3. Session Management
- Automatic logout after password reset
- Forces user to log in with new credentials
- Prevents session hijacking

### 4. Error Handling
- Generic error messages for security
- Specific errors only for validation
- Graceful fallbacks for edge cases

## Troubleshooting

### Email Not Received
1. **Check Spam Folder**: Reset emails may be filtered
2. **Verify SMTP**: Ensure SMTP is configured correctly
3. **Check Rate Limits**: Supabase limits reset requests
4. **Verify Email**: Ensure email exists in auth.users table

### Invalid Token Error
1. **Link Expired**: Request new reset email
2. **Already Used**: Tokens can only be used once
3. **Wrong URL**: Ensure redirectTo matches configured URL

### Password Update Fails
1. **Weak Password**: Check password requirements
2. **Same Password**: New password must differ from old
3. **Session Expired**: Token may have timed out

### Development Mode Issues
1. **CORS**: Ensure localhost is in Redirect URLs
2. **Port**: Match port in redirectTo with dev server
3. **HTTPS**: Some browsers require HTTPS for auth flows

## Production Checklist

- [ ] Configure custom SMTP provider
- [ ] Customize email templates with branding
- [ ] Set production redirect URLs
- [ ] Test with multiple email providers
- [ ] Monitor email delivery rates
- [ ] Set up email bounce handling
- [ ] Configure proper SPF/DKIM records
- [ ] Test password reset on staging
- [ ] Implement rate limiting
- [ ] Add analytics for reset requests

## Environment Variables

Ensure these are set in your `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Support

For issues or questions:
1. Check Supabase Dashboard logs
2. Review browser console for errors
3. Test with Supabase Auth logs
4. Verify email provider settings

## Related Files

- `pages/ForgotPasswordPage.jsx` - Request reset email
- `pages/ResetPasswordPage.jsx` - Handle password update
- `pages/LoginPage.jsx` - Show success message
- `utils/authService.js` - Auth logic
- `app.jsx` - Route configuration
- `scripts/test-password-reset.js` - Testing script
