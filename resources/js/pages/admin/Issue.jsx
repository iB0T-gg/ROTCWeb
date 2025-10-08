import React, { useState, useEffect } from 'react';
import Header from '../../components/header';
import AdminSidebar from '../../components/adminSidebar';
import axios from 'axios';
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

// ChevronDownIcon component for dropdowns
const ChevronDownIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Issue({ issues = [] }) {
    // Local state to store issues if not provided via props
    const [allIssues, setAllIssues] = useState(issues || []);
    const [loading, setLoading] = useState(true);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [response, setResponse] = useState('');
    const [status, setStatus] = useState('pending');
    const [filter, setFilter] = useState('all');
    
    // Alert state
    const [alertDialog, setAlertDialog] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: ''
    });
    
    // Fetch issues from API if not provided via props
    useEffect(() => {
        if (!issues.length) {
            fetchIssues();
        } else {
            setLoading(false);
        }
    }, [issues]);
    
    const fetchIssues = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/all-issues');
            setAllIssues(response.data.issues);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching issues:', error);
            setLoading(false);
        }
    };
    
    // Function to handle updating an issue
    const handleUpdateIssue = async () => {
        if (!selectedIssue) return;
        
        try {
            const updateData = {
                status
            };
            
            const apiResponse = await axios.put(`/api/issues/${selectedIssue.id}`, updateData);
            
            // Update the issue in the local state
            setAllIssues(prevIssues => 
                prevIssues.map(issue => 
                    issue.id === selectedIssue.id 
                        ? { ...issue, status: status, resolved_at: status === 'resolved' ? new Date().toISOString() : null }
                        : issue
                )
            );
            
            // Reset the form and close modal
            setSelectedIssue(null);
            setStatus('pending');
            
            // Show success message
            setAlertDialog({
                isOpen: true,
                type: 'success',
                title: 'Success',
                message: 'Issue updated successfully!'
            });
            
        } catch (error) {
            console.error('Error updating issue:', error);
            setAlertDialog({
                isOpen: true,
                type: 'error',
                title: 'Update Failed',
                message: 'Failed to update issue. Please try again.'
            });
        }
    };
    
    // Function to open modal and set initial values
    const openIssueModal = (issue) => {
        setSelectedIssue(issue);
        setStatus(issue.status || 'pending');
    };
    
    // Filter issues based on selected filter
    const filteredIssues = allIssues.filter(issue => {
        if (filter === 'all') return true;
        if (filter === 'pending') return issue.status === 'pending';
        if (filter === 'in-progress') return issue.status === 'in-progress';
        if (filter === 'resolved') return issue.status === 'resolved';
        if (filter === 'cadet') return issue.reporter_type === 'cadet';
        if (filter === 'faculty') return issue.reporter_type === 'faculty';
        return true;
    });
    
    // Format date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    // Get status badge class
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-500 text-white';
            case 'in-progress':
                return 'bg-blue-500 text-white';
            case 'resolved':
                return 'bg-green-500 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    };
    
    return (
        <>
            <Head title="ROTC Portal - Issues" />
            <div className='w-full min-h-screen bg-backgroundColor'>
          <Header />
          
          <div className='flex flex-col md:flex-row'>
            <AdminSidebar />
            
            <div className='flex-1 p-3 md:p-6'>
              <div className='font-regular'>
                {/* Breadcrumb */}
                <div className='bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 text-sm md:text-base'>
                    <Link href="/adminHome" className="hover:text-primary cursor-pointer">Home</Link>
                    {" > "}
                    <span className='cursor-pointer font-semibold'>Issues</span>
                </div>
                
                {/* Page Header */}
                <div className='flex items-center justify-between mt-3 md:mt-4 mb-3 md:mb-6 pl-3 md:pl-5 py-4 md:py-7 bg-primary text-white p-3 md:p-4 rounded-lg'>
                    <h1 className='text-xl md:text-2xl font-semibold'>Reported Issues</h1>
                </div>

                {/* Filter Section */}
                <div className="bg-white p-3 md:p-6 rounded-lg shadow mb-3 md:mb-6">
                    <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0'>
                        <h1 className='text-base md:text-lg font-semibold text-black mb-2 sm:mb-0'>Issue Reports</h1>
                        
                        <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto'>
                            {/* Filter dropdown with improved styling */}
                            <div className="relative w-full sm:w-auto">
                                <select
                                    className="bg-white border border-gray-300 rounded-lg px-3 md:px-4 py-1.5 md:py-2 pr-8 appearance-none w-full text-xs md:text-sm"
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                >
                                    <option value="all">All Issues</option>
                                    <option value="pending">Pending</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="cadet">Cadets Only</option>
                                    <option value="faculty">Faculty Only</option>
                                </select>
                                <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                            
                            {/* Refresh button with improved styling */}
                            <button 
                                className='px-3 md:px-4 py-1.5 md:py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors duration-150 flex items-center justify-center gap-2 w-full sm:w-auto text-xs md:text-sm'
                                onClick={fetchIssues}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Issues list */}
                <div className='bg-white rounded-lg shadow overflow-hidden'>
                    {loading ? (
                        <div className='p-4 md:p-8 text-center text-sm md:text-base'>Loading issues...</div>
                    ) : filteredIssues.length === 0 ? (
                        <div className='p-4 md:p-8 text-center text-gray-500 text-sm md:text-base'>No issues found</div>
                    ) : (
                        <div className='overflow-x-auto'>
                            {/* Mobile view - card layout */}
                            <div className="md:hidden space-y-3 p-3">
                                {filteredIssues.map(issue => (
                                    <div key={issue.id} className="border rounded-lg p-3 bg-white shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-medium text-sm">ID: {issue.id}</p>
                                                <p className="text-xs text-gray-600 mt-1">{issue.issue_type}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadgeClass(issue.status)}`}>
                                                {issue.status}
                                            </span>
                                        </div>
                                        
                                        <div className="mb-2">
                                            <p className="text-xs text-gray-500">Reported by:</p>
                                            <p className="text-xs font-medium">
                                                {issue.is_anonymous ? (
                                                    <span>Anonymous {issue.reporter_type}</span>
                                                ) : (
                                                    <span>{`${issue.user?.first_name} ${issue.user?.middle_name ? issue.user?.middle_name + ' ' : ''}${issue.user?.last_name}`} ({issue.reporter_type})</span>
                                                )}
                                            </p>
                                        </div>
                                        
                                        <div className="flex justify-between items-end">
                                            <p className="text-xs text-gray-400">{formatDate(issue.created_at).split(',')[0]}</p>
                                            <button 
                                                className="bg-primary text-white text-xs py-1 px-3 rounded-md"
                                                onClick={() => openIssueModal(issue)}
                                            >
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Desktop view - table layout */}
                            <table className='min-w-full divide-y divide-gray-200 hidden md:table'>
                                <thead className='bg-gray-50'>
                                    <tr>
                                        <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>ID</th>
                                        <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Issue Type</th>
                                        <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Reported By</th>
                                        <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Date</th>
                                        <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Status</th>
                                        <th scope='col' className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className='bg-white divide-y divide-gray-200'>
                                    {filteredIssues.map(issue => (
                                        <tr key={issue.id} className='hover:bg-gray-50'>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                                                {issue.id}
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{issue.issue_type}</td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                                                {issue.is_anonymous ? (
                                                    <span>Anonymous {issue.reporter_type}</span>
                                                ) : (
                                                    <span>{`${issue.user?.first_name} ${issue.user?.middle_name ? issue.user?.middle_name + ' ' : ''}${issue.user?.last_name}`} ({issue.reporter_type})</span>
                                                )}
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{formatDate(issue.created_at)}</td>
                                            <td className='px-6 py-4 whitespace-nowrap'>
                                                <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(issue.status)}`}>
                                                    {issue.status}
                                                </span>
                                            </td>
                                            <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                                                <button 
                                                    className='text-primary hover:text-primary-dark'
                                                    onClick={() => openIssueModal(issue)}
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                
                {/* Issue details modal */}
                {selectedIssue && (
                    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 md:p-0'>
                        <div className='bg-white rounded-lg p-3 md:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto'>
                            <div className='flex justify-between items-center mb-3 md:mb-4'>
                                <h2 className='text-lg md:text-2xl font-bold'>Issue Details</h2>
                                <button 
                                    className='text-gray-500 hover:text-gray-700 text-lg md:text-2xl'
                                    onClick={() => setSelectedIssue(null)}
                                >
                                    ✕
                                </button>
                            </div>
                            
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4 mb-3 md:mb-6'>
                                <div>
                                    <p className='text-xs md:text-sm text-gray-500'>Issue ID</p>
                                    <p className='font-medium text-xs md:text-base'>{selectedIssue.id}</p>
                                </div>
                                <div>
                                    <p className='text-xs md:text-sm text-gray-500'>Date Reported</p>
                                    <p className='font-medium text-xs md:text-base'>{formatDate(selectedIssue.created_at)}</p>
                                </div>
                                <div>
                                    <p className='text-xs md:text-sm text-gray-500'>Issue Type</p>
                                    <p className='font-medium text-xs md:text-base'>{selectedIssue.issue_type}</p>
                                </div>
                                <div>
                                    <p className='text-xs md:text-sm text-gray-500'>Reported By</p>
                                    <p className='font-medium text-xs md:text-base'>
                                        {selectedIssue.is_anonymous ? (
                                            <span>Anonymous {selectedIssue.reporter_type}</span>
                                        ) : (
                                            <span>{`${selectedIssue.user?.first_name} ${selectedIssue.user?.middle_name ? selectedIssue.user?.middle_name + ' ' : ''}${selectedIssue.user?.last_name}`} ({selectedIssue.reporter_type})</span>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className='text-xs md:text-sm text-gray-500'>Current Status</p>
                                    <p className={`font-medium text-xs md:text-base ${
                                        selectedIssue.status === 'pending' ? 'text-yellow-500' :
                                        selectedIssue.status === 'in-progress' ? 'text-blue-500' :
                                        'text-green-500'
                                    }`}>
                                        {selectedIssue.status}
                                    </p>
                                </div>
                                {selectedIssue.resolved_at && (
                                    <div>
                                        <p className='text-xs md:text-sm text-gray-500'>Resolved Date</p>
                                        <p className='font-medium text-xs md:text-base'>{formatDate(selectedIssue.resolved_at)}</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className='mb-3 md:mb-6'>
                                <p className='text-xs md:text-sm text-gray-500 mb-1'>Issue Description</p>
                                <div className='p-2 md:p-3 bg-gray-50 rounded-lg whitespace-pre-wrap text-xs md:text-sm'>
                                    {selectedIssue.description}
                                </div>
                            </div>
                            
                            <div className='border-t pt-3 md:pt-4'>
                                <h3 className='font-semibold mb-2 text-sm md:text-base'>Update Issue</h3>
                                
                                <div className='mb-3 md:mb-4'>
                                    <label className='block text-xs md:text-sm text-gray-700 mb-1'>Status</label>
                                    <select 
                                        className='w-full border rounded p-1.5 md:p-2 text-xs md:text-sm'
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="resolved">Resolved</option>
                                    </select>
                                </div>
                                
                                <div className='flex justify-end'>
                                    <button
                                        className='px-2 md:px-4 py-1 md:py-2 bg-gray-200 text-gray-700 rounded mr-2 hover:bg-gray-300 text-xs md:text-sm'
                                        onClick={() => setSelectedIssue(null)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className='px-2 md:px-4 py-1 md:py-2 bg-primary text-white rounded hover:bg-blue-700 text-xs md:text-sm'
                                        onClick={handleUpdateIssue}
                                    >
                                        Update Issue
                                    </button>
                                </div>
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
            </div>
          </div>
        </div>
        </>
      )
}