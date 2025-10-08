import React, { useState, useEffect } from 'react';
const toast = { info: () => {}, success: () => {}, error: () => {} };
import { Link, Head } from '@inertiajs/react';
import Header from '../../components/header';
import FacultySidebar from '../../components/facultySidebar';
import { FaSearch } from 'react-icons/fa';
import { FaSort } from 'react-icons/fa6';

// Alert Dialog Component
// Alert Dialog Component
const AlertDialog = ({ isOpen, type, title, message, onClose }) => {
  if (!isOpen) return null;

  const textColor = type === 'success' ? 'text-primary' : 'text-red-800';
  const borderColor = type === 'success' ? 'border-primary' : 'border-red-300';
  const buttonColor = type === 'success' ? 'bg-primary/90 hover:bg-primary' : 'bg-red-600 hover:bg-red-700';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
        <div className={`border rounded-lg p-4 mb-4`}>
          <h3 className={`text-lg font-semibold ${textColor} mb-2`}>{title}</h3>
          <p className={`${textColor}`}>{message}</p>
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

  // Alert state
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  // Semester options
  const semesterOptions = ['2025-2026 1st semester', '2025-2026 2nd semester'];

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
      
      // Create maps for backward compatibility and real-time calculations
      const attendanceMap = {};
      const examScoresMap = {};
      const equivalentGradesMap = {};
      const commonModuleMap = {};
      const meritsMap = {}; // For 2nd semester aptitude calculations
      
      finalGradesData.forEach(cadet => {
        // Create attendance map entry using the provided attendance_data
        attendanceMap[cadet.id] = {
          user_id: cadet.id,
          weekly_attendance: cadet.attendance_data?.weekly_attendance || {},
          weeks_present: cadet.attendance_data?.weeks_present || 0,
          attendance_30: cadet.attendance_data?.attendance_30 || 0,
          percentage: cadet.attendance_data?.percentage || 0
        };
        
        // Create exam scores map entry - include actual exam data for calculations
        examScoresMap[cadet.id] = {
          id: cadet.id,
          midterm_exam: cadet.exam_data?.midterm_exam || 0,
          final_exam: cadet.exam_data?.final_exam || 0,
          average: 0 // This will be calculated from ROTC grade components
        };
        
        // For 2nd semester, create merits map from aptitude data if available
        if (selectedSemester === '2025-2026 2nd semester' && cadet.aptitude_data) {
          meritsMap[cadet.id] = {
            aptitude_30: cadet.aptitude_data.aptitude_30 || 0,
            total_merits: cadet.aptitude_data.total_merits || 0,
            merits_array: cadet.aptitude_data.merits_array || [],
            demerits_array: cadet.aptitude_data.demerits_array || [],
            percentage: cadet.aptitude_data.aptitude_30 || 0
          };
        }
        
        // Create equivalent grades map
        equivalentGradesMap[cadet.id] = cadet.equivalent_grade;
        
        // Create common module map
        commonModuleMap[cadet.id] = cadet.common_module_grade;
      });

      setCadets(processedCadets);
      setMerits(meritsMap); // Now contains actual merit data for 2nd semester
      setAttendanceMap(attendanceMap);
      setExamScores(examScoresMap);
      setEquivalentGrades(equivalentGradesMap);
      setCommonModuleMap(commonModuleMap);

      // Update cache for this semester
      setSemesterCache(prev => ({
        ...prev,
        [semester]: {
          cadets: processedCadets,
          merits: meritsMap,
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
        if (selectedSemester === '2025-2026 2nd semester') {
          delete n['2025-2026 2nd semester'];
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
    
    const weekLimit = 15; // Both semesters now use 15 weeks
    
    // For 2nd semester, check if there's a pre-calculated attendance_30 value
    if (selectedSemester === '2025-2026 2nd semester' && attendance.attendance_30 !== undefined && attendance.attendance_30 > 0) {
      return Math.min(30, Math.round(attendance.attendance_30));
    }
    
    // First, try to get attendance from weekly_attendance data (the correct source)
    if (attendance.weekly_attendance) {
      const presentCount = Object.values(attendance.weekly_attendance).filter(Boolean).length;
      const percentage = (presentCount / weekLimit) * 30;
      return Math.min(30, Math.round(percentage));
    }
    
    // Fallback to attendances boolean map
    if (attendance.attendances) {
      const presentCount = Object.values(attendance.attendances).filter(Boolean).length;
      const percentage = (presentCount / weekLimit) * 30;
      return Math.min(30, Math.round(percentage));
    }
    
    // Fallback to backend stored percentage
    if (attendance.percentage !== undefined && attendance.percentage !== null && attendance.percentage !== '') {
      const p = typeof attendance.percentage === 'number' ? attendance.percentage : parseFloat(attendance.percentage);
      return Number.isNaN(p) ? 0 : Math.min(30, Math.round(p));
    }
    
    return 0;
  };  // Aptitude (Merits/Demerits) percentage logic – match facultyMerits.jsx
  const getAptitudePercentage = (cadetId) => {
    const record = merits[cadetId] || merits[String(cadetId)] || merits[Number(cadetId)];
    if (!record) { 
      console.log('[Aptitude] No record for cadet', cadetId); 
      
      // For 2nd semester, check if cadet has pre-calculated aptitude_30 from backend
      if (selectedSemester === '2025-2026 2nd semester') {
        const cadet = cadets.find(c => c.id === cadetId);
        if (cadet && cadet.aptitude_30 !== undefined && cadet.aptitude_30 !== null) {
          console.log('[Aptitude] Using backend aptitude_30 for 2nd semester:', cadet.aptitude_30);
          return Math.min(30, Math.round(cadet.aptitude_30));
        }
      }
      
      return 0; 
    }
    
    // For 2nd semester, prefer pre-calculated aptitude_30 if available
    if (selectedSemester === '2025-2026 2nd semester' && record.aptitude_30 !== undefined && record.aptitude_30 !== null && record.aptitude_30 > 0) {
      console.log('[Aptitude] Using stored aptitude_30 for 2nd semester:', record.aptitude_30);
      return Math.min(30, Math.round(record.aptitude_30));
    }
    
    // Prefer computing from merit/demerit day arrays for consistency with the UI grid
    const meritDays = record.merits_array || record.days || record.merits_days || [];
    const demDays = record.demerits_array || record.demerit_days || (record.demerits && (record.demerits.merits_array || record.demerits.days)) || [];
    const weekCountGuess = (Array.isArray(meritDays) && meritDays.length) ? meritDays.length
                            : (Array.isArray(demDays) && demDays.length) ? demDays.length
                            : 15; // Both semesters now use 15 weeks
    if ((meritDays && meritDays.length) || (demDays && demDays.length)) {
      // Updated calculation to match facultyMerits.jsx: total_merits = 150 - total_demerits
      const totalDemerits = (demDays || []).reduce((s, v) => s + (Number(v) || 0), 0);
      const maxPossible = weekCountGuess * 10; // 150 for 15 weeks
      const totalMerits = Math.max(0, maxPossible - totalDemerits);
      const perc = Math.min(30, Math.max(0, Math.round((totalMerits / 150) * 30)));
      console.log('[Aptitude] Computed from array days', { cadetId, totalDemerits, totalMerits, weekCountGuess, maxPossible, perc, record });
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
    const weekLimit = 15; // Both semesters now use 15 weeks
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
    
    // Updated calculation to match facultyMerits.jsx: total_merits = 150 - total_demerits
    const totalDemerits2 = demeritsByWeek.reduce((s, v) => s + (Number(v) || 0), 0);
    const maxPossible = weekLimit * 10; // 150 for 15 weeks
    const totalMerits2 = Math.max(0, maxPossible - totalDemerits2);
    const perc2 = Math.min(30, Math.max(0, Math.round((totalMerits2 / 150) * 30)));
    console.log('[Aptitude] Computed from keyed fields', { cadetId, meritsByWeek, demeritsByWeek, totalDemerits2, totalMerits2, perc2 });
    return isNaN(perc2) ? 0 : perc2;
  };

  // Exam score percentage logic
  const getExamPercentage = (cadet) => {
    const examData = examScores[cadet.id];
    if (!examData) {
      // For 2nd semester, check if cadet has exam data directly in the cadet object
      if (selectedSemester === '2025-2026 2nd semester' && cadet.exam_data) {
        const final = cadet.exam_data.final_exam === '' || cadet.exam_data.final_exam === null ? 0 : Number(cadet.exam_data.final_exam) || 0;
        const midterm = cadet.exam_data.midterm_exam === '' || cadet.exam_data.midterm_exam === null ? 0 : Number(cadet.exam_data.midterm_exam) || 0;
        
        if (final === 0 && midterm === 0) return 0;
        
        // For 2nd semester: average of midterm and final, then 40% weighting
        const average = (final + midterm) / 2;
        const examScore = Math.min(40, Math.round(average * 0.40));
        console.log('[ExamScore] 2nd semester calc from cadet data', { cadetId: cadet.id, final, midterm, average, examScore });
        return examScore;
      }
      return 0;
    }
    
    const final = examData.final_exam === '' || examData.final_exam === null ? 0 : Number(examData.final_exam) || 0;
    const midterm = examData.midterm_exam === '' || examData.midterm_exam === null ? 0 : Number(examData.midterm_exam) || 0;
    
    let average = 0;
    if (selectedSemester === '2025-2026 2nd semester') {
      // For 2nd semester: average of midterm and final
      if (final === 0 && midterm === 0) return 0;
      average = (final + midterm) / 2;
    } else {
      // For 1st semester: Final Exam * 2
      average = final * 2;
    }
    
    // Calculate exam score with semester-specific weighting
    // Both semesters: 40% weighting, capped at 40
    const examScore = Math.min(40, Math.round(average * 0.40));
    console.log('[SubjectProf] calc', { cadetId: cadet.id, final, midterm, average, examScore, semester: selectedSemester });
    return examScore;
  };

  // Helpers for computed columns
  const getRotcGrade = (cadet) => {
    // Prefer backend pre-calculated values if available for both semesters for consistency
    if (cadet.rotc_grade !== undefined && cadet.rotc_grade !== null) {
      return cadet.rotc_grade;
    }
    
    // Fallback to real-time calculation when backend data is not available
    const apt = getAptitudePercentage(cadet.id);
    const att = getAttendancePercentage(cadet);
    const ex = getExamPercentage(cadet);
    const total = Math.round(apt + att + ex);
    
    console.log('[ROTC Grade] Real-time calculation fallback', { 
      cadetId: cadet.id, 
      semester: selectedSemester,
      aptitude: apt, 
      attendance: att, 
      exam: ex, 
      total: total,
      backendRotc: cadet.rotc_grade 
    });
    
    return total;
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
        
        setAlertDialog({
          isOpen: true,
          type: 'success',
          title: 'Save Successful',
          message: 'Common Module Grades have been saved successfully.'
        });
        
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
        setAlertDialog({
          isOpen: true,
          type: 'error',
          title: 'Save Failed',
          message: 'Failed to save Common Module Grades.'
        });
      }
    } catch (e) {
      console.error(e);
      setAlertDialog({
        isOpen: true,
        type: 'error',
        title: 'Save Error',
        message: 'Error saving Common Module Grades: ' + e.message
      });
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
  };

  const handlePostGrades = async (semester) => {
    if (isPosting) return;
    
    setIsPosting(true);
    
    try {
      // Prepare the grades data for posting (remarks auto-computed on backend)
      const gradesData = filteredCadets.map(cadet => ({
        user_id: cadet.id,
        equivalent_grade: cadet.equivalent_grade,
        final_grade: cadet.final_grade,
        semester: semester
      }));

      // Get CSRF token
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
      console.log('CSRF Token:', csrfToken);
      console.log('Posting grades:', { semester: semester, grades: gradesData });

      const response = await fetch('/api/final-grades/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify({ 
          semester: semester, 
          grades: gradesData 
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        console.log('Success response:', result);
        
        setAlertDialog({
          isOpen: true,
          type: 'success',
          title: 'Grades Posted Successfully',
          message: `${semester === '2025-2026 1st semester' ? '1st Semester' : '2nd Semester'} grades have been posted successfully!`
        });
      } else {
        const responseText = await response.text();
        console.error('Error response:', responseText);
        console.error('Response status:', response.status);
        console.error('Response statusText:', response.statusText);
        
        let errorMessage = `Failed to post ${semester === '2025-2026 1st semester' ? '1st semester' : '2nd semester'} grades`;
        
        if (response.status === 419) {
          errorMessage += ': CSRF token mismatch. Please refresh the page and try again.';
        } else if (response.status === 403) {
          errorMessage += ': Access denied. Faculty privileges required.';
        } else if (response.status === 401) {
          errorMessage += ': Authentication required. Please login.';
        } else if (response.status === 422) {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage += `: Validation error - ${errorData.message || 'Invalid data format'}`;
          } catch (e) {
            errorMessage += ': Validation error';
          }
        } else {
          try {
            const errorData = JSON.parse(responseText);
            errorMessage += `: ${errorData.message || 'Unknown error'}`;
          } catch (parseError) {
            errorMessage += `: Server returned ${response.status} status`;
          }
        }
        
        setAlertDialog({
          isOpen: true,
          type: 'error',
          title: 'Post Grades Failed',
          message: errorMessage
        });
      }
    } catch (error) {
      console.error('Error posting grades:', error);
      setAlertDialog({
        isOpen: true,
        type: 'error',
        title: 'Post Grades Error',
        message: `Error posting ${semester === '2025-2026 1st semester' ? '1st semester' : '2nd semester'} grades. Please try again.`
      });
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
    <>
      <Head title="ROTC Portal - Final Grades" />
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
          {/* Breadcrumb - separated, light background */}
          <div className='bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 text-sm md:text-base'>
                <Link href="/faculty/facultyHome" className="hover:underline cursor-pointer font-semibold">
                  Dashboard
                </Link>
                <span className="mx-2 font-semibold">{">"}</span>
                <span className="cursor-default font-bold">Final Grades</span>
          </div>
          {/* Page Header */}
          <div className='flex items-center justify-between mt-3 md:mt-4 mb-4 md:mb-6 pl-3 md:pl-5 py-4 md:py-7 bg-primary text-white p-3 md:p-4 rounded-lg'>
            <h1 className='text-lg md:text-2xl font-semibold'>Final Grades</h1>
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
                      className={`py-1.5 md:py-2 px-2 md:px-4 rounded-lg transition-colors duration-150 text-sm md:text-base ${
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
                  {/* Post Button - Separate for each semester (moved to the left of Search) */}
                  <button
                    onClick={() => handlePostGrades(selectedSemester)}
                    disabled={isLoading || isPosting}
                    className={`w-full sm:w-auto px-3 md:px-6 py-1.5 md:py-2 rounded-lg font-medium transition-colors duration-150 text-sm md:text-base ${
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
                      selectedSemester === '2025-2026 1st semester' ? 'Post 1st Semester' : 'Post 2nd Semester'
                    )}
                  </button>

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
              </div>
            </div>

          {/* Main Content */}
          <div className='w-full mx-auto'>
            
            {/* Main Content */}
            <div className='bg-white p-3 md:p-6 rounded-lg shadow w-full mx-auto'>
              {/* Title and Controls */}
              <div className='flex justify-between items-center mb-4 md:mb-6'>
                <h1 className='text-base md:text-lg font-semibold text-black'>Equivalent Grades</h1>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="text-gray-600">
                    <tr>
                      <th className="py-2 md:py-4 px-2 md:px-3 border-b font-medium text-left text-sm md:text-base">Cadet Names</th>
                      {selectedSemester === '2025-2026 1st semester' ? (
                        <>
                          <th className="py-2 md:py-4 px-2 md:px-3 border-b font-medium text-center text-sm md:text-base">Common Module Grade</th>
                          <th className="py-2 md:py-4 px-2 md:px-3 border-b font-medium text-center text-sm md:text-base">ROTC Grade</th>
                          <th className="py-2 md:py-4 px-2 md:px-3 border-b font-medium text-center text-sm md:text-base">Final Grade</th>
                          <th className="py-2 md:py-4 px-2 md:px-3 border-b font-medium text-center text-sm md:text-base">Equivalent Grade</th>
                          <th className="py-2 md:py-4 px-2 md:px-3 border-b font-medium text-center text-sm md:text-base">Remarks</th>
                        </>
                      ) : (
                        <>
                          <th className="py-2 md:py-4 px-2 md:px-3 border-b font-medium text-center text-sm md:text-base">Final Grade</th>
                          <th className="py-2 md:py-4 px-2 md:px-3 border-b font-medium text-center text-sm md:text-base">Equivalent Grade</th>
                          <th className="py-2 md:py-4 px-2 md:px-3 border-b font-medium text-center text-sm md:text-base">Remarks</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCadets.map(cadet => {
                      // Prefer backend-calculated values for accuracy, fall back to frontend calculation if needed
                      const commonModuleGrade = cadet.common_module_grade || 0;
                      const rotcGrade = cadet.rotc_grade !== undefined && cadet.rotc_grade !== null 
                        ? cadet.rotc_grade 
                        : getRotcGrade(cadet); // Fallback to frontend calculation
                      
                      const finalGrade = cadet.final_grade !== undefined && cadet.final_grade !== null
                        ? cadet.final_grade
                        : selectedSemester === '2025-2026 1st semester' 
                          ? Math.round((rotcGrade + commonModuleGrade) / 2) // 1st semester: (ROTC + Common) / 2
                          : rotcGrade; // 2nd semester: ROTC grade only
                      
                      // Use backend-calculated equivalent grade if available, otherwise compute
                      const equivalentGrade = cadet.equivalent_grade !== undefined && cadet.equivalent_grade !== null
                        ? cadet.equivalent_grade
                        : (() => {
                            const apt = getAptitudePercentage(cadet.id);
                            const att = getAttendancePercentage(cadet);
                            const ex = getExamPercentage(cadet);
                            return computeEquivalentGrade(apt, att, ex);
                          })();
                      
                      // Use new remarks system: < 4.0 = Passed, = 4.0 = Incomplete, > 4.0 = Failed
                      const remark = cadet.remarks
                        ? cadet.remarks
                        : (equivalentGrade === 4.0)
                          ? 'Incomplete'
                          : (equivalentGrade > 4.0)
                            ? 'Failed'
                            : 'Passed';
                      
                      if (selectedSemester === '2025-2026 1st semester') {
                        // 1st semester: Show Common Module Grade, ROTC Grade, Final Grade, Equivalent Grade, Remarks
                        return (
                          <tr className="border-b border-gray-200" key={cadet.id}>
                            <td className="py-2 md:py-4 px-2 md:px-3 text-black text-sm md:text-base">{formatCadetName(cadet)}</td>
                            <td className="py-2 md:py-4 px-2 md:px-3 text-center text-black text-xs md:text-sm">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                inputMode="decimal"
                                  className={`no-spin w-12 md:w-16 h-7 md:h-8 text-center border border-gray-300 rounded text-sm md:text-base font-medium ${!isEditingCommon ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white text-gray-700 hover:border-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500'}`}
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
                            <td className="py-2 md:py-4 px-2 md:px-3 text-center text-black text-sm md:text-base">{rotcGrade}</td>
                            <td className="py-2 md:py-4 px-2 md:px-3 text-center text-black text-sm md:text-base">{Math.round(finalGrade)}</td>
                            <td className="py-2 md:py-4 px-2 md:px-3 text-center text-black text-sm md:text-base">{Number(equivalentGrade).toFixed(2)}</td>
                            <td className="py-2 md:py-4 px-2 md:px-3 text-center text-black text-sm md:text-base">{remark}</td>
                          </tr>
                        );
                      } else {
                        // 2nd semester: Show only Final Grade (ROTC Grade), Equivalent Grade, Remarks
                        return (
                          <tr className="border-b border-gray-200" key={cadet.id}>
                            <td className="py-2 md:py-4 px-2 md:px-3 text-black text-sm md:text-base">{formatCadetName(cadet)}</td>
                            <td className="py-2 md:py-4 px-2 md:px-3 text-center text-black text-sm md:text-base">{rotcGrade}</td>
                            <td className="py-2 md:py-4 px-2 md:px-3 text-center text-black text-sm md:text-base">{equivalentGrade.toFixed(2)}</td>
                            <td className="py-2 md:py-4 px-2 md:px-3 text-center text-black text-sm md:text-base">{remark}</td>
                          </tr>
                        );
                      }
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Footer with Pagination, Pagination Buttons, and Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 w-full gap-4">
                <div className="text-gray-600 text-sm md:text-base order-2 sm:order-1">
                  Showing data {(currentPage - 1) * cadetsPerPage + 1} to {Math.min(currentPage * cadetsPerPage, filteredCadets.length)} of {filteredCadets.length} cadets
                </div>
                <div className="flex justify-center order-1 sm:order-2 w-full sm:w-auto">
                  {currentPage > 1 && (
                    <button
                      className="mx-1 px-2 md:px-3 py-1 rounded bg-white border text-sm md:text-base"
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
                        className={`mx-1 px-2 md:px-3 py-1 rounded text-sm md:text-base ${currentPage === pageNum ? 'bg-primary text-white' : 'bg-white border'}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {currentPage < totalPages && (
                    <button
                      className="mx-1 px-2 md:px-3 py-1 rounded bg-white border text-sm md:text-base"
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      &gt;
                    </button>
                  )}
                </div>
                
                {/* Desktop Action Buttons - Hidden on mobile */}
                <div className="hidden lg:flex justify-end gap-2 order-3">
                  {selectedSemester === '2025-2026 1st semester' && (
                    <>
                      {!isEditingCommon ? (
                        <button
                          className='bg-primary text-white px-3 md:px-4 py-2 rounded hover:bg-[#3d4422] transition-colors duration-150 text-sm md:text-base'
                          onClick={handleEditCommon}
                        >
                          Edit Common Module Grade
                        </button>
                      ) : (
                        <>
                          <button
                            className="bg-gray-500 text-white px-3 md:px-4 py-2 rounded hover:bg-gray-600 transition-colors duration-150 text-sm md:text-base"
                            onClick={handleCancelCommon}
                          >
                            Cancel
                          </button>
                          <button
                            className='bg-primary text-white px-3 md:px-4 py-2 rounded hover:bg-[#3d4422] transition-colors duration-150 text-sm md:text-base'
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
}

export default FacultyFinalGrades;