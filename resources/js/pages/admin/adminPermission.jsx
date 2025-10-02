import Header from '../../components/header';
import AdminSidebar from '../../components/adminSidebar';
import { FaSearch } from 'react-icons/fa'
import { Link } from '@inertiajs/react';
import { FaSort } from 'react-icons/fa6'
import { usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminPermission(){
    const { auth } = usePage().props;
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('');
    const [showFilterPicker, setShowFilterPicker] = useState(false);
    const [processingUser, setProcessingUser] = useState(null);
    const [processingBulk, setProcessingBulk] = useState(false);

    // Fetch pending users
    useEffect(() => {
        const fetchPendingUsers = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/pending-users');
                setPendingUsers(response.data);
            } catch (error) {
                console.error('Error fetching pending users:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchPendingUsers();
    }, []);

    // Filter and sort users
    const filteredAndSortedUsers = () => {
        let filtered = pendingUsers;
        
        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(user => 
                `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.student_number?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Sort users
        switch (sortBy) {
            case 'date-newest':
                return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            case 'date-oldest':
                return filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            case 'name-az':
                return filtered.sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`));
            case 'name-za':
                return filtered.sort((a, b) => `${b.first_name} ${b.last_name}`.localeCompare(`${a.first_name} ${a.last_name}`));
            default:
                return filtered;
        }
    };

    // Handle approve user
    const handleApprove = async (userId) => {
        try {
            setProcessingUser(userId);
            await axios.post('/api/approve-user', { user_id: userId });
            
            // Remove user from pending list
            setPendingUsers(prev => prev.filter(user => user.id !== userId));
            
            alert('User approved successfully!');
        } catch (error) {
            console.error('Error approving user:', error);
            alert('Error approving user. Please try again.');
        } finally {
            setProcessingUser(null);
        }
    };

    // Handle reject user
    const handleReject = async (userId) => {
        if (!confirm('Are you sure you want to reject this user?')) {
            return;
        }
        
        try {
            setProcessingUser(userId);
            await axios.post('/api/reject-user', { user_id: userId });
            
            // Remove user from pending list
            setPendingUsers(prev => prev.filter(user => user.id !== userId));
            
            alert('User rejected successfully!');
        } catch (error) {
            console.error('Error rejecting user:', error);
            alert('Error rejecting user. Please try again.');
        } finally {
            setProcessingUser(null);
        }
    };
    
    // Handle approve all users
    const handleApproveAll = async () => {
        const filteredUsers = filteredAndSortedUsers();
        if (filteredUsers.length === 0) {
            alert('No pending users to approve.');
            return;
        }
        
        if (!confirm(`Are you sure you want to approve all ${filteredUsers.length} pending users?`)) {
            return;
        }
        
        setProcessingBulk(true);
        
        try {
            let successCount = 0;
            let errorCount = 0;
            
            // Process users one by one to ensure proper handling
            for (const user of filteredUsers) {
                try {
                    await axios.post('/api/approve-user', { user_id: user.id });
                    successCount++;
                } catch (error) {
                    console.error(`Error approving user ${user.id}:`, error);
                    errorCount++;
                }
            }
            
            // Update the pending users list by removing all approved users
            setPendingUsers(prev => prev.filter(user => 
                !filteredUsers.some(filteredUser => filteredUser.id === user.id)
            ));
            
            if (errorCount === 0) {
                alert(`Successfully approved all ${successCount} users.`);
            } else {
                alert(`Approved ${successCount} users. Failed to approve ${errorCount} users.`);
            }
        } catch (error) {
            console.error('Error in bulk approval process:', error);
            alert('An error occurred during the bulk approval process.');
        } finally {
            setProcessingBulk(false);
        }
    };
    
    // Handle reject all users
    const handleRejectAll = async () => {
        const filteredUsers = filteredAndSortedUsers();
        if (filteredUsers.length === 0) {
            alert('No pending users to reject.');
            return;
        }
        
        if (!confirm(`Are you sure you want to reject all ${filteredUsers.length} pending users?`)) {
            return;
        }
        
        setProcessingBulk(true);
        
        try {
            let successCount = 0;
            let errorCount = 0;
            
            // Process users one by one to ensure proper handling
            for (const user of filteredUsers) {
                try {
                    await axios.post('/api/reject-user', { user_id: user.id });
                    successCount++;
                } catch (error) {
                    console.error(`Error rejecting user ${user.id}:`, error);
                    errorCount++;
                }
            }
            
            // Update the pending users list by removing all rejected users
            setPendingUsers(prev => prev.filter(user => 
                !filteredUsers.some(filteredUser => filteredUser.id === user.id)
            ));
            
            if (errorCount === 0) {
                alert(`Successfully rejected all ${successCount} users.`);
            } else {
                alert(`Rejected ${successCount} users. Failed to reject ${errorCount} users.`);
            }
        } catch (error) {
            console.error('Error in bulk rejection process:', error);
            alert('An error occurred during the bulk rejection process.');
        } finally {
            setProcessingBulk(false);
        }
    };
    
    return (
    <div className='w-full min-h-screen bg-backgroundColor'>
      <Header auth={auth} />
      
      <div className='flex flex-col md:flex-row'>
        <AdminSidebar />
        
        <div className='flex-1 p-3 md:p-6'>
          <div className='font-regular'>
            {/* Breadcrumb */}
            <div className="bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 text-sm md:text-base">
                <Link href="/adminHome" className="hover:underline cursor-pointer font-semibold">
                  Dashboard
                </Link>
                <span className="mx-2 font-semibold">{">"}</span>
                <span className="cursor-default font-bold">Permission</span>  
          </div>
            
            {/* Page Header */}
            <div className='flex items-center justify-between mt-3 md:mt-4 mb-3 md:mb-6 pl-3 md:pl-5 py-4 md:py-7 bg-primary text-white p-3 md:p-4 rounded-lg'>
                <h1 className='text-xl md:text-2xl font-semibold'>Permission</h1>
            </div>

            {/* Main Content */}
            <div className='bg-white p-3 md:p-6 rounded-lg shadow w-full mx-auto'>
              <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 md:mb-6 gap-3 md:gap-4'>
                <h1 className='text-base md:text-lg font-semibold text-black'>Permission Requests</h1>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <FaSearch className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs md:text-sm" />
                    <input
                      type="search"
                      placeholder="Search Cadets"
                      className="w-full sm:w-48 md:w-64 p-1.5 md:p-2 pl-7 md:pl-10 border border-gray-300 rounded-lg text-xs md:text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="relative w-full sm:w-auto">
                    <div
                      className="bg-white border border-gray-300 rounded-lg p-1.5 md:p-2 pl-3 md:pl-4 pr-8 cursor-pointer flex items-center w-full text-xs md:text-sm"
                      onClick={() => setShowFilterPicker(!showFilterPicker)}
                    >
                      <span className="text-gray-600 truncate">
                        {sortBy ? 
                          sortBy === 'date-newest' ? 'Date (Newest)' : 
                          sortBy === 'date-oldest' ? 'Date (Oldest)' : 
                          sortBy === 'name-az' ? 'Name (A-Z)' : 
                          sortBy === 'name-za' ? 'Name (Z-A)' : 'Sort by'
                        : 'Sort by'}
                      </span>
                      <FaSort className="absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    
                    {showFilterPicker && (
                      <>
                        <div 
                          className="fixed inset-0 bg-black bg-opacity-30 z-40"
                          onClick={() => setShowFilterPicker(false)}
                        ></div>
                        <div
                          className="fixed sm:absolute inset-x-0 sm:inset-auto z-50 bg-white border border-gray-300 rounded-lg p-3 md:p-4 mt-1 shadow-lg w-[90%] sm:w-auto left-1/2 sm:left-auto right-0 sm:right-0 -translate-x-1/2 sm:translate-x-0 mx-auto sm:mx-0"
                          style={{ maxWidth: "300px" }}
                        >
                          <div className="space-y-2 md:space-y-3">
                            <p className="font-medium text-gray-700 border-b pb-2 text-sm md:text-base">Sort Options</p>
                            <div className="space-y-1 md:space-y-2">
                              <div 
                                className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${sortBy === '' ? 'bg-gray-100' : ''} text-xs md:text-sm`}
                                onClick={() => {
                                  setSortBy('');
                                  setShowFilterPicker(false);
                                }}
                              >
                                No sorting
                              </div>
                              <div 
                                className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${sortBy === 'date-newest' ? 'bg-gray-100' : ''} text-xs md:text-sm`}
                                onClick={() => {
                                  setSortBy('date-newest');
                                  setShowFilterPicker(false);
                                }}
                              >
                                Date (Newest)
                              </div>
                              <div 
                                className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${sortBy === 'date-oldest' ? 'bg-gray-100' : ''} text-xs md:text-sm`}
                                onClick={() => {
                                  setSortBy('date-oldest');
                                  setShowFilterPicker(false);
                                }}
                              >
                                Date (Oldest)
                              </div>
                              <div 
                                className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${sortBy === 'name-az' ? 'bg-gray-100' : ''} text-xs md:text-sm`}
                                onClick={() => {
                                  setSortBy('name-az');
                                  setShowFilterPicker(false);
                                }}
                              >
                                Name (A-Z)
                              </div>
                              <div 
                                className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${sortBy === 'name-za' ? 'bg-gray-100' : ''} text-xs md:text-sm`}
                                onClick={() => {
                                  setSortBy('name-za');
                                  setShowFilterPicker(false);
                                }}
                              >
                                Name (Z-A)
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className='overflow-x-auto max-h-[400px] md:max-h-[500px]'>
                <table className='w-full border-collapse'>
                  <thead className='text-gray-600 sticky top-0 bg-white'>
                    <tr>
                      <th className='py-2 md:py-3 px-2 md:px-3 border-b font-medium text-left text-xs md:text-sm'>Cadet Name</th>
                      <th className='py-2 md:py-3 px-2 md:px-3 border-b font-medium text-center text-xs md:text-sm'>Registration Type</th>
                      <th className='py-2 md:py-3 px-2 md:px-3 border-b font-medium text-center text-xs md:text-sm'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="3" className="text-center py-3 md:py-4 text-xs md:text-sm">Loading pending users...</td>
                      </tr>
                    ) : filteredAndSortedUsers().length > 0 ? (
                      filteredAndSortedUsers().map(user => (
                        <tr key={user.id} className='hover:bg-gray-50'>
                          <td className='py-2 md:py-3 px-2 md:px-3 border-b text-xs md:text-sm'>{user.last_name}, {user.first_name}</td>
                          <td className='py-2 md:py-3 px-2 md:px-3 border-b text-center text-xs md:text-sm'>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              user.creation_method === 'admin_created' 
                                ? 'bg-green-100 text-green-800' 
                                : 'text-black'
                            }`}>
                              {user.creation_method === 'admin_created' ? 'Admin Created' : 'Self Registered'}
                            </span>
                          </td>
                          <td className='py-2 md:py-3 px-2 md:px-3 border-b text-center'>
                            <div className='flex justify-center gap-2 md:gap-4'>
                              <button 
                                onClick={() => handleReject(user.id)}
                                disabled={processingUser === user.id}
                                className='text-primary hover:underline disabled:opacity-50 text-xs md:text-sm'
                              >
                                {processingUser === user.id ? 'Processing...' : 'Reject'}
                              </button>
                              <button 
                                onClick={() => handleApprove(user.id)}
                                disabled={processingUser === user.id}
                                className='text-white bg-primary rounded px-3 py-1 hover:bg-opacity-80 disabled:opacity-50 text-xs md:text-sm'
                              >
                                {processingUser === user.id ? 'Processing...' : 'Approve'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center py-4">
                          {searchTerm ? 'No pending users found matching your search.' : 'No pending users to approve.'}
                      </td>
                    </tr>
                    )}
                  </tbody>
                </table>
                <div className='flex right-0 justify-end mt-4 space-x-3'>
                  <button 
                    onClick={handleRejectAll}
                    disabled={processingBulk || loading || filteredAndSortedUsers().length === 0}
                    className='text-primary px-4 py-2 rounded hover:bg-gray-100 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm'
                  >
                    {processingBulk ? 'Processing...' : 'Reject All'}
                  </button>
                  <button 
                    onClick={handleApproveAll}
                    disabled={processingBulk || loading || filteredAndSortedUsers().length === 0}
                    className='bg-primary text-white px-4 py-2 rounded hover:bg-opacity-80 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm'
                  >
                    {processingBulk ? 'Processing...' : 'Approve All'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}