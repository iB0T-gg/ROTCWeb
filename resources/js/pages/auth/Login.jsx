import { Link, useForm, router, Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
// No loading page on login success per requirement


export default function Login({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loginError, setLoginError] = useState('');
    // no success state needed when server redirects

    // Clear error when user starts typing
    const clearError = () => {
        if (loginError) {
            setLoginError('');
        }
    };

    // Prevent accessing login page when already authenticated
    useEffect(() => {
        // Prevent back navigation to this page after successful login
        const preventBack = () => {
            window.history.pushState(null, null, window.location.pathname);
        };
        
        window.addEventListener('popstate', preventBack);

        // Cleanup
        return () => {
            window.removeEventListener('popstate', preventBack);
        };
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        setLoginError(''); // Clear previous errors
        
        // Use Inertia's post method for proper error handling
        post('/login', {
            onSuccess: () => {
                // Server will redirect; do not show loading page
                setIsSubmitting(false);
            },
            onError: (errors) => {
                setIsSubmitting(false);
                
                // Handle specific error cases
                if (errors.email && errors.email.includes('credentials')) {
                    setLoginError('Invalid email or password. Please try again.');
                } else if (errors.email && errors.email.includes('archived')) {
                    setLoginError('Your account has been archived. Please contact the administrator.');
                } else if (errors.email && errors.email.includes('rejected')) {
                    setLoginError('Your account has been rejected. Please contact the administrator.');
                } else if (errors.email && errors.email.includes('pending')) {
                    setLoginError('Your account is pending approval. Please wait for administrator approval.');
                } else if (errors.email) {
                    setLoginError(errors.email);
                } else if (errors.password) {
                    setLoginError(errors.password);
                } else {
                    setLoginError('Login failed. Please try again.');
                }
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    // Always render the form; no loading page on success

    return (
        <>
            <Head title="ROTC Portal - Login" />
            <div className='login-page relative mx-auto flex flex-col items-center justify-center min-h-screen font-poppins p-4'>
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
                <div className='w-full max-w-[30rem] bg-black bg-opacity-80 text-textColor p-4 sm:p-8 rounded-2xl shadow-lg animate-scale-in-up'>
                    <img src='/images/ROTCLogo.png' alt='ROTC Logo' className='w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 animate-fade-in-up animate-stagger-1' />
                    <h1 className='text-base sm:text-lg font-semibold mb-4 sm:mb-6 text-center animate-fade-in-up animate-stagger-2'>Login to your Account</h1>
                    
                    
                    <form onSubmit={handleSubmit} className='space-y-3 sm:space-y-4 font-regular'>
                        <div>
                            <label className='block text-xs sm:text-sm mb-1 sm:mb-2 text-textColor font-regular' htmlFor='email'>Your email</label>
                            <input
                                type='email'
                                id='email'
                                value={data.email}
                                onChange={e => {
                                    setData('email', e.target.value);
                                    clearError();
                                }}
                                className='w-full p-2 rounded-lg bg-white text-black mb-2 text-xs sm:text-sm pl-3 transition-all duration-300 focus:ring-2 focus:ring-primary focus:outline-none'
                                placeholder='Enter your email address'
                                required
                            />
                            {errors.email && <div className="text-red-500 text-xs sm:text-sm mb-2 animate-shake">{errors.email}</div>}
                            
                            <label className='block text-xs sm:text-sm mb-1 sm:mb-2 text-textColor font-regular' htmlFor='password'>Your password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id='password'
                                    value={data.password}
                                    onChange={e => {
                                        setData('password', e.target.value);
                                        clearError();
                                    }}
                                    className='w-full p-2 pr-10 rounded-lg bg-white text-black mb-2 text-xs sm:text-sm pl-3 transition-all duration-300 focus:ring-2 focus:ring-primary focus:outline-none'
                                    placeholder='Enter your password'
                                    required
                                />
                                {data.password && data.password.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                                    >
                                        {showPassword ? <FaEye className="w-4 h-4" /> : <FaEyeSlash className="w-4 h-4" />}
                                    </button>
                                )}
                            </div>
                            {errors.password && <div className="text-red-500 text-xs sm:text-sm mb-2 animate-shake">{errors.password}</div>}
                        </div>
                        
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className='w-full bg-primary text-textColor p-2 rounded-full hover:bg-opacity-80 transition-all duration-300 mt-3 sm:mt-4 disabled:opacity-50 text-sm sm:text-base hover-scale'
                        >
                            {isSubmitting ? 'Verifying...' : 'Login'}
                        </button>

                        <Link href='/forgotPassword' className='block text-center text-xs sm:text-sm mt-3 sm:mt-4 text-textColor hover:underline'>
                            Forgot Password?
                        </Link>
                    </form>
                    
                    <div className='mt-4'>
                    </div>
                </div>
                <div className='w-full max-w-[26rem] mt-4 sm:mt-6 space-y-3'>
                    <Link href='/register' className='block w-full'>
                        <button className='w-full bg-primary text-white p-2 rounded-full hover:bg-opacity-80 transition duration-300 text-sm sm:text-base'>
                            Create an Account
                        </button>
                    </Link>
                </div>
            </div>
            </div>
        </>
    );
}