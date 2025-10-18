import React, { useState, useEffect } from 'react'
import { FaBars } from 'react-icons/fa'
import { FaChartSimple } from 'react-icons/fa6'
import { FaUserCheck } from 'react-icons/fa6'
import { FaUser } from "react-icons/fa";
import { TbMessageReportFilled } from "react-icons/tb";
import { Link, useForm } from '@inertiajs/react'
import { usePage } from '@inertiajs/react'
import { PiExamFill } from "react-icons/pi";
import { IoPersonAddSharp } from "react-icons/io5";
import { PiUserListFill } from "react-icons/pi";
import { RiLockPasswordFill } from "react-icons/ri";
import { MdApproval } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import { GrKey } from "react-icons/gr";


export default function AdminSidebar() {
    const [isOpen, setOpen] = useState(true);
    const [openSubMenu, setOpenSubMenu] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { url } = usePage();
    const { post } = useForm();
    
    // Check if device is mobile and handle resize events
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth < 768) {
                setOpen(false);
            } else {
                setOpen(true);
            }
        };
        
        // Check on initial load
        checkIfMobile();
        
        // Add event listener for window resize
        window.addEventListener('resize', checkIfMobile);
        
        // Cleanup
        return () => window.removeEventListener('resize', checkIfMobile);
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
    
    const toggleSubMenu = (index) => {
      setOpenSubMenu(openSubMenu === index ? null : index);
    };

  // Desktop menu items (without Change Password and Issue)
  const desktopMenuItems = [
  {
    icons: <FaChartSimple />,
    label: 'Dashboard',
    link: '/adminHome',
  },
  {
    icons: <MdApproval />,
    label: 'Permission',
    link: '/adminPermission',
  },
  {
    icons: <IoPersonAddSharp />,
    label: 'User Management',
    link: '/admin/add-users',
  },
  {
    icons: <PiUserListFill />,
    label: 'List of Users',
    link: '/admin/user-list',
  },
  {
    icons: <FaUserCheck />,
    label: 'Attendance',
    link: '/adminAttendance',
  },
  {
    icons: <PiExamFill />,
    label: 'Master Lists',
    subItems: [
      {
        label: 'Cadets Profile Record',
        link: '/adminMasterlist/profile',
      },
      {
        label: 'Cadets Grade Record',
        link: '/adminMasterlist',
      },
    ],
  },
  ];

  // Mobile menu items (only desktop items, settings will be separate)
  const mobileMenuItems = [
    ...desktopMenuItems,
  ];
  return (
    <>
      {/* Desktop Sidebar - Changed to fixed positioning */}
      <div className={`hidden md:block fixed top-14 left-0 h-screen ${isOpen ? 'w-56' : 'w-16'} duration-300 bg-sideBarColor text-sideBarTextColor text-s pt-4 shadow-lg overflow-y-auto z-30`}>
          <div id='menuBar' className={`flex ${isOpen ? 'justify-end pr-4' : 'justify-center pr-0'} mb-3`}> 
            <FaBars className='cursor-pointer' onClick={() => setOpen(!isOpen)} />  
          </div>    
          
          <ul className='flex flex-col space-y-2 w-full px-4'>
            {desktopMenuItems.map((item, index) => {
              const isActive = url === item.link || (item.subItems && item.subItems.some(subItem => url === subItem.link));
              const isSubMenuOpen = openSubMenu === index;
              
              return (
                <li key={index}>
                  {item.subItems ? (
                    <div>
                      <div 
                        onClick={() => toggleSubMenu(index)}
                        className={`flex items-center p-2 ${isOpen ? 'px-6' : 'px-2 my-1' } rounded-md gap-2 w-full transition-colors duration-200 cursor-pointer
                          ${isActive 
                            ? 'bg-primary bg-opacity-20 text-primary font-medium' 
                            : 'hover:bg-primary hover:bg-opacity-20'}
                        `}
                      >
                        {item.icons}
                        <span className={`${!isOpen && 'hidden'} duration-200 flex-1`}>{item.label}</span>
                        {isOpen && (
                          <svg 
                            className={`w-4 h-4 transition-transform duration-200 ${isSubMenuOpen ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </div>
                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen && isSubMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                        {isOpen && isSubMenuOpen && (
                          <ul className="ml-8 mt-1 space-y-1">
                            {item.subItems.map((subItem, subIndex) => {
                              const isSubActive = url === subItem.link;
                              return (
                                <li key={`${index}-${subIndex}`}>
                                  <Link
                                    href={subItem.link}
                                    className={`block p-2 rounded-md transition-colors duration-200 text-sm
                                      ${isSubActive
                                        ? 'bg-primary bg-opacity-20 text-primary font-medium'
                                        : 'hover:bg-primary hover:bg-opacity-20'}
                                    `}
                                  >
                                    {subItem.label}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Link 
                      href={item.link} 
                      className={`flex items-center p-2 ${isOpen ? 'px-6' : 'px-2 my-1' } rounded-md gap-2 w-full transition-colors duration-200
                        ${isActive 
                          ? 'bg-primary bg-opacity-20 text-primary font-medium' 
                          : 'hover:bg-primary hover:bg-opacity-20'}
                      `}
                    >
                      {item.icons}
                      <span className={`${!isOpen && 'hidden'} duration-200`}>{item.label}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
      </div>

      {/* Empty div for spacing when using fixed sidebar */}
      <div className={`hidden md:block ${isOpen ? 'w-56' : 'w-16'} flex-shrink-0`}></div>

      {/* Mobile Hamburger Button (positioned on the right) */}
      <div className="md:hidden fixed top-3 right-4 z-50">
        <button 
          className="p-2 rounded-md bg-primary text-white"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open mobile menu"
        >
          <FaBars className="text-xl" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* Mobile Sidebar */}
      <div className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-sideBarColor text-sideBarTextColor shadow-lg transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button onClick={() => setMobileMenuOpen(false)} className="text-gray-500 hover:text-gray-700">
            <IoMdClose className="text-2xl" />
          </button>
        </div>
        
        <div className="overflow-y-auto h-full py-4">
          <ul className='flex flex-col space-y-2 w-full px-4'>
            {mobileMenuItems.map((item, index) => {
              const isActive = url === item.link || (item.subItems && item.subItems.some(subItem => url === subItem.link));
              const isSubMenuOpen = openSubMenu === index;
              
              return (
                <li key={index}>
                  {item.subItems ? (
                    <div>
                      <div 
                        onClick={() => toggleSubMenu(index)}
                        className={`flex items-center p-3 rounded-md gap-3 w-full transition-colors duration-200 cursor-pointer
                          ${isActive 
                            ? 'bg-primary bg-opacity-20 text-primary font-medium' 
                            : 'hover:bg-primary hover:bg-opacity-20'}
                        `}
                      >
                        {item.icons}
                        <span className="flex-1">{item.label}</span>
                        <svg 
                          className={`w-4 h-4 transition-transform duration-200 ${isSubMenuOpen ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSubMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                        {isSubMenuOpen && (
                          <ul className="ml-8 mt-1 space-y-1">
                            {item.subItems.map((subItem, subIndex) => {
                              const isSubActive = url === subItem.link;
                              return (
                                <li key={`${index}-${subIndex}`}>
                                  <Link
                                    href={subItem.link}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block p-3 rounded-md transition-colors duration-200 text-sm
                                      ${isSubActive
                                        ? 'bg-primary bg-opacity-20 text-primary font-medium'
                                        : 'hover:bg-primary hover:bg-opacity-20'}
                                    `}
                                  >
                                    {subItem.label}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Link 
                      href={item.link} 
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center p-3 rounded-md gap-3 w-full transition-colors duration-200
                        ${isActive 
                          ? 'bg-primary bg-opacity-20 text-primary font-medium' 
                          : 'hover:bg-primary hover:bg-opacity-20'}
                      `}
                    >
                      {item.icons}
                      <span>{item.label}</span>
                    </Link>
                  )}
                </li>
              );
            })}
            
            {/* Settings section with Change Password, Issue, and Logout */}
            <li className="mt-6 pt-6 border-t border-gray-200">
              <div className="px-3 py-2">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Settings</h3>
              </div>
            </li>
            
            <li>
              <Link 
                href="/admin/change-password" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center p-3 rounded-md gap-3 w-full text-sideBarTextColor hover:bg-primary hover:bg-opacity-20 transition-colors duration-200"
              >
                <RiLockPasswordFill />
                <span>Change Password</span>
              </Link>
            </li>
            
            <li>
              <Link 
                href="/Issue" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center p-3 rounded-md gap-3 w-full text-sideBarTextColor hover:bg-primary hover:bg-opacity-20 transition-colors duration-200"
              >
                <TbMessageReportFilled />
                <span>Issue</span>
              </Link>
            </li>
            
            <li>
              <button
                onClick={handleLogout}
                className="flex items-center p-3 rounded-md gap-3 w-full text-sideBarTextColor hover:bg-primary hover:bg-opacity-20 transition-colors duration-200"
              >
                <GrKey />
                <span>Log Out</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </>
  )
}
