import { Link, useForm, Head } from '@inertiajs/react';
import { useState } from 'react';

/**
 * ForgotPassword Component
 *              </div>
            </div>
          </div>
        </>
    );
}his component provides a form for users to request a password reset link.
 * It sends the user's email to the server, which will send a reset link email
 * if the email is associated with a registered account.
 * 
 * @param {Object} props - Component props
 * @param {string} props.status - Status message from the server (e.g., success message)
 * @returns {JSX.Element} The forgot password form
 */
export default function ForgotPassword({ status }) {
    // Initialize form state using Inertia's useForm hook
    const { data, setData, post, processing, errors } = useForm({
        email: '',  // User's email address for password reset
    });

    // State for submission messages
    const [submitMessage, setSubmitMessage] = useState({ type: '', message: '' });

    /**
     * Handle form submission
     * Prevents default form behavior and posts data to the forgot-password endpoint
     * 
     * @param {Event} e - Form submit event
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Clear any previous messages
        setSubmitMessage({ type: '', message: '' });
        
        post('/forgot-password', {
            onSuccess: () => {
                setSubmitMessage({ 
                    type: 'success', 
                    message: 'Password reset link has been sent to your email address. Please check your inbox and spam folder.' 
                });
            },
            onError: (errors) => {
                // Handle general errors or specific email errors
                if (errors.email) {
                    setSubmitMessage({ 
                        type: 'error', 
                        message: errors.email 
                    });
                } else {
                    setSubmitMessage({ 
                        type: 'error', 
                        message: 'An error occurred while processing your request. Please try again.' 
                    });
                }
            }
        });
    };

    return (
    <>
        <Head title="ROTC Portal - Forgot Password" />
        <div className='forgotPassword-page relative mx-auto flex flex-col items-center justify-center min-h-screen font-poppins p-3 sm:p-4'>
          <div 
            className='absolute inset-0 z-0'
            style={{
              backgroundImage: `url('/images/background.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: 0.5, 
              backgroundColor: 'white',
            }}
          ></div>
    
          <div className='container mx-auto flex flex-col items-center justify-center h-full z-10 relative'>
            <div className='w-full max-w-[30rem] bg-black bg-opacity-80 text-textColor p-4 sm:p-8 rounded-xl sm:rounded-2xl shadow-lg animate-scale-in-up'>
                    <img src='/images/ROTCLogo.png' alt='ROTC Logo' className='w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 animate-fade-in-up animate-stagger-1' />
              <h1 className='text-base sm:text-lg font-semibold mb-3 sm:mb-6 text-center animate-fade-in-up animate-stagger-2'>Forgot Password</h1>
              
              {/* Display server status message */}
              {status && (
                <div className="mb-3 sm:mb-4 font-medium text-xs sm:text-sm text-green-600 bg-green-100 p-1.5 sm:p-2 rounded animate-fade-in-up animate-stagger-3">
                  {status}
                </div>
              )}

              {/* Display submission success/error messages */}
              {submitMessage.message && (
                <div className={`mb-3 sm:mb-4 font-medium text-xs sm:text-sm p-1.5 sm:p-2 rounded ${
                  submitMessage.type === 'success' 
                    ? 'text-green-600 bg-green-100' 
                    : 'text-red-600 bg-red-100'
                } animate-fade-in-up animate-stagger-4`}>
                  {submitMessage.message}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className='space-y-3 sm:space-y-4 font-regular animate-fade-in-up animate-stagger-4'>
                <div>
                  <label className='block text-xs sm:text-sm mb-1 sm:mb-2 text-textColor font-regular' htmlFor='email'>Enter your email address to reset your password</label>
                  <label className='block text-xs sm:text-sm mb-1 sm:mb-2 text-textColor font-regular' htmlFor='email'>Your email</label>
                  <input
                    type='email'
                    id='email'
                    value={data.email}
                    onChange={e => setData('email', e.target.value)}
                    className='w-full p-2 rounded-lg bg-white text-black mb-1 sm:mb-2 text-xs sm:text-sm pl-3 transition-all duration-300 focus:ring-2 focus:ring-primary focus:outline-none'
                    placeholder='Enter your email address'
                    required
                  />
                  {errors.email && <div className="text-red-500 text-xs sm:text-sm mb-1 sm:mb-2 animate-shake">{errors.email}</div>}
                </div>
                        
                <button 
                  type="submit"
                  disabled={processing}
                  className='w-full bg-primary text-textColor p-1.5 sm:p-2 rounded-full hover:bg-opacity-80 transition-all duration-300 mt-2 sm:mt-4 disabled:opacity-50 text-sm sm:text-base hover-scale'
                >
                  {processing ? 'Processing...' : 'Submit'}
                </button>
              </form>
                    
              <Link href='/' className='block text-center text-xs sm:text-sm mt-3 sm:mt-4 text-textColor hover:underline hover-scale transition-all'>
                Back to Login
              </Link>
            </div>
          </div>
        </div>
        </>
    );
}