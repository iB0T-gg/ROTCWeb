import React, { useState, useRef, useEffect } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { FaAngleDown } from "react-icons/fa";
import { GrKey } from "react-icons/gr";

export default function Header({ auth }) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { post } = useForm();

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        post('/logout');
    };

    return (
        <header className='bg-primary text-white p-2'>
            <div className='px-4 mx-auto flex justify-between items-center'>
                <Link href="/user/userHome">
                    <div className='flex items-center gap-3'>
                        <img src='/images/ROTClogo.png' alt='ROTC Logo' className='w-11 h-10' />
                        <h1 className='text-xl font-regular'>Bulacan State University ROTC Portal</h1>
                    </div>
                </Link>
                <div className='flex items-center gap-4 relative' ref={dropdownRef}>
                    <h1 className='hover:underline text-xl'>
                        {auth && auth.user ? 
                            auth.user.role === 'admin' ? 
                                'Admin' : 
                                `${auth.user.last_name} ${auth.user.first_name}` 
                            : 'Guest'}
                    </h1>
                    <button
                        className="focus:outline-none"
                        onClick={() => setDropdownOpen((open) => !open)}
                        aria-label="User menu"
                    >
                        <FaAngleDown />
                    </button>
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