/**
 * Twilio SMS Service
 * Handles sending SMS notifications via Supabase Edge Functions
 */

import supabase from './supabaseClient';

class TwilioService {
    constructor() {
        this.functionUrl = `${supabase.supabaseUrl}/functions/v1/send-sms`;
    }

    /**
     * Format phone number to E.164 format
     * @param {string} phone - Phone number to format
     * @returns {string} Formatted phone number
     */
    formatPhoneNumber(phone) {
        // Remove all non-digit characters
        const cleaned = phone.replace(/\D/g, '');
        
        // Add +1 for US numbers if not present
        if (cleaned.length === 10) {
            return `+1${cleaned}`;
        }
        
        // If already has country code
        if (cleaned.length === 11 && cleaned.startsWith('1')) {
            return `+${cleaned}`;
        }
        
        // Already formatted or international
        if (phone.startsWith('+')) {
            return phone;
        }
        
        return `+${cleaned}`;
    }

    /**
     * Send SMS via Supabase Edge Function
     * @param {Object} params - SMS parameters
     * @param {string} params.to - Recipient phone number
     * @param {string} params.message - Message content
     * @param {string} params.type - Message type (claim, reminder, verification, notification)
     * @returns {Promise<Object>} Response from Twilio
     */
    async sendSMS({ to, message, type = 'notification' }) {
        try {
            const formattedPhone = this.formatPhoneNumber(to);
            
            const { data: { session } } = await supabase.auth.getSession();
            
            const response = await fetch(this.functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token || ''}`,
                },
                body: JSON.stringify({
                    to: formattedPhone,
                    message,
                    type,
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to send SMS');
            }

            return result;
        } catch (error) {
            console.error('Twilio SMS Error:', error);
            throw error;
        }
    }

    /**
     * Send food claim notification to donor
     * @param {Object} params - Claim details
     */
    async sendClaimNotification({ donorPhone, donorName, claimerName, foodTitle, pickupLocation }) {
        const message = `Hi ${donorName}, great news! ${claimerName} has claimed your "${foodTitle}". Pickup location: ${pickupLocation}. Thank you for sharing! - DoGoods`;
        
        return this.sendSMS({
            to: donorPhone,
            message,
            type: 'claim',
        });
    }

    /**
     * Send pickup reminder to claimer
     * @param {Object} params - Reminder details
     */
    async sendPickupReminder({ claimerPhone, claimerName, foodTitle, pickupLocation, pickupTime }) {
        const message = `Hi ${claimerName}, reminder: Pick up "${foodTitle}" at ${pickupLocation} by ${pickupTime}. Questions? Contact the community location. - DoGoods`;
        
        return this.sendSMS({
            to: claimerPhone,
            message,
            type: 'reminder',
        });
    }

    /**
     * Send verification code
     * @param {Object} params - Verification details
     */
    async sendVerificationCode({ phone, code }) {
        const message = `Your DoGoods verification code is: ${code}. This code expires in 10 minutes.`;
        
        return this.sendSMS({
            to: phone,
            message,
            type: 'verification',
        });
    }

    /**
     * Send claim confirmation to claimer
     * @param {Object} params - Claim confirmation details
     */
    async sendClaimConfirmation({ claimerPhone, claimerName, foodTitle, pickupLocation, pickupDeadline }) {
        const message = `Hi ${claimerName}, you've successfully claimed "${foodTitle}"! Pick up at ${pickupLocation} by ${pickupDeadline}. See you soon! - DoGoods`;
        
        return this.sendSMS({
            to: claimerPhone,
            message,
            type: 'claim',
        });
    }

    /**
     * Send new food listing notification to nearby users
     * @param {Object} params - Listing details
     */
    async sendNewListingNotification({ userPhone, userName, foodTitle, location }) {
        const message = `Hi ${userName}, new food available near you: "${foodTitle}" at ${location}. Claim it now on DoGoods!`;
        
        return this.sendSMS({
            to: userPhone,
            message,
            type: 'notification',
        });
    }
}

// Create singleton instance
const twilioService = new TwilioService();

export default twilioService;
