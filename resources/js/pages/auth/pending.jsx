import React from 'react';
import { Link } from '@inertiajs/react';

export default function Pending() {
    return (
        <div className='pending-page relative mx-auto flex flex-col items-center justify-center h-screen font-poppins'>
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
                    <h1 className='text-lg font-semibold mb-6 text-center'>Account Activation Pending</h1>
                    <p className='text-sm text-center mb-4'>
                        Your account is currently pending. To gain access, please visit the DMST office to register your fingerprint.
                    </p>
                    <p className='text-sm text-center mb-4'>
                        For further assistance, please contact the administrator.<br></br>Email: admin123@gmail.com
                    </p>
                    <Link href='/' className='block text-center text-sm mt-4 text-textColor hover:underline'>
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}