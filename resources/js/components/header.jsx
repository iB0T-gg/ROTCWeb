import React, { useState, useRef, useEffect } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { FaAngleDown } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { GrKey } from "react-icons/gr";
import { FaLock } from "react-icons/fa";
import { FaExclamationTriangle } from "react-icons/fa";
import { CiSettings } from "react-icons/ci";

export default function Header({ auth }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { post } = useForm();

    // Debug auth object
    console.log('Header component received auth:', auth);
    console.log('Auth type:', typeof auth);
    console.log('Auth user:', auth?.user);
    console.log('Auth user role:', auth?.user?.role);
    
    // Handle both auth formats: {user: {...}} or direct user object
    const user = auth?.user || auth;
    const userRole = user?.role;

    useEffect(() => {
        function handleClickOutside(event) {
            // Close dropdown when clicking outside
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    const handleLogout = async () => {
        try {
            await window.axios.post('/logout');
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed:', error);
            // Force redirect even if logout fails
            window.location.href = '/';
        }
    };

    const getChangePasswordRoute = () => {
        if (!user || !userRole) {
            console.log('Header: No user or role found for password route, defaulting to user route');
            return '/user/change-password';
        }
        
        console.log('Header: Password route - User role is:', userRole);
        
        switch (userRole) {
            case 'admin':
                console.log('Header: Returning admin password route');
                return '/admin/change-password';
            case 'faculty':
                console.log('Header: Returning faculty password route');
                return '/faculty/change-password';
            case 'platoon_leader':
                console.log('Header: Returning platoon leader password route');
                return '/platoon-leader/change-password';
            case 'user':
            default:
                console.log('Header: Returning user password route');
                return '/user/change-password';
        }
    };

    const getIssueRoute = () => {
        if (!user || !userRole) {
            console.log('Header: No user or role found, defaulting to user route');
            return '/user/userReportAnIssue';
        }
        
        console.log('Header: User role is:', userRole);
        
        switch (userRole) {
            case 'admin':
                console.log('Header: Returning admin route');
                return '/Issue';
            case 'faculty':
                console.log('Header: Returning faculty route');
                return '/faculty/facultyReportAnIssue';
            case 'platoon_leader':
                console.log('Header: Returning platoon leader route');
                return '/platoon-leader/report-issue';
            case 'user':
            default:
                console.log('Header: Returning user route');
                return '/user/userReportAnIssue';
        }
    };

    return (
        <header className='bg-primary text-white p-2 sticky top-0 z-40'>
            <div className='px-4 mx-auto flex justify-between items-center'>
                {/* Left section with menu button, logo, and title */}
                <div className='flex items-center'>

                    {/* Logo and Title */}
                    <Link 
                        href={
                            user && userRole ?
                                userRole === 'admin' ? '/adminHome'
                                : userRole === 'faculty' ? '/faculty/facultyHome'
                                : userRole === 'platoon_leader' ? '/platoon-leader/attendance'
                                : userRole === 'user' ? '/user/userHome'
                                : '/user/userHome'
                            : '/user/userHome'
                        }
                        onClick={() => {
                            console.log('Logo clicked - User role:', userRole);
                            console.log('Redirecting to:', user && userRole ?
                                userRole === 'admin' ? '/adminHome'
                                : userRole === 'faculty' ? '/faculty/facultyHome'
                                : userRole === 'user' ? '/user/userHome'
                                : '/user/userHome'
                            : '/user/userHome');
                        }}
                    >
                        <div className='flex items-center gap-3'>
                            <img src='/images/ROTCLogo.png' alt='ROTC Logo' className='w-11 h-10' />
                            <h1 className='hidden md:block text-xl font-regular'>Bulacan State University ROTC Portal</h1>
                            <h1 className='md:hidden text-xl font-regular'>BulSU ROTC</h1>
                        </div>
                    </Link>
                </div>
                 
                {/* User Profile and Dropdown - Only visible on non-mobile */}
                <div className='flex items-center gap-4 relative' ref={dropdownRef}>
                    <Link href="/user/userProfile" className="flex items-center gap-3">
                        {/* Hide profile picture on mobile with "hidden md:block" */}
                        <div className="hidden md:block">
                            {auth && auth.user && auth.user.role !== 'admin' && auth.user.role !== 'faculty' ? (
                                auth.user.profile_pic_url || auth.user.profile_pic ? (
                                    <img 
                                        src={auth.user.profile_pic_url || (auth.user.profile_pic ? (auth.user.profile_pic.startsWith('http') ? auth.user.profile_pic : `/storage/${auth.user.profile_pic}`) : null)}
                                        alt="Profile" 
                                        className="w-10 h-10 rounded-full object-cover border-2 border-white"
                                        onError={(e) => {
                                            console.error("Header image failed to load:", e.target.src);
                                            e.target.onerror = null;
                                            e.target.src = '/images/default-profile.png';
                                        }}
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 border-2 border-white">
                                        {auth.user.first_name?.charAt(0) || 'U'}
                                    </div>
                                )
                            ) : null}
                        </div>
                        {/* Hide username on extra small screens */}
                        <h1 className='hidden xs:block hover:underline text-xl truncate max-w-[120px] sm:max-w-none'>
                            {user ? 
                                userRole === 'admin' ? 
                                    'Admin' : 
                                    `${user.last_name}, ${user.first_name}` 
                                : 'Guest'}
                        </h1>
                    </Link>
                    
                    {/* Faculty designation - show company and battalion for faculty users */}
                    {user && userRole === 'faculty' && (
                        <div className="hidden md:block ml-4 mr-2">
                            <span className="text-lg text-white/90 font-medium">
                                {user.company && user.battalion ? 
                                    `${user.company} Company, ${user.battalion} Instructor` :
                                    'General Faculty Instructor'
                                }
                            </span>
                        </div>
                    )}
                    
                    {/* Platoon Leader designation - show company and platoon for platoon leader users */}
                    {user && userRole === 'platoon_leader' && (
                        <div className="hidden md:block ml-4 mr-2">
                            <span className="text-lg text-white/90 font-medium">
                                {(() => {
                                    const order = [];
                                    if (user.battalion) order.push(user.battalion);
                                    if (user.company) order.push(`${user.company} Company`);
                                    if (user.platoon) order.push(user.platoon);
                                    return order.length ? `${order.join(', ')} Leader` : 'General Platoon Leader';
                                })()}
                            </span>
                        </div>
                    )}
                    
                    {/* Dropdown toggle button - hidden on mobile */}
                    <button
                        className="focus:outline-none hidden md:block"
                        onClick={() => setDropdownOpen((open) => !open)}
                        aria-label="User menu"
                    >
                        <FaAngleDown />
                    </button>
                    {/* Dropdown menu - only shown on non-mobile when activated */}
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-44 w-48 bg-white text-black rounded shadow-lg z-50">
                            <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 rounded-t">
                                <CiSettings className="text-lg" />
                                <h3 className="text-md font-semibold">Settings</h3>
                            </div>
                            <Link
                                href={getIssueRoute()}
                                className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-100"
                                onClick={() => setDropdownOpen(false)}
                            >
                                <span className="ml-2">Report Issue</span>
                            </Link>
                            <Link
                                href={getChangePasswordRoute()}
                                className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-100"
                                onClick={() => setDropdownOpen(false)}
                            >
                                <span className="ml-2">Change Password</span>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-100"
                            >
                                <span className="ml-2">Log Out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
        </header>
    );
}