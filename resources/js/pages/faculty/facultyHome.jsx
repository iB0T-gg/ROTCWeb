import React from 'react'
import { Link, Head } from '@inertiajs/react';
import Header from '../../components/header';
import FacultySidebar from '../../components/facultySidebar';

const FacultyHome = ({ auth }) => {
  return (
    <>
      <Head title="ROTC Portal - Faculty Dashboard" />
      <div className='w-full min-h-screen bg-backgroundColor'>
      <Header auth={auth} />
      
      <div className='flex flex-col md:flex-row'>
        <FacultySidebar />
        
        <div className='flex-1 p-4 md:p-6'>
          <div className='font-regular'>
            {/* Breadcrumb */}
            <div className='bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 text-sm md:text-base'>
              <span className="cursor-default font-bold">Dashboard</span>  
            </div>
            {/* Page Header */}
            <div className='flex items-center justify-between mt-4 mb-4 md:mb-6 px-4 md:pl-5 py-5 md:py-7 bg-primary text-white p-3 md:p-4 rounded-lg shadow-md'>
              <h1 className='text-xl md:text-2xl font-semibold'>Welcome Instructor!</h1>
            </div>
            {/* Main Content: Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {/* Aptitude */}
              <a href="/faculty/facultyMerits">
                <div className="bg-white p-5 md:p-6 rounded-lg drop-shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                  <h3 className="text-lg font-bold mb-2 text-black">Aptitude</h3>
                  <p className="text-gray-600 text-sm md:text-base">Manage and review aptitude</p>
                </div>
              </a>
              {/* Attendance */}
              <a href="/faculty/facultyAttendance">
                <div className="bg-white p-5 md:p-6 rounded-lg drop-shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                  <h3 className="text-lg font-bold mb-2 text-black">Attendance</h3>
                  <p className="text-gray-600 text-sm md:text-base">Manage attendance and reviews</p>
                </div>
              </a>
              {/* Exams */}
              <a href="/faculty/facultyExams">
                <div className="bg-white p-5 md:p-6 rounded-lg drop-shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                  <h3 className="text-lg font-bold mb-2 text-black">Exams</h3>
                  <p className="text-gray-600 text-sm md:text-base">Manage and review exams</p>
                </div>
              </a>
              {/* Final Grades */}
              <a href="/faculty/facultyFinalGrades">
                <div className="bg-white p-5 md:p-6 rounded-lg drop-shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer">
                  <h3 className="text-lg font-bold mb-2 text-black">Final Grades</h3>
                  <p className="text-gray-600 text-sm md:text-base">View and submit final grades</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default FacultyHome