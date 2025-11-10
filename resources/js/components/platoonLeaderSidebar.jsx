import React, { useState, useEffect } from 'react';
import { FaBars } from 'react-icons/fa';
import { FaUserCheck } from 'react-icons/fa6';
import { IoMdClose } from 'react-icons/io';
import { Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';

export default function PlatoonLeaderSidebar() {
    const [isOpen, setOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { url } = usePage();

    useEffect(() => {
        const checkIfMobile = () => {
            const mobileView = window.innerWidth < 768;
            setIsMobile(mobileView);
            setOpen(!mobileView);
        };

        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    const handleLogout = async () => {
        setMobileMenuOpen(false);
        try {
            await window.axios.post('/logout');
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed:', error);
            window.location.href = '/';
        }
    };

    const menuItems = [
        {
            icon: <FaUserCheck />,
            label: 'Attendance',
            link: '/platoon-leader/attendance',
        },
    ];

    return (
        <>
            <div className={`hidden md:block fixed top-14 left-0 h-screen ${isOpen ? 'w-56' : 'w-16'} duration-300 bg-sideBarColor text-sideBarTextColor text-s pt-4 shadow-lg overflow-y-auto z-30`}>
                <div className={`flex ${isOpen ? 'justify-end pr-4' : 'justify-center pr-0'} mb-3`}>
                    <FaBars className="cursor-pointer" onClick={() => setOpen(!isOpen)} />
                </div>

                <ul className="flex flex-col space-y-2 w-full px-4">
                    {menuItems.map((item) => {
                        const isActive = url === item.link;
                        return (
                            <li key={item.link}>
                                <Link
                                    href={item.link}
                                    className={`flex items-center p-2 ${isOpen ? 'px-6' : 'px-2 my-1'} rounded-md gap-2 w-full transition-colors duration-200 ${isActive ? 'bg-primary bg-opacity-20 text-primary font-medium' : 'hover:bg-primary hover:bg-opacity-20'}`}
                                >
                                    {item.icon}
                                    <span className={`${!isOpen && 'hidden'} duration-200`}>{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>

            </div>

            <div className={`hidden md:block ${isOpen ? 'w-56' : 'w-16'} flex-shrink-0`} />

            <div className="md:hidden fixed top-3 right-4 z-50">
                <button
                    className="p-2 rounded-md bg-primary text-white"
                    onClick={() => setMobileMenuOpen(true)}
                    aria-label="Open mobile menu"
                >
                    <FaBars className="text-xl" />
                </button>
            </div>

            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setMobileMenuOpen(false)} />
            )}

            <div className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-sideBarColor text-sideBarTextColor shadow-lg transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold">Menu</h2>
                    <button onClick={() => setMobileMenuOpen(false)} className="text-gray-500 hover:text-gray-700">
                        <IoMdClose className="text-2xl" />
                    </button>
                </div>

                <div className="overflow-y-auto h-full py-4">
                    <ul className="flex flex-col space-y-2 w-full px-4">
                        {menuItems.map((item) => {
                            const isActive = url === item.link;
                            return (
                                <li key={item.link}>
                                    <Link
                                        href={item.link}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center p-3 rounded-md gap-3 w-full transition-colors duration-200 ${isActive ? 'bg-primary bg-opacity-20 text-primary font-medium' : 'hover:bg-primary hover:bg-opacity-20'}`}
                                    >
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}

                        <li>
                            <button
                                onClick={handleLogout}
                                className="flex items-center p-3 rounded-md gap-3 w-full text-sideBarTextColor hover:bg-primary hover:bg-opacity-20 transition-colors duration-200"
                            >
                                Logout
                            </button>
                        </li>
                    </ul>

                <div className="mt-6 px-4">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center justify-center p-2 ${isOpen ? 'px-6' : 'px-2 my-1'} rounded-md w-full transition-colors duration-200 bg-primary text-white hover:bg-primary/85`}
                    >
                        Log Out
                    </button>
                </div>
                </div>
            </div>
        </>
    );
}

