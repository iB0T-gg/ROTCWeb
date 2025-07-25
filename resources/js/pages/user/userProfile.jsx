import React, { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Header from "../../components/header";
import UserSidebar from "../../components/userSidebar";

const UserProfile = ({ auth, user }) => {
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
    student_number: user?.student_number || '',
    platoon: user?.platoon || '-',
    company: user?.company || '-',
    battalion: user?.gender === 'Male' ? '1st Battalion' : (user?.battalion || '-'),
    email: user?.email || '',
    year_course_section: user?.year_course_section || '-',
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
    setForm((prev) => {
      const updatedForm = { ...prev, [name]: value };
      
      // Auto-set battalion based on gender
      if (name === 'gender') {
        if (value === 'Female') {
          updatedForm.battalion = '2nd Battalion';
        } else if (value === 'Male') {
          updatedForm.battalion = '1st Battalion';
        }
      }
      
      return updatedForm;
    });
  };

  // Update battalion when form.gender changes
  useEffect(() => {
    if (form.gender === 'Female') {
      setForm(prev => ({ ...prev, battalion: '2nd Battalion' }));
    } else if (form.gender === 'Male') {
      setForm(prev => ({ ...prev, battalion: '1st Battalion' }));
    }
  }, [form.gender]);

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
    router.post('/api/user/profile/update', form, {
      onSuccess: () => {
        setEditing(false);
        setShowDatePicker(false);
        alert('Profile updated successfully!');
      },
      onError: (errors) => {
        console.error('Error response:', errors);
        if (errors && typeof errors === 'object') {
          const errorMessages = Object.values(errors).flat();
          alert('Validation errors:\n' + errorMessages.join('\n'));
        } else {
          alert('Failed to update profile. Please check your input.');
        }
      }
    });
  };

  // Example options for dropdowns (customize as needed)
  const genderOptions = ['Male', 'Female'];
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
  const focusClass = editing
    ? 'focus:outline-primary-600 focus:outline-2'
    : 'focus:outline-none';

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  // Handle avatar save
  const handleSaveAvatar = async () => {
    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }
    const formData = new FormData();
    formData.append("profile_picture", selectedFile);

    // You may need to adjust the endpoint and headers for your backend
    try {
      const response = await fetch("/api/user/profile/upload-avatar", {
        method: "POST",
        body: formData,
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]').content,
        },
        credentials: "same-origin",
      });

      if (response.ok) {
        // Optionally, update the profilePic state with the new image URL
        // You may want to reload the user data or just update the image
        setShowAvatarModal(false);
        window.location.reload(); // or fetch new user data
      } else {
        alert("Failed to upload image.");
      }
    } catch (err) {
      alert("Error uploading image.");
    }
  };

  // Replace with your actual image or fallback
  const profilePic = user?.profile_pic_url ? user.profile_pic_url : null;

  return (
    <div className="w-full min-h-screen bg-backgroundColor">
      <Header auth={auth} />
      <div className="flex">
        <UserSidebar />
        <div className="flex-1 p-6">
          <div className="font-regular">
            <div className="bg-white p-3 text-[#6B6A6A] rounded-lg pl-5 cursor-pointer">
              Home  {">"} Profile
            </div>
            <div className="bg-primary text-white p-4 rounded-lg flex items-center justify-between mt-4 mb-6 pl-5 py-7">
              <h1 className="text-2xl font-semibold">Profile</h1>
            </div>
            <form onSubmit={handleSubmit} className="bg-white w-full mx-auto h-[650px] p-6 rounded-lg shadow">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center">
                  {editing ? (
                    // Editing mode: show image with hover overlay and click-to-edit
                    <div
                      className="relative w-24 h-24 rounded-full mr-4 bg-gray-200 flex items-center justify-center overflow-hidden group cursor-pointer"
                      onClick={() => setShowAvatarModal(true)}
                      style={{ minWidth: 96, minHeight: 96 }}
                    >
                      {profilePic ? (
                        <>
                          <img
                            src={profilePic}
                            alt="Profile"
                            className="w-full h-full object-cover rounded-full"
                          />
                          {/* Overlay on hover */}
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-semibold text-lg select-none">Edit</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-white font-semibold text-lg select-none">No Image</span>
                          {/* Overlay on hover */}
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-semibold text-lg select-none">Edit</span>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    // Not editing: show image or "No Image"
                    <div
                      className="w-24 h-24 rounded-full mr-4 bg-gray-200 flex items-center justify-center text-gray-400 text-lg font-semibold overflow-hidden"
                      style={{ minWidth: 96, minHeight: 96 }}
                    >
                      {profilePic ? (
                        <img
                          src={profilePic}
                          alt="Profile"
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span>No Image</span>
                      )}
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-semibold text-black">{user?.first_name} {user?.last_name}</h2>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                  </div>
                </div>
                {!editing && (
                  <button
                    type="button"
                    className="bg-primary text-white px-4 py-2 rounded"
                    onClick={handleEdit}
                  >
                    Edit
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-4">
                {/* Row 1 */}
                <div className="flex gap-x-4 mb-3">
                  <div className="flex-1">
                    <label className="block font-medium text-black">First Name</label>
                    <input
                      type="text"
                      value={form.first_name}
                      readOnly
                      className={`w-full bg-blue-100 p-2 rounded py-3 focus:outline-none`}
                      name="first_name"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block font-medium text-black">Middle Name</label>
                    <input
                      type="text"
                      value={form.middle_name}
                      readOnly
                      className={`w-full bg-blue-100 p-2 rounded py-3 focus:outline-none`}
                      name="middle_name"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block font-medium text-black">Last Name</label>
                    <input
                      type="text"
                      value={form.last_name}
                      readOnly
                      className={`w-full bg-blue-100 p-2 rounded py-3 focus:outline-none`}
                      name="last_name"
                    />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="flex gap-x-4 mb-3">
                  <div className="flex-1">
                    <label className="block font-medium text-black">Birthday</label>
                    <div className="relative">
                      <div className="flex items-center bg-gray-100 rounded py-3">
                        <button
                          type="button"
                          onClick={() => editing && setShowDatePicker(!showDatePicker)}
                          className={`pl-2 mr-2 ${editing ? 'cursor-pointer hover:text-blue-600' : 'cursor-default'}`}
                          disabled={!editing}
                        >
                          📅
                        </button>
                        <input
                          type="text"
                          value={form.birthday}
                          readOnly={!editing}
                          className={`bg-transparent w-full outline-none ${editing ? 'bg-gray-100' : ''} ${focusClass}`}
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
                  <div className="flex-1">
                    <label className="block font-medium text-black">Gender</label>
                    {editing ? (
                      <select
                        className={`w-full bg-gray-100 p-2 rounded py-3 ${focusClass}`}
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
                      >
                        <option value="">-</option>
                        {genderOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={form.gender || '-'}
                        readOnly
                        className={`w-full bg-gray-100 p-2 rounded py-3 ${focusClass}`}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block font-medium text-black">Age</label>
                    <input
                      type="text"
                      value={form.age}
                      readOnly
                      className={`w-full bg-gray-100 p-2 rounded py-3 ${focusClass}`}
                      name="age"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block font-medium text-black">Phone Number</label>
                    <input
                      type="text"
                      value={form.phone_number}
                      readOnly={!editing}
                      required
                      className={`w-full ${editing ? 'bg-gray-100' : 'bg-gray-100'} p-2 rounded py-3 ${focusClass}`}
                      name="phone_number"
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Row 3 */}
                <div className="flex gap-x-4 mb-3">
                  <div className="flex-[2]">
                    <label className="block font-medium text-black">Student Number</label>
                    <input
                      type="text"
                      value={form.student_number}
                      readOnly
                      className={`w-full bg-blue-100 p-2 rounded py-3 focus:outline-none`}
                      name="student_number"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block font-medium text-black">Platoon</label>
                    {editing ? (
                      <select
                        className={`w-full bg-gray-100 p-2 rounded py-3 ${focusClass}`}
                        name="platoon"
                        value={form.platoon}
                        onChange={handleChange}
                      >
                        <option value="">-</option>
                        {platoonOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={form.platoon || '-'}
                        readOnly
                        className={`w-full bg-gray-100 p-2 rounded py-3 ${focusClass}`}
                        name="platoon"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block font-medium text-black">Company</label>
                    {editing ? (
                      <select
                        className={`w-full bg-gray-100 p-2 rounded py-3 ${focusClass}`}
                        name="company"
                        value={form.company}
                        onChange={handleChange}
                      >
                        <option value="">-</option>
                        {companyOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={form.company || '-'}
                        readOnly
                        className={`w-full bg-gray-100 p-2 rounded py-3 ${focusClass}`}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block font-medium text-black">Battalion</label>
                    {editing ? (
                      <select
                        className={`w-full bg-gray-100 p-2 rounded py-3 ${focusClass}`}
                        name="battalion"
                        value={form.battalion}
                        onChange={handleChange}
                      >
                        <option value="">-</option>
                        {battalionOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={form.battalion || '-'}
                        readOnly
                        className={`w-full bg-gray-100 p-2 rounded py-3 ${focusClass}`}
                        name="battalion"
                      />
                    )}
                  </div>
                  <div className="flex-[2]">
                    <label className="block font-medium text-black">Email</label>
                    <input
                      type="text"
                      value={form.email}
                      readOnly
                      className={`w-full bg-blue-100 p-2 rounded py-3 focus:outline-none`}
                      name="email"
                    />
                  </div>
                </div>

                {/* Row 4 */}
                <div className="flex gap-x-4 mb-3">
                  <div className="flex-[2]">
                    <label className="block font-medium text-black">Course/ Year/ Section</label>
                    <input
                      type="text"
                      value={form.year_course_section}
                      readOnly={!editing}
                      required
                      className={`w-full ${editing ? 'bg-gray-100' : 'bg-gray-100'} p-2 rounded py-3 ${focusClass}`}
                      name="year_course_section"
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="flex-1">
                    <label className="block font-medium text-black">Blood Type</label>
                    {editing ? (
                      <select
                        className={`w-full bg-gray-100 p-2 rounded py-3 ${focusClass}`}
                        name="blood_type"
                        value={form.blood_type}
                        onChange={handleChange}
                      >
                        <option value="">-</option>
                        {bloodTypeOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={form.blood_type || '-'}
                        readOnly
                        className={`w-full bg-gray-100 p-2 rounded py-3 ${focusClass}`}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block font-medium text-black">Region</label>
                    {editing ? (
                      <select
                        className={`w-full bg-gray-100 p-2 rounded py-3 ${focusClass}`}
                        name="region"
                        value={form.region}
                        onChange={handleChange}
                      >
                        <option value="">-</option>
                        {regionOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={form.region || '-'}
                        readOnly
                        className={`w-full bg-gray-100 p-2 rounded py-3 ${focusClass}`}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block font-medium text-black">Height</label>
                    {editing ? (
                      <select
                        className={`w-full bg-gray-100 p-2 rounded py-3 ${focusClass}`}
                        name="height"
                        value={form.height}
                        onChange={handleChange}
                      >
                        <option value="">-</option>
                        {heightOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={form.height || '-'}
                        readOnly
                        className={`w-full bg-gray-100 p-2 rounded py-3 ${focusClass}`}
                      />
                    )}
                  </div>
                  <div className="flex-[2]">
                    <label className="block font-medium text-black">Address</label>
                    {editing ? (
                      <div style={{ position: "relative", maxWidth: 600 }}>
                        <input
                          type="text"
                          value={form.address}
                          readOnly
                          className="w-full bg-gray-100 p-2 rounded py-3 cursor-pointer"
                          placeholder="Click to select address"
                          onClick={() => setShowPicker(true)}
                        />
                        {showPicker && (
                          <div
                            ref={pickerRef}
                            style={{
                              position: "absolute",
                              zIndex: 10,
                              background: "white",
                              border: "1px solid #ccc",
                              borderRadius: 8,
                              padding: 16,
                              marginTop: 4,
                              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                              width: "100%",
                            }}
                          >
                            <div className="flex flex-col gap-2">
                              <div>
                                <label className="block text-sm mb-1">Province</label>
                                <select
                                  className="w-full bg-gray-100 p-2 rounded"
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
                              </div>
                              <div>
                                <label className="block text-sm mb-1">Municipality/City</label>
                                <select
                                  className="w-full bg-gray-100 p-2 rounded"
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
                              </div>
                              <div>
                                <label className="block text-sm mb-1">Barangay</label>
                                <select
                                  className="w-full bg-gray-100 p-2 rounded"
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
                              </div>
                              <button
                                className="mt-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                onClick={() => setShowPicker(false)}
                                type="button"
                              >
                                Cancel
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
                        className="w-full bg-gray-100 p-2 rounded py-3"
                      />
                    )}
                  </div>
                </div>
              </div>
              {/* Save/Cancel buttons at the lower right */}
              {editing && (
                <div className="flex justify-end mt-8">
                  <button
                    type="button"
                    className="bg-gray-400 text-white px-4 py-2 rounded mr-2"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-primary text-white px-4 py-2 rounded"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </form>
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
              <img
                src={previewUrl || profilePic || "/images/default-avatar.png"}
                alt="Profile Preview"
                className="w-32 h-32 rounded-full object-cover mb-4"
              />
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
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-green-700"
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
    </div>
  );
};

export default UserProfile;