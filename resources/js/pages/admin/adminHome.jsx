import Header from '../../components/header';
import AdminSidebar from '../../components/adminSidebar';
import { usePage, Link } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminHome(){
    const { auth } = usePage().props;
    const [topCadet, setTopCadet] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Fetch the top cadet data
    useEffect(() => {
        const fetchTopCadet = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/top-cadet');
                if (response.data.status === 'success') {
                    setTopCadet(response.data.data);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching top cadet:', error);
                setLoading(false);
            }
        };
        
        fetchTopCadet();
    }, []);
    
    // Format the cadet name
    const formatCadetName = (cadet) => {
        if (!cadet) return '';
        return `${cadet.last_name}, ${cadet.first_name} ${cadet.middle_name ? cadet.middle_name.charAt(0) + '.' : ''}`.trim();
    };
    
    // Format grade to display with 2 decimal places
    const formatGrade = (grade) => {
        if (grade === null || grade === undefined) return 'N/A';
        return Number(grade).toFixed(2);
    };
    
    return (
    <div className='w-full min-h-screen bg-backgroundColor'>
      <Header auth={auth} />
      
      <div className='flex'>
        <AdminSidebar  />
        
        <div className='flex-1 p-6'>

          <div className='font-regular'>
            <div className='bg-white p-3 text-[#6B6A6A] rounded-lg pl-5'>
                <span className='cursor-pointer'>Home</span>
            </div>
            <div className='flex items-center justify-between mt-4 mb-6 pl-5 py-7 bg-primary text-white p-4 rounded-lg'>
                <h1 className='text-2xl font-semibold'>Welcome Admin!</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/adminPermission" className="transition-all">
                <div className="bg-white p-6 rounded-lg drop-shadow-lg hover:scale-105 transition-shadow duration-300 cursor-pointer">
                  <h3 className="text-lg font-bold mb-2 text-black">Permission</h3>
                </div>
              </Link>
              <Link href="/adminMasterlist" className="transition-all">
                <div className="bg-white p-6 rounded-lg drop-shadow-lg hover:scale-105 transition-shadow duration-300 cursor-pointer">
                  <h3 className="text-lg font-bold mb-2 text-black">Master Lists</h3>
                </div>
              </Link>
              <Link href="/adminAttendance" className="transition-all">
                <div className="bg-white p-6 rounded-lg shadow drop-shadow-lg hover:scale-105 transition-shadow duration-300 cursor-pointer">
                  <h3 className="text-lg font-bold mb-2 text-black">Attendance</h3>
                </div>
              </Link>
            </div>

            {/* Top Cadet Section */}
            <div className="bg-white p-6 rounded-lg mb-6 shadow-lg mt-6">
                <h2 className="text-xl font-bold mb-4 text-primary">Top Performing Cadet</h2>
                {loading ? (
                    <p className="text-gray-500">Loading top cadet data...</p>
                ) : topCadet ? (
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold">{formatCadetName(topCadet)}</h3>
                            <p className="text-gray-600 mb-2">
                                Section: {[topCadet.year, topCadet.course, topCadet.section].filter(Boolean).join(' ') || 'N/A'}
                            </p>
                        </div>
                        <div className="mt-2 md:mt-0 text-center">
                            <span className="inline-block bg-green-100 text-green-800 text-lg font-bold py-2 px-4 rounded-full">
                                Grade: {formatGrade(topCadet.equivalent_grade || topCadet.final_grade)}
                            </span>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-500">No cadet grade information available.</p>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}