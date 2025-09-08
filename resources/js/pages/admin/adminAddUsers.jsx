import React, { useState } from 'react';
import Header from '../../components/header';
import AdminSidebar from '../../components/adminSidebar';
import { useForm } from '@inertiajs/react';

export default function AddUsers({ auth }) {
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
        post('/api/admin/add-user', {
            onSuccess: () => {
                reset();
                alert('User added successfully!');
            },
        });
    };

    return (
        <div className="w-full min-h-screen bg-backgroundColor">
            <Header auth={auth} />
            <div className="flex">
                <AdminSidebar />
                <div className="flex-1 p-6">
                    <div className="font-regular">
                        <div className="bg-white p-3 text-[#6B6A6A] rounded-lg pl-5 cursor-pointer">
                            Home {">"} Add Users
                        </div>
                        <div className="bg-primary text-white p-4 rounded-lg flex items-center justify-between mt-4 mb-6 pl-5 py-7">
                            <h1 className="text-2xl font-semibold">User Management</h1>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h2 className="text-lg font-semibold text-gray-700 mb-6">Add New User</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">First Name</label>
                                        <input 
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-black"
                                            value={data.first_name}
                                            onChange={e => setData('first_name', e.target.value)}
                                            required
                                        />
                                        {errors.first_name && <div className="text-red-500 text-sm mt-1">{errors.first_name}</div>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">Middle Name</label>
                                        <input 
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-black"
                                            value={data.middle_name}
                                            onChange={e => setData('middle_name', e.target.value)}
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">Last Name</label>
                                        <input 
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-black"
                                            value={data.last_name}
                                            onChange={e => setData('last_name', e.target.value)}
                                            required
                                        />
                                        {errors.last_name && <div className="text-red-500 text-sm mt-1">{errors.last_name}</div>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">Email</label>
                                        <input 
                                            type="email"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-black"
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            required
                                        />
                                        {errors.email && <div className="text-red-500 text-sm mt-1">{errors.email}</div>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">Student Number</label>
                                        <input 
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-black"
                                            value={data.student_number}
                                            onChange={e => setData('student_number', e.target.value)}
                                            required
                                        />
                                        {errors.student_number && <div className="text-red-500 text-sm mt-1">{errors.student_number}</div>}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-gray-700 font-medium mb-2">Role</label>
                                    <select 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-black"
                                        value={data.role}
                                        onChange={e => setData('role', e.target.value)}
                                        required
                                    >
                                        <option value="user">Cadet</option>
                                        <option value="faculty">Faculty</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">Password</label>
                                        <input 
                                            type="password"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-black"
                                            value={data.password}
                                            onChange={e => setData('password', e.target.value)}
                                            required
                                        />
                                        {errors.password && <div className="text-red-500 text-sm mt-1">{errors.password}</div>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">Confirm Password</label>
                                        <input 
                                            type="password"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-black"
                                            value={data.password_confirmation}
                                            onChange={e => setData('password_confirmation', e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex justify-end">
                                    <button 
                                        type="button"
                                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md mr-2 hover:bg-gray-400 transition-colors"
                                        onClick={() => reset()}
                                    >
                                        Reset
                                    </button>
                                    <button 
                                        type="submit"
                                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
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
    );
}