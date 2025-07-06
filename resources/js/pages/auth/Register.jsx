import React, { useRef, useState } from 'react';
import { Link, useForm } from '@inertiajs/react';

export default function Register() {
    const containerRef = useRef(null);
    const [isScrolling, setIsScrolling] = useState(false);
    const [fileName, setFileName] = useState('Choose file');

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        student_number: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        year_course_section: '',
        password: '',
        password_confirmation: '',
        phone_number: '',
        cor_file: null,
    });

    const handleScroll = () => {
        if (!isScrolling) {
            setIsScrolling(true);
            
            setTimeout(() => {
                setIsScrolling(false);
            }, 1500);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileName(file.name);
            setData('cor_file', file);
        } else {
            setFileName('Choose file');
            setData('cor_file', null);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/register');
    };

    return (
        <div className='registration-page relative mx-auto flex flex-col items-center justify-center h-screen font-poppins'>
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

            <div className='mx-auto flex flex-col items-center justify-center h-full z-10 relative'>
                <div className="w-[46rem] relative">
                    <div 
                        ref={containerRef}
                        onScroll={handleScroll}
                        className={`w-full bg-black bg-opacity-80 text-textColor p-8 rounded-2xl shadow-lg max-h-[80vh] overflow-y-auto overflow-x-hidden ${isScrolling ? 'scrollbar-visible' : 'scrollbar-hidden'}`}
                        style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',  
                        }}
                    >
                        <img src='/images/ROTClogo.png' alt='ROTC Logo' className='w-24 h-24 mx-auto mb-4' />
                        <h1 className='text-lg font-semibold mb-6 text-center'>Registration</h1>
                        
                        <form onSubmit={handleSubmit} className='space-y-4 font-regular'>
                            <div>
                                <div className="mb-4">
                                    <label className='block text-sm mb-2 text-textColor font-regular' htmlFor='email'>Your email</label>
                                    <input
                                        type='email'
                                        id='email'
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        className='w-full p-2 rounded-lg bg-white text-black'
                                        required
                                    />
                                    {errors.email && <div className="text-red-500 text-sm mt-1">{errors.email}</div>}
                                </div>

                                <div className="mb-4">
                                    <label className='block text-sm mb-2 text-textColor font-regular' htmlFor='student_number'>Student Number</label>
                                    <input
                                        type='text'
                                        id='student_number'
                                        value={data.student_number}
                                        onChange={e => setData('student_number', e.target.value)}
                                        className='w-full p-2 rounded-lg bg-white text-black'
                                        required
                                    />
                                    {errors.student_number && <div className="text-red-500 text-sm mt-1">{errors.student_number}</div>}
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label className='block text-sm mb-2 text-textColor font-regular' htmlFor='first_name'>First Name</label>
                                        <input
                                            type='text'
                                            id='first_name'
                                            value={data.first_name}
                                            onChange={e => setData('first_name', e.target.value)}
                                            className='w-full p-2 rounded-lg bg-white text-black'
                                            required
                                        />
                                        {errors.first_name && <div className="text-red-500 text-sm mt-1">{errors.first_name}</div>}
                                    </div>
                                    <div>
                                        <label className='block text-sm mb-2 text-textColor font-regular' htmlFor='middle_name'>Middle Name</label>
                                        <input
                                            type='text'
                                            id='middle_name'
                                            value={data.middle_name}
                                            onChange={e => setData('middle_name', e.target.value)}
                                            className='w-full p-2 rounded-lg bg-white text-black'
                                            required
                                        />
                                        {errors.middle_name && <div className="text-red-500 text-sm mt-1">{errors.middle_name}</div>}
                                    </div>
                                    <div>
                                        <label className='block text-sm mb-2 text-textColor font-regular' htmlFor='last_name'>Last Name</label>
                                        <input
                                            type='text'
                                            id='last_name'
                                            value={data.last_name}
                                            onChange={e => setData('last_name', e.target.value)}
                                            className='w-full p-2 rounded-lg bg-white text-black'
                                            required
                                        />
                                        {errors.last_name && <div className="text-red-500 text-sm mt-1">{errors.last_name}</div>}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className='block text-sm mb-2 text-textColor font-regular' htmlFor='year_course_section'>Year Course & Section</label>
                                    <input
                                        type='text'
                                        id='year_course_section'
                                        value={data.year_course_section}
                                        onChange={e => setData('year_course_section', e.target.value)}
                                        className='w-full p-2 rounded-lg bg-white text-black'
                                        required
                                    />
                                    {errors.year_course_section && <div className="text-red-500 text-sm mt-1">{errors.year_course_section}</div>}
                                </div>

                                <div className="mb-4">
                                    <label className='block text-sm mb-2 text-textColor font-regular' htmlFor='password'>Enter password</label>
                                    <input
                                        type='password'
                                        id='password'
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        className='w-full p-2 rounded-lg bg-white text-black'
                                        required
                                    />
                                    {errors.password && <div className="text-red-500 text-sm mt-1">{errors.password}</div>}
                                </div>

                                <div className="mb-4">
                                    <label className='block text-sm mb-2 text-textColor font-regular' htmlFor='password_confirmation'>Confirm password</label>
                                    <input
                                        type='password'
                                        id='password_confirmation'
                                        value={data.password_confirmation}
                                        onChange={e => setData('password_confirmation', e.target.value)}
                                        className='w-full p-2 rounded-lg bg-white text-black'
                                        required
                                    />
                                    {errors.password_confirmation && <div className="text-red-500 text-sm mt-1">{errors.password_confirmation}</div>}
                                </div>

                                <div className="mb-4">
                                    <label className='block text-sm mb-2 text-textColor font-regular' htmlFor='phone_number'>Phone Number</label>
                                    <input
                                        type='text'
                                        id='phone_number'
                                        value={data.phone_number}
                                        onChange={e => setData('phone_number', e.target.value)}
                                        className='w-full p-2 rounded-lg bg-white text-black'
                                        required
                                    />
                                    {errors.phone_number && <div className="text-red-500 text-sm mt-1">{errors.phone_number}</div>}
                                </div>
                                
                                <div className="mb-4">
                                    <label className='block text-sm mb-2 text-textColor font-regular' htmlFor='cor_file'>Upload Certificate of Registration</label>
                                    <div className="flex w-full">
                                        <input
                                            type='file'
                                            id='cor_file'
                                            className='hidden'
                                            onChange={handleFileChange}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            required
                                        />
                                        <label 
                                            htmlFor='cor_file' 
                                            className='w-full bg-primary text-textColor p-2 rounded-full hover:bg-opacity-80 transition duration-300 mt-2 cursor-pointer flex items-center justify-center'
                                        >
                                            <span className="truncate">{fileName}</span>
                                        </label>
                                    </div>
                                    {errors.cor_file && <div className="text-red-500 text-sm mt-1">{errors.cor_file}</div>}
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={processing}
                                className='w-full bg-primary text-textColor p-2 rounded-full hover:bg-opacity-80 transition duration-300 mt-2 disabled:opacity-50'
                            >
                                {processing ? 'Registering...' : 'Register'}
                            </button>
                            
                            <Link href='/' className='block text-center text-sm mt-4 text-textColor hover:underline'>
                                Already have an account? Login
                            </Link>
                        </form>
                        
                    </div>
                </div>           
            </div>
        </div>
    )
}