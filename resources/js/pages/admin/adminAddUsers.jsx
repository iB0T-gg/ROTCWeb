import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Header from '../../components/header';
import AdminSidebar from '../../components/adminSidebar';
import { Link, Head } from '@inertiajs/react';

// Alert Dialog Component
const AlertDialog = ({ isOpen, type, title, message, onClose }) => {
  if (!isOpen) return null;

  const buttonColor = type === 'success' ? 'bg-primary/90 hover:bg-primary' : 'bg-red-600 hover:bg-red-700';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
        <div>
          <h3 className={`text-lg font-semibold text-black mb-2`}>{title}</h3>
          <p className={`text-black`}>{message}</p>
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
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
    // Alert state
    const [alertDialog, setAlertDialog] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: ''
    });

    const [formData, setFormData] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        student_number: '',
        role: '', // Default role is empty (shows "Select Role")
        company: '',
        battalion: '',
        platoon: '',
        password: '',
        password_confirmation: '',
    });
    const [processing, setProcessing] = useState(false);

    const setData = (field, value) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };
            
            // Clear company, battalion, and platoon when role changes
            if (field === 'role') {
                if (value !== 'faculty' && value !== 'platoon_leader') {
                newData.company = '';
                newData.battalion = '';
                    newData.platoon = '';
                } else if (value === 'faculty') {
                    // Clear platoon for faculty
                    newData.platoon = '';
                } else if (value === 'platoon_leader') {
                    // Clear battalion for platoon leader
                    newData.battalion = '';
                }
            }
            
            return newData;
        });
    };

    const reset = () => {
        setFormData({
            first_name: '',
            middle_name: '',
            last_name: '',
            email: '',
            student_number: '',
            role: '',
            company: '',
            battalion: '',
            platoon: '',
            password: '',
            password_confirmation: '',
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate role is selected
        if (!formData.role.trim()) {
            setAlertDialog({
                isOpen: true,
                type: 'error',
                title: 'Validation Error',
                message: 'Please select a role'
            });
            return;
        }
        
        // Validate student number is required only for cadets
        if (formData.role === 'user' && !formData.student_number.trim()) {
            setAlertDialog({
                isOpen: true,
                type: 'error',
                title: 'Validation Error',
                message: 'Student number is required for cadets'
            });
            return;
        }
        
        // Validate company and battalion are required for faculty
        if (formData.role === 'faculty') {
            if (!formData.company.trim()) {
                setAlertDialog({
                    isOpen: true,
                    type: 'error',
                    title: 'Validation Error',
                    message: 'Company is required for faculty members'
                });
                return;
            }
            if (!formData.battalion.trim()) {
                setAlertDialog({
                    isOpen: true,
                    type: 'error',
                    title: 'Validation Error',
                    message: 'Battalion is required for faculty members'
                });
                return;
            }
        }
        
        // Validate company and platoon are required for platoon leader
        if (formData.role === 'platoon_leader') {
            if (!formData.company.trim()) {
                setAlertDialog({
                    isOpen: true,
                    type: 'error',
                    title: 'Validation Error',
                    message: 'Company is required for platoon leaders'
                });
                return;
            }
            if (!formData.platoon.trim()) {
                setAlertDialog({
                    isOpen: true,
                    type: 'error',
                    title: 'Validation Error',
                    message: 'Platoon is required for platoon leaders'
                });
                return;
            }
        }
        
        setProcessing(true);
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            
            const response = await fetch('/api/admin/add-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                reset();
                setAlertDialog({
                    isOpen: true,
                    type: 'success',
                    title: 'Success',
                    message: result.message
                });
            } else {
                setAlertDialog({
                    isOpen: true,
                    type: 'error',
                    title: 'Error',
                    message: result.message || 'An error occurred while adding the user. Please try again.'
                });
            }
        } catch (error) {
            console.error('Error adding user:', error);
            setAlertDialog({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: 'An error occurred while adding the user. Please try again.'
            });
        } finally {
            setProcessing(false);
        }
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
                    <div className="font-regular min-w-[320px] animate-fade-in-up">
                        <div className="bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 text-sm md:text-base animate-fade-in-up">
                        <Link href="/adminHome" className="hover:underline cursor-pointer font-semibold">
                            Dashboard
                        </Link>
                        <span className="mx-2 font-semibold">{">"}</span>
                        <span className="cursor-default font-bold">Add Users</span>  
                        </div>
                        <div className="bg-primary text-white p-3 md:p-4 rounded-lg flex items-center justify-between mt-4 mb-6 pl-3 md:pl-5 py-5 md:py-7 animate-fade-in-down">
                            <h1 className="text-lg md:text-2xl font-semibold">User Management</h1>
                        </div>
                        <div className="bg-white p-4 md:p-6 rounded-lg shadow animate-scale-in-up">
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
                                            className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm md:text-base"
                                            value={formData.first_name}
                                            onChange={e => setData('first_name', e.target.value)}
                                            required
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1 md:mb-2 text-sm md:text-base">Middle Name</label>
                                        <input 
                                            type="text"
                                            className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm md:text-base"
                                            value={formData.middle_name}
                                            onChange={e => setData('middle_name', e.target.value)}
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1 md:mb-2 text-sm md:text-base">Last Name</label>
                                        <input 
                                            type="text"
                                            className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm md:text-base"
                                            value={formData.last_name}
                                            onChange={e => setData('last_name', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1 md:mb-2 text-sm md:text-base">Email</label>
                                        <input 
                                            type="email"
                                            className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm md:text-base"
                                            value={formData.email}
                                            onChange={e => setData('email', e.target.value)}
                                            required
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1 md:mb-2 text-sm md:text-base">
                                            Student Number {formData.role === 'user' && <span className="text-red-500">*</span>}
                                        </label>
                                        <input 
                                            type="text"
                                            className={`w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm md:text-base ${formData.role !== 'user' ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                                            value={formData.student_number}
                                            onChange={e => setData('student_number', e.target.value)}
                                            required={formData.role === 'user'}
                                            disabled={formData.role !== 'user'}
                                            placeholder={formData.role !== 'user' ? '' : 'Required for cadets'}
                                        />
                                    </div>
                                </div>

                                <div className={`grid gap-4 mb-4 ${formData.role === 'faculty' || formData.role === 'platoon_leader' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1 md:mb-2 text-sm md:text-base">Role</label>
                                        <select 
                                            className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm md:text-base"
                                            value={formData.role}
                                            onChange={e => setData('role', e.target.value)}
                                            required
                                        >
                                            <option value="">Select Role</option>
                                            <option value="user">Cadet</option>
                                            <option value="faculty">Faculty</option>
                                            <option value="platoon_leader">Platoon Leader</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    
                                    {formData.role === 'faculty' && (
                                        <>
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-1 md:mb-2 text-sm md:text-base">Company <span className="text-red-500">*</span></label>
                                                <select 
                                                    className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm md:text-base"
                                                    value={formData.company}
                                                    onChange={e => setData('company', e.target.value)}
                                                    required
                                                >
                                                    <option value="">Select Company</option>
                                                    <option value="alpha">Alpha</option>
                                                    <option value="bravo">Bravo</option>
                                                    <option value="charlie">Charlie</option>
                                                    <option value="delta">Delta</option>
                                                </select>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-1 md:mb-2 text-sm md:text-base">Battalion <span className="text-red-500">*</span></label>
                                                <select 
                                                    className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm md:text-base"
                                                    value={formData.battalion}
                                                    onChange={e => setData('battalion', e.target.value)}
                                                    required
                                                >
                                                    <option value="">Select Battalion</option>
                                                    <option value="1st">1st Battalion</option>
                                                    <option value="2nd">2nd Battalion</option>
                                                </select>
                                            </div>
                                        </>
                                    )}
                                    
                                    {formData.role === 'platoon_leader' && (
                                        <>
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-1 md:mb-2 text-sm md:text-base">Company <span className="text-red-500">*</span></label>
                                                <select 
                                                    className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm md:text-base"
                                                    value={formData.company}
                                                    onChange={e => setData('company', e.target.value)}
                                                    required
                                                >
                                                    <option value="">Select Company</option>
                                                    <option value="alpha">Alpha</option>
                                                    <option value="bravo">Bravo</option>
                                                    <option value="charlie">Charlie</option>
                                                    <option value="delta">Delta</option>
                                                </select>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-gray-700 font-medium mb-1 md:mb-2 text-sm md:text-base">Platoon <span className="text-red-500">*</span></label>
                                                <select 
                                                    className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm md:text-base"
                                                    value={formData.platoon}
                                                    onChange={e => setData('platoon', e.target.value)}
                                                    required
                                                >
                                                    <option value="">Select Platoon</option>
                                                    <option value="1st">1st Platoon</option>
                                                    <option value="2nd">2nd Platoon</option>
                                                    <option value="3rd">3rd Platoon</option>
                                                </select>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1 md:mb-2 text-sm md:text-base">Password</label>
                                        <div className="relative">
                                            <input 
                                                type={showPassword ? 'text' : 'password'}
                                                className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm md:text-base"
                                                value={formData.password}
                                                onChange={e => setData('password', e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-1 md:mb-2 text-sm md:text-base">Confirm Password</label>
                                        <div className="relative">
                                            <input 
                                                type={showPasswordConfirmation ? 'text' : 'password'}
                                                className="w-full px-2 md:px-3 py-1.5 md:py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm md:text-base"
                                                value={formData.password_confirmation}
                                                onChange={e => setData('password_confirmation', e.target.value)}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                                aria-label={showPasswordConfirmation ? 'Hide password' : 'Show password'}
                                            >
                                                {showPasswordConfirmation ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                                            </button>
                                        </div>
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