import React, { useState, useEffect } from 'react';
const toast = { info: () => {}, success: () => {}, error: () => {} };
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

const FacultyFinalGrades = ({ auth }) => {
  const [cadets, setCadets] = useState([]);
  const [search, setSearch] = useState('');
  const [merits, setMerits] = useState({});
  const [attendanceMap, setAttendanceMap] = useState({});
  const [examScores, setExamScores] = useState({});
  const [equivalentGrades, setEquivalentGrades] = useState({});
  const [commonModuleMap, setCommonModuleMap] = useState({});
  const [commonModuleEdited, setCommonModuleEdited] = useState({});
  const [isEditingCommon, setIsEditingCommon] = useState(false);
  const [commonSnapshot, setCommonSnapshot] = useState({});
  const [selectedPlatoon, setSelectedPlatoon] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedBattalion, setSelectedBattalion] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('2025-2026 1st semester');
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const cadetsPerPage = 8;
  const [semesterCache, setSemesterCache] = useState({});
  const [previousSemester, setPreviousSemester] = useState(null);

  // Semester options
  const semesterOptions = ['2025-2026 1st semester', '2026-2027 2nd semester'];

  // Function to fetch data based on selected semester
  const fetchDataForSemester = async (semester, forceRefresh = false) => {
    setIsLoading(true);
    const semesterParam = encodeURIComponent(semester);
    const ts = Date.now(); // cache-busting timestamp
    const randomId = Math.random().toString(36).substring(7); // additional cache-busting

    // Only force refresh if explicitly requested
    const shouldForceRefresh = forceRefresh;

    // Serve from local cache if available and not forcing refresh
    if (semesterCache[semester] && !shouldForceRefresh) {
      const cached = semesterCache[semester];
      setCadets(cached.cadets || []);
      setMerits(cached.merits || {});
      setAttendanceMap(cached.attendanceMap || {});
      setExamScores(cached.examScores || {});
      setEquivalentGrades(cached.equivalentGrades || {});
      setCommonModuleMap(cached.commonModuleMap || {});
      setIsLoading(false);
      return;
    }
    
    try {
      // Use the new final grades API that calculates everything
      const finalGradesUrl = shouldForceRefresh 
        ? `/api/final-grades?semester=${semesterParam}&_t=${ts}&force_refresh=1&r=${randomId}`
        : `/api/final-grades?semester=${semesterParam}&_t=${ts}&r=${randomId}`;
      const finalGradesRes = await fetch(finalGradesUrl);
      const finalGradesData = await finalGradesRes.json();

      // Also fetch common module data for editing
      const commonRes = await fetch(`/api/common-module?semester=${semesterParam}&_t=${ts}&r=${randomId}`);
      const commonData = await commonRes.json();

      // Process the final grades data
      const processedCadets = finalGradesData;
      
      // Create maps for backward compatibility
      const attendanceMap = {};
      const examScoresMap = {};
      const equivalentGradesMap = {};
      const commonModuleMap = {};
      
      finalGradesData.forEach(cadet => {
        // Create attendance map entry
        attendanceMap[cadet.id] = {
          user_id: cadet.id,
          weeks_present: 0, // This will be calculated from ROTC grade components
          attendance_30: 0  // This will be calculated from ROTC grade components
        };
        
        // Create exam scores map entry
        examScoresMap[cadet.id] = {
          id: cadet.id,
          average: 0 // This will be calculated from ROTC grade components
        };
        
        // Create equivalent grades map
        equivalentGradesMap[cadet.id] = cadet.equivalent_grade;
        
        // Create common module map
        commonModuleMap[cadet.id] = cadet.common_module_grade;
      });

      setCadets(processedCadets);
      setMerits({}); // Not needed for final grades
      setAttendanceMap(attendanceMap);
      setExamScores(examScoresMap);
      setEquivalentGrades(equivalentGradesMap);
      setCommonModuleMap(commonModuleMap);

      // Update cache for this semester
      setSemesterCache(prev => ({
        ...prev,
        [semester]: {
          cadets: processedCadets,
          merits: {},
          attendanceMap,
          examScores: examScoresMap,
          equivalentGrades: equivalentGradesMap,
          commonModuleMap: commonModuleMap
        }
      }));
      
      // Log to verify data is loaded
      console.log(`Final grades data loaded for ${semester}:`, {
        cadetsCount: processedCadets.length,
        sampleData: processedCadets[0],
        ankundingData: processedCadets.find(c => c.id === 3)
      });
      
    } catch (error) {
      console.error('Error fetching data for semester:', error);
      toast.error('Failed to load data.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchDataForSemester(selectedSemester, true); // Force refresh on initial load
  }, []);

  // Fetch data when semester changes
  useEffect(() => {
    if (selectedSemester) {
      // If currently editing Common Module, cancel and discard
      if (isEditingCommon) {
        setIsEditingCommon(false);
        toast.info('Switching semesters. Unsaved Common Module changes discarded.');
      }
      // Clear any staged edits so returning doesn't show unsaved values
      setCommonModuleEdited({});
      setCommonSnapshot({});
      // Clear cache for previous semester to drop unsaved local edits
      if (previousSemester && previousSemester !== selectedSemester) {
        setSemesterCache(prev => {
          const n = { ...prev };
          delete n[previousSemester];
          return n;
        });
      }
      // Also clear cache for current semester to ensure fresh data
      setSemesterCache(prev => {
        const n = { ...prev };
        delete n[selectedSemester];
        // Extra clear for 2nd semester to ensure fresh data
        if (selectedSemester === '2026-2027 2nd semester') {
          delete n['2026-2027 2nd semester'];
        }
        return n;
      });
      setPreviousSemester(selectedSemester);
      fetchDataForSemester(selectedSemester, true); // Force refresh
    }
  }, [selectedSemester]);

  const formatCadetName = (cadet) => {
    const lastName = cadet.last_name || '';
    const firstName = cadet.first_name || '';
    const middleName = cadet.middle_name || '';
    const middleInitial = middleName ? ` ${middleName.charAt(0)}.` : '';
    return `${lastName}, ${firstName}${middleInitial}`;
  };

  // Filter and sort cadets
  const filteredCadets = (cadets || [])
    .filter(cadet => {
      if (!cadet) return false;
      const isUser = cadet.role === 'user';
      const nameMatches = formatCadetName(cadet).toLowerCase().includes(search.toLowerCase());
      const platoonMatches = !selectedPlatoon || cadet.platoon === selectedPlatoon;
      const companyMatches = !selectedCompany || cadet.company === selectedCompany;
      const battalionMatches = !selectedBattalion || cadet.battalion === selectedBattalion;
      return isUser && nameMatches && platoonMatches && companyMatches && battalionMatches;
    })
    .sort((a, b) => formatCadetName(a).localeCompare(formatCadetName(b)));

  const totalPages = Math.max(1, Math.ceil(filteredCadets.length / cadetsPerPage));
  const paginatedCadets = filteredCadets.slice(
    (currentPage - 1) * cadetsPerPage,
    currentPage * cadetsPerPage
  );

  // Attendance percentage logic
  const getAttendancePercentage = (cadet) => {
    const attendance = attendanceMap[cadet.id];
    if (!attendance) return 0;
    // Prefer computing from merits_array to ensure consistency with UI (weeks present)
    const weekLimit = selectedSemester === '2025-2026 1st semester' ? 10 : 15;
    const days = Array.isArray(attendance.merits_array) ? attendance.merits_array : [];
    if (days.length > 0) {
      const presentCount = days.filter(Boolean).length;
      const percentage = (presentCount / weekLimit) * 30;
      return Math.min(30, Math.round(percentage));
    }
    // Next, fallback to computed map shape (attendances boolean map)
    if (attendance.attendances) {
      const presentCount = Object.values(attendance.attendances).filter(Boolean).length;
      const percentage = (presentCount / weekLimit) * 30;
      return Math.min(30, Math.round(percentage));
    }
    // Lastly, fallback to backend stored percentage
    if (attendance.percentage !== undefined && attendance.percentage !== null && attendance.percentage !== '') {
      const p = typeof attendance.percentage === 'number' ? attendance.percentage : parseFloat(attendance.percentage);
      return Number.isNaN(p) ? 0 : Math.min(30, Math.round(p));
    }
    return 0;
  };

  // Aptitude (Merits/Demerits) percentage logic – match facultyMerits.jsx
  const getAptitudePercentage = (cadetId) => {
    const record = merits[cadetId] || merits[String(cadetId)] || merits[Number(cadetId)];
    if (!record) { console.log('[Aptitude] No record for cadet', cadetId); return 0; }
    // Prefer computing from merit/demerit day arrays for consistency with the UI grid
    const meritDays = record.merits_array || record.days || record.merits_days || [];
    const demDays = record.demerits_array || record.demerit_days || (record.demerits && (record.demerits.merits_array || record.demerits.days)) || [];
    const weekCountGuess = (Array.isArray(meritDays) && meritDays.length) ? meritDays.length
                            : (Array.isArray(demDays) && demDays.length) ? demDays.length
                            : (selectedSemester === '2025-2026 1st semester' ? 10 : 15);
    if ((meritDays && meritDays.length) || (demDays && demDays.length)) {
      const totalMerits = (meritDays || []).reduce((s, v) => s + (Number(v) || 0), 0);
      const totalDemerits = (demDays || []).reduce((s, v) => s + (Number(v) || 0), 0);
      const netScore = totalMerits - totalDemerits;
      const maxPossible = weekCountGuess * 10;
      const perc = Math.min(30, Math.round(((maxPossible === 0 ? 0 : netScore / maxPossible) * 30)));
      console.log('[Aptitude] Computed from array days', { cadetId, totalMerits, totalDemerits, weekCountGuess, maxPossible, perc, record });
      return isNaN(perc) ? 0 : perc;
    }

    // If arrays not available, use API-provided percentage as fallback
    if (record.percentage !== undefined && record.percentage !== null && record.percentage !== '') {
      const raw = record.percentage;
      const parsed = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[^0-9.\-]+/g, ''));
      console.log('[Aptitude] Using percentage from API (fallback)', { cadetId, raw, parsed, record });
      if (!Number.isNaN(parsed)) {
        return Math.min(30, Math.round(parsed));
      }
    }

    // As a final fallback, build days from individual keyed fields (week1..week15, merit1.., m1.. etc.)
    const weekLimit = selectedSemester === '2025-2026 1st semester' ? 10 : 15;
    const meritsByWeek = Array(weekLimit).fill(0);
    const demeritsByWeek = Array(weekLimit).fill(0);
    Object.keys(record || {}).forEach(k => {
      const mk = k.toLowerCase();
      const m = mk.match(/(m|merit|day|days)_?([0-9]{1,2})$/);
      const d = mk.match(/(d|demerit|demerits)_?([0-9]{1,2})$/);
      if (m) {
        const idx = Number(m[2]);
        if (idx >= 1 && idx <= weekLimit) meritsByWeek[idx - 1] = Number(record[k]) || 0;
      }
      if (d) {
        const idx = Number(d[2]);
        if (idx >= 1 && idx <= weekLimit) demeritsByWeek[idx - 1] = Number(record[k]) || 0;
      }
    });
    const totalMerits2 = meritsByWeek.reduce((s, v) => s + (Number(v) || 0), 0);
    const totalDemerits2 = demeritsByWeek.reduce((s, v) => s + (Number(v) || 0), 0);
    const net2 = totalMerits2 - totalDemerits2;
    const perc2 = Math.min(30, Math.round(((weekLimit * 10 === 0 ? 0 : net2 / (weekLimit * 10)) * 30)));
    console.log('[Aptitude] Computed from keyed fields', { cadetId, meritsByWeek, demeritsByWeek, perc2 });
    return isNaN(perc2) ? 0 : perc2;
  };

  // Exam score percentage logic
  const getExamPercentage = (cadet) => {
    const examData = examScores[cadet.id];
    if (!examData) return 0;
    
    const final = examData.final_exam === '' || examData.final_exam === null ? 0 : Number(examData.final_exam) || 0;
    const midterm = examData.midterm_exam === '' || examData.midterm_exam === null ? 0 : Number(examData.midterm_exam) || 0;
    
    let average = 0;
    if (selectedSemester === '2026-2027 2nd semester') {
      // For 2nd semester: (Total / 123) * 100
      const total = final + midterm;
      average = total > 0 ? (total / 123) * 100 : 0;
    } else {
      // For 1st semester: Final Exam * 2
      average = final * 2;
    }
    
    // Calculate exam score with semester-specific weighting
    // 2025-2026 1st semester: 40% weighting, capped at 40
    // 2026-2027 2nd semester (current): retain 40% weighting, capped at 40
    const isFirstSem = selectedSemester === '2025-2026 1st semester';
    const weight = isFirstSem ? 0.40 : 0.40;
    const cap = isFirstSem ? 40 : 40;
    const examScore = Math.min(cap, Math.round(average * weight));
    console.log('[SubjectProf] calc', { cadetId: cadet.id, final, midterm, average, examScore });
    return examScore;
  };

  // Helpers for first semester computed columns
  const getRotcGrade = (cadet) => {
    const apt = getAptitudePercentage(cadet.id);
    const att = getAttendancePercentage(cadet);
    const ex = getExamPercentage(cadet);
    return Math.round(apt + att + ex);
  };

  const getCommonModule = (cadetId) => {
    const edited = commonModuleEdited[cadetId];
    if (edited !== undefined) return edited;
    const v = commonModuleMap[cadetId];
    return (v === null || v === undefined || v === '') ? '' : Number(v);
  };

  const setCommonModule = (cadetId, value) => {
    if (value === '') {
      setCommonModuleEdited(prev => ({ ...prev, [cadetId]: '' }));
      return;
    }
    // Allow only 0-100 with up to 2 decimals
    const str = String(value);
    const valid = /^\d{0,3}(?:\.\d{0,2})?$/.test(str);
    if (!valid) return; // ignore invalid keystrokes
    // keep raw string while editing so decimals are freely editable
    setCommonModuleEdited(prev => ({ ...prev, [cadetId]: str }));
  };

  const handleSaveCommonModule = async () => {
    if (selectedSemester !== '2025-2026 1st semester') return;
    const payload = [];
    filteredCadets.forEach(c => {
      const val = getCommonModule(c.id);
      if (val !== '' && !isNaN(val)) {
        payload.push({ user_id: c.id, common_module_grade: Number(val).toFixed(2) });
      }
    });
    
    try {
      const res = await fetch('/api/common-module/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({ semester: selectedSemester, grades: payload })
      });
      if (res.ok) {
        setCommonModuleMap(prev => ({ ...prev, ...commonModuleEdited }));
        setIsEditingCommon(false);
        toast.success('Common Module Grades saved.');
        
        // Clear the cache for this semester to force fresh data
        setSemesterCache(prev => {
          const newCache = { ...prev };
          delete newCache[selectedSemester];
          return newCache;
        });
        
        // Refresh data from server to get updated final grades (force refresh)
        await fetchDataForSemester(selectedSemester, true);
        
        // Clear edited state after successful refresh
        setCommonModuleEdited({});
      } else {
        toast.error('Failed to save Common Module Grades');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error saving Common Module Grades');
    }
  };

  const handleEditCommon = () => {
    setCommonSnapshot({ ...commonModuleMap, ...commonModuleEdited });
    setIsEditingCommon(true);
    toast.info('Edit mode enabled. You can now modify Common Module grades.');
  };

  const handleCancelCommon = () => {
    // restore snapshot
    setCommonModuleEdited({});
    setCommonModuleMap(commonSnapshot);
    setIsEditingCommon(false);
    toast.info('Editing cancelled. Changes discarded.');
  };

  const handlePostGrades = async () => {
    if (isPosting) return;
    
    setIsPosting(true);
    
    try {
      // Prepare the grades data for posting
      const gradesData = filteredCadets.map(cadet => ({
        user_id: cadet.id,
        equivalent_grade: cadet.equivalent_grade,
        remarks: cadet.remarks,
        final_grade: cadet.final_grade,
        semester: selectedSemester
      }));

      // Get CSRF token
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
      console.log('CSRF Token:', csrfToken);
      console.log('Posting grades:', { semester: selectedSemester, grades: gradesData });

      const response = await fetch('/api/final-grades/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({ 
          semester: selectedSemester, 
          grades: gradesData 
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        console.log('Success response:', result);
        toast.success('Grades posted successfully!');
      } else {
        const responseText = await response.text();
        console.error('Error response:', responseText);
        
        try {
          const errorData = JSON.parse(responseText);
          toast.error(`Failed to post grades: ${errorData.message || 'Unknown error'}`);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          toast.error(`Failed to post grades: Server returned ${response.status} status`);
        }
      }
    } catch (error) {
      console.error('Error posting grades:', error);
      toast.error('Error posting grades. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  // Compute equivalent grade (same as before)
  const computeEquivalentGrade = (merit, attendance, exams) => {
    // Ensure all values are numbers
    const meritNum = typeof merit === 'number' ? merit : 0;
    const attendanceNum = typeof attendance === 'number' ? attendance : 0;
    const examsNum = typeof exams === 'number' ? exams : 0;
    
    const totalPercentage = meritNum + attendanceNum + examsNum;
    if (totalPercentage >= 96.5) return 1.00;
    if (totalPercentage >= 93.5) return 1.25;
    if (totalPercentage >= 90.5) return 1.50;
    if (totalPercentage >= 87.5) return 1.75;
    if (totalPercentage >= 84.5) return 2.00;
    if (totalPercentage >= 81.5) return 2.25;
    if (totalPercentage >= 78.5) return 2.50;
    if (totalPercentage >= 75.5) return 2.75;
    if (totalPercentage >= 75.0) return 3.00;
    return 5.00;
  };
  
  // Save all equivalent grades to backend
  const handleSaveEquivalentGrades = async () => {
    const grades = filteredCadets.map(cadet => {
      const merit = getAptitudePercentage(cadet.id);
      const attendance = getAttendancePercentage(cadet);
      // Use the same computation shown in the UI, which already handles semester rules
      const exams = getExamPercentage(cadet);
      // Final grade is the summation of Aptitude (30) + Attendance (30) + Subject Prof. (40)
      const finalGrade = Math.round((merit || 0) + (attendance || 0) + (exams || 0));
      const equivalentGrade = computeEquivalentGrade(merit, attendance, exams);
      return {
        user_id: cadet.id,
        equivalent_grade: equivalentGrade,
        final_grade: finalGrade
      };
    });
    try {
      const response = await fetch('/direct-grades/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({ semester: selectedSemester, grades })
      });
      if (response.ok) {
        alert('Equivalent grades saved successfully.');
        // Refresh grades
        fetch('/direct-grades')
          .then(res => res.json())
          .then(data => {
            const map = {};
            data.forEach(user => { 
              if (user.equivalent_grade !== null) {
                map[user.id] = parseFloat(user.equivalent_grade); 
              }
            });
            setEquivalentGrades(map);
          });
      } else {
        alert('Failed to save equivalent grades: ' + response.status);
        console.error('Error response:', await response.text());
      }
    } catch (error) {
      console.error('Error saving grades:', error);
      alert('Failed to save equivalent grades: ' + error.message);
    }
  };
  

  return (
    <div className='w-full min-h-screen bg-backgroundColor'>
      <style>{`
        input.no-spin::-webkit-outer-spin-button,
        input.no-spin::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input.no-spin[type=number] { -moz-appearance: textfield; appearance: textfield; }
      `}</style>
      <Header auth={auth} />
      <div className='flex flex-col md:flex-row'>
        <FacultySidebar />
        <div className='flex-1 p-3 md:p-6'>
          <div className='font-regular'>
            {/* Breadcrumb */}
            <div className="bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 text-sm md:text-base">
                <Link href="/faculty/facultyHome" className="hover:underline cursor-pointer font-semibold">
                  Dashboard
                </Link>
                <span className="mx-2 font-semibold">{">"}</span>
                <span className="cursor-default font-bold">Final Grades</span>  
          </div>
            {/* Page Header */}
            <div className='flex items-center justify-between mt-3 md:mt-4 mb-3 md:mb-6 pl-3 md:pl-5 py-4 md:py-7 bg-primary text-white p-3 md:p-4 rounded-lg'>
              <h1 className='text-xl md:text-2xl font-semibold'>Final Grades</h1>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white p-3 md:p-6 rounded-lg shadow mb-3 md:mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4">
                {/* Semester Selection Tabs */}
                <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full sm:w-auto">
                  {semesterOptions.map((semester) => (
                    <button
                      key={semester}
                      onClick={() => {
                        setSelectedSemester(semester);
                        // Clear cache for the new semester to ensure fresh data
                        setSemesterCache(prev => {
                          const newCache = { ...prev };
                          delete newCache[semester];
                          return newCache;
                        });
                      }}
                      disabled={isLoading}
                      className={`py-1.5 md:py-2 px-2 md:px-4 rounded-lg transition-colors duration-150 text-xs md:text-sm ${
                        selectedSemester === semester
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {semester}
                    </button>
                  ))}
                  {isLoading && (
                    <div className="ml-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                  <div className="relative w-full sm:w-auto">
                    <FaSearch className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs md:text-sm" />
                    <input
                      type="search"
                      placeholder="Search"
                      className="w-full sm:w-36 md:w-48 p-1.5 md:p-2 pl-7 md:pl-10 border border-gray-300 rounded-lg text-xs md:text-sm"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="relative w-full sm:w-auto">
                    <div
                      className="relative flex items-center justify-between bg-white border border-gray-300 rounded-lg px-3 py-2 cursor-pointer text-xs md:text-sm w-full hover:border-gray-400"
                      onClick={() => setShowFilterPicker(!showFilterPicker)}
                    >
                      <span className="text-gray-600 truncate">
                        {selectedPlatoon || selectedCompany || selectedBattalion
                          ? `Filters: ${[
                              selectedPlatoon || '',
                              selectedCompany || '',
                              selectedBattalion || ''
                            ].filter(Boolean).join(', ')}`
                          : 'Sort by: All'}
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
                              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Platoon</label>
                              <select
                                className="w-full bg-gray-100 p-1.5 md:p-2 rounded border text-xs md:text-sm"
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
                              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Company</label>
                              <select
                                className="w-full bg-gray-100 p-1.5 md:p-2 rounded border text-xs md:text-sm"
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
                              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">Battalion</label>
                              <select
                                className="w-full bg-gray-100 p-1.5 md:p-2 rounded border text-xs md:text-sm"
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
                                className="flex-1 px-4 py-1.5 md:py-2 bg-gray-300 rounded text-xs md:text-sm hover:bg-gray-400 text-gray-700"
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
                                className="flex-1 px-4 py-1.5 md:py-2 bg-primary rounded text-xs md:text-sm text-white hover:bg-opacity-90"
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
                  
                  {/* Post Button */}
                  <button
                    onClick={handlePostGrades}
                    disabled={isLoading || isPosting}
                    className={`w-full sm:w-auto px-3 md:px-6 py-1.5 md:py-2 rounded-lg font-medium transition-colors duration-150 text-xs md:text-sm ${
                      isPosting
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-[#3d4422] transition-colors duration-150'
                    }`}
                  >
                    {isPosting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white"></div>
                        <span>Posting...</span>
                      </div>
                    ) : (
                      'Post'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="bg-white p-3 md:p-6 rounded-lg shadow w-full mx-auto">
              <div className="flex justify-between items-center mb-3 md:mb-6">
                <div>
                  <h1 className="text-base md:text-lg font-semibold text-black">Equivalent Grades</h1>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="text-gray-600">
                    <tr>
                      <th className="py-2 md:py-4 px-2 md:px-3 border-b font-medium text-left text-xs md:text-sm">Cadet Names</th>
                      {selectedSemester === '2025-2026 1st semester' ? (
                        <>
                          <th className="py-2 md:py-4 px-2 md:px-3 border-b font-medium text-center text-xs md:text-sm">Common Module Grade</th>
                          <th className="py-2 md:py-4 px-2 md:px-3 border-b font-medium text-center text-xs md:text-sm">ROTC Grade</th>
                          <th className="py-2 md:py-4 px-2 md:px-3 border-b font-medium text-center text-xs md:text-sm">Final Grade</th>
                          <th className="py-2 md:py-4 px-2 md:px-3 border-b font-medium text-center text-xs md:text-sm">Equivalent Grade</th>
                          <th className="py-2 md:py-4 px-2 md:px-3 border-b font-medium text-center text-xs md:text-sm">Remarks</th>
                        </>
                      ) : (
                        <>
                          <th className="py-2 md:py-4 px-2 md:px-3 border-b font-medium text-center text-xs md:text-sm">Final Grade</th>
                          <th className="py-2 md:py-4 px-2 md:px-3 border-b font-medium text-center text-xs md:text-sm">Equivalent Grade</th>
                          <th className="py-2 md:py-4 px-2 md:px-3 border-b font-medium text-center text-xs md:text-sm">Remarks</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCadets.map(cadet => {
                      // Use the pre-calculated values from the final grades API
                      const commonModuleGrade = cadet.common_module_grade || 0;
                      const rotcGrade = cadet.rotc_grade || 0;
                      const finalGrade = cadet.final_grade || 0;
                      const equivalentGrade = cadet.equivalent_grade || 0;
                      // Prefer backend-provided remarks if present
                      const remark = cadet.remarks
                        ? cadet.remarks
                        : (equivalentGrade === 5.0)
                          ? 'Failed'
                          : (equivalentGrade === 4.0)
                            ? 'INC'
                            : (equivalentGrade === 3.0 && Math.round(finalGrade) === 75)
                              ? '75 (PASSED)'
                              : 'Passed';
                      
                      if (selectedSemester === '2025-2026 1st semester') {
                        // 1st semester: Show Common Module Grade, ROTC Grade, Final Grade, Equivalent Grade, Remarks
                        return (
                          <tr className="border-b border-gray-200" key={cadet.id}>
                            <td className="py-2 md:py-4 px-2 md:px-3 text-black text-xs md:text-sm">{formatCadetName(cadet)}</td>
                            <td className="py-2 md:py-4 px-2 md:px-3 text-center text-black text-xs md:text-sm">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                inputMode="decimal"
                                className={`no-spin w-12 md:w-16 h-7 md:h-8 text-center border border-gray-300 rounded text-xs md:text-sm font-medium ${!isEditingCommon ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white text-gray-700 hover:border-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500'}`}
                                value={(isEditingCommon && commonModuleEdited[cadet.id] !== undefined)
                                  ? String(commonModuleEdited[cadet.id])
                                  : (commonModuleGrade === 0 ? '' : Number(commonModuleGrade).toFixed(2))}
                                onChange={e => setCommonModule(cadet.id, e.target.value)}
                                onBlur={e => {
                                  const v = e.target.value;
                                  if (v === '') {
                                    // keep as blank when cleared
                                    setCommonModule(cadet.id, '');
                                    return;
                                  }
                                  const n = Math.max(0, Math.min(100, Number(v)));
                                  setCommonModule(cadet.id, (Math.round(n * 100) / 100).toFixed(2));
                                }}
                                disabled={!isEditingCommon}
                              />
                            </td>
                            <td className="py-2 md:py-4 px-2 md:px-3 text-center text-black text-xs md:text-sm">{rotcGrade}</td>
                            <td className="py-2 md:py-4 px-2 md:px-3 text-center text-black text-xs md:text-sm">{Math.round(finalGrade)}</td>
                            <td className="py-2 md:py-4 px-2 md:px-3 text-center text-black text-xs md:text-sm">{Number(equivalentGrade).toFixed(2)}</td>
                            <td className="py-2 md:py-4 px-2 md:px-3 text-center text-black text-xs md:text-sm">{remark}</td>
                          </tr>
                        );
                      } else {
                        // 2nd semester: Show only Final Grade (ROTC Grade), Equivalent Grade, Remarks
                        return (
                          <tr className="border-b border-gray-200" key={cadet.id}>
                            <td className="py-2 md:py-4 px-2 md:px-3 text-black text-xs md:text-sm">{formatCadetName(cadet)}</td>
                            <td className="py-2 md:py-4 px-2 md:px-3 text-center text-black text-xs md:text-sm">{rotcGrade}</td>
                            <td className="py-2 md:py-4 px-2 md:px-3 text-center text-black text-xs md:text-sm">{equivalentGrade.toFixed(2)}</td>
                            <td className="py-2 md:py-4 px-2 md:px-3 text-center text-black text-xs md:text-sm">{remark}</td>
                          </tr>
                        );
                      }
                    })}
                  </tbody>
                </table>
                {/* Footer with Pagination and Summary */}
                <div className="flex flex-col sm:flex-row items-center justify-between mt-4 w-full gap-3 md:gap-4">
                  <div className="text-xs md:text-sm text-gray-600 text-center sm:text-left">
                    Showing data {(currentPage - 1) * cadetsPerPage + 1} to {Math.min(currentPage * cadetsPerPage, filteredCadets.length)} of {filteredCadets.length} cadets
                  </div>
                  <div className="flex justify-center my-2 sm:my-0">
                    {currentPage > 1 && (
                      <button
                        className="mx-0.5 md:mx-1 px-2 md:px-3 py-1 rounded bg-white border text-xs md:text-sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        {'<'}
                      </button>
                    )}
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        className={`mx-0.5 md:mx-1 px-2 md:px-3 py-1 rounded text-xs md:text-sm ${currentPage === i + 1 ? 'bg-primary text-white' : 'bg-white border'}`}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    ))}
                    {currentPage < totalPages && (
                      <button
                        className="mx-0.5 md:mx-1 px-2 md:px-3 py-1 rounded bg-white border text-xs md:text-sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        &gt;
                      </button>
                    )}
                  </div>
                  <div className="flex justify-center sm:justify-end gap-2 w-full sm:w-auto">
                    {selectedSemester === '2025-2026 1st semester' && (
                      <>
                        {!isEditingCommon ? (
                          <button
                            className='bg-primary text-white px-3 md:px-4 py-1.5 md:py-2 rounded text-xs md:text-sm hover:bg-[#3d4422] transition-colors duration-150 w-full sm:w-auto'
                            onClick={handleEditCommon}
                          >
                            Edit Common Module Grade
                          </button>
                        ) : (
                          <>
                            <button
                              className="bg-gray-500 text-white px-3 md:px-4 py-1.5 md:py-2 rounded text-xs md:text-sm hover:bg-gray-600 transition-colors duration-150"
                              onClick={handleCancelCommon}
                            >
                              Cancel
                            </button>
                            <button
                              className='ml-2 bg-primary text-white px-3 md:px-4 py-1.5 md:py-2 rounded text-xs md:text-sm hover:bg-[#3d4422] transition-colors duration-150'
                              onClick={handleSaveCommonModule}
                            >
                              Save
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FacultyFinalGrades;