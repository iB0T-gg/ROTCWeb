import React, { useState, useEffect } from 'react';
import axios from 'axios'; // If you don't have axios, use fetch or install it
import Header from '../../components/header';
import UserSidebar from '../../components/userSidebar';

const userGrades = ({ auth, user }) => {
  const [cadets, setCadets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Adjust the URL if your API is prefixed (e.g., /api/cadets)
    axios.get('/api/cadets')
      .then(res => {
        setCadets(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch cadets:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className='w-full min-h-screen bg-backgroundColor'>
      <Header auth={auth} />
      <div className='flex'>
        <UserSidebar />
        <div className='flex-1 p-6'>
          <div className='font-regular'>
            {/* Breadcrumb */}
            <div className='bg-white p-3 text-[#6B6A6A] rounded-lg pl-5 cursor-pointer'>
              Home {">"} Grades
            </div>
            {/* Page Header */}
            <div className='flex items-center justify-between mt-4 mb-6 pl-5 py-7 bg-primary text-white p-4 rounded-lg'>
              <h1 className='text-2xl font-semibold'>Grades</h1>
            </div>
            {/* Main Card */}
            <div className='bg-white p-6 rounded-lg shadow w-full mx-auto h-[650px]'>
              {/* Profile picture */}
                <div className="flex items-center">
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
              
              {/* Grades Title */}
              <div className='mt-2 mb-1 pt-6 font-medium text-black'>Grades</div>
              
              {/* Military Science 1 */}
              <div className='mt-4 mb-4'>
                <div className='bg-blue-50 py-2 px-4 font-medium mb-2 rounded text-center'>Military Science 1</div>
                <table className='w-full text-left border-collapse mb-4'>
                  <thead>
                    <tr>
                      <th className='py-2 px-4 font-medium text-center'>CODE</th>
                      <th className='py-2 px-4 font-medium text-center'>SUBJECT</th>
                      <th className='py-2 px-4 font-medium text-center'>GRADE</th>
                      <th className='py-2 px-4 font-medium text-center'>REMARK</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className='py-2 px-4 text-center'>NSTP101</td>
                      <td className='py-2 px-4 text-center'>NSTP-ROTC</td>
                      <td className='py-2 px-4 text-center'>1.0</td>
                      <td className='py-2 px-4 text-center'>Passed</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Military Science 2 */}
              <div>
                <div className='bg-blue-50 py-2 px-4 font-medium mb-2 rounded text-center mt-16'>Military Science 2</div>
                <table className='w-full text-left border-collapse'>
                  <thead>
                    <tr>
                      <th className='py-2 px-4 font-medium text-center'>CODE</th>
                      <th className='py-2 px-4 font-medium text-center'>SUBJECT</th>
                      <th className='py-2 px-4 font-medium text-center'>GRADE</th>
                      <th className='py-2 px-4 font-medium text-center'>REMARK</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className='py-2 px-4 text-center'>NSTP102</td>
                      <td className='py-2 px-4 text-center'>NSTP-ROTC</td>
                      <td className='py-2 px-4 text-center'>1.0</td>
                      <td className='py-2 px-4 text-center'>Passed</td>
                    </tr>
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

export default userGrades;