import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, Head } from '@inertiajs/react';
import Header from '../../components/header';
import FacultySidebar from '../../components/facultySidebar';
import { FaSearch } from 'react-icons/fa';
import { FaSort } from 'react-icons/fa6';

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
            className={`px-4 py-2 ${buttonColor} text-white rounded hover:opacity-90 transition-colors duration-150`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

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

const FacultyExams = ({ auth }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cadets, setCadets] = useState([]);
  const [originalCadets, setOriginalCadets] = useState([]);
  const [semesterData, setSemesterData] = useState({}); // Cache data for each semester
  const [previousSemester, setPreviousSemester] = useState(null); // Track previous semester
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPlatoon, setSelectedPlatoon] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedBattalion, setSelectedBattalion] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('2025-2026 1st semester');
  const [currentPage, setCurrentPage] = useState(1);
  const cadetsPerPage = 8;
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  
  // Alert state
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const [maxFinal, setMaxFinal] = useState(() => {
    try {
      const raw = sessionStorage.getItem('facultyExamsMaxFinal_v2');
      const map = raw ? JSON.parse(raw) : {};
      return map['2025-2026 1st semester'] ?? 100;
    } catch (e) { return 100; }
  });
  const [maxMidterm, setMaxMidterm] = useState(() => {
    try {
      const raw = sessionStorage.getItem('facultyExamsMaxMidterm_v2');
      const map = raw ? JSON.parse(raw) : {};
      return map['2025-2026 1st semester'] ?? 100;
    } catch (e) { return 100; }
  });

  // Persist cache across pages (sidebar navigation) using sessionStorage
  const storageKey = 'facultyExamsCache_v2'; // Changed version to clear old cache
  const getStoredCache = () => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  };
  const setStoredCache = (cache) => {
    try { sessionStorage.setItem(storageKey, JSON.stringify(cache)); } catch (e) {}
  };

  const maxFinalStorageKey = 'facultyExamsMaxFinal_v2'; // Changed version to clear old cache
  const maxMidtermStorageKey = 'facultyExamsMaxMidterm_v2'; // Changed version to clear old cache
  const getStoredMaxFinalMap = () => {
    try {
      const raw = sessionStorage.getItem(maxFinalStorageKey);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  };
  const getStoredMaxMidtermMap = () => {
    try {
      const raw = sessionStorage.getItem(maxMidtermStorageKey);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {}
  };
  const setStoredMaxFinalForSemester = (semester, value) => {
    try {
      const map = getStoredMaxFinalMap();
      map[semester] = value;
      sessionStorage.setItem(maxFinalStorageKey, JSON.stringify(map));
    } catch (e) {}
  };
  const setStoredMaxMidtermForSemester = (semester, value) => {
    try {
      const map = getStoredMaxMidtermMap();
      map[semester] = value;
      sessionStorage.setItem(maxMidtermStorageKey, JSON.stringify(map));
    } catch (e) {}
  };

  // Semester options
  const semesterOptions = ['2025-2026 1st semester', '2025-2026 2nd semester'];

  // Reset edit state when switching semesters
  const resetEditState = () => {
    setIsEditing(false);
    // Reset cadets to original state to prevent stale data
    if (originalCadets.length > 0) {
      setCadets([...originalCadets]);
    }
  };

  // Function to fetch data based on selected semester
  const fetchDataForSemester = async (semester) => {
    setLoading(true);
    
    // Check in-memory cache first
    if (semesterData[semester]) {
      // Ensure proper empty value handling for cached data
      const processedCachedData = semesterData[semester].map(cadet => ({
        ...cadet,
        midterm_exam: cadet.midterm_exam === null || cadet.midterm_exam === undefined ? '' : cadet.midterm_exam,
        final_exam: cadet.final_exam === null || cadet.final_exam === undefined ? '' : cadet.final_exam
      }));
      
      setCadets(processedCachedData);
      setOriginalCadets(processedCachedData);
      // Kick off a background refresh to pick up newly added cadets
      (async () => {
        try {
          const response = await axios.get(`${window.location.protocol}//${window.location.host}/api/exams?semester=${encodeURIComponent(semester)}&_t=${Date.now()}`);
          const fresh = (response.data || []).map(c => ({
            ...c,
            midterm_exam: c.midterm_exam === null || c.midterm_exam === undefined ? '' : c.midterm_exam,
            final_exam: c.final_exam === null || c.final_exam === undefined ? '' : c.final_exam
          }));
          // Only update if count changed or data differs
          if (fresh.length !== processedCachedData.length) {
            setCadets(fresh);
            setOriginalCadets(fresh);
            setSemesterData(prev => ({ ...prev, [semester]: fresh }));
            const nextStored = getStoredCache();
            nextStored[semester] = fresh;
            setStoredCache(nextStored);
          }
        } catch (e) {}
        setLoading(false);
      })();
      return;
    }

    // Then check sessionStorage cache (persists across pages)
    const stored = getStoredCache();
    if (stored[semester]) {
      const processedStored = stored[semester].map(cadet => ({
        ...cadet,
        midterm_exam: cadet.midterm_exam === null || cadet.midterm_exam === undefined ? '' : cadet.midterm_exam,
        final_exam: cadet.final_exam === null || cadet.final_exam === undefined ? '' : cadet.final_exam
      }));
      setCadets(processedStored);
      setOriginalCadets(processedStored);
      setSemesterData(prev => ({ ...prev, [semester]: processedStored }));
      // Background refresh to pick up newly added cadets
      (async () => {
        try {
          const response = await axios.get(`${window.location.protocol}//${window.location.host}/api/exams?semester=${encodeURIComponent(semester)}&_t=${Date.now()}`);
          const fresh = (response.data || []).map(c => ({
            ...c,
            midterm_exam: c.midterm_exam === null || c.midterm_exam === undefined ? '' : c.midterm_exam,
            final_exam: c.final_exam === null || c.final_exam === undefined ? '' : c.final_exam
          }));
          if (fresh.length !== processedStored.length) {
            setCadets(fresh);
            setOriginalCadets(fresh);
            setSemesterData(prev => ({ ...prev, [semester]: fresh }));
            const nextStored = getStoredCache();
            nextStored[semester] = fresh;
            setStoredCache(nextStored);
          }
        } catch (e) {}
        setLoading(false);
      })();
      return;
    }
    
    const semesterParam = encodeURIComponent(semester);
    const root = `${window.location.protocol}//${window.location.host}`;
    const ts = Date.now(); // cache busting to avoid stale responses when returning from other tabs
    
    try {
      const response = await axios.get(`${root}/api/exams?semester=${semesterParam}&_t=${ts}`);
      const data = response.data;
      
      // Debug logging to see what data is received
      console.log(`Received data for ${semester}:`, data.length, 'cadets');
      console.log('First few cadets:', data.slice(0, 3).map(c => `${c.last_name}, ${c.first_name}`));
      
      // Ensure proper empty value handling for input fields
      const processedData = data.map(cadet => ({
        ...cadet,
        midterm_exam: cadet.midterm_exam === null || cadet.midterm_exam === undefined ? '' : cadet.midterm_exam,
        final_exam: cadet.final_exam === null || cadet.final_exam === undefined ? '' : cadet.final_exam
      }));
      
      setCadets(processedData);
      setOriginalCadets(processedData); // Store original data for cancel functionality
      
      // Cache the data for this semester (memory + sessionStorage)
      setSemesterData(prev => ({
        ...prev,
        [semester]: processedData
      }));
      const nextStored = getStoredCache();
      nextStored[semester] = processedData;
      setStoredCache(nextStored);
    } catch (err) {
      console.error('Failed to fetch exam data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchDataForSemester(selectedSemester);
  }, []);

  // Fetch data when semester changes
  useEffect(() => {
    if (selectedSemester) {
      // If currently editing, cancel editing and discard changes
      if (isEditing) {
        resetEditState();
        console.log('Switching semesters. Unsaved changes discarded.');
      }

      // Clear any local edits by resetting cadets to original state
      // This prevents stale edited values from showing when switching back
      if (previousSemester && previousSemester !== selectedSemester) {
        // Clear the cache for the previous semester to ensure fresh data
        setSemesterData(prev => {
          const newData = { ...prev };
          delete newData[previousSemester];
          return newData;
        });
      }

      // Update previous semester
      setPreviousSemester(selectedSemester);
      // Load stored max values for this semester
      const mapF = getStoredMaxFinalMap();
      const mapM = getStoredMaxMidtermMap();
      setMaxFinal(mapF[selectedSemester] !== undefined && mapF[selectedSemester] !== null ? Number(mapF[selectedSemester]) || 100 : 100);
      setMaxMidterm(mapM[selectedSemester] !== undefined && mapM[selectedSemester] !== null ? Number(mapM[selectedSemester]) || 100 : 100);

      fetchDataForSemester(selectedSemester);
    }
  }, [selectedSemester]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedPlatoon, selectedCompany, selectedBattalion]);

  const handleEdit = () => {
    setOriginalCadets([...cadets]); // Store current state as original before editing
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (isSaving) return; // Prevent multiple saves
    
    setIsSaving(true);
    
    try {
      const scores = cadets.map(cadet => {
        const final = cadet.final_exam === '' || cadet.final_exam === null ? '' : Number(cadet.final_exam) || 0;
        const midterm = cadet.midterm_exam === '' || cadet.midterm_exam === null ? '' : Number(cadet.midterm_exam) || 0;
        
        let average = 0;
        if (selectedSemester === '2025-2026 2nd semester') {
          // 2nd semester: mean of normalized FE and ME
          const finalNorm = (Number(maxFinal) || 0) > 0 ? ((final === '' ? 0 : final) / Number(maxFinal)) : 0;
          const midNorm = (Number(maxMidterm) || 0) > 0 ? ((midterm === '' ? 0 : midterm) / Number(maxMidterm)) : 0;
          average = ((finalNorm + midNorm) / 2) * 100;
        } else {
          // 1st semester: (Final / Max FE) * 100
          const denominator = Math.max(1, (Number(maxFinal) || 0));
          average = final === '' ? 0 : (final / denominator) * 100;
        }
        // Format average based on semester
        average = selectedSemester === '2025-2026 2nd semester' 
          ? parseFloat(average.toFixed(2))  // 2nd semester: 2 decimal places
          : Math.round(average);  // 1st semester: whole number
        
        // Calculate subject_prof (40%)
        const subjectProf = Math.min(40, Math.round(average * 0.40));
        
        return {
          id: cadet.id,
          final_exam: cadet.final_exam,
          midterm_exam: cadet.midterm_exam,
          average: average,
          subject_prof: subjectProf,
        };
      });
      // Get CSRF token from meta tag
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
      if (!csrfToken) {
        console.error('CSRF token not found. Please refresh the page and try again.');
        setAlertDialog({
          isOpen: true,
          type: 'error',
          title: 'Session Error',
          message: 'CSRF token not found. Please refresh the page and try again.'
        });
        return;
      }

      const response = await axios.post(`/api/exams/save`, { 
        scores,
        semester: selectedSemester,
        max_final: Number(maxFinal) || 100,
        max_midterm: Number(maxMidterm) || 100,
      }, { 
        headers: { 
          'X-CSRF-TOKEN': csrfToken, 
          'Accept': 'application/json', 
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest' 
        }, 
        withCredentials: true 
      });
      
      if (response.status === 200) {
        console.log('Successfully saved exam scores!');
        setIsEditing(false);
        // Update original data to current state after successful save
        setOriginalCadets([...cadets]);
        
        // Update caches (memory + sessionStorage)
        setSemesterData(prev => ({
          ...prev,
          [selectedSemester]: [...cadets]
        }));
        const stored = getStoredCache();
        stored[selectedSemester] = [...cadets];
        setStoredCache(stored);
        
        // Show success alert
        setAlertDialog({
          isOpen: true,
          type: 'success',
          title: 'Success!',
          message: 'Exam scores have been saved successfully.'
        });
        
        // Sync with server to ensure what shows next time is the persisted data
        await fetchDataForSemester(selectedSemester);
      } else {
        console.error('Failed to save exam scores. Please try again.');
        setAlertDialog({
          isOpen: true,
          type: 'error',
          title: 'Save Failed',
          message: 'Failed to save exam scores. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error saving exam scores:', error);
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const message = error.response.data?.message || 'Unknown error occurred';
        
        let errorMessage = '';
        if (status === 419) {
          errorMessage = 'Session expired. Please refresh the page and try again.';
          console.error('Session expired. Please refresh the page and try again.');
        } else if (status === 422) {
          errorMessage = `Validation error: ${message}`;
          console.error('Validation error: ' + message);
        } else if (status === 403) {
          errorMessage = 'Access denied. You may not have permission to save exam scores.';
          console.error('Access denied. You may not have permission to save exam scores.');
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again or contact support.';
          console.error('Server error. Please try again or contact support.');
        } else {
          errorMessage = `Error ${status}: ${message}`;
          console.error(`Error ${status}: ${message}`);
        }
        
        setAlertDialog({
          isOpen: true,
          type: 'error',
          title: 'Error Saving',
          message: errorMessage
        });
      } else if (error.request) {
        // Network error
        console.error('Network error. Please check your connection and try again.');
        setAlertDialog({
          isOpen: true,
          type: 'error',
          title: 'Network Error',
          message: 'Network error. Please check your connection and try again.'
        });
      } else {
        // Other error
        console.error('An unexpected error occurred. Please try again.');
        setAlertDialog({
          isOpen: true,
          type: 'error',
          title: 'Unexpected Error',
          message: 'An unexpected error occurred. Please try again.'
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Deep clone and ensure proper empty value handling
    const resetCadets = originalCadets.map(cadet => ({
      ...cadet,
      midterm_exam: cadet.midterm_exam === null || cadet.midterm_exam === undefined ? '' : cadet.midterm_exam,
      final_exam: cadet.final_exam === null || cadet.final_exam === undefined ? '' : cadet.final_exam
    }));
    
    setCadets(resetCadets); // Reset to original state
    setIsEditing(false);
    
    // Update the cache to reflect the reset state (memory + sessionStorage)
    setSemesterData(prev => ({
      ...prev,
      [selectedSemester]: resetCadets
    }));
    const stored = getStoredCache();
    stored[selectedSemester] = resetCadets;
    setStoredCache(stored);
    
    console.log('Editing cancelled. Changes discarded.');
  };

  // Handle input change for midterm/final
  const handleScoreChange = (id, field, value) => {
    // Allow empty string for controlled input
    if (value === '') {
      const updatedCadets = cadets.map(cadet =>
        cadet.id === id ? { ...cadet, [field]: '' } : cadet
      );
      setCadets(updatedCadets);
      
      // Update cache for this semester
      setSemesterData(prev => ({
        ...prev,
        [selectedSemester]: updatedCadets
      }));
      return;
    }
    let num = Number(value);
    // Apply dynamic max based on field
    const cap = field === 'midterm_exam' ? (Number(maxMidterm) || 100) : (Number(maxFinal) || 100);
    if (num > cap) num = cap;
    if (num < 0) num = 0;
    const updatedCadets = cadets.map(cadet =>
      cadet.id === id ? { ...cadet, [field]: num } : cadet
    );
    setCadets(updatedCadets);
    
    // Update cache for this semester
    setSemesterData(prev => ({
      ...prev,
      [selectedSemester]: updatedCadets
    }));
  };

  const formatCadetName = (cadet) => {
    const lastName = cadet.last_name || '';
    const firstName = cadet.first_name || '';
    const middleName = cadet.middle_name || '';
    const middleInitial = middleName ? ` ${middleName.charAt(0)}.` : '';
    return `${lastName}, ${firstName}${middleInitial}`;
  };

  // Filter, sort, and paginate cadets
  // The API already returns only cadets, so no need to filter by role here
  const filteredCadets = cadets
    .filter(cadet => {
      const nameMatches = formatCadetName(cadet).toLowerCase().includes(search.toLowerCase());
      const platoonMatches = !selectedPlatoon || cadet.platoon === selectedPlatoon;
      const companyMatches = !selectedCompany || cadet.company === selectedCompany;
      const battalionMatches = !selectedBattalion || cadet.battalion === selectedBattalion;
      return nameMatches && platoonMatches && companyMatches && battalionMatches;
    })
    .sort((a, b) => formatCadetName(a).localeCompare(formatCadetName(b)));

  const totalPages = Math.ceil(filteredCadets.length / cadetsPerPage);
  const paginatedCadets = filteredCadets.slice(
    (currentPage - 1) * cadetsPerPage,
    currentPage * cadetsPerPage
  );

  return (
    <>
      <Head title="ROTC Portal - Exams" />
      <div className='w-full min-h-screen bg-backgroundColor'>
      <Header auth={auth} />
      <div className='flex flex-col md:flex-row'>
        <FacultySidebar />
        <div className='flex-1 p-3 md:p-6'>
          <div className='font-regular animate-fade-in-up'>
          {/* Breadcrumb - separated, light background */}
          <div className='bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 text-sm md:text-base animate-fade-in-up'>
                <Link href="/faculty/facultyHome" className="hover:underline cursor-pointer font-semibold">
                  Dashboard
                </Link>
                <span className="mx-2 font-semibold">{">"}</span>
                <span className="cursor-default font-bold">Exams</span>
          </div>
          {/* Page Header */}
          <div className='flex items-center justify-between mt-3 md:mt-4 mb-4 md:mb-6 pl-3 md:pl-5 py-4 md:py-7 bg-primary text-white p-3 md:p-4 rounded-lg animate-fade-in-down'>
            <h1 className='text-lg md:text-2xl font-semibold'>Exams</h1>
          </div>
          {/* Main Content */}
          <div className='w-full mx-auto'>
            
            {/* Tabs Bar with Search and Filter on the right */}
            <div className='bg-white p-3 md:p-6 rounded-lg shadow mb-4 md:mb-6 animate-scale-in-up'>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  {semesterOptions.map((semester) => (
                    <button
                      key={semester}
                      onClick={() => {
                        // Reset edit state when switching semesters
                        resetEditState();
                        setCurrentPage(1);
                        setSelectedSemester(semester);
                        console.log(`Switched to ${semester}. Edit mode disabled.`);
                      }}
                      disabled={loading}
                      className={`w-full sm:w-auto py-2 px-3 md:px-4 rounded-lg transition-colors duration-150 text-sm md:text-base ${
                        selectedSemester === semester
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {semester}
                    </button>
                  ))}
                  {loading && (
                    <div className="ml-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
                <div className='flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 w-full lg:w-auto'>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full lg:w-auto">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {selectedSemester === '2025-2026 2nd semester' && (
                        <>
                          <label className="text-gray-600 text-sm">Max ME</label>
                          <input
                            type="number"
                            min="1"
                            className={`w-20 md:w-24 p-2 border border-gray-300 rounded-lg text-center text-sm ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            value={maxMidterm}
                            disabled={!isEditing}
                            onChange={e => {
                              if (!isEditing) return;
                              const val = Math.max(1, Number(e.target.value) || 0);
                              setMaxMidterm(val);
                              setStoredMaxMidtermForSemester(selectedSemester, val);
                              // Also normalize any current inputs above the new cap (midterms)
                              setCadets(prev => prev.map(c => ({
                                ...c,
                                midterm_exam: c.midterm_exam === '' || c.midterm_exam === null ? '' : Math.min(val, Number(c.midterm_exam) || 0),
                              })));
                            }}
                          />
                        </>
                      )}
                      <label className="text-gray-600 text-sm">Max FE</label>
                      <input
                        type="number"
                        min="1"
                        className={`w-20 md:w-24 p-2 border border-gray-300 rounded-lg text-center text-sm ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        value={maxFinal}
                        disabled={!isEditing}
                        onChange={e => {
                          if (!isEditing) return;
                          const val = Math.max(1, Number(e.target.value) || 0);
                          setMaxFinal(val);
                          setStoredMaxFinalForSemester(selectedSemester, val);
                          // Also normalize any current inputs above the new cap (finals)
                          setCadets(prev => prev.map(c => ({
                            ...c,
                            final_exam: c.final_exam === '' || c.final_exam === null ? '' : Math.min(val, Number(c.final_exam) || 0),
                          })));
                        }}
                      />
                    </div>
                    <div className="relative w-full sm:w-auto">
                      <FaSearch className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="search"
                        placeholder="Search"
                        className="w-full sm:w-48 p-2 pl-10 border border-gray-300 rounded-lg text-sm md:text-base"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                      />
                    </div>
                    <div className="relative w-full sm:w-auto">
                      <div
                        className="relative flex items-center justify-between bg-white border border-gray-300 rounded-lg px-3 py-2 cursor-pointer text-sm md:text-base w-full hover:border-gray-400"
                        onClick={() => setShowFilterPicker(!showFilterPicker)}
                      >
                        <span className="text-gray-600 truncate">
                          {selectedPlatoon || selectedCompany || selectedBattalion
                            ? `Filters: ${[
                                selectedPlatoon || '',
                                selectedCompany || '',
                                selectedBattalion || ''
                              ].filter(Boolean).join(', ')}`
                            : 'Sort by : All'}
                        </span>
                        <FaSort className="text-gray-400 flex-shrink-0 ml-2" />
                      </div>
                      {showFilterPicker && (
                      <>
                        <div 
                          className="fixed inset-0 bg-black bg-opacity-30 z-40"
                          onClick={() => setShowFilterPicker(false)}
                        ></div>
                        <div
                          className="fixed sm:absolute inset-x-0 sm:inset-auto z-50 bg-white border border-gray-300 rounded-lg p-4 mt-1 shadow-lg w-[90%] sm:w-64 left-1/2 sm:left-auto right-0 sm:right-0 -translate-x-1/2 sm:translate-x-0 mx-auto sm:mx-0"
                          style={{ maxWidth: "400px" }}
                        >
                          <div className="space-y-3 md:space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Platoon</label>
                              <select
                                className="w-full bg-gray-100 p-2 rounded border text-sm"
                                value={selectedPlatoon}
                                onChange={e => setSelectedPlatoon(e.target.value)}
                              >
                                <option value="">Select Platoon</option>
                                <option value="1st Platoon">1st Platoon</option>
                                <option value="2nd Platoon">2nd Platoon</option>
                                <option value="3rd Platoon">3rd Platoon</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Company</label>
                              <select
                                className="w-full bg-gray-100 p-2 rounded border text-sm"
                                value={selectedCompany}
                                onChange={e => setSelectedCompany(e.target.value)}
                              >
                                <option value="">Select Company</option>
                                <option value="Alpha">Alpha</option>
                                <option value="Beta">Beta</option>
                                <option value="Charlie">Charlie</option>
                                <option value="Delta">Delta</option>
                                </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-2">Battalion</label>
                              <select
                                className="w-full bg-gray-100 p-2 rounded border text-sm"
                                value={selectedBattalion}
                                onChange={e => setSelectedBattalion(e.target.value)}
                              >
                                <option value="">Select Battalion</option>
                                <option value="1st Battalion">1st Battalion</option>
                                <option value="2nd Battalion">2nd Battalion</option>
                              </select>
                            </div>
                            <div className="flex gap-2 mt-4">
                              <button
                                className="flex-1 px-4 py-2 bg-gray-300 rounded text-sm hover:bg-gray-400 text-gray-700"
                                onClick={() => {
                                  setSelectedPlatoon('');
                                  setSelectedCompany('');
                                  setSelectedBattalion('');
                                  setShowFilterPicker(false);
                                }}
                              >
                                Clear
                              </button>
                              <button
                                className="flex-1 px-4 py-2 bg-primary rounded text-sm md:text-base text-white hover:bg-opacity-90"
                                onClick={() => setShowFilterPicker(false)}
                              >
                                Apply
                                </button>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Mobile-only quick action below filters */}
                  <div className="flex lg:hidden items-center w-full sm:w-auto">
                    {!isEditing ? (
                      <button 
                        onClick={handleEdit}
                        className='bg-primary text-white px-3 md:px-4 py-2 rounded hover:bg-[#3d4422] transition-colors duration-150 w-full text-sm md:text-base'
                      >
                        Edit Scores
                      </button>
                    ) : (
                      <div className="flex gap-2 w-full">
                        <button 
                          onClick={handleCancel}
                          className="bg-gray-500 text-white px-3 md:px-4 py-2 rounded hover:bg-gray-600 transition-colors duration-150 flex-1 text-sm md:text-base"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleSave}
                          disabled={isSaving}
                          className={`bg-primary text-white px-3 md:px-4 py-2 rounded transition-colors duration-150 flex-1 text-sm md:text-base ${
                            isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary'
                          }`}
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className='bg-white p-3 md:p-6 rounded-lg shadow w-full mx-auto animate-scale-in-up'>
              {/* Title and Controls */}
              <div className='flex justify-between items-center mb-4 md:mb-6 animate-fade-in-up'>
                <h1 className='text-base md:text-lg font-semibold text-black'>Exam Record</h1>
              </div>
              
              <div className="overflow-x-auto -mx-3 md:mx-0 animate-fade-in-up">
                <div className="min-w-full">
                  <table className='w-full border-collapse min-w-[600px]'>
                    <thead className='text-gray-600'>
                      <tr>
                        <th className='p-2 md:p-3 border-b font-medium text-left text-sm md:text-base'>Cadet Names</th>
                        {selectedSemester === '2025-2026 2nd semester' ? (
                          <>
                            <th className='p-2 md:p-3 border-b font-medium text-center text-sm md:text-base'>Midterm Exam</th>
                            <th className='p-2 md:p-3 border-b font-medium text-center text-sm md:text-base'>Final Exam</th>
                            <th className='p-2 md:p-3 border-b font-medium text-center text-sm md:text-base'>Total</th>
                          </>
                        ) : (
                          <th className='p-2 md:p-3 border-b font-medium text-center text-sm md:text-base'>Final Exam</th>
                        )}
                        <th className='p-2 md:p-3 border-b font-medium text-center text-sm md:text-base'>Average</th>
                        <th className='p-2 md:p-3 border-b font-medium text-center text-sm md:text-base'>Subject Prof. (40%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCadets.map(cadet => {
                        const final = (cadet.final_exam === '' || cadet.final_exam === null) ? 0 : Number(cadet.final_exam) || 0;
                        const midterm = (cadet.midterm_exam === '' || cadet.midterm_exam === null) ? 0 : Number(cadet.midterm_exam) || 0;
                        
                        // Calculate total and average based on semester
                        const total = final + midterm;
                        let average = 0;
                        if (selectedSemester === '2025-2026 2nd semester') {
                          // 2nd sem: mean of normalized scores
                          const finalNorm = (Number(maxFinal) || 0) > 0 ? (final / Number(maxFinal)) : 0;
                          const midNorm = (Number(maxMidterm) || 0) > 0 ? (midterm / Number(maxMidterm)) : 0;
                          average = ((finalNorm + midNorm) / 2) * 100;
                        } else {
                          // 1st sem: final over Max FE
                          const denominator = Math.max(1, (Number(maxFinal) || 0));
                          average = final === '' ? 0 : (final / denominator) * 100;
                        }
                        // Format average based on semester
                        const formattedAverage = selectedSemester === '2025-2026 2nd semester' 
                          ? average.toFixed(2)  // 2nd semester: 2 decimal places
                          : Math.round(average).toString();  // 1st semester: whole number
                        
                        const equivalent = (average === 0)
                          ? '0'
                          : Math.min(40, Math.round(average * 0.40)).toString();
                        return (
                          <tr className='border-b border-gray-200' key={cadet.id}>
                            <td className='p-2 md:p-3 text-black text-sm md:text-base'>{formatCadetName(cadet)}</td>
                            {selectedSemester === '2025-2026 2nd semester' ? (
                              <>
                                <td className='p-2 md:p-3 text-center'>
                                  <input
                                    type="number"
                                    min="0"
                                    max={Number(maxMidterm) || undefined}
                                    className={`w-12 md:w-16 text-center border border-gray-300 rounded p-1 text-sm ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    value={cadet.midterm_exam === '' || cadet.midterm_exam === null ? '' : cadet.midterm_exam}
                                    disabled={!isEditing}
                                    onChange={e => handleScoreChange(cadet.id, 'midterm_exam', e.target.value)}
                                  />
                                </td>
                                <td className='p-2 md:p-3 text-center'>
                                  <input
                                    type="number"
                                    min="0"
                                    max={Number(maxFinal) || undefined}
                                    className={`w-12 md:w-16 text-center border border-gray-300 rounded p-1 text-sm ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    value={cadet.final_exam === '' || cadet.final_exam === null ? '' : cadet.final_exam}
                                    disabled={!isEditing}
                                    onChange={e => handleScoreChange(cadet.id, 'final_exam', e.target.value)}
                                  />
                                </td>
                                <td className='p-2 md:p-3 text-center text-black text-sm md:text-base'>
                                  {total}
                                </td>
                              </>
                            ) : (
                              <td className='p-2 md:p-3 text-center'>
                                <input
                                  type="number"
                                  min="0"
                                  max={Number(maxFinal) || undefined}
                                  className={`w-12 md:w-16 text-center border border-gray-300 rounded p-1 text-sm ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                  value={cadet.final_exam === '' || cadet.final_exam === null ? '' : cadet.final_exam}
                                  disabled={!isEditing}
                                  onChange={e => handleScoreChange(cadet.id, 'final_exam', e.target.value)}
                                />
                              </td>
                            )}
                              <td className='p-2 md:p-3 text-center text-black text-sm md:text-base'>
                                {formattedAverage}
                              </td>
                            <td className='p-2 md:p-3 text-center text-black text-sm md:text-base'>{equivalent}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Footer with Pagination, Pagination Buttons, and Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 w-full gap-4">
                <div className="text-gray-600 text-sm md:text-base order-2 sm:order-1">
                  Showing data {(currentPage - 1) * cadetsPerPage + 1} to {Math.min(currentPage * cadetsPerPage, filteredCadets.length)} of {filteredCadets.length} cadets
                </div>
                
                {/* Pagination Buttons - Only show if more than 1 page */}
                <div className="flex justify-center order-1 sm:order-2 w-full sm:w-auto gap-2">
                  {totalPages > 1 && (
                    <>
                      {currentPage > 1 && (
                        <button
                          className="px-3 md:px-4 py-2 rounded bg-white border text-sm md:text-base hover:bg-gray-50 transition-colors"
                          onClick={() => setCurrentPage(currentPage - 1)}
                        >
                          {'<'}
                        </button>
                      )}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        if (pageNum > totalPages) return null;
                        return (
                          <button
                            key={pageNum}
                            className={`px-3 md:px-4 py-2 rounded text-sm md:text-base transition-colors ${currentPage === pageNum ? 'bg-primary text-white hover:bg-primary/90' : 'bg-white border hover:bg-gray-50'}`}
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      {currentPage < totalPages && (
                        <button
                          className="px-3 md:px-4 py-2 rounded bg-white border text-sm md:text-base hover:bg-gray-50 transition-colors"
                          onClick={() => setCurrentPage(currentPage + 1)}
                        >
                          &gt;
                        </button>
                      )}
                    </>
                  )}
                </div>
                
                {/* Action Buttons - Always visible */}
                <div className="flex justify-end gap-2 order-3 w-full sm:w-auto">
                  {!isEditing ? (
                    <button 
                      onClick={handleEdit}
                      className='bg-primary text-white px-3 md:px-4 py-2 rounded hover:bg-[#3d4422] transition-colors duration-150 text-sm md:text-base'
                    >
                      Edit Scores
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={handleCancel}
                        className="bg-gray-500 text-white px-3 md:px-4 py-2 rounded hover:bg-gray-600 transition-colors duration-150 text-sm md:text-base"
                      >
                        Cancel
                      </button>

                      <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`bg-primary text-white px-3 md:px-4 py-2 rounded transition-colors duration-150 text-sm md:text-base ${
                          isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary'
                        }`}
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        type={alertDialog.type}
        title={alertDialog.title}
        message={alertDialog.message}
        onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })}
      />
    </div>
    </>
  );
};

export default FacultyExams;