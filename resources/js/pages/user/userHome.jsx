import React from 'react';
import { Link, useForm } from '@inertiajs/react';
import Header from '../../components/header';
import UserSidebar from '../../components/userSidebar';

export default function UserHome({ auth }) {
    const { post } = useForm();

    const handleLogout = () => {
        post('/logout');
    };

    return (
        <div className='w-full min-h-screen bg-backgroundColor'>
            <Header auth={auth} onLogout={handleLogout} />
            
            <div className='flex flex-col md:flex-row'>
                <UserSidebar />
                
                <div className='flex-1 p-4 md:p-6 w-full'>
                    <div className='font-regular'>
                        <div className='bg-white p-3 text-[#6B6A6A] rounded-lg pl-4 md:pl-5 shadow-sm'>
                            <Link href="/user/userHome" className="hover:underline cursor-pointer font-bold">
                                Dashboard
                            </Link>
                        </div>
                        
                        <div className='flex items-center justify-between mt-4 mb-6 px-4 md:pl-5 py-5 md:py-7 bg-primary text-white rounded-lg shadow-md'>
                            <h1 className='text-xl md:text-2xl font-semibold'>Welcome User!</h1>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            <Link href="/user/userProfile">
                                <div className="bg-white p-5 md:p-6 rounded-lg drop-shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                                    <h3 className="text-lg font-bold mb-2 text-black">Profile</h3>
                                    <p className="text-gray-600 text-sm md:text-base">Editing Information</p>
                                </div>
                            </Link>
                            <Link href="/user/userAttendance">
                                <div className="bg-white p-5 md:p-6 rounded-lg drop-shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                                    <h3 className="text-lg font-bold mb-2 text-black">Attendance</h3>
                                    <p className="text-gray-600 text-sm md:text-base">Record of Attendance</p>
                                </div>
                            </Link>
                            <Link href="/user/userGrades" className="sm:col-span-2 lg:col-span-1">
                                <div className="bg-white p-5 md:p-6 rounded-lg drop-shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                                    <h3 className="text-lg font-bold mb-2 text-black">Grades</h3>
                                    <p className="text-gray-600 text-sm md:text-base">Tracking Grades</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}