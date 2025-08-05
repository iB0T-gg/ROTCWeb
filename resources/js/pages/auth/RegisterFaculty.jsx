import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { FaEye, FaEyeSlash, FaUpload } from 'react-icons/fa';

const RegisterFaculty = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const { data, setData, post, processing, errors } = useForm({
    email: '',
    employee_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: '',
    campus: '',
    department: '',
    password: '',
    password_confirmation: '',
    phone_number: '',
    credentials_file: null,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('email', data.email);
    formData.append('employee_id', data.employee_id);
    formData.append('first_name', data.first_name);
    formData.append('middle_name', data.middle_name);
    formData.append('last_name', data.last_name);
    formData.append('department', data.department);
    formData.append('password', data.password);
    formData.append('password_confirmation', data.password_confirmation);
    formData.append('phone_number', data.phone_number);
    if (data.credentials_file) {
      formData.append('credentials_file', data.credentials_file);
    }

    post('/register-faculty', {
      data: formData,
      forceFormData: true,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setData('credentials_file', file);
      setSelectedFile(file.name);
    }
  };

  return (
    <>
      <Head title="Faculty Registration" />
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 bg-green-600 rounded-full flex items-center justify-center">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Faculty Registration
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Create your faculty account for ROTC Portal
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              {/* Email */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                                 <input
                   id="email"
                   name="email"
                   type="email"
                   required
                   className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                   placeholder="Enter your email address"
                   value={data.email}
                   onChange={(e) => setData('email', e.target.value)}
                 />
                {errors.email && <div className="text-red-500 text-sm mt-1">{errors.email}</div>}
              </div>

              {/* Employee ID */}
              <div className="mb-4">
                <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700">
                  Employee ID
                </label>
                                 <input
                   id="employee_id"
                   name="employee_id"
                   type="text"
                   required
                   className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                   placeholder="Enter your employee ID number"
                   value={data.employee_id}
                   onChange={(e) => setData('employee_id', e.target.value)}
                 />
                {errors.employee_id && <div className="text-red-500 text-sm mt-1">{errors.employee_id}</div>}
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                                     <input
                     id="first_name"
                     name="first_name"
                     type="text"
                     required
                     className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                     placeholder="Enter your first name"
                     value={data.first_name}
                     onChange={(e) => setData('first_name', e.target.value)}
                   />
                  {errors.first_name && <div className="text-red-500 text-sm mt-1">{errors.first_name}</div>}
                </div>

                <div>
                  <label htmlFor="middle_name" className="block text-sm font-medium text-gray-700">
                    Middle Name
                  </label>
                                     <input
                     id="middle_name"
                     name="middle_name"
                     type="text"
                     required
                     className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                     placeholder="Enter your middle name"
                     value={data.middle_name}
                     onChange={(e) => setData('middle_name', e.target.value)}
                   />
                  {errors.middle_name && <div className="text-red-500 text-sm mt-1">{errors.middle_name}</div>}
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                                     <input
                     id="last_name"
                     name="last_name"
                     type="text"
                     required
                     className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                     placeholder="Enter your last name"
                     value={data.last_name}
                     onChange={(e) => setData('last_name', e.target.value)}
                   />
                  {errors.last_name && <div className="text-red-500 text-sm mt-1">{errors.last_name}</div>}
                </div>
              </div>

              {/* Gender */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Gender
                </label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="Male"
                      checked={data.gender === 'Male'}
                      onChange={(e) => setData('gender', e.target.value)}
                      className="mr-2"
                      required
                    />
                    <span className="text-gray-700">Male</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="Female"
                      checked={data.gender === 'Female'}
                      onChange={(e) => setData('gender', e.target.value)}
                      className="mr-2"
                      required
                    />
                    <span className="text-gray-700">Female</span>
                  </label>
                </div>
                {errors.gender && <div className="text-red-500 text-sm mt-1">{errors.gender}</div>}
              </div>

              {/* Campus */}
              <div className="mb-4">
                <label htmlFor="campus" className="block text-sm font-medium text-gray-700">
                  Campus
                </label>
                <select
                  id="campus"
                  name="campus"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  value={data.campus}
                  onChange={(e) => setData('campus', e.target.value)}
                >
                  <option value="">Select Campus</option>
                  <option value="Hagonoy Campus">Hagonoy Campus</option>
                  <option value="Meneses Campus">Meneses Campus</option>
                  <option value="Sarmiento Campus">Sarmiento Campus</option>
                  <option value="Bustos Campus">Bustos Campus</option>
                  <option value="San Rafael Campus">San Rafael Campus</option>
                  <option value="Main Campus">Main Campus</option>
                </select>
                {errors.campus && <div className="text-red-500 text-sm mt-1">{errors.campus}</div>}
              </div>

              {/* Department */}
              <div className="mb-4">
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                                 <input
                   id="department"
                   name="department"
                   type="text"
                   required
                   className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                   placeholder="e.g., Computer Science, Engineering"
                   value={data.department}
                   onChange={(e) => setData('department', e.target.value)}
                 />
                {errors.department && <div className="text-red-500 text-sm mt-1">{errors.department}</div>}
              </div>

              {/* Phone Number */}
              <div className="mb-4">
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                                 <input
                   id="phone_number"
                   name="phone_number"
                   type="tel"
                   required
                   className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                   placeholder="Enter your phone number"
                   value={data.phone_number}
                   onChange={(e) => setData('phone_number', e.target.value)}
                 />
                {errors.phone_number && <div className="text-red-500 text-sm mt-1">{errors.phone_number}</div>}
              </div>

              {/* Password */}
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                                     <input
                     id="password"
                     name="password"
                     type={showPassword ? 'text' : 'password'}
                     required
                     className="mt-1 appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                     placeholder="Enter your password (min. 6 characters)"
                     value={data.password}
                     onChange={(e) => setData('password', e.target.value)}
                   />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash className="h-4 w-4 text-gray-400" /> : <FaEye className="h-4 w-4 text-gray-400" />}
                  </button>
                </div>
                {errors.password && <div className="text-red-500 text-sm mt-1">{errors.password}</div>}
              </div>

              {/* Confirm Password */}
              <div className="mb-4">
                <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                                     <input
                     id="password_confirmation"
                     name="password_confirmation"
                     type={showConfirmPassword ? 'text' : 'password'}
                     required
                     className="mt-1 appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                     placeholder="Confirm your password"
                     value={data.password_confirmation}
                     onChange={(e) => setData('password_confirmation', e.target.value)}
                   />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEyeSlash className="h-4 w-4 text-gray-400" /> : <FaEye className="h-4 w-4 text-gray-400" />}
                  </button>
                </div>
                {errors.password_confirmation && <div className="text-red-500 text-sm mt-1">{errors.password_confirmation}</div>}
              </div>

              {/* Credentials File Upload */}
              <div className="mb-4">
                <label htmlFor="credentials_file" className="block text-sm font-medium text-gray-700">
                  Credentials/Qualifications (PDF)
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="credentials_file"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="credentials_file"
                          name="credentials_file"
                          type="file"
                          accept=".pdf"
                          className="sr-only"
                          onChange={handleFileChange}
                          required
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF up to 2MB</p>
                    {selectedFile && (
                      <p className="text-sm text-green-600">Selected: {selectedFile}</p>
                    )}
                  </div>
                </div>
                {errors.credentials_file && <div className="text-red-500 text-sm mt-1">{errors.credentials_file}</div>}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={processing}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {processing ? 'Registering...' : 'Register as Faculty'}
              </button>
            </div>

            <div className="text-center">
              <a href="/" className="font-medium text-green-600 hover:text-green-500">
                Already have an account? Sign in
              </a>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default RegisterFaculty; 