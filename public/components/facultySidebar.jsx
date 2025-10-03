import React, { useState, useEffect } from 'react'
import { FaBars } from 'react-icons/fa'
import { FaChartSimple } from 'react-icons/fa6'
import { FaUserCheck } from 'react-icons/fa6'
import { BiSolidReport } from "react-icons/bi";
import { Link, usePage, useForm } from '@inertiajs/react'
import { PiExamFill } from "react-icons/pi";
import { FaMedal } from "react-icons/fa6";
import { FaLock } from "react-icons/fa";
import { TbMessageReportFilled } from "react-icons/tb";
import { IoMdClose } from "react-icons/io";
import { GrKey } from "react-icons/gr";

const FacultySidebar = () => {
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
  
  const handleLogout = () => {
      setMobileMenuOpen(false);
      post('/logout');
  };

  const menuItems = [
    {
      icons: <FaChartSimple />,
      label: 'Dashboard',
      link: '/faculty/facultyHome',
    },
    {
      icons: <FaMedal />,
      label: 'Aptitude',
      link: '/faculty/facultyMerits',
    },
    {
      icons: <FaUserCheck />,
      label: 'Attendance',
      link: '/faculty/facultyAttendance',
    },
    {
      icons: <PiExamFill />,
      label: 'Exams',
      link: '/faculty/facultyExams',
    },
    {
      icons: <BiSolidReport />,
      label: 'Final Grades',
      link: '/faculty/facultyFinalGrades',
    },
    {
      icons: <FaLock />,
      label: 'Change Password',
      link: '/faculty/change-password',
    },
    {
      icons: <TbMessageReportFilled />,
      label: 'Report an Issue',
      link: '/faculty/facultyReportAnIssue',
    },
    
  ];

  return (
    <>
      {/* Desktop Sidebar - Changed to fixed positioning */}
      <div className={`hidden md:block fixed top-14 left-0 h-screen ${isOpen ? 'w-56' : 'w-16'} duration-300 bg-sideBarColor text-sideBarTextColor text-s pt-4 shadow-lg overflow-y-auto z-30`}>
        <div id='menuBar' className={`flex  ${isOpen ? 'justify-end pr-4' : 'justify-center pr-0'} mb-3`}> 
          <FaBars className='cursor-pointer' onClick={() => setOpen(!isOpen)} />  
        </div>    
        
        <ul className='flex flex-col space-y-2 w-full px-4'>
          {menuItems.map((item, index) => {
            const isActive = url === item.link;
            
            return (
              <li key={index}>
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
            {menuItems.map((item, index) => {
              const isActive = url === item.link;
              
              return (
                <li key={index}>
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
                </li>
              );
            })}
            
            {/* Logout button added to mobile sidebar */}
            <li className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="flex items-center p-3 rounded-md gap-3 w-full text-sideBarTextColor hover:bg-primary hover:bg-opacity-20 transition-colors duration-200"
              >
                <span>Log Out</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default FacultySidebar;