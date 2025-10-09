import React, { useRef, useState } from 'react';
import { Link, useForm, Head } from '@inertiajs/react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Register() {
    const containerRef = useRef(null);
    const [isScrolling, setIsScrolling] = useState(false);
    const [fileName, setFileName] = useState('Choose file');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);
    const [isPasswordConfirmationFocused, setIsPasswordConfirmationFocused] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        student_number: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        gender: '',
        campus: '',
        year: '',
        course: '',
        section: '',
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
        <>
            <Head title="ROTC Portal - Register" />
            <div className='registration-page relative mx-auto flex flex-col items-center justify-center min-h-screen font-poppins p-3 sm:p-4'>
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

            <div className='mx-auto flex flex-col items-center justify-center h-full z-10 relative w-full'>
                <div className="w-full max-w-[46rem] relative">
                    <div 
                        ref={containerRef}
                        onScroll={handleScroll}
                        className={`w-full bg-black bg-opacity-80 text-textColor p-4 sm:p-8 rounded-xl sm:rounded-2xl shadow-lg max-h-[85vh] overflow-y-auto overflow-x-hidden ${isScrolling ? 'scrollbar-visible' : 'scrollbar-hidden'}`}
                        style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',  
                        }}
                    >
                        <img src='/images/ROTCLogo.png' alt='ROTC Logo' className='w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4' />
                        <h1 className='text-base sm:text-lg font-semibold mb-4 sm:mb-6 text-center'>Registration</h1>
                        
                        <form onSubmit={handleSubmit} className='space-y-3 sm:space-y-4 font-regular'>
                            <div>
                                <div className="mb-3 sm:mb-4">
                                    <label className='block text-xs sm:text-sm mb-1 sm:mb-2 text-textColor font-regular' htmlFor='email'>Your email</label>
                                    <input
                                        type='email'
                                        id='email'
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        className='w-full p-2 sm:p-3 rounded-lg bg-white text-gray-700 text-xs sm:text-sm pl-3'
                                        placeholder='Enter your email address'
                                        required
                                    />
                                    {errors.email && <div className="text-red-500 text-xs sm:text-sm mt-1">{errors.email}</div>}
                                </div>

                                <div className="mb-3 sm:mb-4">
                                    <label className='block text-xs sm:text-sm mb-1 sm:mb-2 text-textColor font-regular' htmlFor='student_number'>Student Number</label>
                                    <input
                                        type='text'
                                        id='student_number'
                                        value={data.student_number}
                                        onChange={e => setData('student_number', e.target.value)}
                                        className='w-full p-2 sm:p-3 rounded-lg bg-white text-gray-700 text-xs sm:text-sm pl-3'
                                        placeholder='Enter your student number'
                                        required
                                    />
                                    {errors.student_number && <div className="text-red-500 text-xs sm:text-sm mt-1">{errors.student_number}</div>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
                                    <div className="mb-2 sm:mb-0">
                                        <label className='block text-xs sm:text-sm mb-1 sm:mb-2 text-textColor font-regular' htmlFor='first_name'>First Name</label>
                                        <input
                                            type='text'
                                            id='first_name'
                                            value={data.first_name}
                                            onChange={e => setData('first_name', e.target.value)}
                                            className='w-full p-2 sm:p-3 rounded-lg bg-white text-gray-700 text-xs sm:text-sm pl-3'
                                            placeholder='Enter your first name'
                                            required
                                        />
                                        {errors.first_name && <div className="text-red-500 text-xs sm:text-sm mt-1">{errors.first_name}</div>}
                                    </div>
                                    <div className="mb-2 sm:mb-0">
                                        <label className='block text-xs sm:text-sm mb-1 sm:mb-2 text-textColor font-regular' htmlFor='middle_name'>Middle Name</label>
                                        <input
                                            type='text'
                                            id='middle_name'
                                            value={data.middle_name}
                                            onChange={e => setData('middle_name', e.target.value)}
                                            className='w-full p-2 sm:p-3 rounded-lg bg-white text-gray-700 text-xs sm:text-sm pl-3'
                                            placeholder='Enter your middle name'
                                            required
                                        />
                                        {errors.middle_name && <div className="text-red-500 text-xs sm:text-sm mt-1">{errors.middle_name}</div>}
                                    </div>
                                    <div>
                                        <label className='block text-xs sm:text-sm mb-1 sm:mb-2 text-textColor font-regular' htmlFor='last_name'>Last Name</label>
                                        <input
                                            type='text'
                                            id='last_name'
                                            value={data.last_name}
                                            onChange={e => setData('last_name', e.target.value)}
                                            className='w-full p-2 sm:p-3 rounded-lg bg-white text-gray-700 text-xs sm:text-sm pl-3'
                                            placeholder='Enter your last name'
                                            required
                                        />
                                        {errors.last_name && <div className="text-red-500 text-xs sm:text-sm mt-1">{errors.last_name}</div>}
                                    </div>
                                </div>

                                <div className="mb-3 sm:mb-4">
                                    <label className='block text-xs sm:text-sm mb-1 sm:mb-2 text-textColor font-regular' htmlFor='campus'>Campus</label>
                                    <select
                                        id='campus'
                                        value={data.campus}
                                        onChange={e => setData('campus', e.target.value)}
                                        className='w-full p-2 sm:p-3 rounded-lg bg-white text-gray-700 text-xs sm:text-sm'
                                        required
                                    >
                                        <option value="" className="text-gray-400">Select Campus</option>
                                        <option value="Hagonoy Campus" className="text-gray-700">Hagonoy Campus</option>
                                        <option value="Meneses Campus" className="text-gray-700">Meneses Campus</option>
                                        <option value="Sarmiento Campus" className="text-gray-700">Sarmiento Campus</option>
                                        <option value="Bustos Campus" className="text-gray-700">Bustos Campus</option>
                                        <option value="San Rafael Campus" className="text-gray-700">San Rafael Campus</option>
                                        <option value="Main Campus" className="text-gray-700">Main Campus</option>
                                    </select>
                                    {errors.campus && <div className="text-red-500 text-xs sm:text-sm mt-1">{errors.campus}</div>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
                                    <div className="mb-2 sm:mb-0">
                                        <label className='block text-xs sm:text-sm mb-1 sm:mb-2 text-textColor font-regular' htmlFor='course'>Course</label>
                                        <select
                                            id='course'
                                            value={data.course}
                                            onChange={e => setData('course', e.target.value)}
                                            className='w-full p-2 sm:p-3 rounded-lg bg-white text-gray-700 text-xs sm:text-sm'
                                            required
                                        >
                                            <option value="" className="text-gray-400">Select Course</option>
                                            <option value="BSIT" className="text-gray-700">BSIT</option>
                                            <option value="BSIS" className="text-gray-700">BSIS</option>
                                            <option value="BSCS" className="text-gray-700">BSCS</option>
                                            <option value="BSA" className="text-gray-700">BSA</option>
                                            <option value="BSBA" className="text-gray-700">BSBA</option>
                                            <option value="BSED" className="text-gray-700">BSED</option>
                                            <option value="BEED" className="text-gray-700">BEED</option>
                                            <option value="BSN" className="text-gray-700">BSN</option>
                                            <option value="BSHM" className="text-gray-700">BSHM</option>
                                            <option value="BSTM" className="text-gray-700">BSTM</option>
                                        </select>
                                        {errors.course && <div className="text-red-500 text-xs sm:text-sm mt-1">{errors.course}</div>}
                                    </div>
                                    <div className="mb-2 sm:mb-0">
                                        <label className='block text-xs sm:text-sm mb-1 sm:mb-2 text-textColor font-regular' htmlFor='year'>Year Level & Section</label>
                                        <input
                                            type='text'
                                            id='year'
                                            value={data.year}
                                            onChange={e => setData('year', e.target.value)}
                                            placeholder='e.g., 2nd Year - G'
                                            className='w-full p-2 sm:p-3 rounded-lg bg-white text-gray-700 text-xs sm:text-sm pl-3'
                                            required
                                        />
                                        {errors.year && <div className="text-red-500 text-xs sm:text-sm mt-1">{errors.year}</div>}
                                    </div>
                                    <div>
                                        <label className='block text-xs sm:text-sm mb-1 sm:mb-2 text-textColor font-regular' htmlFor='section'>Group</label>
                                        <select
                                            id='section'
                                            value={data.section}
                                            onChange={e => setData('section', e.target.value)}
                                            className='w-full p-2 sm:p-3 rounded-lg bg-white text-gray-700 text-xs sm:text-sm'
                                        >
                                            <option value="" className="text-gray-400">Select Group</option>
                                            <option value="G1" className="text-gray-700">G1</option>
                                            <option value="G2" className="text-gray-700">G2</option>
                                        </select>
                                        {errors.section && <div className="text-red-500 text-xs sm:text-sm mt-1">{errors.section}</div>}
                                    </div>
                                </div>

                                <div className="mb-3 sm:mb-4">
                                    <label className='block text-xs sm:text-sm mb-1 sm:mb-2 text-textColor font-regular' htmlFor='password'>Enter password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            id='password'
                                            value={data.password}
                                            onChange={e => setData('password', e.target.value)}
                                            className='w-full p-2 sm:p-3 pr-10 rounded-lg bg-white text-gray-700 text-xs sm:text-sm pl-3'
                                            placeholder='Enter your password (min. 8 characters)'
                                            required
                                            onFocus={() => setIsPasswordFocused(true)}
                                            onBlur={() => setIsPasswordFocused(false)}
                                        />
                                        {(data.password && data.password.length > 0) && (
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                            >
                                                {showPassword ? <FaEye className="w-4 h-4" /> : <FaEyeSlash className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                    {errors.password && <div className="text-red-500 text-xs sm:text-sm mt-1">{errors.password}</div>}
                                </div>

                                <div className="mb-3 sm:mb-4">
                                    <label className='block text-xs sm:text-sm mb-1 sm:mb-2 text-textColor font-regular' htmlFor='password_confirmation'>Confirm password</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswordConfirmation ? 'text' : 'password'}
                                            id='password_confirmation'
                                            value={data.password_confirmation}
                                            onChange={e => setData('password_confirmation', e.target.value)}
                                            className='w-full p-2 sm:p-3 pr-10 rounded-lg bg-white text-gray-700 text-xs sm:text-sm pl-3'
                                            placeholder='Confirm your password'
                                            required
                                            onFocus={() => setIsPasswordConfirmationFocused(true)}
                                            onBlur={() => setIsPasswordConfirmationFocused(false)}
                                        />
                                        {(data.password_confirmation && data.password_confirmation.length > 0) && (
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                            >
                                                {showPasswordConfirmation ? <FaEye className="w-4 h-4" /> : <FaEyeSlash className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                    {errors.password_confirmation && <div className="text-red-500 text-xs sm:text-sm mt-1">{errors.password_confirmation}</div>}
                                </div>

                                <div className="mb-3 sm:mb-4">
                                    <label className='block text-xs sm:text-sm mb-1 sm:mb-2 text-textColor font-regular' htmlFor='phone_number'>Phone Number</label>
                                    <input
                                        type='text'
                                        id='phone_number'
                                        value={data.phone_number}
                                        onChange={e => setData('phone_number', e.target.value)}
                                        className='w-full p-2 sm:p-3 rounded-lg bg-white text-gray-700 text-xs sm:text-sm pl-3'
                                        placeholder='Enter your phone number'
                                        required
                                    />
                                    {errors.phone_number && <div className="text-red-500 text-xs sm:text-sm mt-1">{errors.phone_number}</div>}
                                </div>
                                
                                <div className="mb-3 sm:mb-4">
                                    <label className='block text-xs sm:text-sm mb-1 sm:mb-2 text-textColor font-regular'>Gender</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="gender"
                                                value="Male"
                                                checked={data.gender === 'Male'}
                                                onChange={e => setData('gender', e.target.value)}
                                                className="mr-2"
                                                required
                                            />
                                            <span className="text-textColor text-xs sm:text-sm">Male</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="gender"
                                                value="Female"
                                                checked={data.gender === 'Female'}
                                                onChange={e => setData('gender', e.target.value)}
                                                className="mr-2"
                                                required
                                            />
                                            <span className="text-textColor text-xs sm:text-sm">Female</span>
                                        </label>
                                    </div>
                                    {errors.gender && <div className="text-red-500 text-xs sm:text-sm mt-1">{errors.gender}</div>}
                                </div>
                                
                                <div className="mb-3 sm:mb-4">
                                    <label className='block text-xs sm:text-sm mb-1 sm:mb-2 text-textColor font-regular' htmlFor='cor_file'>Upload Certificate of Registration</label>
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
                                            className='w-full bg-primary text-textColor p-1.5 sm:p-2 rounded-full hover:bg-opacity-80 transition duration-300 mt-1 sm:mt-2 cursor-pointer flex items-center justify-center text-xs sm:text-sm'
                                        >
                                            <span className="truncate">{fileName}</span>
                                        </label>
                                    </div>
                                    {errors.cor_file && <div className="text-red-500 text-xs sm:text-sm mt-1">{errors.cor_file}</div>}
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={processing}
                                className='w-full bg-primary text-textColor p-1.5 sm:p-2 rounded-full hover:bg-opacity-80 transition duration-300 mt-1 sm:mt-2 disabled:opacity-50 text-xs sm:text-base'
                            >
                                {processing ? 'Registering...' : 'Register'}
                            </button>
                            
                            <Link href='/' className='block text-center text-xs sm:text-sm mt-3 sm:mt-4 text-textColor hover:underline'>
                                Already have an account? Login
                            </Link>
                        </form>
                        
                    </div>
                </div>           
            </div>
            </div>
        </>
    )
}