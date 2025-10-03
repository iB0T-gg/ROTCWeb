import React, { useState, useEffect } from 'react';
const toast = { info: () => {}, success: () => {}, error: () => {} };
import axios from 'axios';
import { Link } from '@inertiajs/react';
import Header from '../../components/header';
import FacultySidebar from '../../components/facultySidebar';
import { FaSearch } from 'react-icons/fa';
import { FaSort } from 'react-icons/fa6';

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
  const [activeTab, setActiveTab] = useState('current'); // 'current' or 'previous'
  const [maxFinal, setMaxFinal] = useState(() => {
    try {
      const raw = sessionStorage.getItem('facultyExamsMaxFinal_v1');
      const map = raw ? JSON.parse(raw) : {};
      return map['2025-2026 1st semester'] ?? 100;
    } catch (e) { return 100; }
  });
  const [maxMidterm, setMaxMidterm] = useState(() => {
    try {
      const raw = sessionStorage.getItem('facultyExamsMaxMidterm_v1');
      const map = raw ? JSON.parse(raw) : {};
      return map['2025-2026 1st semester'] ?? 100;
    } catch (e) { return 100; }
  });

  // Persist cache across pages (sidebar navigation) using sessionStorage
  const storageKey = 'facultyExamsCache_v1';
  const getStoredCache = () => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  };
  const setStoredCache = (cache) => {
    try { sessionStorage.setItem(storageKey, JSON.stringify(cache)); } catch (e) {}
  };

  const maxFinalStorageKey = 'facultyExamsMaxFinal_v1';
  const maxMidtermStorageKey = 'facultyExamsMaxMidterm_v1';
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
  const semesterOptions = ['2025-2026 1st semester', '2026-2027 2nd semester'];

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
      setLoading(false);
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
      setLoading(false);
      return;
    }
    
    const semesterParam = encodeURIComponent(semester);
    const root = `${window.location.protocol}//${window.location.host}`;
    const ts = Date.now(); // cache busting to avoid stale responses when returning from other tabs
    
    try {
      const response = await axios.get(`${root}/api/exams?semester=${semesterParam}&_t=${ts}`);
      const data = response.data;
      
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
        toast.info('Switching semesters. Unsaved changes discarded.');
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
    toast.info('Edit mode enabled. You can now modify exam scores.');
  };

  const handleSave = async () => {
    try {
      const scores = cadets.map(cadet => {
        const final = cadet.final_exam === '' || cadet.final_exam === null ? '' : Number(cadet.final_exam) || 0;
        const midterm = cadet.midterm_exam === '' || cadet.midterm_exam === null ? '' : Number(cadet.midterm_exam) || 0;
        
        let average = 0;
        if (selectedSemester === '2026-2027 2nd semester') {
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
        average = selectedSemester === '2026-2027 2nd semester' 
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
      // CSRF: try meta tag first, then fall back to XSRF-TOKEN cookie
      const metaToken = document.querySelector('meta[name="csrf-token"]')?.content;
      const cookieToken = (() => {
        try {
          const raw = document.cookie.split('; ').find(r => r.startsWith('XSRF-TOKEN='));
          return raw ? decodeURIComponent(raw.split('=')[1]) : undefined;
        } catch { return undefined; }
      })();
      const csrfToken = metaToken || cookieToken;
      const response = await axios.post(`/api/exams/save`, { 
        scores,
        semester: selectedSemester,
        max_final: Number(maxFinal) || 100,
        max_midterm: Number(maxMidterm) || 100,
      }, { headers: { 'X-CSRF-TOKEN': csrfToken, 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, withCredentials: true });
      if (response.status === 200) {
        toast.success('Successfully saved exam scores.');
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
        
        // Sync with server to ensure what shows next time is the persisted data
        await fetchDataForSemester(selectedSemester);
      } else {
        toast.error('Failed to save exam scores.');
      }
    } catch (error) {
      console.error('Error saving exam scores:', error);
      toast.error('Error saving exam scores.');
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
    
    toast.info('Editing cancelled. Changes discarded.');
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
    <div className='w-full min-h-screen bg-backgroundColor'>
      <Header auth={auth} />
      <div className='flex'>
        <FacultySidebar />
        <div className='flex-1 p-6'>
          {/* Breadcrumb - separated, light background */}
          <div className='bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 text-sm md:text-base'>
                <Link href="/faculty/facultyHome" className="hover:underline cursor-pointer font-semibold">
                  Dashboard
                </Link>
                <span className="mx-2 font-semibold">{">"}</span>
                <span className="cursor-default font-bold">Exams</span>
          </div>
          {/* Page Header */}
          <div className='flex items-center justify-between mt-4 mb-6 pl-5 py-7 bg-primary text-white p-4 rounded-lg'>
            <h1 className='text-2xl font-semibold'>Exams</h1>
          </div>
          {/* Main Content */}
          <div className='w-full mx-auto'>
            
            {/* Tabs Bar with Search and Filter on the right */}
            <div className='bg-white p-6 rounded-lg shadow mb-6'>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {semesterOptions.map((semester) => (
                    <button
                      key={semester}
                      onClick={() => {
                        // Reset edit state when switching semesters
                        resetEditState();
                        setCurrentPage(1);
                        setSelectedSemester(semester);
                        toast.info(`Switched to ${semester}. Edit mode disabled.`);
                      }}
                      disabled={loading}
                      className={`py-2 px-4 rounded-lg transition-colors duration-150 ${
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
                <div className='flex items-center gap-4'>
                  <div className="flex items-center gap-2">
                    {selectedSemester === '2026-2027 2nd semester' && (
                      <>
                        <label className="text-gray-600">Max ME</label>
                        <input
                          type="number"
                          min="1"
                          className={`w-24 p-2 border border-gray-300 rounded-lg text-center ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                    <label className="text-gray-600">Max FE</label>
                    <input
                      type="number"
                      min="1"
                      className={`w-24 p-2 border border-gray-300 rounded-lg text-center ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="search"
                      placeholder="Search"
                      className="w-48 p-2 pl-10 border border-gray-300 rounded-lg"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <div
                      className="bg-white border border-gray-300 rounded-lg p-2 pl-9 pr-8 cursor-pointer"
                      onClick={() => setShowFilterPicker(!showFilterPicker)}
                    >
                      <span className="text-gray-600">
                        {selectedPlatoon || selectedCompany || selectedBattalion
                          ? `Filters: ${[
                              selectedPlatoon || '',
                              selectedCompany || '',
                              selectedBattalion || ''
                            ].filter(Boolean).join(', ')}`
                          : 'Sort by : All'}
                      </span>
                      <FaSort className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    {showFilterPicker && (
                      <div
                        className="absolute z-10 bg-white border border-gray-300 rounded-lg p-4 mt-1 shadow-lg w-64"
                        style={{ top: '100%', right: 0 }}
                      >
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Platoon (Select Platoon)</label>
                            <select
                              className="w-full bg-gray-100 p-2 rounded border"
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">Company (Select Company)</label>
                            <select
                              className="w-full bg-gray-100 p-2 rounded border"
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">Battalion (Select Battalion)</label>
                            <select
                              className="w-full bg-gray-100 p-2 rounded border"
                              value={selectedBattalion}
                              onChange={e => setSelectedBattalion(e.target.value)}
                            >
                              <option value="">Select Battalion</option>
                              <option value="1st Battalion">1st Battalion</option>
                              <option value="2nd Battalion">2nd Battalion</option>
                            </select>
                          </div>
                          <button
                            className="w-full mt-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-gray-700"
                            onClick={() => setShowFilterPicker(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Current Semester Content */}
            {activeTab === 'current' && (
              <div className='bg-white p-6 rounded-lg shadow overflow-x-auto'>
                {/* Title and Controls */}
                <div className='flex justify-between items-center mb-6'>
                  <h1 className='text-lg font-semibold text-black'>Exam Record</h1>
                </div>
                <table className='w-full border-collapse'>
                <thead className='text-gray-600'>
                  <tr>
                    <th className='p-3 border-b font-medium text-left'>Cadet Names</th>
                    {selectedSemester === '2026-2027 2nd semester' ? (
                      <>
                        <th className='p-3 border-b font-medium text-center'>Midterm Exam</th>
                        <th className='p-3 border-b font-medium text-center'>Final Exam</th>
                        <th className='p-3 border-b font-medium text-center'>Total</th>
                      </>
                    ) : (
                      <th className='p-3 border-b font-medium text-center'>Final Exam</th>
                    )}
                    <th className='p-3 border-b font-medium text-center'>Average</th>
                    <th className='p-3 border-b font-medium text-center'>Subject Prof. (40%)</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCadets.map(cadet => {
                    const final = (cadet.final_exam === '' || cadet.final_exam === null) ? 0 : Number(cadet.final_exam) || 0;
                    const midterm = (cadet.midterm_exam === '' || cadet.midterm_exam === null) ? 0 : Number(cadet.midterm_exam) || 0;
                    
                    // Calculate total and average based on semester
                    const total = final + midterm;
                    let average = 0;
                    if (selectedSemester === '2026-2027 2nd semester') {
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
                    const formattedAverage = selectedSemester === '2026-2027 2nd semester' 
                      ? average.toFixed(2)  // 2nd semester: 2 decimal places
                      : Math.round(average).toString();  // 1st semester: whole number
                    
                    const equivalent = (average === 0)
                      ? '0'
                      : Math.min(40, Math.round(average * 0.40)).toString();
                    return (
                      <tr className='border-b border-gray-200' key={cadet.id}>
                        <td className='p-3 text-black'>{formatCadetName(cadet)}</td>
                        {selectedSemester === '2026-2027 2nd semester' ? (
                          <>
                            <td className='p-3 text-center'>
                              <input
                                type="number"
                                min="0"
                                max={Number(maxMidterm) || undefined}
                                className={`w-16 text-center border border-gray-300 rounded p-1 ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                value={cadet.midterm_exam === '' || cadet.midterm_exam === null ? '' : cadet.midterm_exam}
                                disabled={!isEditing}
                                onChange={e => handleScoreChange(cadet.id, 'midterm_exam', e.target.value)}
                              />
                            </td>
                            <td className='p-3 text-center'>
                              <input
                                type="number"
                                min="0"
                                max={Number(maxFinal) || undefined}
                                className={`w-16 text-center border border-gray-300 rounded p-1 ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                value={cadet.final_exam === '' || cadet.final_exam === null ? '' : cadet.final_exam}
                                disabled={!isEditing}
                                onChange={e => handleScoreChange(cadet.id, 'final_exam', e.target.value)}
                              />
                            </td>
                            <td className='p-3 text-center text-black'>
                              {total}
                            </td>
                          </>
                        ) : (
                          <td className='p-3 text-center'>
                            <input
                              type="number"
                              min="0"
                              max={Number(maxFinal) || undefined}
                              className={`w-16 text-center border border-gray-300 rounded p-1 ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                              value={cadet.final_exam === '' || cadet.final_exam === null ? '' : cadet.final_exam}
                              disabled={!isEditing}
                              onChange={e => handleScoreChange(cadet.id, 'final_exam', e.target.value)}
                            />
                          </td>
                        )}
                          <td className='p-3 text-center text-black'>
                            {formattedAverage}
                          </td>
                        <td className='p-3 text-center text-black'>{equivalent}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Footer with Pagination, Pagination Buttons, and Action Buttons */}
              <div className="flex justify-between items-center mt-4 w-full">
                <div className="text-gray-600">
                  Showing data {(currentPage - 1) * cadetsPerPage + 1} to {Math.min(currentPage * cadetsPerPage, filteredCadets.length)} of {filteredCadets.length} cadets
                </div>
                <div className="flex-1 flex justify-center">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      className={`mx-1 px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-primary text-white' : 'bg-white border'}`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  {currentPage < totalPages && (
                    <button
                      className="mx-1 px-3 py-1 rounded bg-white border"
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      &gt;
                    </button>
                  )}
                  {currentPage > 1 && (
                    <button
                      className="mx-1 px-3 py-1 rounded bg-white border"
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      {'<'}
                    </button>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  {!isEditing ? (
                    <button 
                      onClick={handleEdit}
                      className='bg-primary text-white px-4 py-2 rounded hover:bg-[#3d4422] transition-colors duration-150'
                    >
                      Edit Scores
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={handleCancel}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors duration-150"
                      >
                        Cancel
                      </button>

                      <button 
                        onClick={handleSave}
                        className="bg-primary text-white px-4 py-2 rounded hover:bg-primary transition-colors duration-150"
                      >
                        Save
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            )}
            
            {/* Previous Semester Content */}
            {activeTab === 'previous' && (
              <div className='bg-white p-6 rounded-lg shadow overflow-x-auto'>
                {/* Title and Controls */}
                <div className='flex justify-between items-center mb-6'>
                  <h1 className='text-lg font-semibold text-black'>Exam Record</h1>
                  <div className='flex items-center gap-4'>
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="search"
                        placeholder="Search"
                        className="w-48 p-2 pl-10 border border-gray-300 rounded-lg"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                      />
                    </div>
                    <div className="relative">
                      <div
                        className="bg-white border border-gray-300 rounded-lg p-2 pl-9 pr-8 cursor-pointer"
                        onClick={() => setShowFilterPicker(!showFilterPicker)}
                      >
                        <span className="text-gray-600">
                          {selectedPlatoon || selectedCompany || selectedBattalion
                            ? `Filters: ${[
                                selectedPlatoon || '',
                                selectedCompany || '',
                                selectedBattalion || ''
                              ].filter(Boolean).join(', ')}`
                            : 'Sort By : All'}
                        </span>
                        <FaSort className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                      {showFilterPicker && (
                        <div
                          className="absolute z-10 bg-white border border-gray-300 rounded-lg p-4 mt-1 shadow-lg w-64"
                          style={{ top: '100%', right: 0 }}
                        >
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Platoon (Select Platoon)</label>
                              <select
                                className="w-full bg-gray-100 p-2 rounded border"
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
                              <label className="block text-sm font-medium text-gray-700 mb-2">Company (Select Company)</label>
                              <select
                                className="w-full bg-gray-100 p-2 rounded border"
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
                              <label className="block text-sm font-medium text-gray-700 mb-2">Battalion (Select Battalion)</label>
                              <select
                                className="w-full bg-gray-100 p-2 rounded border"
                                value={selectedBattalion}
                                onChange={e => setSelectedBattalion(e.target.value)}
                              >
                                <option value="">Select Battalion</option>
                                <option value="1st Battalion">1st Battalion</option>
                                <option value="2nd Battalion">2nd Battalion</option>
                              </select>
                            </div>
                            <button
                              className="w-full mt-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-gray-700"
                              onClick={() => setShowFilterPicker(false)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <table className='w-full border-collapse'>
                  <thead className='text-gray-600'>
                    <tr>
                      <th className='p-3 border-b font-medium text-left'>Cadet Names</th>
                      {selectedSemester === '2026-2027 2nd semester' ? (
                        <>
                          <th className='p-3 border-b font-medium text-center'>Midterm Exam</th>
                          <th className='p-3 border-b font-medium text-center'>Final Exam</th>
                          <th className='p-3 border-b font-medium text-center'>Total</th>
                        </>
                      ) : (
                        <th className='p-3 border-b font-medium text-center'>Final Exam</th>
                      )}
                      <th className='p-3 border-b font-medium text-center'>Average</th>
                      <th className='p-3 border-b font-medium text-center'>Subject Prof. (40%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCadets.map(cadet => {
                      const final = (cadet.final_exam === '' || cadet.final_exam === null) ? 0 : Number(cadet.final_exam) || 0;
                      const midterm = (cadet.midterm_exam === '' || cadet.midterm_exam === null) ? 0 : Number(cadet.midterm_exam) || 0;
                      
                      // Calculate total and average based on semester
                      const total = final + midterm;
                      let average = 0;
                      if (selectedSemester === '2026-2027 2nd semester') {
                        // For 2nd semester: (Total / (2 * maxScore)) * 100
                        const denominator = Math.max(1, (Number(maxScore) || 0) * 2);
                        average = total > 0 ? (total / denominator) * 100 : 0;
                      } else {
                        // For 1st semester: (Final / maxScore) * 100
                        const denominator = Math.max(1, (Number(maxScore) || 0));
                        average = final === '' ? 0 : (final / denominator) * 100;
                      }
                      // Format average based on semester
                      const formattedAverage = selectedSemester === '2026-2027 2nd semester' 
                        ? average.toFixed(2)  // 2nd semester: 2 decimal places
                        : Math.round(average).toString();  // 1st semester: whole number
                      
                      const equivalent = (average === 0)
                        ? '0'
                        : Math.min(40, Math.round(average * 0.40)).toString();
                      return (
                        <tr className='border-b border-gray-200' key={cadet.id}>
                          <td className='p-3 text-black'>{formatCadetName(cadet)}</td>
                          {selectedSemester === '2026-2027 2nd semester' ? (
                            <>
                              <td className='p-3 text-center'>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  className={`w-16 text-center border border-gray-300 rounded p-1 ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                  value={cadet.midterm_exam === '' || cadet.midterm_exam === null ? '' : cadet.midterm_exam}
                                  disabled={!isEditing}
                                  onChange={e => handleScoreChange(cadet.id, 'midterm_exam', e.target.value)}
                                />
                              </td>
                              <td className='p-3 text-center'>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  className={`w-16 text-center border border-gray-300 rounded p-1 ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                  value={cadet.final_exam === '' || cadet.final_exam === null ? '' : cadet.final_exam}
                                  disabled={!isEditing}
                                  onChange={e => handleScoreChange(cadet.id, 'final_exam', e.target.value)}
                                />
                              </td>
                              <td className='p-3 text-center text-black'>
                                {total}
                              </td>
                            </>
                          ) : (
                            <td className='p-3 text-center'>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                className={`w-16 text-center border border-gray-300 rounded p-1 ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                value={cadet.final_exam === '' || cadet.final_exam === null ? '' : cadet.final_exam}
                                disabled={!isEditing}
                                onChange={e => handleScoreChange(cadet.id, 'final_exam', e.target.value)}
                              />
                            </td>
                          )}
                          <td className='p-3 text-center text-black'>
                            {formattedAverage}
                          </td>
                          <td className='p-3 text-center text-black'>{equivalent}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {/* Footer with Pagination, Pagination Buttons, and Action Buttons */}
                <div className="flex justify-between items-center mt-4 w-full">
                  <div className="text-gray-600">
                    Showing data {(currentPage - 1) * cadetsPerPage + 1} to {Math.min(currentPage * cadetsPerPage, filteredCadets.length)} of {filteredCadets.length} cadets
                  </div>
                  <div className="flex-1 flex justify-center">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        className={`mx-1 px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-primary text-white' : 'bg-white border'}`}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    ))}
                    {currentPage < totalPages && (
                      <button
                        className="mx-1 px-3 py-1 rounded bg-white border"
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        &gt;
                      </button>
                    )}
                    {currentPage > 1 && (
                      <button
                        className="mx-1 px-3 py-1 rounded bg-white border"
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        {'<'}
                      </button>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    {!isEditing ? (
                      <button 
                        onClick={handleEdit}
                        className='bg-primary text-white px-4 py-2 rounded hover:bg-[#3d4422] transition-colors duration-150'
                      >
                        Edit Scores
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={handleCancel}
                          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors duration-150"
                        >
                          Cancel
                        </button>

                        <button 
                          onClick={handleSave}
                          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary transition-colors duration-150"
                        >
                          Save
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FacultyExams