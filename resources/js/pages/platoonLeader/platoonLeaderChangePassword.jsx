import React, { useState } from 'react';
import Header from '../../components/header';
import PlatoonLeaderSidebar from '../../components/platoonLeaderSidebar';
import { Head, Link } from '@inertiajs/react';

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

export default function PlatoonLeaderChangePassword({ auth }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      setAlertDialog({
        isOpen: true,
        type: 'error',
        title: 'Password Mismatch',
        message: 'New password and confirm password do not match.'
      });
      return;
    }

    if (newPassword.length < 8) {
      setAlertDialog({
        isOpen: true,
        type: 'error',
        title: 'Password Too Short',
        message: 'New password must be at least 8 characters long.'
      });
      return;
    }

    setSubmitting(true);

    try {
      const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

      const response = await fetch('/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token,
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Current password is incorrect.');
        }
        if (response.status === 422) {
          throw new Error('Password validation failed. Please review the requirements.');
        }
        throw new Error('Password change failed. Please try again.');
      }

      resetForm();
      setAlertDialog({
        isOpen: true,
        type: 'success',
        title: 'Password Updated',
        message: 'Your password has been updated successfully.'
      });
    } catch (error) {
      setAlertDialog({
        isOpen: true,
        type: 'error',
        title: 'Password Change Failed',
        message: error.message || 'An unexpected error occurred.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head title="ROTC Portal - Change Password" />
      <div className="w-full min-h-screen bg-backgroundColor">
        <Header auth={auth} />
        <div className="flex flex-col md:flex-row">
          <PlatoonLeaderSidebar />
          <div className="flex-1 p-3 md:p-6">
            <div className="font-regular animate-fade-in-up">
              <div className="bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 text-sm md:text-base animate-fade-in-up">
                <Link href="/platoon-leader/attendance" className="hover:text-primary hover:underline cursor-pointer font-semibold">Attendance</Link>
                {' > '}
                <span className="cursor-pointer font-bold">Change Password</span>
              </div>

              <div className="bg-primary text-white p-3 md:p-4 rounded-lg flex items-center justify-between mt-3 md:mt-4 mb-3 md:mb-6 pl-3 md:pl-5 py-4 md:py-7 animate-fade-in-down">
                <h1 className="text-xl md:text-2xl font-semibold">Change Password</h1>
              </div>

              <div className="bg-white p-3 md:p-6 rounded-lg shadow animate-scale-in-up max-w-2xl">
                <h2 className="text-base md:text-lg font-semibold text-gray-700 mb-4">Update Your Password</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm md:text-base">Current Password</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm md:text-base"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm md:text-base">New Password</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm md:text-base"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2 text-sm md:text-base">Confirm New Password</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm md:text-base"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex justify-start">
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`px-4 py-2 rounded-md text-sm md:text-base text-white transition-colors ${submitting ? 'bg-primary opacity-80 cursor-not-allowed' : 'bg-primary hover:bg-primary/90'}`}
                    >
                      {submitting ? 'Updating...' : 'Change Password'}
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

