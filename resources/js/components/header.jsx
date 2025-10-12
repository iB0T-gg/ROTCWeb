import React, { useState, useRef, useEffect } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { FaAngleDown, FaBars } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { GrKey } from "react-icons/gr";

export default function Header({ auth }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    const mobileMenuRef = useRef(null);
    const { post } = useForm();

    useEffect(() => {
        function handleClickOutside(event) {
            // Close dropdown when clicking outside
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
            
            // Close mobile menu when clicking outside
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) && 
                !event.target.closest('.mobile-menu-button')) {
                setMobileMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close mobile menu on window resize (if screen becomes larger)
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setMobileMenuOpen(false);
            }
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogout = async () => {
        setMobileMenuOpen(false);
        try {
            await window.axios.post('/logout');
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed:', error);
            // Force redirect even if logout fails
            window.location.href = '/';
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
                            auth && auth.user ?
                                auth.user.role === 'admin' ? '/adminHome'
                                : auth.user.role === 'faculty' ? '/faculty/facultyHome'
                                : auth.user.role === 'user' ? '/user/userHome'
                                : '/user/userHome'
                            : '/user/userHome'
                        }
                        onClick={() => {
                            console.log('Logo clicked - User role:', auth?.user?.role);
                            console.log('Redirecting to:', auth && auth.user ?
                                auth.user.role === 'admin' ? '/adminHome'
                                : auth.user.role === 'faculty' ? '/faculty/facultyHome'
                                : auth.user.role === 'user' ? '/user/userHome'
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
                            {auth && auth.user ? 
                                auth.user.role === 'admin' ? 
                                    'Admin' : 
                                    `${auth.user.last_name}, ${auth.user.first_name}` 
                                : 'Guest'}
                        </h1>
                    </Link>
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
                        <div className="absolute right-0 mt-20 w-32 bg-white text-black rounded shadow-lg z-50">
                            <button
                                onClick={handleLogout}
                                className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-100"
                            >
                                <GrKey />
                                <span className="ml-2">Log Out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
        </header>
    );
}