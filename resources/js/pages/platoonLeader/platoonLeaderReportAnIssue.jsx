import React, { useState } from 'react';
import Header from '../../components/header';
import PlatoonLeaderSidebar from '../../components/platoonLeaderSidebar';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';

const AlertDialog = ({ isOpen, type, title, message, onClose }) => {
  if (!isOpen) return null;

  const buttonColor = type === 'success' ? 'bg-primary/90 hover:bg-primary' : 'bg-red-600 hover:bg-red-700';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
        <div>
          <h3 className="text-lg font-semibold text-black mb-2">{title}</h3>
          <p className="text-black whitespace-pre-line">{message}</p>
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

const ISSUE_TYPES = [
  'Attendance Discrepancy',
  'Cadet Information Concern',
  'Technical Issue',
  'Suggestion',
  'Other'
];

export default function PlatoonLeaderReportAnIssue({ auth }) {
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const resetForm = () => {
    setIssueType('');
    setDescription('');
    setIsAnonymous(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!issueType && !description.trim()) {
      setAlertDialog({
        isOpen: true,
        type: 'error',
        title: 'Validation Error',
        message: 'Please select an issue type or provide a description.'
      });
      return;
    }

    setSubmitting(true);

    try {
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

      await axios.post('/api/issues', {
        issue_type: issueType || 'Custom',
        description,
        is_anonymous: isAnonymous,
        origin: 'platoon_leader'
      }, {
        headers: {
          'X-CSRF-TOKEN': token,
          'Accept': 'application/json'
        }
      });

      resetForm();
      setAlertDialog({
        isOpen: true,
        type: 'success',
        title: 'Issue Submitted',
        message: 'Your report has been submitted. Our team will review it shortly.'
      });
    } catch (error) {
      console.error('Issue submission failed:', error);
      const message = error.response?.data?.message || 'Unable to submit the issue. Please try again later.';
      setAlertDialog({
        isOpen: true,
        type: 'error',
        title: 'Submission Failed',
        message
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head title="ROTC Portal - Report an Issue" />
      <div className="w-full min-h-screen bg-backgroundColor">
        <Header auth={auth} />
        <div className="flex flex-col md:flex-row">
          <PlatoonLeaderSidebar />
          <div className="flex-1 p-3 md:p-6">
            <div className="font-regular animate-fade-in-up">
              <div className="bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 text-sm md:text-base animate-fade-in-up">
                <Link href="/platoon-leader/attendance" className="hover:text-primary hover:underline cursor-pointer font-semibold">Attendance</Link>
                {' > '}
                <span className="cursor-pointer font-bold">Report Issue</span>
              </div>

              <div className="bg-primary text-white p-3 md:p-4 rounded-lg flex items-center justify-between mt-3 md:mt-4 mb-3 md:mb-6 pl-3 md:pl-5 py-4 md:py-7 animate-fade-in-down">
                <h1 className="text-xl md:text-2xl font-semibold">Report an Issue</h1>
              </div>

              <div className="bg-white p-3 md:p-6 rounded-lg shadow animate-scale-in-up max-w-3xl">
                <p className="text-sm md:text-base text-gray-600 mb-4">
                  Share concerns or suggestions related to your platoon. Providing detailed information helps us resolve issues faster.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm md:text-base">Issue Type</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ISSUE_TYPES.map((type) => {
                        const isActive = issueType === type;
                        return (
                          <button
                            type="button"
                            key={type}
                            onClick={() => setIssueType(isActive ? '' : type)}
                            className={`px-3 py-2 rounded-md border text-sm md:text-base transition-colors ${
                              isActive ? 'border-primary bg-primary/10 text-primary' : 'border-gray-300 hover:border-primary'
                            }`}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm md:text-base">Description</label>
                    <textarea
                      rows="6"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm md:text-base"
                      placeholder="Provide additional context or details about the issue."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                    <p className="text-xs text-gray-500 mt-2">Include cadet names, dates, or relevant weeks if applicable.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="platoon-leader-anonymous"
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <label htmlFor="platoon-leader-anonymous" className="text-sm md:text-base text-gray-700">
                      Submit anonymously
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 rounded-md border border-gray-300 text-sm md:text-base text-gray-700 hover:bg-gray-100"
                    >
                      Clear
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`px-4 py-2 rounded-md text-sm md:text-base text-white transition-colors ${submitting ? 'bg-primary opacity-80 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}`}
                    >
                      {submitting ? 'Submitting...' : 'Submit Issue'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog
        isOpen={alertDialog.isOpen}
        type={alertDialog.type}
        title={alertDialog.title}
        message={alertDialog.message}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
      />
    </>
  );
}

