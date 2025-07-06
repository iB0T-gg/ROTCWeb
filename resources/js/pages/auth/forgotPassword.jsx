import React from 'react';
import { Link, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/forgot-password');
    };

    return (
        <div className='forgotPassword-page relative mx-auto flex flex-col items-center justify-center h-screen font-poppins'>
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
                    <h1 className='text-lg font-semibold mb-6 text-center'>Forgot Password</h1>
                    
                    {status && (
                        <div className="mb-4 font-medium text-sm text-green-600 bg-green-100 p-2 rounded">
                            {status}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className='space-y-4 font-regular'>
                        <div>
                            <label className='block text-sm mb-2 text-textColor font-regular' htmlFor='email'>Enter your email address to reset your password</label>
                            <label className='block text-sm mb-2 text-textColor font-regular' htmlFor='email'>Your email</label>
                            <input
                                type='email'
                                id='email'
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                                className='w-full p-2 rounded-lg bg-white text-black mb-2'
                                required
                            />
                            {errors.email && <div className="text-red-500 text-sm mb-2">{errors.email}</div>}
                        </div>
                        
                        <button 
                            type="submit"
                            disabled={processing}
                            className='w-full bg-primary text-textColor p-2 rounded-full hover:bg-opacity-80 transition duration-300 mt-4 disabled:opacity-50'
                        >
                            {processing ? 'Processing...' : 'Submit'}
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