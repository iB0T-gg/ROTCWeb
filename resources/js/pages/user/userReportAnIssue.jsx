import React, { useState } from 'react';
import Header from '../../components/header';
import UserSidebar from '../../components/userSidebar';
import { Link, Head } from '@inertiajs/react';
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
            className={`px-4 py-2 rounded text-white transition-colors ${buttonColor}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

const userReportAnIssue = ({ auth }) => {
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueDescription, setIssueDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // AlertDialog state
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Check if user has made any input
  const hasUserInput = selectedIssue || issueDescription.trim().length > 0;

  const handleIssueSelect = (issueId) => {
    setSelectedIssue(selectedIssue === issueId ? null : issueId);
  };

  const handleDescriptionChange = (e) => {
    setIssueDescription(e.target.value);
  };

  const handleAnonymousChange = (e) => {
    setIsAnonymous(e.target.checked);
  };

  const handleCancel = () => {
    setSelectedIssue(null);
    setIssueDescription('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedIssue && !issueDescription.trim()) {
      setAlertDialog({
        isOpen: true,
        title: 'Missing Information',
        message: 'Please select an issue type or provide a description.',
        type: 'error'
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Submit the issue to the backend
      const response = await axios.post('/issues', {
        issue_type: selectedIssue,
        description: issueDescription.trim(),
        is_anonymous: isAnonymous
      });
      
      setAlertDialog({
        isOpen: true,
        title: 'Success',
        message: 'Your issue has been submitted successfully! The admin will review it soon.',
        type: 'success'
      });
      
      // Reset the form after a short delay
      setTimeout(() => {
        setSelectedIssue(null);
        setIssueDescription('');
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting issue:', error);
      setAlertDialog({
        isOpen: true,
        title: 'Submission Failed',
        message: error.response?.data?.message || 'An error occurred while submitting your issue. Please try again.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Define descriptive issue examples
  const issueTypes = [
    'Cannot log in to my account',
    'Registration form not working',
    'Profile picture not uploading',
    'Attendance not showing correctly',
    'Grades are missing or wrong',
    'Page keeps loading forever',
    'Data disappears after refresh',
    'System is very slow',
    'Website looks broken on phone',
    'Something else not listed'
  ];

  return (
    <>
      <Head title="ROTC Portal - Report an Issue" />
      <div className='w-full min-h-screen bg-backgroundColor'>
      <Header auth={auth} />
      <div className='flex flex-col md:flex-row'>
        <div className="block">
          <UserSidebar />
        </div>
        <div className='flex-1 p-3 md:p-6'>
          <div className='font-regular animate-fade-in-up'>
            {/* Breadcrumb */}
            <div className='bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 mb-4 text-sm md:text-base'>
              <Link href="/user/userHome" className="hover:underline cursor-pointer font-semibold">
                Dashboard
              </Link>
              <span className="mx-2 font-semibold">{">"}</span>
              <span className="cursor-default font-bold">Report an Issue</span>
            </div>
            
            {/* Title */}
            <div className='flex items-center justify-between mt-3 md:mt-4 mb-4 md:mb-6 pl-3 md:pl-5 py-4 md:py-7 bg-primary text-white p-3 md:p-4 rounded-lg animate-fade-in-down'>
              <h1 className='text-xl md:text-2xl font-semibold'>Report an Issue</h1>
            </div>
            
            {/* Card */}
            <form onSubmit={handleSubmit} className='bg-white p-3 md:p-6 rounded-lg shadow w-full h-auto md:h-[650px] overflow-y-auto animate-scale-in-up'>
              {/* Reason for reporting */}
              <div className='mb-4 md:mb-6'>
                <p className='font-semibold mb-2 mt-2 md:mt-4 text-sm md:text-base'>Reason for reporting this issue?</p>
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4 mb-4 mt-4 md:mt-12'>
                  {issueTypes.map((issueType, idx) => (
                    <button
                      type="button"
                      key={idx}
                      className={`py-2 md:py-3 px-2 rounded text-center transition-colors duration-150 text-xs md:text-sm ${
                        selectedIssue === issueType 
                          ? 'bg-primary text-white' 
                          : 'bg-[#F7F7FF] text-[#6B6A6A] hover:bg-primary hover:text-white'
                      }`}
                      onClick={() => handleIssueSelect(issueType)}
                      disabled={submitting}
                    >
                      {issueType}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Clarity for the issue */}
              <div className='mb-4 md:mb-6'>
                <p className='font-semibold mb-1 mt-6 md:mt-16 text-sm md:text-base'>Can you provide clarity for the issue?</p>
                <p className='text-xs md:text-sm text-gray-500 mb-2'>
                  Provide a detailed description of the issue including the steps to reproduce it, expected behavior, and actual behavior. Include any relevant information or observations.
                </p>
                <textarea
                  className='w-full border rounded p-2 md:p-3 min-h-[120px] md:min-h-[190px] resize-none focus:outline-primary'
                  placeholder='Describe the issue here...'
                  value={issueDescription}
                  onChange={handleDescriptionChange}
                  disabled={submitting}
                />
              </div>
              
              {/* Anonymous reporting option */}
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={handleAnonymousChange}
                  className="mr-2"
                  disabled={submitting}
                />
                <label htmlFor="anonymous" className="text-xs md:text-sm text-gray-700">
                  Submit this issue anonymously (your name and identity will be hidden from admins)
                </label>
              </div>
              
              {/* Action buttons - only show if user has made input */}
              {hasUserInput && (
                <div className="flex justify-end mt-4 md:mt-8">
                  <button
                    type="button"
                    className="bg-gray-400 text-white px-3 md:px-4 py-1.5 md:py-2 rounded mr-2 text-sm md:text-base"
                    onClick={handleCancel}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-primary text-white px-3 md:px-4 py-1.5 md:py-2 rounded hover:bg-primary/90 text-sm md:text-base"
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
    
    {/* AlertDialog */}
    <AlertDialog
      isOpen={alertDialog.isOpen}
      onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
      title={alertDialog.title}
      message={alertDialog.message}
      type={alertDialog.type}
    />
    </>
  );
};

export default userReportAnIssue;