import { Link, useForm, router, Head } from '@inertiajs/react';
import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';


export default function Login({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
    });

    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/login', {
            onSuccess: () => {
                // The server will handle the redirection
                // No need for client-side redirect checks
            },
            onError: (errors) => {
                // Handle errors if needed
                console.log(errors);
            }
        });
    };

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
                <div className='w-full max-w-[30rem] bg-black bg-opacity-80 text-textColor p-4 sm:p-8 rounded-2xl shadow-lg'>
                    <img src='/images/ROTCLogo.png' alt='ROTC Logo' className='w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4' />
                    <h1 className='text-base sm:text-lg font-semibold mb-4 sm:mb-6 text-center'>Login to your Account</h1>
                    
                    {status && (
                        <div className="mb-4 font-medium text-sm text-green-600 bg-green-100 p-2 rounded">
                            {status}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className='space-y-3 sm:space-y-4 font-regular'>
                        <div>
                            <label className='block text-xs sm:text-sm mb-1 sm:mb-2 text-textColor font-regular' htmlFor='email'>Your email</label>
                            <input
                                type='email'
                                id='email'
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                                className='w-full p-2 rounded-lg bg-white text-black mb-2 text-xs sm:text-sm pl-3'
                                placeholder='Enter your email address'
                                required
                            />
                            {errors.email && <div className="text-red-500 text-xs sm:text-sm mb-2">{errors.email}</div>}
                            
                            <label className='block text-xs sm:text-sm mb-1 sm:mb-2 text-textColor font-regular' htmlFor='password'>Your password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id='password'
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    className='w-full p-2 pr-10 rounded-lg bg-white text-black mb-2 text-xs sm:text-sm pl-3'
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
                            {errors.password && <div className="text-red-500 text-xs sm:text-sm mb-2">{errors.password}</div>}
                        </div>
                        
                        <button 
                            type="submit"
                            disabled={processing}
                            className='w-full bg-primary text-textColor p-2 rounded-full hover:bg-opacity-80 transition duration-300 mt-3 sm:mt-4 disabled:opacity-50 text-sm sm:text-base'
                        >
                            {processing ? 'Logging in...' : 'Login'}
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
