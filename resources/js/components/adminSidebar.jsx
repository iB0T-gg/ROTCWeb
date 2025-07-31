import React, { useState } from 'react'
import { FaBars } from 'react-icons/fa'
import { FaChartSimple } from 'react-icons/fa6'
import { FaUserCheck } from 'react-icons/fa6'
import { FaUser } from "react-icons/fa";
import { TbMessageReportFilled } from "react-icons/tb";
import { Link } from '@inertiajs/react'
import { usePage } from '@inertiajs/react'
import { PiExamFill } from "react-icons/pi";

export default function AdminSidebar() {
    const [isOpen, setOpen] = useState(true);
    const [openSubMenu, setOpenSubMenu] = useState(null);
    const { url } = usePage();
    
    const toggleSubMenu = (index) => {
      setOpenSubMenu(openSubMenu === index ? null : index);
    };

  const menuItems = [
  {
    icons: <FaChartSimple />,
    label: 'Dashboard',
    link: '/adminHome',
  },
  {
    icons: <FaUser />,
    label: 'Permission',
    link: '/adminPermission',
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
  {
    icons: <TbMessageReportFilled />,
    label: 'Issue',
    link: '/Issue',
  },

]
  return (
    <div className={`sticky top-0 h-screen ${isOpen ? 'w-56' : 'w-16'} duration-300 bg-sideBarColor text-sideBarTextColor text-s pt-4 shadow-lg overflow-y-auto`}>
          <div id='menuBar' className={`flex  ${isOpen ? 'justify-end pr-4' : 'justify-center pr-0'} mb-3`}> 
            <FaBars className='cursor-pointer' onClick={() => setOpen(!isOpen)} />  
          </div>    
          
          <ul className='flex flex-col space-y-2 w-full px-4'>
            {menuItems.map((item, index) => {
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
                          <span className="transform transition-transform duration-200">
                          </span>
                        )}
                      </div>
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
  )
}
