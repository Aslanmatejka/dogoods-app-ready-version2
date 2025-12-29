# Pickup Verification System - Complete Documentation

## Overview
Comprehensive before/after pickup verification system with photo uploads, status tracking, and dispute management. Ensures food quality, builds trust between donors and recipients, and provides audit trail for all transactions.

## What Was Implemented

✅ **Database Migration** - Verification fields, status tracking, audit logs, and dispute management
✅ **Verification Service** - Photo uploads, status management, and dispute reporting
✅ **Verification Modal** - UI for before/after photo verification with notes
✅ **Status Components** - Visual indicators for verification progress
✅ **Admin Dashboard** - Review verification photos and manage disputes
✅ **Auto-Calculation** - Automatic status updates via database triggers

---

## Database Schema

### Migration: `029_add_pickup_verification.sql`

**New Enum: verification_status**
```sql
CREATE TYPE verification_status AS ENUM (
    'pending',           -- Awaiting verification
    'verified_before',   -- Verified before pickup (by donor)
    'verified_after',    -- Verified after pickup (by recipient)
    'completed',         -- Both verifications complete
    'disputed',          -- Issue reported
    'skipped'           -- Verification skipped
);
```

**New Fields on food_listings:**
- `verification_status` - Current verification status (auto-calculated)
- `verified_before_pickup` - Boolean flag for before verification
- `verified_after_pickup` - Boolean flag for after verification
- `verification_before_photos` - Array of photo URLs (before pickup)
- `verification_after_photos` - Array of photo URLs (after pickup)
- `verification_before_notes` - Optional notes from donor
- `verification_after_notes` - Optional notes from recipient
- `verified_before_by` - User ID who verified before
- `verified_after_by` - User ID who verified after
- `verified_before_at` - Timestamp of before verification
- `verified_after_at` - Timestamp of after verification
- `verification_required` - Whether verification is mandatory

**New Table: verification_logs**
Audit trail of all verification activities:
```sql
CREATE TABLE verification_logs (
    id UUID PRIMARY KEY,
    listing_id UUID REFERENCES food_listings(id),
    verification_type TEXT CHECK (verification_type IN ('before', 'after')),
    verified_by UUID REFERENCES users(id),
    photos TEXT[],
    notes TEXT,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    device_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(listing_id, verification_type)
);
```

**New Table: verification_disputes**
Track disputes about food quality/accuracy:
```sql
CREATE TABLE verification_disputes (
    id UUID PRIMARY KEY,
    listing_id UUID REFERENCES food_listings(id),
    reported_by UUID REFERENCES users(id),
    dispute_type TEXT CHECK (dispute_type IN (
        'quality_mismatch', 
        'quantity_mismatch', 
        'not_as_described', 
        'safety_concern', 
        'other'
    )),
    description TEXT NOT NULL,
    evidence_photos TEXT[],
    status TEXT CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    resolution_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
);
```

**Auto-Triggers:**
- `trigger_update_verification_status` - Auto-calculates verification_status
- `trigger_log_verification` - Creates audit log entries

---

## Setup Steps

### 1. Apply Database Migration

```bash
# For local development
npm run supabase:reset

# Or manually in Supabase SQL Editor
# Run: supabase/migrations/029_add_pickup_verification.sql
```

### 2. Configure Storage Bucket

Verification photos are stored in the `food-images` bucket (reuses existing bucket). If you prefer a separate bucket:

```sql
-- Create dedicated verification bucket (optional)
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-photos', 'verification-photos', true);

-- Set storage policy
CREATE POLICY "Users can upload verification photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'verification-photos');
```

### 3. Start the App

```bash
npm run dev
```

---

## Components Reference

### 1. VerificationService (`utils/verificationService.js`)

**Purpose**: Handle all verification logic and photo uploads

**Key Methods:**

```javascript
import VerificationService, { VERIFICATION_TYPES, VERIFICATION_STATUS } from '../utils/verificationService';

// Upload verification photo
const photoUrl = await VerificationService.uploadVerificationPhoto(
    file,           // File object
    listingId,      // Food listing ID
    'before'        // 'before' or 'after'
);

// Submit before-pickup verification
const result = await VerificationService.verifyBeforePickup(listingId, {
    photos: [file1, file2],     // File array
    notes: 'Food looks great!',  // Optional notes
    location: { lat, lng }       // Optional location
});

// Submit after-pickup verification
const result = await VerificationService.verifyAfterPickup(listingId, {
    photos: [file1],
    notes: 'Received as described'
});

// Get verification status
const status = await VerificationService.getVerificationStatus(listingId);

// Report a dispute
const dispute = await VerificationService.reportDispute(listingId, {
    type: 'quality_mismatch',
    description: 'Food was spoiled',
    evidencePhotos: [file1, file2]
});

// Check if user can verify
const canVerify = await VerificationService.canVerify(listingId, 'before');

// Get verification statistics (admin)
const stats = await VerificationService.getVerificationStats();
```

---

### 2. VerificationModal (`components/food/VerificationModal.jsx`)

**Purpose**: Modal UI for photo verification with upload

**Usage:**
```jsx
import VerificationModal from '../components/food/VerificationModal';
import { VERIFICATION_TYPES } from '../utils/verificationService';

function MyComponent() {
    const [showModal, setShowModal] = useState(false);

    const handleVerificationComplete = (result) => {
        console.log('Verification complete:', result);
        // Refresh data, show success message, etc.
    };

    return (
        <>
            <button onClick={() => setShowModal(true)}>
                Verify Before Pickup
            </button>

            <VerificationModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                listingId="123-456"
                verificationType={VERIFICATION_TYPES.BEFORE}
                foodTitle="Fresh Produce Bundle"
                onVerificationComplete={handleVerificationComplete}
            />
        </>
    );
}
```

**Features:**
- Photo upload with preview (1-3 photos required)
- Optional notes field (500 char max)
- Real-time validation
- Loading states
- Error handling
- Clean preview URL cleanup

---

### 3. VerificationStatus Components (`components/food/VerificationStatus.jsx`)

**VerificationStatus Badge:**
```jsx
import VerificationStatus from '../components/food/VerificationStatus';
import { VERIFICATION_STATUS } from '../utils/verificationService';

<VerificationStatus 
    status={VERIFICATION_STATUS.COMPLETED}
    showIcon={true}        // Optional, default true
    compact={false}        // Optional, default false
/>
```

**VerificationProgress:**
```jsx
import { VerificationProgress } from '../components/food/VerificationStatus';

<VerificationProgress
    verifiedBefore={true}
    verifiedAfter={false}
    verificationRequired={true}
/>
```

**VerificationPhotos Gallery:**
```jsx
import { VerificationPhotos } from '../components/food/VerificationStatus';

<VerificationPhotos
    photos={['url1.jpg', 'url2.jpg', 'url3.jpg']}
    title="Before Pickup Photos"
/>
```

---

## User Flows

### Donor Flow (Before Pickup Verification)

1. **List Food** → Create food donation listing
2. **Wait for Claim** → Recipient claims the food
3. **Prepare for Pickup** → Get food ready
4. **Verify Before Pickup** → Open verification modal
   - Take 1-3 photos of the food
   - Add notes about condition, packaging
   - Submit verification
5. **Status Updates** → `verification_status` = `verified_before`
6. **Recipient Notified** → Recipient sees verified status

**When to Verify:**
- Right before recipient arrives
- After packaging food for pickup
- To confirm food condition is as described

**Code Example:**
```jsx
import { useState } from 'react';
import VerificationModal from '../components/food/VerificationModal';
import { VERIFICATION_TYPES } from '../utils/verificationService';

function DonorDashboard({ myListings }) {
    const [verifyingListing, setVerifyingListing] = useState(null);

    return (
        <div>
            {myListings.map(listing => (
                <div key={listing.id}>
                    <h3>{listing.title}</h3>
                    {listing.claimed_by && !listing.verified_before_pickup && (
                        <button onClick={() => setVerifyingListing(listing)}>
                            📸 Verify Before Pickup
                        </button>
                    )}
                </div>
            ))}

            {verifyingListing && (
                <VerificationModal
                    isOpen={true}
                    onClose={() => setVerifyingListing(null)}
                    listingId={verifyingListing.id}
                    verificationType={VERIFICATION_TYPES.BEFORE}
                    foodTitle={verifyingListing.title}
                    onVerificationComplete={() => {
                        // Refresh listings
                        setVerifyingListing(null);
                    }}
                />
            )}
        </div>
    );
}
```

---

### Recipient Flow (After Pickup Verification)

1. **Claim Food** → Claim a food listing
2. **Coordinate Pickup** → Arrange pickup time with donor
3. **Pick Up Food** → Collect the food
4. **Verify After Pickup** → Open verification modal
   - Take photos of received food
   - Confirm condition matches description
   - Add any feedback
5. **Status Updates** → `verification_status` = `completed`
6. **Build Trust** → Helps future donors/recipients

**When to Verify:**
- Immediately after receiving food
- Before leaving pickup location
- To confirm quality and quantity

**Code Example:**
```jsx
function RecipientDashboard({ claimedListings }) {
    const [verifyingListing, setVerifyingListing] = useState(null);

    return (
        <div>
            {claimedListings.map(listing => (
                <div key={listing.id}>
                    <h3>{listing.title}</h3>
                    {listing.verified_before_pickup && !listing.verified_after_pickup && (
                        <button onClick={() => setVerifyingListing(listing)}>
                            ✅ Verify After Pickup
                        </button>
                    )}
                </div>
            ))}

            {verifyingListing && (
                <VerificationModal
                    isOpen={true}
                    onClose={() => setVerifyingListing(null)}
                    listingId={verifyingListing.id}
                    verificationType={VERIFICATION_TYPES.AFTER}
                    foodTitle={verifyingListing.title}
                    onVerificationComplete={() => {
                        setVerifyingListing(null);
                    }}
                />
            )}
        </div>
    );
}
```

---

### Dispute Flow

1. **Issue Detected** → Recipient finds problem with food
2. **Report Dispute** → Open dispute form
3. **Upload Evidence** → Add photos of the issue
4. **Admin Review** → Admin investigates
5. **Resolution** → Dispute resolved or closed

**Code Example:**
```jsx
import VerificationService, { DISPUTE_TYPES } from '../utils/verificationService';

async function handleReportDispute(listingId) {
    try {
        const dispute = await VerificationService.reportDispute(listingId, {
            type: DISPUTE_TYPES.QUALITY_MISMATCH,
            description: 'Food was spoiled upon pickup',
            evidencePhotos: [file1, file2]
        });
        
        alert('Dispute reported successfully');
    } catch (error) {
        alert('Failed to report dispute: ' + error.message);
    }
}
```

---

## Admin Management

### Admin Dashboard (`pages/admin/VerificationManagement.jsx`)

**Features:**
- View all verifications with statistics
- Filter by status (pending, disputed, completed)
- Review verification photos
- Manage disputes
- Track verification compliance

**Access:** Navigate to `/admin/verification` (admin only)

**Statistics Shown:**
- Total listings with verification
- Pending verifications
- Completed verifications
- Active disputes

---

## Testing Checklist

### Database Tests
- [ ] Migration applies successfully
- [ ] New columns exist on food_listings
- [ ] verification_logs table created
- [ ] verification_disputes table created
- [ ] Triggers auto-calculate verification_status
- [ ] RLS policies protect verification data

### UI Tests
- [ ] VerificationModal opens correctly
- [ ] Photo upload works (1-3 photos)
- [ ] Photo previews display
- [ ] Can remove photos before submit
- [ ] Notes field accepts text (500 char limit)
- [ ] Submit button disabled without photos
- [ ] Loading state shows during upload
- [ ] Error messages display correctly

### Functional Tests
- [ ] Donor can verify before pickup
- [ ] Recipient can verify after pickup
- [ ] Photos upload to storage successfully
- [ ] verification_status updates automatically
- [ ] verification_logs entry created
- [ ] Can view verification photos
- [ ] Can report disputes
- [ ] Admin can view all verifications

### Edge Cases
- [ ] Uploading > 3 photos shows error
- [ ] Large file sizes handled
- [ ] Network errors handled gracefully
- [ ] Duplicate verifications prevented
- [ ] Can skip verification (donor only)
- [ ] Verification required flag works

---

## Security & Privacy

### Row Level Security (RLS)

**verification_logs:**
- Users can view their own verification logs
- Users can view logs for listings they own
- Users can insert their own logs

**verification_disputes:**
- Users can view disputes they reported
- Users can view disputes for their listings
- Admins can manage all disputes

### Photo Storage

- Photos stored in Supabase Storage
- Public read access (for transparency)
- Authenticated upload only
- File size limits enforced (5MB per photo)

### Data Protection

- Verification data tied to user authentication
- Cannot verify on behalf of others
- Admin oversight for disputes
- Audit trail maintained in logs

---

## Troubleshooting

### Issue: Photos not uploading

**Solutions:**
1. Check storage bucket exists:
   ```sql
   SELECT * FROM storage.buckets WHERE name = 'food-images';
   ```

2. Verify storage policy:
   ```sql
   SELECT * FROM storage.policies WHERE bucket_id = 'food-images';
   ```

3. Check file size (max 5MB):
   ```javascript
   if (file.size > 5 * 1024 * 1024) {
       alert('File too large. Max 5MB.');
   }
   ```

### Issue: Verification status not updating

**Solution:**
```sql
-- Manually trigger status recalculation
UPDATE food_listings
SET verification_status = CASE
    WHEN verified_before_pickup AND verified_after_pickup THEN 'completed'
    WHEN verified_before_pickup THEN 'verified_before'
    WHEN verified_after_pickup THEN 'verified_after'
    ELSE 'pending'
END
WHERE id = 'listing-id';
```

### Issue: Can't access verification modal

**Checklist:**
1. User authenticated?
2. User has permission? (donor for before, recipient for after)
3. Listing in correct status?
4. Check browser console for errors

---

## File Structure

```
├── components/
│   └── food/
│       ├── VerificationModal.jsx        # Photo upload modal
│       ├── VerificationStatus.jsx       # Status badges
│       └── FoodCard.jsx                 # Updated with status badge
├── pages/
│   └── admin/
│       └── VerificationManagement.jsx   # Admin dashboard
├── utils/
│   └── verificationService.js           # Verification logic
├── supabase/
│   └── migrations/
│       └── 029_add_pickup_verification.sql
└── VERIFICATION_FEATURE.md              # This documentation
```

---

## Future Enhancements

### Potential Additions
1. **QR Codes**: Generate QR codes for quick verification at pickup
2. **GPS Verification**: Require location match for verification
3. **Time Windows**: Set pickup time windows and verify within window
4. **Reputation Scores**: Calculate user reputation based on verifications
5. **Automated Reminders**: Email/SMS reminders to verify
6. **Video Verification**: Support video uploads for higher quality proof
7. **Third-Party Verification**: Allow neutral party verification

### Integration Ideas
- Combine with urgency system (verify urgent items faster)
- Integrate with dietary compatibility (verify dietary claims)
- Add to impact tracking (verified pickups = confirmed impact)
- Show verification rate on user profiles

---

## Quick Start Example

```jsx
// Complete example: Food detail page with verification
import { useState, useEffect } from 'react';
import VerificationModal from '../components/food/VerificationModal';
import VerificationStatus, { VerificationProgress, VerificationPhotos } from '../components/food/VerificationStatus';
import VerificationService, { VERIFICATION_TYPES } from '../utils/verificationService';
import { useAuthContext } from '../utils/AuthContext';

function FoodDetailPage({ listingId }) {
    const { user } = useAuthContext();
    const [listing, setListing] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [verificationType, setVerificationType] = useState(null);

    useEffect(() => {
        loadListing();
    }, [listingId]);

    const loadListing = async () => {
        const data = await VerificationService.getVerificationStatus(listingId);
        setListing(data);
    };

    const handleVerify = (type) => {
        setVerificationType(type);
        setShowModal(true);
    };

    const isDonor = listing?.user_id === user?.id;
    const isRecipient = listing?.claimed_by === user?.id;

    return (
        <div>
            <h1>{listing?.title}</h1>

            {/* Verification Status */}
            <VerificationStatus status={listing?.verification_status} />

            {/* Verification Progress */}
            <VerificationProgress
                verifiedBefore={listing?.verified_before_pickup}
                verifiedAfter={listing?.verified_after_pickup}
                verificationRequired={listing?.verification_required}
            />

            {/* Action Buttons */}
            {isDonor && !listing?.verified_before_pickup && (
                <button onClick={() => handleVerify(VERIFICATION_TYPES.BEFORE)}>
                    Verify Before Pickup
                </button>
            )}

            {isRecipient && listing?.verified_before_pickup && !listing?.verified_after_pickup && (
                <button onClick={() => handleVerify(VERIFICATION_TYPES.AFTER)}>
                    Verify After Pickup
                </button>
            )}

            {/* Verification Photos */}
            {listing?.verification_before_photos && (
                <VerificationPhotos
                    photos={listing.verification_before_photos}
                    title="Before Pickup Photos"
                />
            )}

            {listing?.verification_after_photos && (
                <VerificationPhotos
                    photos={listing.verification_after_photos}
                    title="After Pickup Photos"
                />
            )}

            {/* Verification Modal */}
            <VerificationModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                listingId={listingId}
                verificationType={verificationType}
                foodTitle={listing?.title}
                onVerificationComplete={loadListing}
            />
        </div>
    );
}
```

---

## Support

For questions or issues:
- **Database**: `supabase/migrations/029_add_pickup_verification.sql`
- **Service**: `utils/verificationService.js`
- **Components**: `components/food/VerificationModal.jsx`, `VerificationStatus.jsx`
- **Admin**: `pages/admin/VerificationManagement.jsx`

## Related Features
- [Urgency Tracking](URGENCY_FEATURE.md)
- [Dietary Compatibility](DIETARY_NEEDS_FEATURE.md)
- [User Feedback System](FEEDBACK_QUICKSTART.md)
