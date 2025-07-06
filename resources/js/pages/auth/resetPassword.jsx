import React from 'react';
import { Link, useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors } = useForm({
        token: token,
        email: email || '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/reset-password');
    };

    return (
        <div className='resetPassword-page relative mx-auto flex flex-col items-center justify-center h-screen font-poppins'>
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
            
            <div className='container mx-auto flex flex-col items-center justify-center h-full z-10 relative '>
                <div className='w-[30rem] bg-black bg-opacity-80 text-textColor p-8 rounded-2xl shadow-lg'>
                    <img src='/images/ROTCLogo.png' alt='ROTC Logo' className='w-24 h-24 mx-auto mb-4' />
                    <h1 className='text-lg font-semibold mb-6 text-center'>Reset Password</h1>
                    <form onSubmit={handleSubmit} className='space-y-4 font-regular'>
                        <div>
                            <label className='block text-sm mb-2 text-textColor font-regular' htmlFor='password'>New Password</label>
                            <input
                                type='password'
                                id='password'
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                className='w-full p-2 rounded-lg bg-white text-black mb-2'
                                required
                            />
                            {errors.password && <div className="text-red-500 text-sm mb-2">{errors.password}</div>}
                        </div>
                        <div>
                            <label className='block text-sm mb-2 text-textColor font-regular' htmlFor='password_confirmation'>Confirm Password</label>
                            <input
                                type='password'
                                id='password_confirmation'
                                value={data.password_confirmation}
                                onChange={e => setData('password_confirmation', e.target.value)}
                                className='w-full p-2 rounded-lg bg-white text-black mb-2'
                                required
                            />
                            {errors.password_confirmation && <div className="text-red-500 text-sm mb-2">{errors.password_confirmation}</div>}
                        </div>
                        <button 
                            type="submit"
                            disabled={processing}
                            className='w-full bg-primary text-textColor p-2 rounded-full hover:bg-opacity-80 transition duration-300 mt-4 disabled:opacity-50'
                        >
                            {processing ? 'Processing...' : 'Reset Password'}
                        </button>
                    </form>
                    <Link href='/' className='block text-center text-sm mt-4 text-textColor hover:underline'>
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}