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
            
            <div className='flex'>
                <UserSidebar />
                
                <div className='flex-1 p-6'>
                    <div className='font-regular'>
                        <div className='bg-white p-3 text-[#6B6A6A] rounded-lg pl-5'>
                            <Link href="/user/userHome" className="hover:underline cursor-pointer font-bold">
                                Dashboard
                            </Link>
                        </div>
                        
                        <div className='flex items-center justify-between mt-4 mb-6 pl-5 py-7 bg-primary text-white p-4 rounded-lg'>
                            <h1 className='text-2xl font-semibold'>Welcome User!</h1>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         <Link href="/user/userProfile">
                            <div className="bg-white p-6 rounded-lg drop-shadow-lg hover:scale-105 transition-shadow duration-300 cursor-pointer">
                                <h3 className="text-lg font-bold mb-2 text-black">Profile</h3>
                                <p className="text-gray-600">Editing Information</p>
                            </div>
                        </Link>
                        <Link href="/user/userAttendance">
                            <div className="bg-white p-6 rounded-lg drop-shadow-lg hover:scale-105 transition-shadow duration-300 cursor-pointer">
                                <h3 className="text-lg font-bold mb-2 text-black">Attendance</h3>
                                <p className="text-gray-600">Record of Attendance</p>
                            </div>
                        </Link>
                        <Link href="/user/userGrades">
                            <div className="bg-white p-6 rounded-lg shadow drop-shadow-lg hover:scale-105 transition-shadow duration-300 cursor-pointer">
                                <h3 className="text-lg font-bold mb-2 text-black">Grades</h3>
                                <p className="text-gray-600">Tracking Grades</p>
                            </div>
                        </Link>
                            
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}