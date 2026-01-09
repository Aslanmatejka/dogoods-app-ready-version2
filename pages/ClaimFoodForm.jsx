

import React from "react";
import dataService from '../utils/dataService';
import supabase from '../utils/supabaseClient';
import { useNavigate, useLocation } from "react-router-dom";
import Button from "../components/common/Button";
import Input from "../components/common/Input";

export default function ClaimFoodForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const food = location.state?.food;
    const [formData, setFormData] = React.useState({
        requester_name: "",
        requester_email: "",
        requester_phone: "",
        school_district: "",
        school: "",
        school_contact: "",
        school_contact_email: "",
        school_contact_phone: "",
        dietary_restrictions: "",
        pickup_dropoff: "",
        members_count: "",
        people: "",
        students: "",
        school_staff: "",
        food_title: food?.title || food?.name || "",
        food_description: food?.description || "",
        pickup_date: "",
        reminder_hours_before: 24
    });
    const [submitted, setSubmitted] = React.useState(false);
    const [userReminderPreference, setUserReminderPreference] = React.useState(24);

    React.useEffect(() => {
        const loadUserPreferences = async () => {
            const userResult = await supabase.auth.getUser();
            const user = userResult.data?.user;
            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('default_reminder_hours')
                    .eq('id', user.id)
                    .single();

                if (profile?.default_reminder_hours) {
                    setUserReminderPreference(profile.default_reminder_hours);
                    setFormData(prev => ({
                        ...prev,
                        reminder_hours_before: profile.default_reminder_hours
                    }));
                }
            }
        };
        loadUserPreferences();
    }, []);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const [loading, setLoading] = React.useState(false);
    const [submitError, setSubmitError] = React.useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSubmitError(null);
        try {
            // Get current user UID for RLS
            const userResult = await supabase.auth.getUser();
            const user = userResult.data?.user;
            if (!user) throw new Error('User must be logged in to claim food');
            const claimer_id = user.id;

            // Compose claim data, exclude food_description, food_title, and pickup_dropoff
            const { food_description, food_title, pickup_dropoff, ...restFormData } = formData;

            const claimData = {
                ...restFormData,
                food_id: food?.id || food?.objectId || null,
                claimer_id,
                status: 'pending',
                people: parseInt(formData.people) || 0,
                students: parseInt(formData.students) || 0,
                school_staff: parseInt(formData.school_staff) || 0,
                members_count: parseInt(formData.members_count) || 0,
                pickup_date: formData.pickup_date || null,
                reminder_hours_before: parseInt(formData.reminder_hours_before) || 24
            };
            await dataService.createFoodClaim(claimData);
            setSubmitted(true);

            // Trigger custom event for impact refresh
            console.log('Food claim submitted, triggering impact refresh...');
            window.dispatchEvent(new CustomEvent('foodClaimed'));
        } catch (error) {
            setSubmitError('Failed to submit claim. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="max-w-md mx-auto py-8 px-4">
                <h2 className="text-2xl font-bold mb-4">Thank you for claiming!</h2>
                <p className="mb-4">Your claim has been submitted. We will contact you soon.</p>
                <Button onClick={() => navigate("/find")}>Back to Find Food</Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-8 px-4">
            <h2 className="text-2xl font-bold mb-4">Claim Food</h2>
            {food && (
                <div className="mb-4 p-4 bg-gray-50 rounded border">
                    <div className="font-semibold">Food: {food.title || food.name || "(No title)"}</div>
                    <div className="text-sm text-gray-600">{food.description}</div>
                </div>
            )}
            <form className="bg-white rounded-2xl shadow-lg p-8 space-y-8 border border-gray-100" onSubmit={handleSubmit}>
                {submitError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4" role="alert">
                        <p className="text-red-700">
                            <i className="fas fa-exclamation-circle mr-2"></i>
                            {submitError}
                        </p>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Input label="Name / Organization" name="requester_name" value={formData.requester_name} onChange={handleFormChange} required maxLength={100} helperText="Enter your full name or organization name." />
                    <Input label="Email" name="requester_email" type="email" value={formData.requester_email} onChange={handleFormChange} maxLength={100} helperText="Enter your email address." />
                    <Input label="Phone" name="requester_phone" type="tel" value={formData.requester_phone} onChange={handleFormChange} maxLength={20} helperText="Enter your phone number." />
                    <Input label="School District" name="school_district" type="select" value={formData.school_district} onChange={handleFormChange} required options={[{ value: '', label: 'Select District' },{ value: 'AUSD', label: 'AUSD' },{ value: 'OUSD', label: 'OUSD' },{ value: 'SLZUSD', label: 'SLZUSD' },{ value: 'BUSD', label: 'BUSD' }]} helperText="Select your school district." />
                    <Input label="School" name="school" value={formData.school} onChange={handleFormChange} required maxLength={100} helperText="Enter your school name." />
                    <Input label="School Contact (Case Worker)" name="school_contact" value={formData.school_contact} onChange={handleFormChange} required maxLength={100} helperText="Enter the name of your school contact or case worker." />
                    <Input label="School Contact Email" name="school_contact_email" type="email" value={formData.school_contact_email} onChange={handleFormChange} maxLength={100} helperText="Enter the email address of your school contact." />
                    <Input label="School Contact Phone" name="school_contact_phone" type="tel" value={formData.school_contact_phone} onChange={handleFormChange} maxLength={20} helperText="Enter the phone number of your school contact." />
                    <Input label="Dietary Restrictions" name="dietary_restrictions" value={formData.dietary_restrictions} onChange={handleFormChange} maxLength={200} helperText="List any dietary restrictions." />
                    <Input label="Total Members" name="members_count" type="number" value={formData.members_count} onChange={handleFormChange} required min={1} max={1000} helperText="Total number of people this food will serve." />
                </div>

                {/* Conditional Drop Off or Pickup Form */}
                {formData.school_district === 'AUSD' ? (
                    <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
                        <h3 className="text-lg font-bold text-blue-700 mb-4">Drop Off Details (AUSD Only)</h3>
                        <Input label="Time" name="dropoff_time" type="time" value={formData.dropoff_time || ''} onChange={handleFormChange} required helperText="Select time." />
                        <Input label="Place" name="dropoff_place" value={formData.dropoff_place || ''} onChange={handleFormChange} required maxLength={100} helperText="Enter location." />
                        <Input label="Contact" name="dropoff_contact" value={formData.dropoff_contact || ''} onChange={handleFormChange} required maxLength={100} helperText="Enter contact." />
                    </div>
                ) : (
                    <div className="mt-8 p-6 bg-green-50 rounded-xl border border-green-200">
                        <h3 className="text-lg font-bold text-green-700 mb-4">Pickup Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Pickup Date"
                                name="pickup_date"
                                type="date"
                                value={formData.pickup_date || ''}
                                onChange={handleFormChange}
                                required
                                min={new Date().toISOString().split('T')[0]}
                                helperText="Select the date for pickup."
                            />
                            <Input
                                label="Pickup Time"
                                name="pickup_time"
                                type="time"
                                value={formData.pickup_time || ''}
                                onChange={handleFormChange}
                                required
                                helperText="Select pickup time."
                            />
                        </div>
                        <Input label="Pickup Place" name="pickup_place" value={formData.pickup_place || ''} onChange={handleFormChange} required maxLength={100} helperText="Enter pickup location." />
                        <Input label="Pickup Contact" name="pickup_contact" value={formData.pickup_contact || ''} onChange={handleFormChange} required maxLength={100} helperText="Enter contact for pickup." />

                        <div className="mt-4 pt-4 border-t border-green-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <i className="fas fa-bell mr-2 text-green-600"></i>
                                Remind me before pickup
                            </label>
                            <select
                                name="reminder_hours_before"
                                value={formData.reminder_hours_before}
                                onChange={handleFormChange}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                            >
                                <option value={1}>1 hour before</option>
                                <option value={2}>2 hours before</option>
                                <option value={4}>4 hours before</option>
                                <option value={12}>12 hours before</option>
                                <option value={24}>24 hours before (1 day)</option>
                                <option value={48}>48 hours before (2 days)</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                                You'll receive a notification reminder before your scheduled pickup time.
                            </p>
                        </div>
                    </div>
                )}
                <div className="flex justify-end mt-8">
                    <Button type="submit" variant="primary" className="px-8 py-3 text-lg font-semibold rounded-lg shadow-md bg-green-600 hover:bg-green-700 transition" disabled={loading}>
                        {loading ? (
                            <span><i className="fas fa-spinner fa-spin mr-2"></i>Submitting...</span>
                        ) : (
                            'Submit Claim'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
