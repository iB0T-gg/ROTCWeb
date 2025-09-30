import React, { useState } from 'react';
import Header from '../../components/header';
import AdminSidebar from '../../components/adminSidebar';
import { useForm } from '@inertiajs/react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ChangePassword({ auth }) {
    const [passwordError, setPasswordError] = useState('');
    const { data, setData, post, processing, errors } = useForm({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });

    const validatePasswords = () => {
        if (data.new_password !== data.confirm_password) {
            setPasswordError('New password and confirm password do not match');
            return false;
        }
        setPasswordError('');
        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!validatePasswords()) {
            return;
        }
        
        const formData = new FormData();
        formData.append('current_password', data.current_password);
        formData.append('new_password', data.new_password);
        formData.append('confirm_password', data.confirm_password);
        
        // Get the CSRF token from meta tag
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        
        // Use fetch API directly to avoid Inertia's handling of the response
        fetch('/api/admin/change-password', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRF-TOKEN': token,
                'X-Requested-With': 'XMLHttpRequest',
            }
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Failed to change password');
                });
            }
            return response.json();
        })
        .then(data => {
            // Clear form data
            setData({
                current_password: '',
                new_password: '',
                confirm_password: '',
            });
            
            // Show success toast
            toast.success('Password changed successfully!', {
                position: "top-center",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true
            });
        })
        .catch(error => {
            // Show error toast
            if (error.message && error.message.includes('current password is incorrect')) {
                toast.error('The current password is incorrect', {
                    position: "top-center",
                    autoClose: 5000
                });
            } else {
                toast.error('Failed to change password. Please try again.', {
                    position: "top-center",
                    autoClose: 5000
                });
            }
            console.error('Error:', error);
        });
    };

    return (
        <div className="w-full min-h-screen bg-backgroundColor">
            <ToastContainer />
            <Header auth={auth} />
            <div className="flex flex-col md:flex-row">
                <AdminSidebar />
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
                                        <input 
                                            type="password"
                                            className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm md:text-base"
                                            value={data.current_password}
                                            onChange={e => setData('current_password', e.target.value)}
                                            required
                                        />
                                        {errors.current_password && <div className="text-red-500 text-xs md:text-sm mt-1">{errors.current_password}</div>}
                                    </div>
                                    
                                    <div className="mb-4 md:mb-5">
                                        <label className="block text-gray-700 font-medium mb-1 md:mb-2 text-sm md:text-base">New Password</label>
                                        <input 
                                            type="password"
                                            className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm md:text-base"
                                            value={data.new_password}
                                            onChange={e => {
                                                setData('new_password', e.target.value);
                                                if (data.confirm_password && data.confirm_password !== e.target.value) {
                                                    setPasswordError('New password and confirm password do not match');
                                                } else {
                                                    setPasswordError('');
                                                }
                                            }}
                                            required
                                        />
                                        {errors.new_password && <div className="text-red-500 text-xs md:text-sm mt-1">{errors.new_password}</div>}
                                    </div>
                                    
                                    <div className="mb-4 md:mb-6">
                                        <label className="block text-gray-700 font-medium mb-1 md:mb-2 text-sm md:text-base">Confirm New Password</label>
                                        <input 
                                            type="password"
                                            className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm md:text-base"
                                            value={data.confirm_password}
                                            onChange={e => {
                                                setData('confirm_password', e.target.value);
                                                if (data.new_password !== e.target.value) {
                                                    setPasswordError('New password and confirm password do not match');
                                                } else {
                                                    setPasswordError('');
                                                }
                                            }}
                                            required
                                        />
                                        {errors.confirm_password && <div className="text-red-500 text-xs md:text-sm mt-1">{errors.confirm_password}</div>}
                                        {passwordError && <div className="text-red-500 text-xs md:text-sm mt-1">{passwordError}</div>}
                                    </div>
                                    
                                    <div className="flex justify-start">
                                        <button 
                                            type="submit"
                                            className="px-3 md:px-4 py-1.5 md:py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors text-sm md:text-base"
                                            disabled={processing}
                                        >
                                            {processing ? 'Changing Password...' : 'Change Password'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}