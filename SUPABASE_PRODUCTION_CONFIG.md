# Supabase Production Configuration Required

## Password Reset Not Working - Fix

The password reset feature requires specific URL configuration in your Supabase Dashboard.

### Steps to Configure:

1. **Go to Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/ifzbpqyuhnxbhdcnmvfs
   - Project ID: `ifzbpqyuhnxbhdcnmvfs`

2. **Navigate to Authentication Settings**
   - Click **Authentication** in the left sidebar
   - Click **URL Configuration**

3. **Configure URLs**

   **Site URL:** (this is where users start from)
   ```
   https://dogoods.store
   ```

   **Redirect URLs:** (add ALL of these to the list)
   ```
   https://dogoods.store
   https://dogoods.store/reset-password
   https://dogoods.store/login
   https://dogoods.store/email-confirmation
   ```

4. **Save Changes**
   - Click the **Save** button at the bottom
   - Wait for confirmation

### How to Test After Configuration:

1. Go to https://dogoods.store/forgot-password
2. Enter your email address
3. Click "Send Reset Link"
4. Check your email inbox (and spam folder)
5. Click the link in the email
6. You should arrive at https://dogoods.store/reset-password with a token
7. Enter your new password
8. You'll be redirected to /login with a success message

### If Emails Aren't Arriving:

1. Check spam/junk folder
2. In Supabase Dashboard → **Authentication** → **Email Templates**:
   - Verify the "Reset Password" template is active
   - The template should include: `{{ .ConfirmationURL }}`
3. Check **Authentication** → **Settings** → **SMTP Settings**:
   - If using custom SMTP, verify credentials
   - If using Supabase's default, it should work automatically

### Current Status:

- ✅ Local development config (`supabase/config.toml`) includes correct URLs
- ✅ Code correctly calls `resetPasswordForEmail` with redirect URL
- ✅ ResetPasswordPage properly handles the recovery token
- ⚠️ **PRODUCTION Dashboard redirect URLs need manual configuration** (see above)

### Related Files:

- `utils/authService.js` - Calls `resetPasswordForEmail()` with redirect URL
- `pages/ForgotPasswordPage.jsx` - Form to request reset
- `pages/ResetPasswordPage.jsx` - Form to set new password after clicking email link
- `supabase/config.toml` - Local development only (doesn't affect production)
