import React from 'react';
import Header from '../../components/header';
import UserSidebar from '../../components/userSidebar';
import { usePage } from '@inertiajs/react';

const attendanceData = [];

const userAttendance = ({ auth }) => {
    const { user } = usePage().props;
  return (
    <div className='w-full min-h-screen bg-backgroundColor'>
      <Header auth={auth} />
      <div className='flex'>
        <UserSidebar />
        <div className='flex-1 p-6'>
          <div className='font-regular'>
            {/* Breadcrumb */}
            <div className='bg-white p-3 text-[#6B6A6A] rounded-lg pl-5 cursor-pointer'>
              Home {">"} Attendance
            </div>
            {/* Page Header */}
            <div className='flex items-center justify-between mt-4 mb-6 pl-5 py-7 bg-primary text-white p-4 rounded-lg'>
              <h1 className='text-2xl font-semibold'>Attendance</h1>
            </div>
            {/* Main Card */}
            <div className='bg-white p-6 rounded-lg shadow w-full mx-auto h-[650px]'>
              {/* Profile picture */}
              <div className="flex items-center mb-4">
                {user?.profile_pic_url ? (
                  <img 
                    src={user.profile_pic_url} 
                    alt="Profile Picture" 
                    className="w-24 h-24 rounded-full mr-4 object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-24 h-24 rounded-full mr-4 bg-gray-200 flex items-center justify-center text-gray-400 text-lg font-semibold ${user?.profile_pic_url ? 'hidden' : ''}`}>
                  No Image
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-black">{`${user?.first_name || 'User'} ${user?.last_name || 'Name'}`}</h2>
                  <p className="text-sm text-gray-600">{user?.email || 'user@example.com'}</p>
                </div>
              </div>
              
              {/* Attendance Record Title */}
              <div className='mb-3 font-medium text-black'>Attendance Record</div>
              
              {/* Attendance Table with Vertical Scroll */}
              <div className='overflow-x-auto overflow-y-auto' style={{ height: 'calc(100% - 140px)' }}>
                <table className='min-w-full text-left border-collapse'>
                  <thead className='sticky top-0 bg-white'>
                    <tr className='bg-blue-50'>
                      <th className='py-2 px-4 font-medium text-left'>Training Day</th>
                      <th className='py-2 px-4 font-medium text-left'>Date</th>
                      <th className='py-2 px-4 font-medium text-left'>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="py-8 px-4 text-center text-gray-500">
                          No attendance records available at the moment.
                        </td>
                      </tr>
                    ) : (
                      attendanceData.map((row) => (
                        <tr key={row.day} className='border-b border-gray-100'>
                          <td className='py-2 px-4'>{row.day}</td>
                          <td className='py-2 px-4'>{row.date}</td>
                          <td className='py-2 px-4'>{row.status}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {/* End Main Card */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default userAttendance;