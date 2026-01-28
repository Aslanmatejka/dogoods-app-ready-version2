import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import supabase from '../utils/supabaseClient';
import { reportError } from '../utils/helpers';

function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [formData, setFormData] = React.useState({
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [success, setSuccess] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
    const [verifyingToken, setVerifyingToken] = React.useState(true);
    const [validToken, setValidToken] = React.useState(false);

    useEffect(() => {
        // Check for token in URL hash (Supabase auth redirect)
        const checkToken = async () => {
            try {
                // Check if there's a hash with access_token
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const type = hashParams.get('type');

                if (type === 'recovery' && accessToken) {
                    // Valid password reset token
                    setValidToken(true);
                    setVerifyingToken(false);
                    return;
                }

                // Also check query params (alternative method)
                const token = searchParams.get('token');
                if (token) {
                    setValidToken(true);
                    setVerifyingToken(false);
                    return;
                }

                // Check if user already has a session from email link
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                
                if (session && !sessionError) {
                    setValidToken(true);
                } else {
                    setError('Invalid or expired reset link. Please request a new password reset.');
                    setValidToken(false);
                }
            } catch (err) {
                console.error('Token verification error:', err);
                setError('Failed to verify reset link. Please try again.');
                setValidToken(false);
            } finally {
                setVerifyingToken(false);
            }
        };

        checkToken();
    }, [searchParams]);

    const validatePassword = (password) => {
        if (password.length < 8) {
            return 'Password must be at least 8 characters long';
        }
        if (!/(?=.*[a-z])/.test(password)) {
            return 'Password must contain at least one lowercase letter';
        }
        if (!/(?=.*[A-Z])/.test(password)) {
            return 'Password must contain at least one uppercase letter';
        }
        if (!/(?=.*\d)/.test(password)) {
            return 'Password must contain at least one number';
        }
        return null;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (error) setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!formData.password || !formData.confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        const passwordError = validatePassword(formData.password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            // Update password using Supabase
            const { error: updateError } = await supabase.auth.updateUser({
                password: formData.password
            });

            if (updateError) {
                throw updateError;
            }

            setSuccess(true);
            
            // Sign out after password reset for security
            await supabase.auth.signOut();
            
            setTimeout(() => {
                navigate('/login?message=password-reset-success');
            }, 2000);
        } catch (error) {
            console.error('Password update error:', error);
            reportError(error, { context: 'Password reset' });
            
            if (error.message?.includes('session') || error.message?.includes('token')) {
                setError('Your reset link has expired. Please request a new one.');
                setTimeout(() => navigate('/forgot-password'), 3000);
            } else if (error.message?.includes('same password')) {
                setError('New password must be different from your old password.');
            } else {
                setError('Failed to reset password. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Show loading while verifying token
    if (verifyingToken) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2CABE3] mx-auto mb-4"></div>
                            <p className="text-sm text-gray-600">Verifying reset link...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show error if token is invalid
    if (!validToken && !verifyingToken) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <i className="fas fa-times text-red-600 text-xl"></i>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Invalid or Expired Link
                            </h3>
                            <p className="text-sm text-gray-600 mb-6">
                                {error || 'This password reset link is invalid or has expired.'}
                            </p>
                            <div className="space-y-3">
                                <Button
                                    variant="primary"
                                    onClick={() => navigate('/forgot-password')}
                                    className="w-full"
                                >
                                    Request New Reset Link
                                </Button>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full text-sm font-medium text-green-600 hover:text-green-500"
                                >
                                    Back to Login
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                <i className="fas fa-check text-green-600 text-xl"></i>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Password reset successful
                            </h3>
                            <p className="text-sm text-gray-600 mb-6">
                                Your password has been successfully reset. You can now log in with your new password.
                            </p>
                            <p className="text-sm text-gray-500">
                                Redirecting to login page...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Set new password
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Please enter your new password below
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                New password
                            </label>
                            <div className="mt-1 relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter new password"
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    <i className={`fas fa-eye${showPassword ? '-slash' : ''} text-gray-400`}></i>
                                </button>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                                Must be at least 8 characters with uppercase, lowercase, and numbers
                            </p>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                Confirm new password
                            </label>
                            <div className="mt-1 relative">
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm new password"
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    <i className={`fas fa-eye${showConfirmPassword ? '-slash' : ''} text-gray-400`}></i>
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <i className="fas fa-exclamation-circle text-red-400"></i>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-800">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? 'Resetting password...' : 'Reset password'}
                            </Button>
                        </div>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="text-sm font-medium text-green-600 hover:text-green-500"
                            >
                                Back to login
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ResetPasswordPage;
