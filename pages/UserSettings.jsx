import React from "react";
import Card from "../components/common/Card";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { useAuth } from "../utils/hooks/useSupabase";
import DietaryPreferences from "../components/profile/DietaryPreferences";
import { useTutorial } from "../utils/TutorialContext";
import supabase from "../utils/supabaseClient";

function UserSettings() {
    const { resetTutorial } = useTutorial();
    const { user: authUser, isAuthenticated, updateProfile } = useAuth();
    
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
    const [formData, setFormData] = React.useState({
        name: '',
        email: '',
        notifications: {
            email: false,
            push: false
        },
        privacy: {
            profileVisibility: false,
            locationSharing: false
        },
        dietary_restrictions: [],
        allergies: [],
        dietary_preferences: [],
        pickup_reminder_enabled: true,
        default_reminder_hours: 24
    });
    const [successMessage, setSuccessMessage] = React.useState('');

    React.useEffect(() => {
        const loadUserData = async () => {
            if (authUser) {
                // Fetch full user profile from database
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();

                setFormData({
                    name: authUser.name || profile?.name || '',
                    email: authUser.email || '',
                    notifications: authUser.notifications || {
                        email: false,
                        push: false
                    },
                    privacy: authUser.privacy || {
                        profileVisibility: false,
                        locationSharing: false
                    },
                    dietary_restrictions: profile?.dietary_restrictions || [],
                    allergies: profile?.allergies || [],
                    dietary_preferences: profile?.dietary_preferences || [],
                    pickup_reminder_enabled: profile?.pickup_reminder_enabled !== false,
                    default_reminder_hours: profile?.default_reminder_hours || 24
                });
            }
        };
        loadUserData();
    }, [authUser]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNestedInputChange = (category, field, value) => {
        setFormData(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [field]: value
            }
        }));
    };

    const handleCheckboxChange = (section, field) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: !prev[section][field]
            }
        }));
    };

    const handleDietaryChange = (dietaryData) => {
        setFormData(prev => ({
            ...prev,
            ...dietaryData
        }));
    };

    const handleSaveSettings = async (section) => {
        setLoading(true);
        setError(null);
        setSuccessMessage('');
        
        try {
            // Update user profile in Supabase
            if (section === 'Dietary') {
                const { error: updateError } = await supabase
                    .from('users')
                    .update({
                        dietary_restrictions: formData.dietary_restrictions,
                        allergies: formData.allergies,
                        dietary_preferences: formData.dietary_preferences
                    })
                    .eq('id', authUser.id);

                if (updateError) throw updateError;
            } else if (section === 'Reminders') {
                const { error: updateError } = await supabase
                    .from('users')
                    .update({
                        pickup_reminder_enabled: formData.pickup_reminder_enabled,
                        default_reminder_hours: formData.default_reminder_hours
                    })
                    .eq('id', authUser.id);

                if (updateError) throw updateError;
            } else if (updateProfile) {
                await updateProfile(formData);
            }
            
            setSuccessMessage(`${section} settings saved successfully`);
            
            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        } catch (error) {
            console.error('Save settings error:', error);
            setError('Failed to save settings. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setLoading(true);
        try {
            // In a real app, this would delete the account from Supabase
            // For now, just show success message
            setSuccessMessage('Account deletion initiated. Please contact support for confirmation.');
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        } catch (error) {
            console.error('Delete account error:', error);
            setError('Failed to delete account. Please try again.');
        } finally {
            setLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="text-center py-12" role="status" aria-busy="true">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
                <div className="sr-only">Loading user settings...</div>
                <p className="mt-4 text-gray-600" aria-live="polite">Loading user settings...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

            {error && (
                <div 
                    className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" 
                    role="alert"
                >
                    <i className="fas fa-exclamation-circle mr-2" aria-hidden="true"></i>
                    {error}
                </div>
            )}

            {successMessage && (
                <div 
                    className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative"
                    role="status"
                >
                    <i className="fas fa-check-circle mr-2" aria-hidden="true"></i>
                    {successMessage}
                </div>
            )}

            <div className="space-y-6">
                {/* Account Settings */}
                <Card>
                    <div className="p-6">
                        <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Email"
                                value={formData.email}
                                disabled
                                aria-label="Email address"
                            />
                            <Input
                                label="Display Name"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                aria-label="Display name"
                            />
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button
                                variant="primary"
                                onClick={() => handleSaveSettings('Account')}
                                disabled={loading}
                                aria-label="Save account settings"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Notification Settings */}
                <Card>
                    <div className="p-6">
                        <h2 className="text-xl font-semibold mb-6">Notification Settings</h2>
                        <div className="space-y-4" role="group" aria-labelledby="notification-settings">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="emailNotifications"
                                    checked={formData.notifications.email}
                                    onChange={() => handleCheckboxChange('notifications', 'email')}
                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    aria-label="Enable email notifications"
                                />
                                <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
                                    Email Notifications
                                </label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="pushNotifications"
                                    checked={formData.notifications.push}
                                    onChange={() => handleCheckboxChange('notifications', 'push')}
                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    aria-label="Enable push notifications"
                                />
                                <label htmlFor="pushNotifications" className="ml-2 block text-sm text-gray-900">
                                    Push Notifications
                                </label>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button
                                variant="primary"
                                onClick={() => handleSaveSettings('Notification')}
                                disabled={loading}
                                aria-label="Save notification settings"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Pickup Reminders */}
                <Card>
                    <div className="p-6">
                        <h2 className="text-xl font-semibold mb-6">Pickup Reminders</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Get notified before your scheduled food pickups so you never miss a collection.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="pickupReminders"
                                    checked={formData.pickup_reminder_enabled}
                                    onChange={() => handleInputChange('pickup_reminder_enabled', !formData.pickup_reminder_enabled)}
                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    aria-label="Enable pickup reminders"
                                />
                                <label htmlFor="pickupReminders" className="ml-2 block text-sm text-gray-900">
                                    Enable pickup reminders
                                </label>
                            </div>

                            {formData.pickup_reminder_enabled && (
                                <div className="ml-6 mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Remind me before pickup
                                    </label>
                                    <select
                                        value={formData.default_reminder_hours}
                                        onChange={(e) => handleInputChange('default_reminder_hours', parseInt(e.target.value))}
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                                        aria-label="Select reminder time"
                                    >
                                        <option value={1}>1 hour before</option>
                                        <option value={2}>2 hours before</option>
                                        <option value={4}>4 hours before</option>
                                        <option value={12}>12 hours before</option>
                                        <option value={24}>24 hours before (1 day)</option>
                                        <option value={48}>48 hours before (2 days)</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button
                                variant="primary"
                                onClick={() => handleSaveSettings('Reminders')}
                                disabled={loading}
                                aria-label="Save reminder preferences"
                            >
                                {loading ? 'Saving...' : 'Save Reminder Preferences'}
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Dietary Preferences */}
                <Card>
                    <div className="p-6">
                        <h2 className="text-xl font-semibold mb-6">Dietary Preferences & Allergies</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Help us match you with suitable food by setting your dietary restrictions, allergies, and preferences.
                        </p>
                        <DietaryPreferences
                            initialRestrictions={formData.dietary_restrictions}
                            initialAllergies={formData.allergies}
                            initialPreferences={formData.dietary_preferences}
                            onChange={handleDietaryChange}
                        />
                        <div className="mt-6 flex justify-end">
                            <Button
                                variant="primary"
                                onClick={() => handleSaveSettings('Dietary')}
                                disabled={loading}
                                aria-label="Save dietary preferences"
                            >
                                {loading ? 'Saving...' : 'Save Dietary Preferences'}
                            </Button>
                        </div>
                    </div>
                </Card>
                {/* Tutorial Section */}
                <Card>
                    <div className="p-6">
                        <h2 className="text-xl font-semibold mb-4">Tutorial</h2>
                        <p className="text-gray-600 mb-6">
                            Need a refresher? Restart the interactive tutorial to learn how to use DoGoods.
                        </p>
                        <Button
                            variant="secondary"
                            onClick={resetTutorial}
                            className="flex items-center"
                        >
                            <i className="fas fa-graduation-cap mr-2"></i>
                            Start Tutorial
                        </Button>
                    </div>
                </Card>
                {/* Privacy Settings */}
                <Card>
                    <div className="p-6">
                        <h2 className="text-xl font-semibold mb-6">Privacy Settings</h2>
                        <div className="space-y-4" role="group" aria-labelledby="privacy-settings">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="profileVisibility"
                                    checked={formData.privacy.profileVisibility}
                                    onChange={() => handleCheckboxChange('privacy', 'profileVisibility')}
                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    aria-label="Make profile visible to other users"
                                />
                                <label htmlFor="profileVisibility" className="ml-2 block text-sm text-gray-900">
                                    Make profile visible to other users
                                </label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="locationSharing"
                                    checked={formData.privacy.locationSharing}
                                    onChange={() => handleCheckboxChange('privacy', 'locationSharing')}
                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                    aria-label="Share location with food listings"
                                />
                                <label htmlFor="locationSharing" className="ml-2 block text-sm text-gray-900">
                                    Share location with food listings
                                </label>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button
                                variant="primary"
                                onClick={() => handleSaveSettings('Privacy')}
                                disabled={loading}
                                aria-label="Save privacy settings"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Danger Zone */}
                <Card>
                    <div className="p-6">
                        <h2 className="text-xl font-semibold mb-6 text-red-600">Danger Zone</h2>
                        <div className="space-y-4">
                            <Button
                                variant="danger"
                                onClick={() => setShowDeleteConfirm(true)}
                                aria-label="Delete account"
                            >
                                Delete Account
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Delete Account Confirmation Modal */}
            {showDeleteConfirm && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
                    role="dialog"
                    aria-labelledby="delete-account-title"
                    aria-describedby="delete-account-description"
                >
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full">
                        <h3 id="delete-account-title" className="text-lg font-semibold mb-4">
                            Delete Account
                        </h3>
                        <p id="delete-account-description" className="text-gray-600 mb-6">
                            Are you sure you want to delete your account? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-4">
                            <Button
                                variant="secondary"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={loading}
                                aria-label="Cancel account deletion"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleDeleteAccount}
                                disabled={loading}
                                aria-label="Confirm account deletion"
                            >
                                {loading ? 'Deleting...' : 'Delete Account'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserSettings;
