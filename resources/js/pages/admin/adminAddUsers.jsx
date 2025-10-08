import React, { useState } from 'react';
import Header from '../../components/header';
import AdminSidebar from '../../components/adminSidebar';
import { useForm, Link, Head } from '@inertiajs/react';

// Alert Dialog Component
const AlertDialog = ({ isOpen, type, title, message, onClose }) => {
  if (!isOpen) return null;

  const textColor = type === 'success' ? 'text-primary' : 'text-red-800';
  const borderColor = type === 'success' ? 'border-primary' : 'border-red-300';
  const buttonColor = type === 'success' ? 'bg-primary/90 hover:bg-primary' : 'bg-red-600 hover:bg-red-700';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
        <div className={`border rounded-lg p-4 mb-4`}>
          <h3 className={`text-lg font-semibold ${textColor} mb-2`}>{title}</h3>
          <p className={`${textColor}`}>{message}</p>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 ${buttonColor} text-white rounded hover:opacity-90 transition-colors duration-150`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AddUsers({ auth, success, error }) {
    // Alert state
    const [alertDialog, setAlertDialog] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: ''
    });

    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        student_number: '',
        role: 'user', // Default role is user (cadet)
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validate student number is required only for cadets
        if (data.role === 'user' && !data.student_number.trim()) {
            setAlertDialog({
                isOpen: true,
                type: 'error',
                title: 'Validation Error',
                message: 'Student number is required for cadets'
            });
            return;
        }
        
        post('/api/admin/add-user', {
            onSuccess: () => {
                reset();
                setAlertDialog({
                    isOpen: true,
                    type: 'success',
                    title: 'Success',
                    message: 'User has been successfully added!'
                });
            },
            onError: (errors) => {
                // Check if there are specific validation errors
                if (Object.keys(errors).length > 0) {
                    // Use the first error message
                    const firstError = Object.values(errors)[0];
                    setAlertDialog({
                        isOpen: true,
                        type: 'error',
                        title: 'Validation Error',
                        message: Array.isArray(firstError) ? firstError[0] : firstError
                    });
                } else {
                    setAlertDialog({
                        isOpen: true,
                        type: 'error',
                        title: 'Error',
                        message: 'An error occurred while adding the user. Please try again.'
                    });
                }
                console.error('Validation errors:', errors);
            }
        });
    };

    return (
        <>
            <Head title="ROTC Portal - Add Users" />
            <div className="w-full min-h-screen bg-backgroundColor">
            <Header auth={auth} />
            {/* Add margin-top on mobile to account for mobile hamburger menu */}
            <div className="flex mt-0 md:mt-0">
                <AdminSidebar />
                <div className="flex-1 p-3 md:p-6 w-full md:w-auto overflow-x-auto">
                    <div className="font-regular min-w-[320px]">
                        <div className="bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 text-sm md:text-base">
                        <Link href="/adminHome" className="hover:underline cursor-pointer font-semibold">
                            Dashboard
                        </Link>
                        <span className="mx-2 font-semibold">{">"}</span>
                        <span className="cursor-default font-bold">Add Users</span>  
                        </div>
                        <div className="bg-primary text-white p-3 md:p-4 rounded-lg flex items-center justify-between mt-4 mb-6 pl-3 md:pl-5 py-5 md:py-7">
                            <h1 className="text-lg md:text-2xl font-semibold">User Management</h1>
                        </div>
                        <div className="bg-white p-4 md:p-6 rounded-lg shadow">
                            <h2 className="text-base md:text-lg font-semibold text-gray-700 mb-4">Add New User</h2>
                            
                            {/* Information panel */}
                            <div className="bg-blue-50 border-l-4 border-green-400 p-3 md:p-4 mb-6">
                                <div className="flex">
                                    <div className="ml-2 md:ml-3">
                                        <p className="text-xs md:text-sm text-green-700">
                                            <strong>Email Process:</strong>
                                        </p>
                                        <ul className="text-xs md:text-sm text-green-600 mt-1 list-disc list-inside space-y-1">
                                            <li><strong>Admin-created users:</strong> Will receive login credentials via email once approved.</li>
                                            <li><strong>Self-registered users:</strong> Will receive approval notification (no credentials) and use their original password.</li>
                                            <li><strong>Admins:</strong> Will be approved automatically and receive login credentials immediately.</li>
                                            <li><strong>Student Number:</strong> Required only for cadets, optional for faculty and admins.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1 md:mb-2 text-sm md:text-base">First Name</label>
                                        <input 
                                            type="text"
                                            className={`w-full px-2 md:px-3 py-1.5 md:py-2 border rounded-md focus:outline-none focus:border-primary text-sm md:text-base ${errors.first_name ? 'border-red-500' : 'border-gray-300'}`}
                                            value={data.first_name}
                                            onChange={e => setData('first_name', e.target.value)}
                                            required
                                        />
                                        {errors.first_name && <div className="text-red-500 text-xs md:text-sm mt-1">{errors.first_name}</div>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1 md:mb-2 text-sm md:text-base">Middle Name</label>
                                        <input 
                                            type="text"
                                            className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm md:text-base"
                                            value={data.middle_name}
                                            onChange={e => setData('middle_name', e.target.value)}
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1 md:mb-2 text-sm md:text-base">Last Name</label>
                                        <input 
                                            type="text"
                                            className={`w-full px-2 md:px-3 py-1.5 md:py-2 border rounded-md focus:outline-none focus:border-primary text-sm md:text-base ${errors.last_name ? 'border-red-500' : 'border-gray-300'}`}
                                            value={data.last_name}
                                            onChange={e => setData('last_name', e.target.value)}
                                            required
                                        />
                                        {errors.last_name && <div className="text-red-500 text-xs md:text-sm mt-1">{errors.last_name}</div>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1 md:mb-2 text-sm md:text-base">Email</label>
                                        <input 
                                            type="email"
                                            className={`w-full px-2 md:px-3 py-1.5 md:py-2 border rounded-md focus:outline-none focus:border-primary text-sm md:text-base ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            required
                                        />
                                        {errors.email && <div className="text-red-500 text-xs md:text-sm mt-1">{errors.email}</div>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1 md:mb-2 text-sm md:text-base">
                                            Student Number {data.role === 'user' && <span className="text-red-500">*</span>}
                                        </label>
                                        <input 
                                            type="text"
                                            className={`w-full px-2 md:px-3 py-1.5 md:py-2 border rounded-md focus:outline-none focus:border-primary text-sm md:text-base ${errors.student_number ? 'border-red-500' : 'border-gray-300'}`}
                                            value={data.student_number}
                                            onChange={e => setData('student_number', e.target.value)}
                                            required={data.role === 'user'}
                                            placeholder={data.role !== 'user' ? 'Optional for admin/faculty' : 'Required for cadets'}
                                        />
                                        {errors.student_number && <div className="text-red-500 text-xs md:text-sm mt-1">{errors.student_number}</div>}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700 font-medium mb-1 md:mb-2 text-sm md:text-base">Role</label>
                                    <select 
                                        className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm md:text-base"
                                        value={data.role}
                                        onChange={e => setData('role', e.target.value)}
                                        required
                                    >
                                        <option value="user">Cadet</option>
                                        <option value="faculty">Faculty</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1 md:mb-2 text-sm md:text-base">Password</label>
                                        <input 
                                            type="password"
                                            className={`w-full px-2 md:px-3 py-1.5 md:py-2 border rounded-md focus:outline-none focus:border-primary text-sm md:text-base ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                                            value={data.password}
                                            onChange={e => setData('password', e.target.value)}
                                            required
                                        />
                                        {errors.password && <div className="text-red-500 text-xs md:text-sm mt-1">{errors.password}</div>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1 md:mb-2 text-sm md:text-base">Confirm Password</label>
                                        <input 
                                            type="password"
                                            className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm md:text-base"
                                            value={data.password_confirmation}
                                            onChange={e => setData('password_confirmation', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-0">
                                    <button 
                                        type="button"
                                        className="w-full sm:w-auto px-6 py-3 md:px-4 md:py-2 bg-gray-300 text-gray-700 rounded-md sm:mr-2 hover:bg-gray-400 transition-colors text-sm md:text-base touch-manipulation"
                                        onClick={() => reset()}
                                    >
                                        Reset
                                    </button>
                                    <button 
                                        type="submit"
                                        className="w-full sm:w-auto px-6 py-3 md:px-4 md:py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors text-sm md:text-base touch-manipulation"
                                        disabled={processing}
                                    >
                                        {processing ? 'Adding User...' : 'Add User'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Alert Dialog */}
        <AlertDialog
            isOpen={alertDialog.isOpen}
            type={alertDialog.type}
            title={alertDialog.title}
            message={alertDialog.message}
            onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        />
        </>
    );
}