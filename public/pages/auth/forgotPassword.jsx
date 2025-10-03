import { Link, useForm } from '@inertiajs/react';

/**
 * ForgotPassword Component
 * 
 * This component provides a form for users to request a password reset link.
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

    /**
     * Handle form submission
     * Prevents default form behavior and posts data to the forgot-password endpoint
     * 
     * @param {Event} e - Form submit event
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        post('/forgot-password');
    };

    return (
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
            <div className='w-full max-w-[30rem] bg-black bg-opacity-80 text-textColor p-4 sm:p-8 rounded-xl sm:rounded-2xl shadow-lg'>
                    <img src='/images/ROTCLogo.png' alt='ROTC Logo' className='w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4' />
              <h1 className='text-base sm:text-lg font-semibold mb-3 sm:mb-6 text-center'>Forgot Password</h1>
              
              {status && (
                <div className="mb-3 sm:mb-4 font-medium text-xs sm:text-sm text-green-600 bg-green-100 p-1.5 sm:p-2 rounded">
                  {status}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className='space-y-3 sm:space-y-4 font-regular'>
                <div>
                  <label className='block text-xs sm:text-sm mb-1 sm:mb-2 text-textColor font-regular' htmlFor='email'>Enter your email address to reset your password</label>
                  <label className='block text-xs sm:text-sm mb-1 sm:mb-2 text-textColor font-regular' htmlFor='email'>Your email</label>
                  <input
                    type='email'
                    id='email'
                    value={data.email}
                    onChange={e => setData('email', e.target.value)}
                    className='w-full p-2 rounded-lg bg-white text-black mb-1 sm:mb-2 text-xs sm:text-sm pl-3'
                    placeholder='Enter your email address'
                    required
                  />
                  {errors.email && <div className="text-red-500 text-xs sm:text-sm mb-1 sm:mb-2">{errors.email}</div>}
                </div>
                        
                <button 
                  type="submit"
                  disabled={processing}
                  className='w-full bg-primary text-textColor p-1.5 sm:p-2 rounded-full hover:bg-opacity-80 transition duration-300 mt-2 sm:mt-4 disabled:opacity-50 text-sm sm:text-base'
                >
                  {processing ? 'Processing...' : 'Submit'}
                </button>
              </form>
                    
              <Link href='/' className='block text-center text-xs sm:text-sm mt-3 sm:mt-4 text-textColor hover:underline'>
                Back to Login
              </Link>
            </div>
          </div>
        </div>
    );
}