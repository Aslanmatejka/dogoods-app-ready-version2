import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import authService from '../utils/authService';

function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [email, setEmail] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [success, setSuccess] = React.useState(false);

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);

        try {
            await authService.resetPassword(email);
            setSuccess(true);
        } catch (error) {
            console.error('Password reset error:', error);
            setError('Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
                                Check your email
                            </h3>
                            <p className="text-sm text-gray-600 mb-6">
                                We've sent a password reset link to <strong>{email}</strong>
                            </p>
                            <p className="text-sm text-gray-500 mb-6">
                                Click the link in the email to reset your password. The link will expire in 1 hour.
                            </p>
                            <Button
                                variant="primary"
                                onClick={() => navigate('/login')}
                                className="w-full"
                            >
                                Return to login
                            </Button>
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
                    Reset your password
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Enter your email address and we'll send you a link to reset your password
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <div className="mt-1">
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (error) setError(null);
                                    }}
                                    placeholder="Enter your email"
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                />
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
                                {loading ? 'Sending...' : 'Send reset link'}
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

export default ForgotPasswordPage;
