import React, { useState, useEffect, useRef } from 'react';
import { router, Link, Head } from '@inertiajs/react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Header from "../../components/header";
import UserSidebar from "../../components/userSidebar";

// Alert Dialog Component
const AlertDialog = ({ isOpen, type, title, message, onClose }) => {
  if (!isOpen) return null;

  const buttonColor = type === 'success' ? 'bg-primary/90 hover:bg-primary' : 'bg-red-600 hover:bg-red-700';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
        <div>
          <h3 className={`text-lg font-semibold text-black mb-2`}>{title}</h3>
          <p className={`text-black`}>{message}</p>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded text-white transition-colors ${buttonColor}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

const UserProfile = ({ auth, user }) => {
  const ChevronDownIcon = ({ className }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  const [editing, setEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    middle_name: user?.middle_name || '',
    last_name: user?.last_name || '',
    birthday: user?.birthday || '',
    gender: user?.gender || '-',
    age: user?.age ? String(user.age) : '',
    phone_number: user?.phone_number || '-',
    campus: user?.campus || '-',
    student_number: user?.student_number || '',
    platoon: user?.platoon || '-',
    company: user?.company || '-',
         battalion: user?.battalion || '-',
    email: user?.email || '',
    year: user?.year || '-',
    course: user?.course || '-',
    section: user?.section || '-',
    blood_type: user?.blood_type || '',
    region: user?.region || '-',
    height: user?.height || '-',
    address: user?.address || '',
  });

  // Address picker state
  const [showPicker, setShowPicker] = useState(false);
  const [province, setProvince] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [barangay, setBarangay] = useState("");
  const [provinces, setProvinces] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const pickerRef = useRef(null);

  // Avatar modal state (must be declared before effects that reference it)
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // AlertDialog state
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Only set battalion from gender if battalion is empty
  useEffect(() => {
    const computed = form.gender === 'Male' ? '1st Battalion' : form.gender === 'Female' ? '2nd Battalion' : null;
    if (computed && (!form.battalion || form.battalion === '-')) {
      setForm(prev => ({ ...prev, battalion: computed }));
    }
  }, [form.gender]);

  // Compute Platoon and Company only if both are empty and roster is accessible
  useEffect(() => {
    if ((form.platoon && form.platoon !== '-') || (form.company && form.company !== '-')) return;
    async function computePlatoonCompany() {
      try {
        // Try public cadets endpoint first; fall back to admin endpoint if needed
        let data = [];
        try {
          const res = await fetch('/api/cadets');
          if (res.ok) data = await res.json();
        } catch (e) {}
        if (!Array.isArray(data) || data.length === 0) {
          try {
            const res2 = await fetch('/api/admin-cadets');
            if (res2.ok) data = await res2.json();
          } catch (e) {}
        }
        if (!Array.isArray(data) || data.length === 0) return;

        // Sort alphabetically by last name then first name
        const normalize = (s) => (s || '').toString().trim().toLowerCase();
        const sorted = [...data].sort((a, b) => {
          const aLast = normalize(a.last_name);
          const bLast = normalize(b.last_name);
          if (aLast !== bLast) return aLast.localeCompare(bLast);
          const aFirst = normalize(a.first_name);
          const bFirst = normalize(b.first_name);
          return aFirst.localeCompare(bFirst);
        });

        // Identify this cadet by student_number first, else email, else name
        const myStudent = normalize(user?.student_number);
        const myEmail = normalize(user?.email);
        const myFirst = normalize(user?.first_name);
        const myLast = normalize(user?.last_name);
        const myIndex = sorted.findIndex((c) => {
          const cStudent = normalize(c.student_number);
          const cEmail = normalize(c.email);
          const cFirst = normalize(c.first_name);
          const cLast = normalize(c.last_name);
          return (
            (myStudent && cStudent && cStudent === myStudent) ||
            (myEmail && cEmail && cEmail === myEmail) ||
            (cFirst === myFirst && cLast === myLast)
          );
        });

        if (myIndex < 0) { return; }

        const groupIndex = Math.floor(myIndex / 37); // 0-based groups of 37
        // Cycle platoons every 3 groups: 1st, 2nd, 3rd, then repeat
        const cycle = groupIndex % 3;
        const platoonOrdinal = cycle === 0 ? '1st' : cycle === 1 ? '2nd' : '3rd';
        const platoonName = `${platoonOrdinal} Platoon`;
        const companies = [
          'Alpha','Beta','Charlie','Delta','Echo','Foxtrot','Golf','Hotel','India','Juliet','Kilo','Lima','Mike','November','Oscar','Papa','Quebec','Romeo','Sierra','Tango','Uniform','Victor','Whiskey','X-ray','Yankee','Zulu'
        ];
        const companyName = companies[groupIndex % companies.length] || 'Alpha';

        setForm((prev) => ({
          ...prev,
          platoon: (prev.platoon && prev.platoon !== '-') ? prev.platoon : platoonName,
          company: (prev.company && prev.company !== '-') ? prev.company : companyName
        }));
      } catch (e) {
        // Silently ignore if API not available
      }
    }
    // Run once after mount
    computePlatoonCompany();
  }, [user?.first_name, user?.last_name, user?.student_number, user?.email]);

  // Fetch provinces on mount
  useEffect(() => {
    fetch("https://psgc.gitlab.io/api/provinces/")
      .then((res) => res.json())
      .then((data) => setProvinces(data));
  }, []);

  // Fetch municipalities when province changes
  useEffect(() => {
    if (province) {
      setMunicipalities([]);
      setMunicipality("");
      setBarangays([]);
      setBarangay("");
      fetch(
        `https://psgc.gitlab.io/api/provinces/${province}/cities-municipalities/`
      )
        .then((res) => res.json())
        .then((data) => setMunicipalities(data));
    }
  }, [province]);

  // Fetch barangays when municipality changes
  useEffect(() => {
    if (municipality) {
      setBarangays([]);
      setBarangay("");
      fetch(
        `https://psgc.gitlab.io/api/cities-municipalities/${municipality}/barangays/`
      )
        .then((res) => res.json())
        .then((data) => setBarangays(data));
    }
  }, [municipality]);

  // Close picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    }
    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPicker]);

  // Avatar modal state (declare before effects that reference it)
  // moved above (placeholder removed)

  // Lock page scroll only for avatar modal (address picker should not gray out/lock)
  useEffect(() => {
    const shouldLock = showAvatarModal;
    if (shouldLock) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [showAvatarModal]);

  // When all selected, set address and close picker
  useEffect(() => {
    if (province && municipality && barangay) {
      const provName = provinces.find((p) => p.code === province)?.name || "";
      const munName =
        municipalities.find((m) => m.code === municipality)?.name || "";
      const newAddress = `Brgy. ${barangay}, ${munName}, ${provName}`;
      setForm((prev) => ({ ...prev, address: newAddress }));
      setShowPicker(false);
    }
  }, [province, municipality, barangay, provinces, municipalities]);

  // Store original data for cancel
  const [originalForm, setOriginalForm] = useState(form);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Auto-assign battalion based on gender when gender changes
    if (name === 'gender') {
      const nextBattalion = value === 'Male' ? '1st Battalion' : value === 'Female' ? '2nd Battalion' : '-';
      setForm((prev) => ({
        ...prev,
        [name]: value,
        battalion: nextBattalion
      }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };



  const handleDateChange = (date) => {
    if (date) {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString();
      const formattedDate = `${day}/${month}/${year}`;
      const today = new Date();
      let age = today.getFullYear() - date.getFullYear();
      const m = today.getMonth() - date.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
        age--;
      }
      setForm((prev) => ({ 
        ...prev, 
        birthday: formattedDate,
        age: age.toString()
      }));
    }
    setShowDatePicker(false);
  };

  const handleEdit = () => {
    setOriginalForm(form);
    setEditing(true);
  };

  const handleCancel = () => {
    setForm(originalForm);
    setEditing(false);
    setShowDatePicker(false);
    setProvince("");
    setMunicipality("");
    setBarangay("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    // Normalize birthday (expected dd/mm/yyyy or dd/mm/yy) to YYYY-MM-DD for SQL
    if (payload.birthday && typeof payload.birthday === 'string') {
      const parts = payload.birthday.split('/');
      if (parts.length === 3) {
        const [d, m, y] = parts;
        const year = y?.length === 2 ? `20${y}` : y;
        const mm = m?.padStart(2, '0');
        const dd = d?.padStart(2, '0');
        if (year && mm && dd) {
          payload.birthday = `${year}-${mm}-${dd}`;
        }
      }
    }
    router.post('/api/user/profile/update', payload, {
      onSuccess: () => {
        setEditing(false);
        setShowDatePicker(false);
        setAlertDialog({
          isOpen: true,
          title: 'Success',
          message: 'Profile updated successfully!',
          type: 'success'
        });
      },
      onError: (errors) => {
        console.error('Error response:', errors);
        if (errors && typeof errors === 'object') {
          const errorMessages = Object.values(errors).flat();
          setAlertDialog({
            isOpen: true,
            title: 'Validation Errors',
            message: errorMessages.join('\n'),
            type: 'error'
          });
        } else {
          setAlertDialog({
            isOpen: true,
            title: 'Error',
            message: 'Failed to update profile. Please check your input.',
            type: 'error'
          });
        }
      }
    });
  };

  // Example options for dropdowns (customize as needed)
  const genderOptions = ['Male', 'Female'];
  const campusOptions = ['Hagonoy Campus', 'Meneses Campus', 'Sarmiento Campus', 'Bustos Campus', 'San Rafael Campus', 'Main Campus'];
  const platoonOptions = ['1st Platoon', '2nd Platoon', '3rd Platoon'];
  const companyOptions = ['Alpha', 'Beta', 'Charlie', 'Delta'];
  // Battalion options based on gender
  const battalionOptions = ['1st Battalion', '2nd Battalion'];

  const bloodTypeOptions = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const regionOptions = [
    'Region I',
    'Region II',
    'Region III',
    'Region IV-A',
    'Region IV-B',
    'Region V',
    'Region VI',
    'Region VII',
    'Region VIII',
    'Region IX',
    'Region X',
    'Region XI',
    'Region XII',
    'Region XIII',
    'NCR',
    'CAR',
    'BARMM'
  ];
  const heightOptions = [
    '4\'0"', '4\'1"', '4\'2"', '4\'3"', '4\'4"', '4\'5"', '4\'6"', '4\'7"', '4\'8"', '4\'9"', '4\'10"', '4\'11"',
    '5\'0"', '5\'1"', '5\'2"', '5\'3"', '5\'4"', '5\'5"', '5\'6"', '5\'7"', '5\'8"', '5\'9"', '5\'10"', '5\'11"',
    '6\'0"', '6\'1"', '6\'2"', '6\'3"', '6\'4"', '6\'5"', '6\'6"', '6\'7"', '6\'8"', '6\'9"', '6\'10"', '6\'11"', '7\'0"'
  ];

  // List of uneditable fields
  const uneditableFields = [
    'first_name',
    'middle_name',
    'last_name',
    'student_number',
    'email'
  ];

  // Helper for conditional focus outline
  const focusClass = 'focus:outline-none';

  

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    if (file) {
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!allowedTypes.includes(file.type)) {
        setAlertDialog({
          isOpen: true,
          title: 'Invalid File Type',
          message: 'Please select a valid image file (JPEG, PNG, JPG, or GIF).',
          type: 'error'
        });
        e.target.value = '';
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }
      
      if (file.size > maxSize) {
        setAlertDialog({
          isOpen: true,
          title: 'File Too Large',
          message: 'File size must be less than 5MB.',
          type: 'error'
        });
        e.target.value = '';
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }
      
      setPreviewUrl(URL.createObjectURL(file));
      console.log('File selected:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
    } else {
      setPreviewUrl(null);
    }
  };

  // Handle avatar save
  const handleSaveAvatar = async () => {
    if (!selectedFile) {
      setAlertDialog({
        isOpen: true,
        title: 'No File Selected',
        message: 'Please select a file.',
        type: 'error'
      });
      return;
    }

    // Use Inertia.js router for file upload to handle CSRF automatically
    router.post('/api/user/profile/upload-avatar', 
      { profile_picture: selectedFile },
      {
        forceFormData: true,
        onSuccess: (page) => {
          console.log('Upload successful:', page);
          setShowAvatarModal(false);
          setSelectedFile(null);
          setPreviewUrl(null);
          setAlertDialog({
            isOpen: true,
            title: 'Success',
            message: 'Profile picture uploaded successfully!',
            type: 'success'
          });
          window.location.reload();
        },
        onError: (errors) => {
          console.error('Upload errors:', errors);
          if (errors && typeof errors === 'object') {
            const errorMessages = Object.values(errors).flat();
            setAlertDialog({
              isOpen: true,
              title: 'Upload Failed',
              message: errorMessages.join('\n'),
              type: 'error'
            });
          } else {
            setAlertDialog({
              isOpen: true,
              title: 'Upload Failed',
              message: 'Upload failed. Please try again.',
              type: 'error'
            });
          }
        },
        onFinish: () => {
          console.log('Upload request finished');
        }
      }
    );
  };

  // Get the profile picture URL, check if it's a full URL or a relative path
  const profilePic = user?.profile_pic_url ? user.profile_pic_url : null;

  return (
    <>
      <Head title="ROTC Portal - Profile" />
      <div className="relative w-full min-h-screen">
      <div className="fixed inset-0 bg-backgroundColor -z-10" />
      <Header auth={auth} />
      <div className="flex flex-col lg:flex-row">
        <UserSidebar />
        <div className="flex-1 p-3 lg:p-6">
          <div className="font-regular animate-fade-in-up">
            <div className="bg-white p-2 lg:p-3 text-[#6B6A6A] rounded-lg pl-3 lg:pl-5 text-sm lg:text-base animate-fade-in-up">
              <Link href="/user/userHome" className="hover:underline cursor-pointer font-semibold">
                Dashboard
              </Link>
              <span className="mx-1 lg:mx-2 font-semibold">{">"}</span>
              <span className="cursor-default font-bold">Profile</span>
            </div>
            <div className="bg-primary text-white p-3 lg:p-4 rounded-lg flex items-center justify-between mt-4 mb-4 lg:mb-6 pl-3 lg:pl-5 py-4 lg:py-7 animate-fade-in-down">
              <h1 className="text-xl lg:text-2xl font-semibold">Profile</h1>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 items-start">
              {/* LEFT COLUMN - Profile Info and Academic Info */}
              <div className="lg:col-span-1 flex flex-col gap-4 order-1 lg:order-1">
                {/* Profile Info Card */}
                <div className="bg-white p-4 lg:p-6 rounded-lg shadow animate-scale-in-up">
                <div className="flex flex-col items-center text-center">
                  {/* Profile Picture */}
                  <div 
                    className={`relative w-24 h-24 lg:w-32 lg:h-32 rounded-full overflow-hidden mb-4 ${editing ? 'cursor-pointer hover:opacity-80 border-2 border-primary' : ''}`}
                    onClick={() => editing && setShowAvatarModal(true)}
                    title={editing ? "Click to change profile picture" : ""}
                  >
                    {profilePic ? (
                      <img
                        src={profilePic}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '';
                          e.target.style.display = 'none';
                          // Show the fallback div
                          const fallbackDiv = e.target.nextElementSibling;
                          if (fallbackDiv) fallbackDiv.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 text-2xl lg:text-3xl font-semibold ${profilePic ? 'hidden' : 'flex'}`}
                      style={{ display: profilePic ? 'none' : 'flex' }}
                    >
                      {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    {editing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs">Change</span>
                      </div>
                    )}
                  </div>
                  
                  {/* User Info */}
                  <div className="w-full">
                    <h2 className="text-lg lg:text-xl font-semibold text-black mb-2">
                      {user?.last_name}, {user?.first_name}
                    </h2>
                    
                    {/* Student Number */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Student Number</label>
                      <div className="bg-blue-100 p-3 rounded text-center font-medium">
                        {user?.student_number || '-'}
                      </div>
                    </div>
                    
                    {/* Email */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                      <div className="bg-blue-100 p-3 rounded text-center font-medium break-words">
                        {user?.email || '-'}
                      </div>
                    </div>
                    
                    {editing && (
                      <div className="text-xs text-primary mt-2">Click photo to change</div>
                    )}
                  </div>
                </div>
                </div>

                {/* Academic Information Section - Separate Card */}
                <div className="bg-white p-3 lg:p-4 rounded-lg shadow animate-scale-in-up">
                  <h3 className="text-base lg:text-lg font-semibold text-black mb-3 text-center">Academic Information</h3>
                  
                  {/* Course */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Course</label>
                    {editing ? (
                      <div className="relative">
                        <select
                          className={`w-full bg-gray-100 p-3 rounded pr-9 appearance-none ${focusClass}`}
                          name="course"
                          value={form.course}
                          onChange={handleChange}
                          required={editing}
                        >
                          <option value="">-</option>
                          {['BSIT','BSCS','BSCpE','BSEE','BSME','BSED','BEED','BSA','BSBA','BSHM'].map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                      </div>
                    ) : (
                      <div className="bg-gray-100 p-3 rounded">
                        {form.course || '-'}
                      </div>
                    )}
                  </div>
                  
                  {/* Year & Section */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Year & Section</label>
                    {editing ? (
                      <input
                        type="text"
                        value={form.year}
                        onChange={handleChange}
                        required={editing}
                        className={`w-full bg-gray-100 p-3 rounded ${focusClass}`}
                        name="year"
                        placeholder="e.g., 3rd Year - A"
                      />
                    ) : (
                      <div className="bg-gray-100 p-3 rounded">
                        {form.year || '-'}
                      </div>
                    )}
                  </div>
                  
                  {/* Group */}
                  <div className="mb-0">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Group</label>
                    {editing ? (
                      <input
                        type="text"
                        value={form.section}
                        onChange={handleChange}
                        required={editing}
                        className={`w-full bg-gray-100 p-3 rounded ${focusClass}`}
                        name="section"
                        placeholder="e.g., Group 1"
                      />
                    ) : (
                      <div className="bg-gray-100 p-3 rounded">
                        {form.section || '-'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT CARD - Editable Fields */}
              <form onSubmit={handleSubmit} className="lg:col-span-3 bg-white p-4 lg:p-6 rounded-lg shadow order-2 lg:order-2 animate-scale-in-up">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-3 lg:gap-0">
                  <h1 className="text-lg lg:text-xl font-semibold text-black">Personal Information</h1>
                  {!editing && (
                    <button
                      type="button"
                      className="bg-primary text-white px-3 lg:px-4 py-2 rounded hover:bg-primary transition-colors text-sm lg:text-base w-full lg:w-auto"
                      onClick={handleEdit}
                    >
                      Edit Info
                    </button>
                  )}
                </div>
                
                <div className="flex flex-col gap-4">
                {/* Row 1 - Name Fields (Read-only) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block font-medium text-black mb-2">First Name</label>
                    <input
                      type="text"
                      value={form.first_name}
                      readOnly
                      className={`w-full bg-blue-100 p-3 rounded ${focusClass} pointer-events-none select-none cursor-not-allowed`}
                      name="first_name"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-black mb-2">Middle Name</label>
                    <input
                      type="text"
                      value={form.middle_name}
                      readOnly
                      className={`w-full bg-blue-100 p-3 rounded ${focusClass} pointer-events-none select-none cursor-not-allowed`}
                      name="middle_name"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-black mb-2">Last Name</label>
                    <input
                      type="text"
                      value={form.last_name}
                      readOnly
                      className={`w-full bg-blue-100 p-3 rounded ${focusClass} pointer-events-none select-none cursor-not-allowed`}
                      name="last_name"
                    />
                  </div>
                </div>

                {/* Row 2: Birthday, Gender, Age, Phone Number, Campus */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                  <div>
                    <label className="block font-medium text-black mb-2">Birthday</label>
                    <div className="relative">
                      <div className="flex items-center bg-gray-100 rounded p-3">
                        <button
                          type="button"
                          onClick={() => editing && setShowDatePicker(!showDatePicker)}
                          className={`mr-2 ${editing ? 'cursor-pointer hover:text-blue-600' : 'cursor-default'}`}
                          disabled={!editing}
                        >
                          📅
                        </button>
                        <input
                          type="text"
                          value={form.birthday}
                          readOnly={!editing}
                          required={editing}
                          className={`bg-transparent w-full ${editing ? 'bg-gray-100' : ''} ${focusClass}`}
                          name="birthday"
                          onChange={handleChange}
                          placeholder="dd/mm/yy"
                        />
                      </div>
                      {showDatePicker && editing && (
                        <div className="absolute z-10 mt-1 left-0">
                          <DatePicker
                              selected={form.birthday ? (() => {
                                try {
                                  const [day, month, year] = form.birthday.split('/');
                                  // Handle both 2-digit and 4-digit years
                                  const fullYear = year.length === 2 ? `20${year}` : year;
                                  return new Date(parseInt(fullYear), parseInt(month) - 1, parseInt(day));
                                } catch (error) {
                                  return null;
                                }
                              })() : null}
                            onChange={handleDateChange}
                            dateFormat="dd/MM/yyyy"
                            maxDate={new Date()}
                            showYearDropdown
                            scrollableYearDropdown
                            yearDropdownItemNumber={100}
                            placeholderText="dd/mm/yy"
                            autoFocus
                            inline
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium text-black mb-2">Age</label>
                    <input
                      type="text"
                      value={form.age}
                      readOnly={!editing}
                      required={editing}
                      className={`w-full ${editing ? 'bg-gray-100' : 'bg-gray-100'} p-3 rounded ${focusClass}`}
                      name="age"
                      onChange={handleChange}
                      placeholder='-'
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-black mb-2">Gender</label>
                    {editing ? (
                      <div className="relative">
                        <select
                          className={`w-full bg-gray-100 p-3 rounded pr-9 appearance-none ${focusClass}`}
                          name="gender"
                          value={form.gender}
                          onChange={handleChange}
                          required={editing}
                        >
                          <option value="">-</option>
                          {genderOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={form.gender || '-'}
                        readOnly
                        className={`w-full bg-gray-100 p-3 rounded ${focusClass}`}
                      />
                    )}
                  </div>
                  <div>
                    <label className="block font-medium text-black mb-2">Phone Number</label>
                    <input
                      type="text"
                      value={form.phone_number}
                      readOnly={!editing}
                      required={editing}
                      className={`w-full ${editing ? 'bg-gray-100' : 'bg-gray-100'} p-3 rounded ${focusClass}`}
                      name="phone_number"
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-black mb-2">Campus</label>
                    {editing ? (
                      <div className="relative">
                        <select
                          className={`w-full bg-gray-100 p-3 rounded pr-9 appearance-none ${focusClass}`}
                          name="campus"
                          value={form.campus}
                          onChange={handleChange}
                          required={editing}
                        >
                          <option value="">-</option>
                          {campusOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={form.campus || '-'}
                        readOnly
                        className={`w-full bg-gray-100 p-3 rounded ${focusClass}`}
                      />
                    )}
                  </div>
                </div>

                {/* Row 3: Platoon, Company, Battalion */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block font-medium text-black mb-2">Platoon</label>
                    <input
                      type="text"
                      value={form.platoon || '-'}
                      readOnly
                      className={`w-full bg-blue-100 p-3 rounded ${focusClass} pointer-events-none select-none cursor-not-allowed`}
                      name="platoon"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-black mb-2">Company</label>
                    <input
                      type="text"
                      value={form.company || '-'}
                      readOnly
                      className={`w-full bg-blue-100 p-3 rounded ${focusClass} pointer-events-none select-none cursor-not-allowed`}
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-black mb-2">Battalion</label>
                    <input
                      type="text"
                      value={form.battalion || '-'}
                      readOnly
                      className={`w-full bg-blue-100 p-3 rounded ${focusClass} pointer-events-none select-none cursor-not-allowed`}
                    />
                  </div>
                </div>

                {/* Row 5: Physical and Location Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block font-medium text-black mb-2">Blood Type</label>
                    {editing ? (
                      <div className="relative">
                        <select
                          className={`w-full bg-gray-100 p-3 rounded pr-9 appearance-none ${focusClass}`}
                          name="blood_type"
                          value={form.blood_type}
                          onChange={handleChange}
                          required={editing}
                        >
                          <option value="">-</option>
                          {bloodTypeOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={form.blood_type || '-'}
                        readOnly
                        className={`w-full bg-gray-100 p-3 rounded ${focusClass}`}
                      />
                    )}
                  </div>
                  <div>
                    <label className="block font-medium text-black mb-2">Height</label>
                    {editing ? (
                      <div className="relative">
                        <select
                          className={`w-full bg-gray-100 p-3 rounded pr-9 appearance-none ${focusClass}`}
                          name="height"
                          value={form.height}
                          onChange={handleChange}
                          required={editing}
                        >
                          <option value="">-</option>
                          {heightOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={form.height || '-'}
                        readOnly
                        className={`w-full bg-gray-100 p-3 rounded ${focusClass}`}
                      />
                    )}
                  </div>
                  <div>
                    <label className="block font-medium text-black mb-2">Region</label>
                    {editing ? (
                      <div className="relative">
                        <select
                          className={`w-full bg-gray-100 p-3 rounded pr-9 appearance-none ${focusClass}`}
                          name="region"
                          value={form.region}
                          onChange={handleChange}
                          required={editing}
                        >
                          <option value="">-</option>
                          {regionOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={form.region || '-'}
                        readOnly
                        className={`w-full bg-gray-100 p-3 rounded ${focusClass}`}
                      />
                    )}
                  </div>
                </div>

                {/* Row 6: Address */}
                <div className="mb-4">
                  <label className="block font-medium text-black mb-2">Address</label>
                  {editing ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={form.address}
                        readOnly
                        required={editing}
                        className="w-full bg-gray-100 p-3 rounded pr-9 cursor-pointer focus:outline-none"
                        placeholder="-"
                        onClick={() => setShowPicker(true)}
                      />
                      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                      {showPicker && (
                        <div
                          ref={pickerRef}
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            zIndex: 20,
                            background: "white",
                            border: "1px solid #ccc",
                            borderRadius: 8,
                            padding: "16px 16px 0 16px",
                            marginTop: 4,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            width: "100%",
                            maxHeight: 360,
                            overflowY: "auto"
                          }}
                        >
                          <div className="flex flex-col gap-2">
                            <div>
                              <label className="block text-sm mb-1">Province</label>
                              <div className="relative">
                                <select
                                  className="w-full bg-gray-100 p-2 rounded pr-9 appearance-none"
                                  value={province}
                                  onChange={(e) => setProvince(e.target.value)}
                                >
                                  <option value="">Select Province</option>
                                  {provinces.map((prov) => (
                                    <option key={prov.code} value={prov.code}>
                                      {prov.name}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm mb-1">Municipality/City</label>
                              <div className="relative">
                                <select
                                  className="w-full bg-gray-100 p-2 rounded pr-9 appearance-none"
                                  value={municipality}
                                  onChange={(e) => setMunicipality(e.target.value)}
                                  disabled={!province}
                                >
                                  <option value="">Select Municipality/City</option>
                                  {municipalities.map((mun) => (
                                    <option key={mun.code} value={mun.code}>
                                      {mun.name}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm mb-1">Barangay</label>
                              <div className="relative">
                                <select
                                  className="w-full bg-gray-100 p-2 rounded pr-9 appearance-none"
                                  value={barangay}
                                  onChange={(e) => setBarangay(e.target.value)}
                                  disabled={!municipality}
                                >
                                  <option value="">Select Barangay</option>
                                  {barangays.map((brgy) => (
                                    <option key={brgy.code} value={brgy.name}>
                                      {brgy.name}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 w-5 h-5" />
                              </div>
                            </div>
                            <button
                              className="mt-2 mb-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                              onClick={() => setShowPicker(false)}
                              type="button"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={form.address}
                      readOnly
                      className="w-full bg-gray-100 p-3 rounded focus:outline-none"
                    />
                  )}
                </div>
                </div>

                {/* Bottom controls */}
                {editing && (
                  <div className="flex flex-col sm:flex-row justify-end mt-8 gap-2">
                    <button
                      type="button"
                      className="bg-gray-400 text-white px-4 lg:px-6 py-2 rounded hover:bg-gray-500 transition-colors order-2 sm:order-1"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-primary text-white px-4 lg:px-6 py-2 rounded hover:bg-primary transition-colors order-1 sm:order-2"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>    
        </div>
      </div>
      
      {/* Avatar Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-8 relative w-[350px] max-w-full">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
              onClick={() => setShowAvatarModal(false)}
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold mb-4 text-center">Choose profile picture</h2>
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mb-4">
                {previewUrl || profilePic ? (
                  <img
                    src={previewUrl || profilePic}
                    alt="Profile Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '';
                      e.target.style.display = 'none';
                      // Show the fallback div
                      const fallbackDiv = e.target.nextElementSibling;
                      if (fallbackDiv) fallbackDiv.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 text-3xl font-semibold ${(previewUrl || profilePic) ? 'hidden' : 'flex'}`}
                  style={{ display: (previewUrl || profilePic) ? 'none' : 'flex' }}
                >
                  {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                className="mb-4"
                onChange={handleFileChange}
              />
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  onClick={() => setShowAvatarModal(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary"
                  onClick={handleSaveAvatar}
                  type="button"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* AlertDialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
      />
    </div>
    </>
  );
};

export default UserProfile; 