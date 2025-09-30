import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/header';
import UserSidebar from '../../components/userSidebar';
import { Link } from '@inertiajs/react';

const userGrades = ({ auth, user }) => {
  const [userGrades, setUserGrades] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch the current user's grades with cache busting
    const timestamp = new Date().getTime();
    axios.get(`/api/user/grades?_t=${timestamp}`)
      .then(res => {
        setUserGrades(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch user grades:', err);
        // Don't set error state, just show empty grades with "-" values
        setUserGrades(null);
        setLoading(false);
      });
  }, []);

  // Helper function to format grade display
  const formatGrade = (equivalentGrade) => {
    if (equivalentGrade === null || equivalentGrade === undefined || equivalentGrade === '') {
      return '-';
    }
    return equivalentGrade;
  };

  // Helper function to get remarks with fallback
  const getRemarks = (remarks, equivalentGrade) => {
    if (remarks) {
      return remarks;
    }
    if (equivalentGrade === null || equivalentGrade === undefined || equivalentGrade === '') {
      return '-';
    }
    const eq = parseFloat(equivalentGrade);
    if (!isNaN(eq) && eq >= 1.0 && eq <= 3.0) {
      return 'Passed';
    }
    return 'Failed';
  };

  return (
    <div className='w-full min-h-screen bg-backgroundColor'>
      <Header auth={auth} />
      <div className='flex flex-col md:flex-row'>
        {/* Sidebar - always visible */}
        <div className="block">
          <UserSidebar />
        </div>
        
        <div className='flex-1 p-3 md:p-6'>
          <div className='font-regular'>
            {/* Breadcrumb */}
            <div className='bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 text-sm md:text-base'>
              <Link href="/user/userHome" className="hover:underline cursor-pointer font-semibold">
                Dashboard
              </Link>
              <span className="mx-2 font-semibold">{">"}</span>
              <span className="cursor-default font-bold">Grades</span>
            </div>
            
            {/* Page Header */}
            <div className='flex items-center justify-between mt-4 mb-4 md:mb-6 pl-3 md:pl-5 py-4 md:py-7 bg-primary text-white p-3 md:p-4 rounded-lg'>
              <h1 className='text-xl md:text-2xl font-semibold'>Grades</h1>
            </div>
            
            {/* Main Card */}
            <div className='bg-white p-3 md:p-6 rounded-lg shadow w-full mx-auto h-auto md:h-[650px] overflow-y-auto'>
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading grades...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Profile section - made responsive */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start">
                    <div className="flex flex-col items-center sm:flex-row sm:items-center mb-4 sm:mb-0">
                      {user?.profile_pic_url ? (
                        <img 
                          src={user.profile_pic_url} 
                          alt="Profile Picture" 
                          className="w-16 h-16 md:w-24 md:h-24 rounded-full mb-2 sm:mb-0 sm:mr-4 object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-16 h-16 md:w-24 md:h-24 rounded-full mb-2 sm:mb-0 sm:mr-4 bg-gray-200 flex items-center justify-center text-gray-400 text-lg font-semibold ${user?.profile_pic_url ? 'hidden' : ''}`}>
                        No Image
                      </div>
                    </div>
                    <div className="text-center sm:text-left">
                      <h2 className="text-base md:text-lg font-semibold text-black">
                        {userGrades ? `${userGrades.last_name || 'Name'}, ${userGrades.first_name || 'User'}` : `${user?.last_name || 'Name'}, ${user?.first_name || 'User'}`}
                      </h2>
                      <p className="text-xs md:text-sm text-gray-600">
                        {userGrades ? userGrades.email : (user?.email || 'user@example.com')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Grades Title */}
                  <div className='mt-2 mb-1 pt-4 md:pt-6 font-medium text-black text-center sm:text-left'>Grades</div>
                  
                  {/* Military Science 1 - Responsive Table */}
                  <div className='mt-4 mb-4'>
                    <div className='bg-blue-50 py-2 px-2 md:px-4 font-medium mb-2 rounded text-center text-sm md:text-base'>Military Science 1</div>
                    <div className='overflow-x-auto'>
                      <table className='w-full text-left border-collapse mb-4 text-xs md:text-base'>
                        <thead>
                          <tr>
                            <th className='py-2 px-2 md:px-4 font-medium text-center'>CODE</th>
                            <th className='py-2 px-2 md:px-4 font-medium text-center'>SUBJECT</th>
                            <th className='py-2 px-2 md:px-4 font-medium text-center'>GRADE</th>
                            <th className='py-2 px-2 md:px-4 font-medium text-center'>REMARKS</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className='py-2 px-2 md:px-4 text-center'>NSTP101</td>
                            <td className='py-2 px-2 md:px-4 text-center'>NSTP-ROTC</td>
                            <td className='py-2 px-2 md:px-4 text-center'>{formatGrade(userGrades?.first_semester?.equivalent_grade)}</td>
                            <td className='py-2 px-2 md:px-4 text-center'>
                              {getRemarks(userGrades?.first_semester?.remarks, userGrades?.first_semester?.equivalent_grade)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Military Science 2 - Responsive Table */}
                  <div>
                    <div className='bg-blue-50 py-2 px-2 md:px-4 font-medium mb-2 rounded text-center mt-8 md:mt-16 text-sm md:text-base'>Military Science 2</div>
                    <div className='overflow-x-auto'>
                      <table className='w-full text-left border-collapse text-xs md:text-base'>
                        <thead>
                          <tr>
                            <th className='py-2 px-2 md:px-4 font-medium text-center'>CODE</th>
                            <th className='py-2 px-2 md:px-4 font-medium text-center'>SUBJECT</th>
                            <th className='py-2 px-2 md:px-4 font-medium text-center'>GRADE</th>
                            <th className='py-2 px-2 md:px-4 font-medium text-center'>REMARK</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className='py-2 px-2 md:px-4 text-center'>NSTP102</td>
                            <td className='py-2 px-2 md:px-4 text-center'>NSTP-ROTC</td>
                            <td className='py-2 px-2 md:px-4 text-center'>{formatGrade(userGrades?.second_semester?.equivalent_grade)}</td>
                            <td className='py-2 px-2 md:px-4 text-center'>
                              {getRemarks(userGrades?.second_semester?.remarks, userGrades?.second_semester?.equivalent_grade)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
            {/* End Main Card */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default userGrades;