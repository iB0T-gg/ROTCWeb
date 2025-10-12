import React, { useState, useEffect } from 'react';
import Header from '../../components/header';
import AdminSidebar from '../../components/adminSidebar';
import { FaSearch } from 'react-icons/fa'
import { Link, Head } from '@inertiajs/react';
import { FaSort, FaEye } from 'react-icons/fa6'
import { usePage } from '@inertiajs/react';
import axios from 'axios';

// Alert Dialog Component
const AlertDialog = ({ isOpen, type, title, message, onClose }) => {
  if (!isOpen) return null;

  const buttonColor = type === 'success' ? 'bg-primary/90 hover:bg-primary' : 'bg-red-600 hover:bg-red-700';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
        <div>
          <h3 className={`text-lg font-semibold text-black mb-2`}>{title}</h3>
          <p className={`text-black`}>{message}</p>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 ${buttonColor} text-white rounded hover:opacity-90 transition-colors duration-150`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AdminPermission(){
    const { auth } = usePage().props;
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('');
    const [showFilterPicker, setShowFilterPicker] = useState(false);
    const [processingUser, setProcessingUser] = useState(null);
    const [processingBulk, setProcessingBulk] = useState(false);
    
    // Alert state
    const [alertDialog, setAlertDialog] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: ''
    });
    
    // Certificate viewing state
    const [showCertificateModal, setShowCertificateModal] = useState(false);
    const [selectedUserCertificate, setSelectedUserCertificate] = useState(null);
    const [loadingCertificate, setLoadingCertificate] = useState(false);

    // Fetch pending users
    useEffect(() => {
        const fetchPendingUsers = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/api/pending-users');
                console.log('Fetched pending users:', response.data);
                
                // Debug: Log each user's certificate fields
                response.data.forEach((user, index) => {
                    console.log(`User ${index + 1} (${user.first_name} ${user.last_name}):`, {
                        id: user.id,
                        creation_method: user.creation_method,
                        cor_file_path: user.cor_file_path, // Primary certificate field
                        certificate_of_registration: user.certificate_of_registration,
                        certificate: user.certificate,
                        cor: user.cor,
                        registration_certificate: user.registration_certificate,
                        // Log all fields to see what's available
                        allFields: Object.keys(user)
                    });
                });
                
                setPendingUsers(response.data);
            } catch (error) {
                console.error('Error fetching pending users:', error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchPendingUsers();
    }, []);

    // Helper function to get certificate from user (checking multiple possible field names)
    const getUserCertificate = (user) => {
        // Check various possible field names for the certificate
        const possibleFields = [
            'cor_file_path', // Primary field name based on user feedback
            'certificate_of_registration',
            'certificate',
            'cor',
            'registration_certificate',
            'certificate_file',
            'certificate_path'
        ];
        
        for (const field of possibleFields) {
            if (user[field] && user[field].trim() !== '') {
                console.log(`Found certificate in field '${field}':`, user[field]);
                let filePath = user[field];
                
                // Handle different path formats
                if (filePath.includes('/public/storage/')) {
                    // Full URL with /public/storage/ - replace with /storage/
                    filePath = filePath.replace('/public/storage/', '/storage/');
                } else if (filePath.includes('/storage/')) {
                    // Already has /storage/ - keep as is
                    filePath = filePath;
                } else if (filePath.startsWith('cor_files/') || filePath.startsWith('avatars/') || filePath.startsWith('credentials_files/')) {
                    // Relative path - add /storage/ prefix
                    filePath = '/storage/' + filePath;
                } else if (filePath.startsWith('http')) {
                    // Full HTTP URL - keep as is
                    filePath = filePath;
                } else {
                    // Default case - assume it's a relative path and add /storage/
                    filePath = '/storage/' + filePath;
                }
                
                console.log(`Processed certificate path:`, filePath);
                return filePath;
            }
        }
        
        console.log('No certificate found for user:', user.first_name, user.last_name);
        return null;
    };

    // Helper function to check if user has a certificate
    const userHasCertificate = (user) => {
        return getUserCertificate(user) !== null;
    };

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
            
            setAlertDialog({
                isOpen: true,
                type: 'success',
                title: 'Success',
                message: 'User approved successfully!'
            });
        } catch (error) {
            console.error('Error approving user:', error);
            setAlertDialog({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: 'Error approving user. Please try again.'
            });
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
            
            setAlertDialog({
                isOpen: true,
                type: 'success',
                title: 'Success',
                message: 'User rejected successfully!'
            });
        } catch (error) {
            console.error('Error rejecting user:', error);
            setAlertDialog({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: 'Error rejecting user. Please try again.'
            });
        } finally {
            setProcessingUser(null);
        }
    };
    
    // Handle approve all users
    const handleApproveAll = async () => {
        const filteredUsers = filteredAndSortedUsers();
        if (filteredUsers.length === 0) {
            setAlertDialog({
                isOpen: true,
                type: 'error',
                title: 'No Users',
                message: 'No pending users to approve.'
            });
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
                setAlertDialog({
                    isOpen: true,
                    type: 'success',
                    title: 'Success',
                    message: `Successfully approved all ${successCount} users.`
                });
            } else {
                setAlertDialog({
                    isOpen: true,
                    type: 'error',
                    title: 'Partial Success',
                    message: `Approved ${successCount} users. Failed to approve ${errorCount} users.`
                });
            }
        } catch (error) {
            console.error('Error in bulk approval process:', error);
            setAlertDialog({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: 'An error occurred during the bulk approval process.'
            });
        } finally {
            setProcessingBulk(false);
        }
    };
    
    // Handle reject all users
    const handleRejectAll = async () => {
        const filteredUsers = filteredAndSortedUsers();
        if (filteredUsers.length === 0) {
            setAlertDialog({
                isOpen: true,
                type: 'error',
                title: 'No Users',
                message: 'No pending users to reject.'
            });
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
                setAlertDialog({
                    isOpen: true,
                    type: 'success',
                    title: 'Success',
                    message: `Successfully rejected all ${successCount} users.`
                });
            } else {
                setAlertDialog({
                    isOpen: true,
                    type: 'error',
                    title: 'Partial Success',
                    message: `Rejected ${successCount} users. Failed to reject ${errorCount} users.`
                });
            }
        } catch (error) {
            console.error('Error in bulk rejection process:', error);
            setAlertDialog({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: 'An error occurred during the bulk rejection process.'
            });
        } finally {
            setProcessingBulk(false);
        }
    };
    
    // Handle view certificate
    const handleViewCertificate = async (user) => {
        try {
            setLoadingCertificate(true);
            setSelectedUserCertificate(user);
            setShowCertificateModal(true);
            
            // Fetch the certificate data if needed
            // This assumes the certificate path/URL is stored in the user object
            // If you need to fetch it separately, you can make an API call here
        } catch (error) {
            console.error('Error viewing certificate:', error);
            alert('Error loading certificate. Please try again.');
        } finally {
            setLoadingCertificate(false);
        }
    };
    
    // Close certificate modal
    const closeCertificateModal = () => {
        setShowCertificateModal(false);
        setSelectedUserCertificate(null);
        setLoadingCertificate(false);
    };
    
    return (
        <>
            <Head title="ROTC Portal - Permissions" />
            <div className='w-full min-h-screen bg-backgroundColor'>
      <Header auth={auth} />
      
      <div className='flex flex-col md:flex-row'>
        <AdminSidebar />
        
        <div className='flex-1 p-3 md:p-6'>
          <div className='font-regular animate-fade-in-up'>
            {/* Breadcrumb */}
            <div className="bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 text-sm md:text-base animate-fade-in-up">
                <Link href="/adminHome" className="hover:underline cursor-pointer font-semibold">
                  Dashboard
                </Link>
                <span className="mx-2 font-semibold">{">"}</span>
                <span className="cursor-default font-bold">Permission</span>  
          </div>
            
            {/* Page Header */}
            <div className='flex items-center justify-between mt-3 md:mt-4 mb-3 md:mb-6 pl-3 md:pl-5 py-4 md:py-7 bg-primary text-white p-3 md:p-4 rounded-lg animate-fade-in-down'>
                <h1 className='text-xl md:text-2xl font-semibold'>Permission</h1>
            </div>

            {/* Main Content */}
            <div className='bg-white p-3 md:p-6 rounded-lg shadow w-full mx-auto animate-scale-in-up'>
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
                      className="bg-white border border-gray-300 rounded-lg px-3 py-2 cursor-pointer flex items-center w-full sm:w-56 text-xs md:text-sm"
                      onClick={() => setShowFilterPicker(!showFilterPicker)}
                    >
                      <span className="text-gray-600">
                        {sortBy ? 
                          sortBy === 'date-newest' ? 'Date (Newest)' : 
                          sortBy === 'date-oldest' ? 'Date (Oldest)' : 
                          sortBy === 'name-az' ? 'Name (A-Z)' : 
                          sortBy === 'name-za' ? 'Name (Z-A)' : 'Sort by : All'
                        : 'Sort by : All'}
                      </span>
                      <FaSort className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
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
                      <th className='py-2 md:py-3 px-2 md:px-3 border-b font-medium text-center text-xs md:text-sm'>Certificate</th>
                      <th className='py-2 md:py-3 px-2 md:px-3 border-b font-medium text-center text-xs md:text-sm'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="4" className="text-center py-3 md:py-4 text-xs md:text-sm">Loading pending users...</td>
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
                            {user.creation_method !== 'admin_created' && userHasCertificate(user) ? (
                              <button 
                                onClick={() => handleViewCertificate(user)}
                                className='text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-full transition-colors duration-200'
                                title="View Certificate of Registration"
                                disabled={loadingCertificate}
                              >
                                <FaEye className="text-lg md:text-xl text-primary" />
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">
                                {user.creation_method === 'admin_created' ? 'N/A' : 'No Certificate'}
                              </span>
                            )}
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
                        <td colSpan="4" className="text-center py-4">
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
      
      {/* Certificate Viewing Modal */}
      {showCertificateModal && selectedUserCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FaEye className="text-primary" />
                Certificate of Registration
              </h2>
              <button
                onClick={closeCertificateModal}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                disabled={loadingCertificate}
              >
                &times;
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <h3 className="font-medium text-gray-800 mb-2">Cadet Information:</h3>
                <div className="bg-gray-50 p-3 rounded">
                  <p><span className="font-medium">Name:</span> {selectedUserCertificate.last_name}, {selectedUserCertificate.first_name}</p>
                  <p><span className="font-medium">Student Number:</span> {selectedUserCertificate.student_number}</p>
                  <p><span className="font-medium">Registration Type:</span> Self Registered</p>
                </div>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                {loadingCertificate ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading certificate...</span>
                  </div>
                ) : selectedUserCertificate && getUserCertificate(selectedUserCertificate) ? (
                  <div className="text-center">
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-800 mb-2">Certificate of Registration</h4>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-4 max-h-96 overflow-auto">
                      <img 
                        src={getUserCertificate(selectedUserCertificate)} 
                        alt="Certificate of Registration"
                        className="max-w-full h-auto mx-auto rounded border shadow"
                        onError={(e) => {
                          console.error('Failed to load certificate image:', getUserCertificate(selectedUserCertificate));
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                        onLoad={() => {
                          console.log('Certificate image loaded successfully:', getUserCertificate(selectedUserCertificate));
                        }}
                      />
                      <div className="text-center text-primary-20 mt-4 hidden">
                        <p>Unable to load certificate image</p>
                        <p className="text-sm">File: {getUserCertificate(selectedUserCertificate)}</p>
                        <p className="text-xs mt-2">
                          Full path: {getUserCertificate(selectedUserCertificate)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-center gap-3">
                      <a 
                        href={getUserCertificate(selectedUserCertificate)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                      >
                        Open in New Tab
                      </a>
                      <a 
                        href={getUserCertificate(selectedUserCertificate)}
                        download
                        className="px-4 py-2 bg-primary/90 text-white rounded hover:bg-primary transition-colors"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <FaEye className="mx-auto text-4xl mb-2" />
                    </div>
                    <p className="text-gray-600">No certificate of registration available</p>
                    <p className="text-sm text-gray-500 mt-1">This cadet did not upload a certificate during registration</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end p-4 border-t bg-gray-50">
              <button
                onClick={closeCertificateModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        type={alertDialog.type}
        title={alertDialog.title}
        message={alertDialog.message}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
      />
    </div>
        </>
    )
}