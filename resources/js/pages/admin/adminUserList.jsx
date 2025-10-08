import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/header';
import AdminSidebar from '../../components/adminSidebar';
import { FaSearch } from 'react-icons/fa'
import { FaChevronDown } from 'react-icons/fa6'
import { Link, Head } from '@inertiajs/react';

// Alert Dialog Component
const AlertDialog = ({ isOpen, type, title, message, onClose }) => {
  if (!isOpen) return null;

  const textColor = type === 'success' ? 'text-primary' : 'text-red-800';
  const borderColor = type === 'success' ? 'border-primary' : 'border-red-300';
  const buttonColor = type === 'success' ? 'bg-primary/90 hover:bg-primary' : 'bg-red-600 hover:bg-red-700';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
        <div className={`border rounded-lg p-4 mb-4`}>
          <h3 className={`text-lg font-semibold ${textColor} mb-2`}>{title}</h3>
          <p className={`${textColor}`}>{message}</p>
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

// Confirmation Dialog Component
const ConfirmationDialog = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
        <div className="border rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
          <p className="text-gray-700">{message}</p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors duration-150"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-150"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AdminUserList({ auth }) {
    const [users, setUsers] = useState([]);
    const [archivedUsers, setArchivedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'archived'
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'admin', 'faculty', 'user'
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 8;

    // Alert dialog state
    const [alertDialog, setAlertDialog] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: ''
    });

    // Confirmation dialog state
    const [confirmationDialog, setConfirmationDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null
    });

    useEffect(() => {
        // Fetch users when component mounts
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/users');
            const allUsers = response.data;
            
            // Separate active and archived users
            const active = allUsers.filter(user => !user.archived);
            const archived = allUsers.filter(user => user.archived);
            
            setUsers(active);
            setArchivedUsers(archived);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Failed to fetch users. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleArchiveUser = async (userId) => {
        // Find the user to check if they're an admin
        const userToArchive = users.find(user => user.id === userId);
        
        // Prevent archiving if the user is an admin
        if (userToArchive && userToArchive.role === 'admin') {
            setAlertDialog({
                isOpen: true,
                type: 'error',
                title: 'Cannot Archive Admin',
                message: 'Admin users cannot be archived.'
            });
            return;
        }

        // Show confirmation dialog
        setConfirmationDialog({
            isOpen: true,
            title: 'Archive User',
            message: `Are you sure you want to archive ${userToArchive?.first_name} ${userToArchive?.last_name}?`,
            onConfirm: async () => {
                try {
                    await axios.post('/api/archive-user', { user_id: userId });
                    setAlertDialog({
                        isOpen: true,
                        type: 'success',
                        title: 'Success',
                        message: 'User has been archived successfully!'
                    });
                    fetchUsers(); // Refresh user lists
                } catch (err) {
                    console.error('Error archiving user:', err);
                    setAlertDialog({
                        isOpen: true,
                        type: 'error',
                        title: 'Archive Failed',
                        message: 'Failed to archive user. Please try again.'
                    });
                }
                setConfirmationDialog({ ...confirmationDialog, isOpen: false });
            }
        });
    };
    
    const handleArchiveAll = async () => {
        // Filter out admin users
        const nonAdminUsers = filteredUsers.filter(user => user.role !== 'admin');
        
        if (nonAdminUsers.length === 0) {
            setAlertDialog({
                isOpen: true,
                type: 'error',
                title: 'No Users to Archive',
                message: 'No non-admin users to archive.'
            });
            return;
        }

        // Show confirmation dialog
        setConfirmationDialog({
            isOpen: true,
            title: 'Archive All Users',
            message: `Are you sure you want to archive ${nonAdminUsers.length} users? Admin users will not be archived.`,
            onConfirm: async () => {
                setLoading(true);
                
                try {
                    let successCount = 0;
                    let errorCount = 0;
                    
                    // Process users one by one
                    for (const user of nonAdminUsers) {
                        try {
                            await axios.post('/api/archive-user', { user_id: user.id });
                            successCount++;
                        } catch (error) {
                            console.error(`Error archiving user ${user.id}:`, error);
                            errorCount++;
                        }
                    }
                    
                    // Refresh the user lists
                    fetchUsers();
                    
                    if (errorCount === 0) {
                        setAlertDialog({
                            isOpen: true,
                            type: 'success',
                            title: 'Success',
                            message: `Successfully archived ${successCount} users.`
                        });
                    } else {
                        setAlertDialog({
                            isOpen: true,
                            type: 'error',
                            title: 'Partial Success',
                            message: `Archived ${successCount} users. Failed to archive ${errorCount} users.`
                        });
                    }
                } catch (error) {
                    console.error('Error in bulk archive process:', error);
                    setAlertDialog({
                        isOpen: true,
                        type: 'error',
                        title: 'Archive Failed',
                        message: 'An error occurred during the bulk archive process.'
                    });
                } finally {
                    setLoading(false);
                }
                setConfirmationDialog({ ...confirmationDialog, isOpen: false });
            }
        });
    };

    const handleRestoreUser = async (userId) => {
        // Find the user to get their name for confirmation
        const userToRestore = archivedUsers.find(user => user.id === userId);

        // Show confirmation dialog
        setConfirmationDialog({
            isOpen: true,
            title: 'Restore User',
            message: `Are you sure you want to restore ${userToRestore?.first_name} ${userToRestore?.last_name}?`,
            onConfirm: async () => {
                try {
                    await axios.post('/api/restore-user', { user_id: userId });
                    setAlertDialog({
                        isOpen: true,
                        type: 'success',
                        title: 'Success',
                        message: 'User has been restored successfully!'
                    });
                    fetchUsers(); // Refresh user lists
                } catch (err) {
                    console.error('Error restoring user:', err);
                    setAlertDialog({
                        isOpen: true,
                        type: 'error',
                        title: 'Restore Failed',
                        message: 'Failed to restore user. Please try again.'
                    });
                }
                setConfirmationDialog({ ...confirmationDialog, isOpen: false });
            }
        });
    };

    // Filter users based on search term and role
    const filteredUsers = users.filter(user => {
        const nameMatches = `${user.first_name} ${user.middle_name} ${user.last_name}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const emailMatches = user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const roleMatches = roleFilter === 'all' || user.role === roleFilter;
        
        return (nameMatches || emailMatches) && roleMatches;
    }).sort((a, b) => {
        // Sort by last name in alphabetical order
        const lastNameA = a.last_name ? a.last_name.toLowerCase() : '';
        const lastNameB = b.last_name ? b.last_name.toLowerCase() : '';
        
        // If last names are the same, sort by first name
        if (lastNameA === lastNameB) {
            const firstNameA = a.first_name ? a.first_name.toLowerCase() : '';
            const firstNameB = b.first_name ? b.first_name.toLowerCase() : '';
            return firstNameA.localeCompare(firstNameB);
        }
        
        return lastNameA.localeCompare(lastNameB);
    });

  // Reset to first page when filters/search/tab change
  useEffect(() => {
      setCurrentPage(1);
  }, [searchTerm, roleFilter, activeTab]);

    // Filter archived users based on search term and role
    const filteredArchivedUsers = archivedUsers.filter(user => {
        const nameMatches = `${user.first_name} ${user.middle_name} ${user.last_name}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        const emailMatches = user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const roleMatches = roleFilter === 'all' || user.role === roleFilter;
        
        return (nameMatches || emailMatches) && roleMatches;
    }).sort((a, b) => {
        // Sort by last name in alphabetical order
        const lastNameA = a.last_name ? a.last_name.toLowerCase() : '';
        const lastNameB = b.last_name ? b.last_name.toLowerCase() : '';
        
        // If last names are the same, sort by first name
        if (lastNameA === lastNameB) {
            const firstNameA = a.first_name ? a.first_name.toLowerCase() : '';
            const firstNameB = b.first_name ? b.first_name.toLowerCase() : '';
            return firstNameA.localeCompare(firstNameB);
        }
        
        return lastNameA.localeCompare(lastNameB);
    });

    return (
        <>
            <Head title="ROTC Portal - Admin User List" />
            <div className="w-full min-h-screen bg-backgroundColor">
            <Header auth={auth} />
            <div className="flex flex-col md:flex-row">
                <AdminSidebar />
                <div className="flex-1 p-3 md:p-6">
                    <div className="font-regular">
                        {/* Breadcrumb */}
                        <div className="bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 text-sm md:text-base">
                        <Link href="/adminHome" className="hover:underline cursor-pointer font-semibold">
                             Dashboard
                        </Link>
                        <span className="mx-2 font-semibold">{">"}</span>
                        <span className="cursor-default font-bold">User List</span>  
                    </div>
                        
                        {/* Page Header */}
                        <div className="bg-primary text-white p-3 md:p-4 rounded-lg flex items-center justify-between mt-3 md:mt-4 mb-3 md:mb-6 pl-3 md:pl-5 py-4 md:py-7">
                            <h1 className="text-xl md:text-2xl font-semibold">User List</h1>
                        </div>

                        {/* Filters and Search */}
                        <div className="bg-white p-3 md:p-6 rounded-lg shadow mb-3 md:mb-6">
                            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-start sm:items-center justify-between">
                                {/* Tabs */}
                                <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full sm:w-auto">
                                    <button 
                                        onClick={() => setActiveTab('active')}
                                        className={`py-1.5 md:py-2 px-3 md:px-4 rounded-lg transition-colors duration-150 text-xs md:text-sm ${
                                            activeTab === 'active' 
                                                ? 'bg-primary text-white' 
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Active Users
                                    </button>
                                    <button 
                                        onClick={() => setActiveTab('archived')}
                                        className={`py-1.5 md:py-2 px-3 md:px-4 rounded-lg transition-colors duration-150 text-xs md:text-sm ${
                                            activeTab === 'archived' 
                                                ? 'bg-primary text-white' 
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Archived Users
                                    </button>
                                </div>
                                
                                {/* Right controls: Search + Role filter */}
                                <div className="flex w-full sm:w-auto items-center gap-2 md:gap-3 justify-end">
                                    {/* Search */}
                                    <div className="relative w-full sm:w-48 md:w-64">
                                    <FaSearch className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs md:text-sm" />
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full py-1.5 md:py-2 px-2 md:px-4 pl-7 md:pl-10 border rounded-lg text-xs md:text-sm"
                                    />
                                    </div>
                                    {/* Role filter */}
                                    <div className="relative w-auto">
                                        <select 
                                            value={roleFilter}
                                            onChange={(e) => setRoleFilter(e.target.value)}
                                            className="py-1.5 md:py-2 pl-3 pr-8 md:pl-4 md:pr-10 border rounded-lg text-xs md:text-sm appearance-none"
                                        >
                                            <option value="all">All Roles</option>
                                            <option value="admin">Admin</option>
                                            <option value="faculty">Faculty</option>
                                            <option value="user">Cadets</option>
                                        </select>
                                        <FaChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* User List */}
                        <div className="bg-white p-3 md:p-6 rounded-lg shadow">
                            {loading ? (
                                <div className="flex justify-center items-center h-32 md:h-40">
                                    <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-t-2 border-b-2 border-primary"></div>
                                </div>
                            ) : error ? (
                                <div className="text-center text-red-500 py-3 md:py-4 text-sm md:text-base">{error}</div>
                            ) : (
                                <>
                                    {/* Active Users Table */}
                                    {activeTab === 'active' && (
                                        <>
                                            <h2 className="text-base md:text-lg font-semibold mb-2 md:mb-4">Active Users</h2>
                                            {filteredUsers.length === 0 ? (
                                                <p className="text-center py-3 md:py-4 text-gray-500 text-sm md:text-base">No active users found.</p>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                                <th scope="col" className="hidden sm:table-cell px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                                <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                                                <th scope="col" className="hidden sm:table-cell px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                                <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {filteredUsers
                                                              .slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage)
                                                              .map((user) => (
                                                                <tr key={user.id} className="hover:bg-gray-50">
                                                                    <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                                                                        <div className="text-xs md:text-sm font-medium text-gray-900">
                                                                            {user.last_name}, {user.first_name} {user.middle_name}
                                                                        </div>
                                                                        {/* Mobile-only email display */}
                                                                        <div className="text-xs text-gray-500 sm:hidden mt-1">{user.email}</div>
                                                                    </td>
                                                                    <td className="hidden sm:table-cell px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                                                                        <div className="text-xs md:text-sm text-gray-500">{user.email}</div>
                                                                    </td>
                                                                    <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                                                                        <span className={`px-1.5 md:px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                                            ${user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 
                                                                            user.role === 'faculty' ? 'bg-green-100 text-green-800' : 
                                                                            'bg-yellow-100 text-yellow-800'}`}>
                                                                            {user.role === 'user' ? 'Cadet' : 
                                                                              user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                                        </span>
                                                                        {/* Mobile-only status display */}
                                                                        <div className="sm:hidden mt-1">
                                                                            <span className={`px-1.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                                                ${user.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                                                                'bg-yellow-100 text-yellow-800'}`}>
                                                                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="hidden sm:table-cell px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                                                                        <span className={`px-1.5 md:px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                                            ${user.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                                                            'bg-yellow-100 text-yellow-800'}`}>
                                                                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium">
                                                                        {user.role === 'admin' ? (
                                                                            <span className="text-gray-400 italic">Archive</span>
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => handleArchiveUser(user.id)}
                                                                                className="text-red-600 hover:text-red-900"
                                                                            >
                                                                                Archive
                                                                            </button>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                            {filteredUsers.length > 0 && (
                                                <div className="grid grid-cols-1 sm:grid-cols-3 items-center mt-3 md:mt-4 w-full gap-4">
                                                    <div className="text-gray-600 text-sm md:text-base justify-self-start">
                                                        {`Showing data ${Math.min((currentPage - 1) * usersPerPage + 1, filteredUsers.length)} to ${Math.min(currentPage * usersPerPage, filteredUsers.length)} of ${filteredUsers.length} users`}
                                                    </div>
                                                    <div className="flex justify-center justify-self-center w-full sm:w-auto">
                                                        {currentPage > 1 && (
                                                            <button
                                                                className="mx-1 px-2 md:px-3 py-1 rounded bg-white border text-sm md:text-base"
                                                                onClick={() => setCurrentPage(currentPage - 1)}
                                                            >
                                                                {'<'}
                                                            </button>
                                                        )}
                                                        {Array.from({ length: Math.min(5, Math.ceil(filteredUsers.length / usersPerPage)) }, (_, i) => {
                                                            const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
                                                            const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                                                            if (pageNum > totalPages) return null;
                                                            return (
                                                                <button
                                                                    key={pageNum}
                                                                    className={`mx-1 px-2 md:px-3 py-1 rounded text-sm md:text-base ${currentPage === pageNum ? 'bg-primary text-white' : 'bg-white border'}`}
                                                                    onClick={() => setCurrentPage(pageNum)}
                                                                >
                                                                    {pageNum}
                                                                </button>
                                                            );
                                                        })}
                                                        {currentPage < Math.ceil(filteredUsers.length / usersPerPage) && (
                                                            <button
                                                                className="mx-1 px-2 md:px-3 py-1 rounded bg-white border text-sm md:text-base"
                                                                onClick={() => setCurrentPage(currentPage + 1)}
                                                            >
                                                                &gt;
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="justify-self-end">
                                                        <button
                                                            onClick={handleArchiveAll}
                                                            className="bg-primary hover:bg-primary/85 text-white font-medium py-1.5 md:py-2 px-3 md:px-4 rounded shadow text-xs md:text-sm"
                                                        >
                                                            Archive All
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Archived Users Table */}
                                    {activeTab === 'archived' && (
                                        <>
                                            <h2 className="text-base md:text-lg font-semibold mb-2 md:mb-4">Archived Users</h2>
                                            {filteredArchivedUsers.length === 0 ? (
                                                <p className="text-center py-3 md:py-4 text-gray-500 text-sm md:text-base">No archived users found.</p>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                                <th scope="col" className="hidden sm:table-cell px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                                <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                                                <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {filteredArchivedUsers
                                                              .slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage)
                                                              .map((user) => (
                                                                <tr key={user.id} className="hover:bg-gray-50">
                                                                    <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                                                                        <div className="text-xs md:text-sm font-medium text-gray-900">
                                                                            {user.last_name}, {user.first_name} {user.middle_name}
                                                                        </div>
                                                                        {/* Mobile-only email display */}
                                                                        <div className="text-xs text-gray-500 sm:hidden mt-1">{user.email}</div>
                                                                    </td>
                                                                    <td className="hidden sm:table-cell px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                                                                        <div className="text-xs md:text-sm text-gray-500">{user.email}</div>
                                                                    </td>
                                                                    <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                                                                        <span className={`px-1.5 md:px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                                            ${user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 
                                                                            user.role === 'faculty' ? 'bg-green-100 text-green-800' : 
                                                                            'bg-yellow-100 text-yellow-800'}`}>
                                                                            {user.role === 'user' ? 'Cadet' : 
                                                                              user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm font-medium">
                                                                        <button
                                                                            onClick={() => handleRestoreUser(user.id)}
                                                                            className="text-green-600 hover:text-green-900"
                                                                        >
                                                                            Restore
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                            {filteredArchivedUsers.length > 0 && (
                                                <div className="grid grid-cols-1 sm:grid-cols-3 items-center mt-3 md:mt-4 w-full gap-4">
                                                    <div className="text-gray-600 text-sm md:text-base justify-self-start">
                                                        {`Showing data ${Math.min((currentPage - 1) * usersPerPage + 1, filteredArchivedUsers.length)} to ${Math.min(currentPage * usersPerPage, filteredArchivedUsers.length)} of ${filteredArchivedUsers.length} users`}
                                                    </div>
                                                    <div className="flex justify-center justify-self-center w-full sm:w-auto">
                                                        {currentPage > 1 && (
                                                            <button
                                                                className="mx-1 px-2 md:px-3 py-1 rounded bg-white border text-sm md:text-base"
                                                                onClick={() => setCurrentPage(currentPage - 1)}
                                                            >
                                                                {'<'}
                                                            </button>
                                                        )}
                                                        {Array.from({ length: Math.min(5, Math.ceil(filteredArchivedUsers.length / usersPerPage)) }, (_, i) => {
                                                            const totalPages = Math.ceil(filteredArchivedUsers.length / usersPerPage);
                                                            const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                                                            if (pageNum > totalPages) return null;
                                                            return (
                                                                <button
                                                                    key={pageNum}
                                                                    className={`mx-1 px-2 md:px-3 py-1 rounded text-sm md:text-base ${currentPage === pageNum ? 'bg-primary text-white' : 'bg-white border'}`}
                                                                    onClick={() => setCurrentPage(pageNum)}
                                                                >
                                                                    {pageNum}
                                                                </button>
                                                            );
                                                        })}
                                                        {currentPage < Math.ceil(filteredArchivedUsers.length / usersPerPage) && (
                                                            <button
                                                                className="mx-1 px-2 md:px-3 py-1 rounded bg-white border text-sm md:text-base"
                                                                onClick={() => setCurrentPage(currentPage + 1)}
                                                            >
                                                                &gt;
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="justify-self-end"></div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Alert Dialog */}
        <AlertDialog
            isOpen={alertDialog.isOpen}
            type={alertDialog.type}
            title={alertDialog.title}
            message={alertDialog.message}
            onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        />

        {/* Confirmation Dialog */}
        <ConfirmationDialog
            isOpen={confirmationDialog.isOpen}
            title={confirmationDialog.title}
            message={confirmationDialog.message}
            onConfirm={confirmationDialog.onConfirm}
            onCancel={() => setConfirmationDialog({ ...confirmationDialog, isOpen: false })}
        />
        </>
    );
}
