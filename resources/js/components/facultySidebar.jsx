import React, { useState } from 'react'
import { FaBars } from 'react-icons/fa'
import { FaChartSimple } from 'react-icons/fa6'
import { FaUserCheck } from 'react-icons/fa6'
import { BiSolidReport } from "react-icons/bi";
import { TbMessageReportFilled } from "react-icons/tb";
import { Link, usePage } from '@inertiajs/react'
import { PiExamFill } from "react-icons/pi";
import { FaMedal } from "react-icons/fa6";

const FacultySidebar = () => {
  const [isOpen, setOpen] = useState(true);
  const { url } = usePage();

  const menuItems = [
    {
      icons: <FaChartSimple />,
      label: 'Dashboard',
      link: '/faculty/facultyHome',
    },
    {
      icons: <FaMedal />,
      label: 'Merits',
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
    
  ];

  return (
    <div className={`sticky top-0 h-screen ${isOpen ? 'w-56' : 'w-16'} duration-300 bg-sideBarColor text-sideBarTextColor text-s pt-4 shadow-lg overflow-y-auto`}>
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
  );
};

export default FacultySidebar;