import React from 'react';
import { Link, Head } from '@inertiajs/react';

/**
 * Pending Component
 * 
 * This component provides a page for users whose accounts are pending approval.
 * It informs users that they need to visit the DMST office for fingerprint registration
 * before their account can be activated, and provides contact information for assistance.
 * 
 * @returns {JSX.Element} The pending account page
 */
export default function Pending() {
    return (
        <>
            <Head title="ROTC Portal - Account Pending" />
            <div className='pending-page relative mx-auto flex flex-col items-center justify-center min-h-screen font-poppins p-3 sm:p-4'>
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
                    <h1 className='text-base sm:text-lg font-semibold mb-4 sm:mb-6 text-center'>Account Activation Pending</h1>
                    <p className='text-xs sm:text-sm text-center mb-3 sm:mb-4'>
                        Your account is currently pending. To gain access, please visit the DMST office to register your fingerprint.
                    </p>
                    <p className='text-xs sm:text-sm text-center mb-3 sm:mb-4'>
                        For further assistance, please contact the administrator.<br></br>Email: admin123@gmail.com
                    </p>
                    <Link href='/' className='block text-center text-xs sm:text-sm mt-3 sm:mt-4 text-textColor hover:underline'>
                        Back to Login
                    </Link>
                </div>
            </div>
            </div>
        </>
    );
}