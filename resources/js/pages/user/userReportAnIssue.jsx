import React, { useState } from 'react';
import Header from '../../components/header';
import UserSidebar from '../../components/userSidebar';

const userReportAnIssue = ({ auth }) => {
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [issueDescription, setIssueDescription] = useState('');

  // Check if user has made any input
  const hasUserInput = selectedIssue || issueDescription.trim().length > 0;

  const handleIssueSelect = (issueId) => {
    setSelectedIssue(selectedIssue === issueId ? null : issueId);
  };

  const handleDescriptionChange = (e) => {
    setIssueDescription(e.target.value);
  };

  const handleCancel = () => {
    setSelectedIssue(null);
    setIssueDescription('');
  };

  const handleSubmit = () => {
    // Handle form submission here
    console.log('Selected Issue:', selectedIssue);
    console.log('Description:', issueDescription);
    // You can add your submission logic here
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
    <div className='w-full min-h-screen bg-backgroundColor'>
      <Header auth={auth} />
      <div className='flex'>
        <UserSidebar />
        <div className='flex-1 p-6'>
          <div className='font-regular'>
            {/* Breadcrumb */}
            <div className='bg-white p-3 text-[#6B6A6A] rounded-lg pl-5 cursor-pointer mb-4'>
              Home {'>'} Report an Issue
            </div>
            {/* Title */}
            <div className='flex items-center justify-between mt-4 mb-6 pl-5 py-7 bg-primary text-white p-4 rounded-lg'>
              <h1 className='text-2xl font-semibold'>Report an Issue</h1>
            </div>
            {/* Card */}
            <div className='bg-white p-6 rounded-lg shadow w-full h-[650px]'>
              {/* Reason for reporting */}
              <div className='mb-6'>
                <p className='font-semibold mb-2 mt-4'>Reason for reporting this issue?</p>
                <div className='grid grid-cols-5 gap-4 mb-4 mt-12'>
                  {issueTypes.map((issueType, idx) => (
                    <button
                      key={idx}
                      className={`py-3 px-2 rounded text-center transition-colors duration-150 text-sm ${
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
              <div className='mb-6'>
                <p className='font-semibold mb-1 mt-16'>Can you provide clarity for the issue?</p>
                <p className='text-sm text-gray-500 mb-2'>
                  Provide a detailed description of the issue including the steps to reproduce it, expected behavior, and actual behavior. Include any relevant information or observations.
                </p>
                <textarea
                  className='w-full border rounded p-3 min-h-[190px] resize-none focus:outline-primary'
                  placeholder='Describe the issue here...'
                  value={issueDescription}
                  onChange={handleDescriptionChange}
                />
              </div>
              {/* Action buttons - only show if user has made input */}
              {hasUserInput && (
                <div className='flex justify-end gap-4'>
                  <button 
                    className='text-[#6B6A6A] px-4 py-2 rounded hover:bg-gray-100 transition-colors duration-150'
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button 
                    className='bg-primary text-white px-6 py-2 rounded hover:bg-[#3d4422] transition-colors duration-150'
                    onClick={handleSubmit}
                  >
                    Submit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default userReportAnIssue;