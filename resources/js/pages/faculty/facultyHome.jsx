import React from 'react'
import { Link } from '@inertiajs/react';
import Header from '../../components/header';
import FacultySidebar from '../../components/facultySidebar';

const FacultyHome = ({ auth }) => {
  return (
    <div className='w-full min-h-screen bg-backgroundColor'>
      <Header auth={auth} />
      
      <div className='flex'>
        <FacultySidebar />
        
        <div className='flex-1 p-6'>
          <div className='font-regular'>
            {/* Breadcrumb */}
            <div className='bg-white p-3 text-[#6B6A6A] rounded-lg pl-5'>
              <Link href="/faculty/facultyHome" className="hover:underline cursor-pointer font-bold">
                Dashboard
              </Link>
            </div>
            {/* Page Header */}
            <div className='flex items-center justify-between mt-4 mb-6 pl-5 py-7 bg-primary text-white p-4 rounded-lg'>
              <h1 className='text-2xl font-semibold'>Welcome Instructor!</h1>
            </div>
            {/* Main Content: Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <a href="/faculty/facultyMerits">
                <div className="bg-white p-6 rounded-lg drop-shadow-lg hover:scale-105 transition-shadow duration-300 cursor-pointer">
                  <h3 className="text-lg font-bold mb-2 text-black">Merits</h3>
                  <p className="text-gray-600">Manage and review merits</p>
                </div>
              </a>
              <a href="/faculty/facultyExams">
                <div className="bg-white p-6 rounded-lg drop-shadow-lg hover:scale-105 transition-shadow duration-300 cursor-pointer">
                  <h3 className="text-lg font-bold mb-2 text-black">Exams</h3>
                  <p className="text-gray-600">Manage and review exams</p>
                </div>
              </a>
              <a href="/faculty/facultyFinalGrades">
                <div className="bg-white p-6 rounded-lg drop-shadow-lg hover:scale-105 transition-shadow duration-300 cursor-pointer">
                  <h3 className="text-lg font-bold mb-2 text-black">Final Grades</h3>
                  <p className="text-gray-600">View and submit final grades</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FacultyHome