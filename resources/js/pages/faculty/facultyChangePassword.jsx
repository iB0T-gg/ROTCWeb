import React, { useState } from 'react';
import Header from '../../components/header';
import FacultySidebar from '../../components/facultySidebar';
import { useForm, Head } from '@inertiajs/react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function ChangePassword({ auth }) {
    const [passwordError, setPasswordError] = useState('');
    const [passwordValidation, setPasswordValidation] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        symbol: false,
        isValid: false
    });
    const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isCurrentFocused, setIsCurrentFocused] = useState(false);
    const [isNewFocused, setIsNewFocused] = useState(false);
    const [isConfirmFocused, setIsConfirmFocused] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { data, setData, post, processing, errors } = useForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });

    // Password validation function
    const validatePassword = (password) => {
        const validation = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
        };
        
        validation.isValid = Object.values(validation).every(Boolean);
        setPasswordValidation(validation);
        return validation.isValid;
    };

    const validatePasswords = () => {
        if (data.new_password !== data.confirm_password) {
            setPasswordError('New password and confirm password do not match');
            return false;
        }
        
        if (!validatePassword(data.new_password)) {
            setPasswordError('Password does not meet the required criteria');
            return false;
        }
        
        setPasswordError('');
        return true;
    };

    // Handle new password change with validation
    const handleNewPasswordChange = (e) => {
        const password = e.target.value;
        setData('new_password', password);
        validatePassword(password);
        
        // Show requirements if password is being typed
        if (password.length > 0) {
            setShowPasswordRequirements(true);
        } else {
            setShowPasswordRequirements(false);
        }
        
        // Check if confirm password matches
        if (data.confirm_password && data.confirm_password !== password) {
            setPasswordError('New password and confirm password do not match');
        } else {
            setPasswordError('');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!validatePasswords()) {
            return;
        }
        
        if (isSubmitting) {
            return; // Prevent double submission
        }
        
        setIsSubmitting(true);
        
        // Get the CSRF token from meta tag
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        
        console.log('CSRF Token found:', token ? 'Yes' : 'No');
        console.log('Token length:', token.length);
        
        // Prepare JSON data instead of FormData
        const requestData = {
            current_password: data.current_password,
            new_password: data.new_password,
            confirm_password: data.confirm_password,
        };
        
        console.log('Sending request with data structure:', {
            current_password: data.current_password ? 'PROVIDED' : 'MISSING',
            new_password: data.new_password ? 'PROVIDED' : 'MISSING', 
            confirm_password: data.confirm_password ? 'PROVIDED' : 'MISSING',
            new_password_length: data.new_password.length,
            passwords_match: data.new_password === data.confirm_password,
            password_validation: passwordValidation
        });
        
        // Use fetch API with JSON payload
        fetch('/api/faculty/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': token,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
            },
            body: JSON.stringify(requestData)
        })
        .then(response => {
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            console.log('Content-Type:', response.headers.get('content-type'));
            
            if (!response.ok) {
                // Handle error responses
                if (response.status === 419) {
                    throw new Error('CSRF token mismatch.');
                } else if (response.status === 401) {
                    throw new Error('Current password is incorrect.');
                } else if (response.status === 422) {
                    throw new Error('Validation failed. Please check your password requirements.');
                } else {
                    throw new Error(`Server error (${response.status}). Please try again later.`);
                }
            }
            
            // If we get here, the response was successful (200-299 status)
            // We don't need to parse JSON, just treat it as success
            return { success: true };
        })
        .then(data => {
            console.log('Password change successful!');
            
            // Clear form data
            setData({
                current_password: '',
                new_password: '',
                confirm_password: '',
            });
            
            // Reset validation states
            setPasswordValidation({
                length: false,
                uppercase: false,
                lowercase: false,
                number: false,
                symbol: false,
                isValid: false
            });
            setShowPasswordRequirements(false);
            setPasswordError('');
            setIsSubmitting(false);
            
            // Show success toast
            toast.success('🎉 Password changed successfully!', {
                position: "top-center",
                autoClose: 4000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                style: {
                    background: "#10B981",
                    color: "white",
                    fontWeight: "500"
                }
            });
        })
        .catch(error => {
            console.error('Error:', error);
            setIsSubmitting(false); // Reset loading state
            
            // Show error toast based on error type
            if (error.message.includes('CSRF token mismatch')) {
                toast.error('Security token expired. Please refresh the page and try again.', {
                    position: "top-center",
                    autoClose: 5000
                });
                // Refresh the page after a delay
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
            } else if (error.message.includes('Current password is incorrect')) {
                toast.error('The current password is incorrect. Please try again.', {
                    position: "top-center",
                    autoClose: 5000
                });
            } else if (error.message.includes('Validation failed')) {
                // More specific validation error message
                let validationMessage = 'Password validation failed. Please ensure:';
                if (!passwordValidation.length) validationMessage += '\n• At least 8 characters';
                if (!passwordValidation.uppercase) validationMessage += '\n• At least one uppercase letter';
                if (!passwordValidation.lowercase) validationMessage += '\n• At least one lowercase letter';
                if (!passwordValidation.number) validationMessage += '\n• At least one number';
                if (!passwordValidation.symbol) validationMessage += '\n• At least one symbol';
                if (data.new_password !== data.confirm_password) validationMessage += '\n• Passwords must match';
                
                toast.error(validationMessage, {
                    position: "top-center",
                    autoClose: 7000
                });
            } else if (error.message.includes('Server error')) {
                toast.error('Server error occurred. Please try again later.', {
                    position: "top-center",
                    autoClose: 5000
                });
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                toast.error('Network error. Please check your internet connection and try again.', {
                    position: "top-center",
                    autoClose: 5000
                });
            } else {
                toast.error('Failed to change password. Please try again.', {
                    position: "top-center",
                    autoClose: 5000
                });
            }
        });
    };

    return (
        <>
            <Head title="ROTC Portal - Change Password" />
            <div className="w-full min-h-screen bg-backgroundColor">
            <ToastContainer />
            <Header auth={auth} />
            <div className="flex flex-col md:flex-row">
                <FacultySidebar />
                <div className="flex-1 p-3 md:p-6">
                    <div className="font-regular">
                        {/* Breadcrumb */}
                        <div className="bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 cursor-pointer text-sm md:text-base">
                            Home {">"} Change Password
                        </div>
                        
                        {/* Page Header */}
                        <div className="bg-primary text-white p-3 md:p-4 rounded-lg flex items-center justify-between mt-3 md:mt-4 mb-3 md:mb-6 pl-3 md:pl-5 py-4 md:py-7">
                            <h1 className="text-xl md:text-2xl font-semibold">Change Password</h1>
                        </div>
                        
                        {/* Main Content */}
                        <div className="bg-white p-3 md:p-6 rounded-lg shadow">
                            <div className="pl-2 md:pl-4">
                                <h2 className="text-base md:text-lg font-semibold text-gray-700 mb-3 md:mb-6">Update Your Password</h2>
                                <form onSubmit={handleSubmit} className="w-full max-w-lg">
                                    <div className="mb-4 md:mb-5">
                                        <label className="block text-gray-700 font-medium mb-1 md:mb-2 text-sm md:text-base">Current Password</label>
                                        <div className="relative">
                                            <input 
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                className="w-full px-2 md:px-3 py-1.5 md:py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm md:text-base"
                                                value={data.current_password}
                                                onChange={e => setData('current_password', e.target.value)}
                                                required
                                                onFocus={() => setIsCurrentFocused(true)}
                                                onBlur={() => setIsCurrentFocused(false)}
                                            />
                                            {data.current_password && data.current_password.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                                >
                                                    {showCurrentPassword ? <FaEye className="w-4 h-4" /> : <FaEyeSlash className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                        {errors.current_password && <div className="text-red-500 text-xs md:text-sm mt-1">{errors.current_password}</div>}
                                    </div>
                                    
                                    <div className="mb-4 md:mb-5">
                                        <label className="block text-gray-700 font-medium mb-1 md:mb-2 text-sm md:text-base">New Password</label>
                                        <div className="relative">
                                            <input 
                                                type={showNewPassword ? 'text' : 'password'}
                                                className={`w-full px-2 md:px-3 py-1.5 md:py-2 pr-10 border rounded-md focus:outline-none focus:border-primary text-sm md:text-base ${
                                                    data.new_password.length > 0 
                                                        ? passwordValidation.isValid 
                                                            ? 'border-green-500' 
                                                            : 'border-red-500'
                                                        : 'border-gray-300'
                                                }`}
                                                value={data.new_password}
                                                onChange={handleNewPasswordChange}
                                                onFocus={() => { setShowPasswordRequirements(true); setIsNewFocused(true); }}
                                                onBlur={() => setIsNewFocused(false)}
                                                placeholder="Enter a strong password (min. 8 characters)"
                                                required
                                            />
                                            {data.new_password && data.new_password.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                                >
                                                    {showNewPassword ? <FaEye className="w-4 h-4" /> : <FaEyeSlash className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                        {errors.new_password && <div className="text-red-500 text-xs md:text-sm mt-1">{errors.new_password}</div>}
                                        
                                        {/* Password Requirements Display */}
                                        {showPasswordRequirements && (
                                            <div className="mt-2 p-3 bg-gray-50 rounded-md border">
                                                <p className="text-xs md:text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                                                <div className="space-y-1">
                                                    <div className={`text-xs md:text-sm flex items-center ${passwordValidation.length ? 'text-green-600' : 'text-red-500'}`}>
                                                        <span className="mr-1">{passwordValidation.length ? '✓' : '✗'}</span>
                                                        At least 8 characters
                                                    </div>
                                                    <div className={`text-xs md:text-sm flex items-center ${passwordValidation.uppercase ? 'text-green-600' : 'text-red-500'}`}>
                                                        <span className="mr-1">{passwordValidation.uppercase ? '✓' : '✗'}</span>
                                                        At least one uppercase letter (A-Z)
                                                    </div>
                                                    <div className={`text-xs md:text-sm flex items-center ${passwordValidation.lowercase ? 'text-green-600' : 'text-red-500'}`}>
                                                        <span className="mr-1">{passwordValidation.lowercase ? '✓' : '✗'}</span>
                                                        At least one lowercase letter (a-z)
                                                    </div>
                                                    <div className={`text-xs md:text-sm flex items-center ${passwordValidation.number ? 'text-green-600' : 'text-red-500'}`}>
                                                        <span className="mr-1">{passwordValidation.number ? '✓' : '✗'}</span>
                                                        At least one number (0-9)
                                                    </div>
                                                    <div className={`text-xs md:text-sm flex items-center ${passwordValidation.symbol ? 'text-green-600' : 'text-red-500'}`}>
                                                        <span className="mr-1">{passwordValidation.symbol ? '✓' : '✗'}</span>
                                                        At least one symbol (!@#$%^&*()_+-=[]{'}'}|;':",./{`<`}{`>`}?)
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                    </div>
                                    
                                    <div className="mb-4 md:mb-6">
                                        <label className="block text-gray-700 font-medium mb-1 md:mb-2 text-sm md:text-base">Confirm New Password</label>
                                        <div className="relative">
                                            <input 
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                className={`w-full px-2 md:px-3 py-1.5 md:py-2 pr-10 border rounded-md focus:outline-none focus:border-primary text-sm md:text-base ${
                                                    data.confirm_password.length > 0 && data.new_password.length > 0
                                                        ? data.new_password === data.confirm_password 
                                                            ? 'border-green-500' 
                                                            : 'border-red-500'
                                                        : 'border-gray-300'
                                                }`}
                                                value={data.confirm_password}
                                                onChange={e => {
                                                    setData('confirm_password', e.target.value);
                                                    if (data.new_password !== e.target.value) {
                                                        setPasswordError('New password and confirm password do not match');
                                                    } else {
                                                        setPasswordError('');
                                                    }
                                                }}
                                                placeholder="Confirm your new password"
                                                required
                                                onFocus={() => setIsConfirmFocused(true)}
                                                onBlur={() => setIsConfirmFocused(false)}
                                            />
                                            {data.confirm_password && data.confirm_password.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                                >
                                                    {showConfirmPassword ? <FaEye className="w-4 h-4" /> : <FaEyeSlash className="w-4 h-4" />}
                                                </button>
                                            )}
                                        </div>
                                        {errors.confirm_password && <div className="text-red-500 text-xs md:text-sm mt-1">{errors.confirm_password}</div>}
                                        {passwordError && <div className="text-red-500 text-xs md:text-sm mt-1">{passwordError}</div>}
                                        {data.confirm_password.length > 0 && data.new_password === data.confirm_password && data.new_password.length > 0 && (
                                            <div className="text-green-500 text-xs sm:text-sm mt-1">Passwords match</div>
                                        )}
                                    </div>
                                    
                                    <div className="flex justify-start">
                                        <button 
                                            type="submit"
                                            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-md transition-colors text-sm md:text-base ${
                                                isSubmitting || !passwordValidation.isValid || data.new_password !== data.confirm_password
                                                    ? 'bg-primary text-white cursor-not-allowed' 
                                                    : 'bg-primary text-white hover:bg-primary-dark'
                                            }`}
                                            disabled={isSubmitting || !passwordValidation.isValid || data.new_password !== data.confirm_password}
                                        >
                                            {isSubmitting ? 'Changing Password...' : 'Change Password'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}
