import React, { useState, useEffect } from 'react';
import Header from '../../components/header';
import UserSidebar from '../../components/userSidebar';
import { usePage, Link, Head } from '@inertiajs/react';
import axios from 'axios';

const userAttendance = ({ auth }) => {
    const { user } = usePage().props;
    const [attendanceData, setAttendanceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSemester, setSelectedSemester] = useState('2025-2026 1st semester');

    // Semester options
    const semesterOptions = ['2025-2026 1st semester', '2025-2026 2nd semester'];

  // Week limit depends on semester: 1st = 10 weeks, 2nd = 15 weeks
  const weekLimit = selectedSemester === '2025-2026 1st semester' ? 10 : 15;

    // Fetch user's attendance data
    const fetchUserAttendance = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('=== USER ATTENDANCE FETCH ===');
            console.log('Fetching for user ID:', user.id);
            console.log('Selected semester:', selectedSemester);
            console.log('API URL:', `/api/attendance/${user.id}?semester=${encodeURIComponent(selectedSemester)}`);
            
            // Fetch only the current user's attendance data
            const response = await axios.get(`/api/attendance/${user.id}?semester=${encodeURIComponent(selectedSemester)}`);
            
            console.log('Full API Response:', response);
            console.log('Response status:', response.status);
            console.log('Response data:', response.data);
            console.log('Response data type:', typeof response.data);
            console.log('Response data keys:', Object.keys(response.data || {}));
            
            if (response.data && response.data.success) {
                // Set the user's attendance data directly
                console.log('SUCCESS - User attendance data:', response.data.data);
                console.log('Weekly attendance data:', response.data.data?.weekly_attendance);
                console.log('Weekly attendance keys:', response.data.data?.weekly_attendance ? Object.keys(response.data.data.weekly_attendance) : 'No weekly attendance');
                console.log('Weekly attendance values:', response.data.data?.weekly_attendance ? Object.values(response.data.data.weekly_attendance) : 'No values');
                setAttendanceData(response.data.data);
            } else {
                console.log('ERROR - API response not successful:', response.data);
                setError('No attendance data available for this semester.');
                setAttendanceData(null);
            }
        } catch (err) {
            console.error('=== FETCH ERROR ===');
            console.error('Error object:', err);
            console.error('Error message:', err.message);
            console.error('Error response:', err.response);
            console.error('Error response status:', err.response?.status);
            console.error('Error response data:', err.response?.data);
            console.error('=== END ERROR ===');
            
            if (err.response?.status === 404) {
                setError('No attendance records found for the selected semester.');
            } else if (err.response?.status === 403) {
                setError('Access denied. You may not have permission to view attendance data.');
            } else {
                setError(`Failed to fetch attendance data: ${err.message}`);
            }
            setAttendanceData(null);
        } finally {
            setLoading(false);
            console.log('=== FETCH COMPLETE ===');
            console.log('Final loading state:', false);
            console.log('Final error state:', error);
            console.log('Final attendanceData state will be set after this');
        }
    };

    useEffect(() => {
        console.log('useEffect triggered with selectedSemester:', selectedSemester);
        console.log('Current user object:', user);
        console.log('User ID:', user?.id);
        console.log('User props available:', Object.keys(user || {}));
        fetchUserAttendance();
    }, [selectedSemester]);

    // Helper function to get week dates (approximate)
    const getWeekDate = (weekNumber) => {
        const semesterStarts = {
            '2025-2026 1st semester': new Date('2025-08-15'),
            '2025-2026 2nd semester': new Date('2026-01-15'),
        };
        
        const startDate = semesterStarts[selectedSemester];
        if (!startDate) return 'N/A';
        
        const weekDate = new Date(startDate);
        weekDate.setDate(startDate.getDate() + ((weekNumber - 1) * 7));
        
        return weekDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
    };

  return (
    <>
      <Head title="ROTC Portal - Attendance" />
      <div className='w-full min-h-screen bg-backgroundColor'>
      <Header auth={auth} />
      <div className='flex flex-col md:flex-row'>
        <UserSidebar />
        <div className='flex-1 p-3 md:p-6'>
          <div className='font-regular animate-fade-in-up'>
            {/* Breadcrumb */}
            <div className='bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 text-sm md:text-base'>
              <Link href="/user/userHome" className="hover:underline cursor-pointer font-semibold">
                Dashboard
              </Link>
              <span className="mx-2 font-semibold">{">"}</span>
              <span className="cursor-default font-bold">Attendance</span>
            </div>

            {/* Page Header */}
            <div className='bg-primary text-white p-3 md:p-4 rounded-lg flex items-center mt-3 md:mt-4 mb-3 md:mb-6 pl-3 md:pl-5 py-4 md:py-7 animate-fade-in-down'>
              <h1 className='text-xl md:text-2xl font-semibold'>Attendance</h1>
            </div>

            {/* Main Card */}
            <div className='bg-white p-3 md:p-6 rounded-lg shadow w-full mx-auto animate-scale-in-up'>
              {/* Profile Section */}
              <div className="flex flex-col items-center sm:flex-row sm:items-center mb-4 md:mb-6 pb-4 border-b">
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden mb-3 sm:mb-0 sm:mr-4">
                  {user?.profile_pic_url ? (
                    <img 
                      src={user.profile_pic_url} 
                      alt="Profile Picture" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '';
                        e.target.style.display = 'none';
                        // Show the fallback div
                        const fallbackDiv = e.target.nextElementSibling;
                        if (fallbackDiv) fallbackDiv.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 text-xl md:text-2xl font-semibold ${user?.profile_pic_url ? 'hidden' : 'flex'}`}
                    style={{ display: user?.profile_pic_url ? 'none' : 'flex' }}
                  >
                    {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                </div>
                <div className="text-center sm:text-left w-full sm:w-auto">
                  <h2 className="text-lg md:text-xl font-semibold text-black mb-1">
                    {`${user?.last_name || 'Last'}, ${user?.first_name || 'First'} ${user?.middle_name ? user.middle_name.charAt(0) + '.' : ''}`}
                  </h2>
                  <p className="text-sm text-gray-600 mb-1">{user?.student_number || 'N/A'}</p>
                  <p className="text-xs md:text-sm text-gray-500">{user?.email || 'user@example.com'}</p>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col justify-center items-center h-32 md:h-40">
                  <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-t-2 border-b-2 border-primary mb-2"></div>
                  <p className="text-xs md:text-sm text-gray-500">Loading attendance data...</p>
                </div>
              ) : error ? (
                <div className="text-center py-4 md:py-6">
                  <div className="text-red-500 text-sm md:text-base mb-2">{error}</div>
                  <button 
                    onClick={fetchUserAttendance}
                    className="text-xs md:text-sm text-primary hover:text-primary-dark underline"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <>
                  {/* Attendance Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
                    <div className="bg-primary/20 p-3 md:p-4 rounded-lg text-center animate-fade-in-up animate-stagger-1">
                      <div className="text-xl md:text-2xl font-bold text-primary">
                        {(() => {
                          if (!attendanceData?.weekly_attendance) return 0;
                          // Count present weeks from weekly_attendance object
                          return Object.values(attendanceData.weekly_attendance).filter(Boolean).length;
                        })()}
                      </div>
                      <div className="text-xs md:text-sm">Weeks Present</div>
                    </div>
                    <div className="bg-primary/20 p-3 md:p-4 rounded-lg text-center animate-fade-in-up animate-stagger-2">
                      <div className="text-xl md:text-2xl font-bold text-primary">
                        {(() => {
                          if (!attendanceData?.weekly_attendance) return '0%';
                          const weeklyData = attendanceData.weekly_attendance;
                          const presentCount = Object.values(weeklyData).filter(Boolean).length;
                          // Calculate percentage: (present weeks / weekLimit) * 30
                          return `${Math.round((presentCount / weekLimit) * 30)}%`;
                        })()}
                      </div>
                      <div className="text-xs md:text-sm">Attendance Score</div>
                    </div>
                    <div className="bg-primary/20 p-3 md:p-4 rounded-lg text-center sm:col-span-2 lg:col-span-1 animate-fade-in-up animate-stagger-3">
                      <div className="text-xl md:text-2xl font-bold text-primary">
                        {(() => {
                          if (!attendanceData?.weekly_attendance) return `0/${weekLimit}`;
                          const presentCount = Object.values(attendanceData.weekly_attendance).filter(Boolean).length;
                          return `${presentCount}/${weekLimit}`;
                        })()}
                      </div>
                      <div className="text-xs md:text-sm">Completion Rate</div>
                    </div>
                  </div>

                  {/* Attendance Record Title and Semester Selection */}
                  <div className='mb-3 md:mb-4'>
                    {/* Semester Selection - Visible on all screen sizes */}
                    <div className="mb-3">
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Select Semester:</label>
                      <select
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(e.target.value)}
                        className="w-full sm:w-auto bg-white text-gray-800 border border-gray-300 px-3 py-2 rounded-lg font-medium text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      >
                        {semesterOptions.map((semester) => (
                          <option key={semester} value={semester}>
                            {semester}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className='font-medium text-black text-base md:text-lg'>
                      Attendance Record
                    </div>
                  </div>
                  
                  {/* Attendance Table */}
                  <div className='overflow-x-auto -mx-3 md:mx-0'>
                    <div className="min-w-full">
                      <table className='w-full text-left border-collapse bg-white'>
                        <thead className='bg-gray-50'>
                          <tr>
                            <th className='py-2 md:py-3 px-2 md:px-4 font-medium text-left text-xs md:text-sm border-b'>Week</th>
                            <th className='py-2 md:py-3 px-2 md:px-4 font-medium text-left text-xs md:text-sm border-b hidden sm:table-cell'>Date</th>
                            <th className='py-2 md:py-3 px-2 md:px-4 font-medium text-center text-xs md:text-sm border-b'>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: weekLimit }, (_, i) => {
                            const weekNumber = i + 1;
                            // Get attendance status from admin attendance data structure
                            const isPresent = attendanceData?.weekly_attendance?.[weekNumber] || false;
                            
                            return (
                              <tr key={weekNumber} className='border-b border-gray-100 hover:bg-gray-50'>
                                <td className='py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm font-medium'>
                                  <div className="flex flex-col sm:flex-row sm:items-center">
                                    <span>Week {weekNumber}</span>
                                    <span className="text-xs text-gray-500 sm:hidden mt-1">
                                      {getWeekDate(weekNumber)}
                                    </span>
                                  </div>
                                </td>
                                <td className='py-2 md:py-3 px-2 md:px-4 text-xs md:text-sm text-gray-600 hidden sm:table-cell'>
                                  {getWeekDate(weekNumber)}
                                </td>
                                <td className='py-2 md:py-3 px-2 md:px-4 text-center'>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    isPresent 
                                      ? 'bg-primary/20 text-primary' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {isPresent ? '✓ Present' : 'Absent'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {!attendanceData && (
                    <div className="text-center py-6 md:py-8 text-gray-500">
                      <div className="text-3xl md:text-4xl mb-2">📋</div>
                      <p className="text-sm md:text-base mb-1">No attendance records found</p>
                      <p className="text-xs md:text-sm">for the selected semester.</p>
                    </div>
                  )}
                </>
              )}
            </div>
            {/* End Main Card */}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default userAttendance;