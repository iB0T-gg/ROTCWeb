import React, { useState } from 'react';
import Header from '../../components/header';
import FacultySidebar from '../../components/facultySidebar';
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
            className={`px-4 py-2 ${buttonColor} text-white rounded hover:opacity-90 transition-colors duration-150`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

const FacultyReportAnIssue = ({ auth }) => {
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueDescription, setIssueDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Alert dialog state
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
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
        type: 'error',
        title: 'Validation Error',
        message: 'Please select an issue type or provide a description.'
      });
      return;
    }
    
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      // Submit the issue to the backend
      const response = await axios.post('/api/issues', {
        issue_type: selectedIssue,
        description: issueDescription.trim(),
        is_anonymous: isAnonymous
      });
      
      setAlertDialog({
        isOpen: true,
        type: 'success',
        title: 'Success',
        message: 'Your issue has been submitted successfully! The admin will review it soon.'
      });
      
      // Reset the form
      setSelectedIssue(null);
      setIssueDescription('');
      setSubmitSuccess(false);
      
    } catch (error) {
      console.error('Error submitting issue:', error);
      setAlertDialog({
        isOpen: true,
        type: 'error',
        title: 'Submission Failed',
        message: error.response?.data?.message || 'An error occurred while submitting your issue. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Define descriptive issue examples for faculty
  const issueTypes = [
    'Cannot log in to my account',
    'Student grades not saving',
    'Attendance records missing',
    'System showing errors',
    'Profile information incorrect',
    'Missing student data',
    'Upload not working',
    'System is very slow',
    'Website looks broken',
    'Something else not listed'
  ];

  return (
    <>
      <Head title="ROTC Portal - Report Issue" />
      <div className='w-full min-h-screen bg-backgroundColor'>
      
      <Header auth={auth} />
      <div className='flex flex-col md:flex-row'>
        <FacultySidebar />
        <div className='flex-1 p-3 md:p-6'>
          <div className='font-regular animate-fade-in-up'>
            {/* Breadcrumb */}
            <div className='bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 mb-3 md:mb-4 text-sm md:text-base animate-fade-in-up'>
              <Link href="/faculty/facultyHome" className="hover:underline font-semibold">
                Dashboard
              </Link>
              <span className="mx-2 font-semibold">{">"}</span>
              <span className="cursor-default font-bold">Report an Issue</span>
            </div>
            
            {/* Title */}
            <div className='flex items-center justify-between mt-3 md:mt-4 mb-3 md:mb-6 pl-3 md:pl-5 py-4 md:py-7 bg-primary text-white p-3 md:p-4 rounded-lg animate-fade-in-down'>
              <h1 className='text-xl md:text-2xl font-semibold'>Report an Issue</h1>
            </div>
            
            {/* Card */}
            <form onSubmit={handleSubmit} className='bg-white p-3 md:p-6 rounded-lg shadow w-full h-auto md:h-[650px] animate-scale-in-up'>
              {/* Reason for reporting */}
              <div className='mb-4 md:mb-6'>
                <p className='font-semibold mb-2 mt-2 md:mt-4 text-sm md:text-base'>Reason for reporting this issue?</p>
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4 mb-2 md:mb-4 mt-3 md:mt-12'>
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
                    >
                      {issueType}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Clarity for the issue */}
              <div className='mb-4 md:mb-6'>
                <p className='font-semibold mb-1 mt-4 md:mt-16 text-sm md:text-base'>Can you provide clarity for the issue?</p>
                <p className='text-xs md:text-sm text-gray-500 mb-2'>
                  Provide a detailed description of the issue including the steps to reproduce it, expected behavior, and actual behavior. Include any relevant information such as student details, timestamps, or screenshots.
                </p>
                <textarea
                  className='w-full border rounded p-2 md:p-3 min-h-[150px] md:min-h-[190px] resize-none focus:outline-primary text-sm md:text-base'
                  placeholder='Describe the issue here...'
                  value={issueDescription}
                  onChange={handleDescriptionChange}
                  disabled={submitting}
                />
              </div>
              
              {/* Anonymous reporting option */}
              <div className="flex items-center mb-3 md:mb-4">
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
                    className="bg-gray-400 text-white px-3 md:px-4 py-1.5 md:py-2 rounded mr-2 text-xs md:text-sm"
                    onClick={handleCancel}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-primary text-white px-3 md:px-4 py-1.5 md:py-2 rounded hover:bg-primary/90 text-xs md:text-sm"
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
  );
};

export default FacultyReportAnIssue;
