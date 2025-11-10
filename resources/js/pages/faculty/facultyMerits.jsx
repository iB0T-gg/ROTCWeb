import React, { useState, useEffect, useRef } from 'react';
import { Link, Head } from '@inertiajs/react';
const toast = { info: () => {}, success: () => {}, error: () => {} };
import Header from '../../components/header';
import FacultySidebar from '../../components/facultySidebar';
import { FaSearch } from 'react-icons/fa';
import { FaSort } from 'react-icons/fa6';
import { FaAngleLeft } from "react-icons/fa";
import { FaAngleRight } from "react-icons/fa";


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

// Weeks configuration (15 total weeks available in data for both semesters)
const firstSemesterWeeks = Array.from({ length: 10 }, (_, i) => `Week ${i + 1}`);
const secondSemesterWeeks = Array.from({ length: 15 }, (_, i) => `Week ${i + 1}`);

// Week dates mapping for 2025-2026 1st semester (format: MM-DD-YYYY)
const firstSemesterWeekDates = [
  '08-15-2025', // Week 1
  '08-22-2025', // Week 2
  '08-29-2025', // Week 3
  '09-05-2025', // Week 4
  '09-12-2025', // Week 5
  '09-19-2025', // Week 6
  '09-26-2025', // Week 7
  '10-03-2025', // Week 8
  '10-10-2025', // Week 9
  '10-17-2025', // Week 10
];

// Week dates mapping for 2025-2026 2nd semester (format: MM-DD-YYYY)
const secondSemesterWeekDates = [
  '01-15-2026', // Week 1
  '01-22-2026', // Week 2
  '01-29-2026', // Week 3
  '02-05-2026', // Week 4
  '02-12-2026', // Week 5
  '02-19-2026', // Week 6
  '02-26-2026', // Week 7
  '03-05-2026', // Week 8
  '03-12-2026', // Week 9
  '03-19-2026', // Week 10
  '03-26-2026', // Week 11
  '04-02-2026', // Week 12
  '04-09-2026', // Week 13
  '04-16-2026', // Week 14
  '04-23-2026', // Week 15
];

// Helper function to get date for a week
const getWeekDate = (weekLabel, semester) => {
  const weekMatch = weekLabel.match(/Week (\d+)/);
  if (!weekMatch) return '';
  const weekNumber = parseInt(weekMatch[1], 10);
  
  if (semester === '2025-2026 1st semester') {
    if (weekNumber >= 1 && weekNumber <= 10) {
      return firstSemesterWeekDates[weekNumber - 1];
    }
  } else if (semester === '2025-2026 2nd semester') {
    if (weekNumber >= 1 && weekNumber <= 15) {
      return secondSemesterWeekDates[weekNumber - 1];
    }
  }
  return '';
};

const FacultyMerits = ({ auth }) => {
  // Check if faculty has company and battalion assigned (new faculty) or not (seeder faculty)
  const isNewFaculty = auth && auth.company && auth.battalion;
  const [isEditing, setIsEditing] = useState(false);
  const [cadets, setCadets] = useState([]);
  const [merits, setMerits] = useState([]);
  const [demerits, setDemerits] = useState([]);
    // Snapshots used to restore values on Cancel
  const [originalMerits, setOriginalMerits] = useState([]);
  const [originalDemerits, setOriginalDemerits] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('all');
  const [selectedPlatoon, setSelectedPlatoon] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedBattalion, setSelectedBattalion] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('2025-2026 1st semester');
  const [renderKey, setRenderKey] = useState(0); // force remount after cancel
  const [showSortPicker, setShowSortPicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('current'); // 'current' or 'previous'
  // Desktop horizontal scrollbar sync for 2nd semester (keep content fully visible)
  const previousTableScrollRef = useRef(null);
  const previousBottomScrollRef = useRef(null);
  const [previousContentWidth, setPreviousContentWidth] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  // Alert state
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });
  
  // Week window state (visible weeks on desktop)
const WEEK_WINDOW = 8;
const [currentWeekRange, setCurrentWeekRange] = useState({ start: 0, end: WEEK_WINDOW - 1 });
const [scrollPosition, setScrollPosition] = useState(0);

  // Mobile detection to show all weeks on small screens
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640); // Tailwind sm breakpoint
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  
  // Multiple selection states
  const [selectedPlatoons, setSelectedPlatoons] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedBattalions, setSelectedBattalions] = useState([]);
  const cadetsPerPage = 8;

  // Semester options
  const semesterOptions = ['2025-2026 1st semester', '2025-2026 2nd semester'];

  // Function to fetch data based on selected semester
  const fetchDataForSemester = async (semester) => {
    console.log('=== FETCHING DATA FOR SEMESTER ===');
    console.log('Semester:', semester);
    setIsLoading(true);
    const timestamp = Date.now(); // Cache busting
    console.log('=== FORCE REFRESH - Cache busting timestamp:', timestamp);
    
    try {
      // Determine which API endpoint to use based on semester
      let meritsEndpoint;
      const weekCount = semester === '2025-2026 1st semester' ? 10 : 15;
      
      if (semester === '2025-2026 1st semester') {
        meritsEndpoint = '/api/first_semester_aptitude';
      } else if (semester === '2025-2026 2nd semester') {
        meritsEndpoint = '/api/second_semester_aptitude';
      } else {
        console.error('Unknown semester:', semester);
        return;
      }
      
      console.log('Using merits endpoint:', meritsEndpoint);
      
      // Fetch cadets (same for both semesters)
      const cadetsUrl = `/api/cadets?_t=${timestamp}`;
      console.log('Cadets URL:', cadetsUrl);
      const cadetsResponse = await fetch(cadetsUrl);
      console.log('Cadets response status:', cadetsResponse.status);
      
      if (cadetsResponse.ok) {
        const cadetsData = await cadetsResponse.json();
        console.log('Fetched cadets data for', semester, ':', cadetsData);
        console.log('Number of cadets:', cadetsData.length);
        setCadets(cadetsData);
        
        // Fetch existing merits using the correct endpoint
        const meritsUrl = `${meritsEndpoint}?_t=${timestamp}`;
        console.log('Merits URL:', meritsUrl);
        const meritsResponse = await fetch(meritsUrl);
        console.log('Merits response status:', meritsResponse.status);
        
        if (meritsResponse.ok) {
          const meritsData = await meritsResponse.json();
          console.log('Fetched merits data for', semester, ':', meritsData);
            
          // Initialize merits and demerits data for each cadet
          const initialMerits = cadetsData.map(cadet => {
            const existingMerit = meritsData[cadet.id];
            if (existingMerit) {
              console.log(`Found existing merit for cadet ${cadet.id}:`, existingMerit);
              
              // Ensure merits_array and demerits_array are arrays
              let meritDays = existingMerit.merits_array;
              let demeritDays = existingMerit.demerits_array;
              
              // Handle case where arrays might be stored as strings or other formats
              if (typeof meritDays === 'string') {
                try {
                  meritDays = JSON.parse(meritDays);
                } catch (e) {
                  console.warn(`Failed to parse merits_array for cadet ${cadet.id}, using defaults`);
                  meritDays = Array(weekCount).fill(10);
                }
              } else if (!Array.isArray(meritDays)) {
                meritDays = Array(weekCount).fill(10);
              }
              
              if (typeof demeritDays === 'string') {
                try {
                  demeritDays = JSON.parse(demeritDays);
                } catch (e) {
                  console.warn(`Failed to parse demerits_array for cadet ${cadet.id}, using defaults`);
                  demeritDays = Array(weekCount).fill(0);
                }
              } else if (!Array.isArray(demeritDays)) {
                demeritDays = Array(weekCount).fill(0);
              }
              
              // Ensure arrays are exactly the expected weeks long by padding if needed
              if (meritDays.length < weekCount) {
                console.log(`Padding meritDays from ${meritDays.length} to ${weekCount} weeks for cadet ${cadet.id}`);
                meritDays = [...meritDays, ...Array(weekCount - meritDays.length).fill(10)];
              }
              
              if (demeritDays.length < weekCount) {
                console.log(`Padding demeritDays from ${demeritDays.length} to ${weekCount} weeks for cadet ${cadet.id}`);
                demeritDays = [...demeritDays, ...Array(weekCount - demeritDays.length).fill(0)];
              }
              
              // Recalculate merits based on demerits to ensure Merit = 10 - Demerit
              console.log(`Recalculating merits for cadet ${cadet.id}:`);
              console.log('Original merits:', meritDays);
              console.log('Demerits:', demeritDays);
              
              const recalculatedMerits = meritDays.map((merit, index) => {
                const demerit = demeritDays[index] || 0;
                const newMerit = Math.max(0, 10 - demerit);
                console.log(`Week ${index + 1}: Original Merit ${merit}, Demerit ${demerit} → New Merit ${newMerit} (${newMerit} + ${demerit} = ${newMerit + demerit})`);
                return newMerit;
              });
              
              console.log('Recalculated merits:', recalculatedMerits);
              
              return {
                days: recalculatedMerits,
                percentage: existingMerit.percentage || 0
              };
            }
            console.log(`No existing merit for cadet ${cadet.id}, using defaults`);
            return { days: Array(weekCount).fill(10), percentage: 0 };
          });
          
          const initialDemerits = cadetsData.map(cadet => {
            const existingMerit = meritsData[cadet.id];
            if (existingMerit) {
              let demeritDays = existingMerit.demerits_array;
              
              // Handle case where array might be stored as string or other format
              if (typeof demeritDays === 'string') {
                try {
                  demeritDays = JSON.parse(demeritDays);
                } catch (e) {
                  console.warn(`Failed to parse demerits_array for cadet ${cadet.id}, using defaults`);
                  demeritDays = Array(weekCount).fill(0);
                }
              } else if (!Array.isArray(demeritDays)) {
                demeritDays = Array(weekCount).fill(0);
              }
              
              // Ensure demerit array is exactly expected weeks long by padding if needed
              if (demeritDays.length < weekCount) {
                console.log(`Padding demeritDays from ${demeritDays.length} to ${weekCount} weeks for cadet ${cadet.id} (demerits section)`);
                demeritDays = [...demeritDays, ...Array(weekCount - demeritDays.length).fill(0)];
              }
              
              return {
                days: demeritDays
              };
            }
            return { days: Array(weekCount).fill(0) };
          });
          
          console.log('Initial merits for', semester, ':', initialMerits);
          console.log('Initial demerits for', semester, ':', initialDemerits);
          setMerits(initialMerits);
          setDemerits(initialDemerits);
        } else {
          // If no merits exist, initialize with defaults
          setMerits(cadetsData.map(() => ({ days: Array(weekCount).fill(10), percentage: 0 })));
          setDemerits(cadetsData.map(() => ({ days: Array(weekCount).fill(0) })));
        }
      } else {
        console.error('Failed to fetch cadets');
        toast.error('Failed to fetch cadets data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error loading data. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchDataForSemester(selectedSemester);
  }, []);

  // Fetch data when semester changes
  useEffect(() => {
    if (selectedSemester) {
      fetchDataForSemester(selectedSemester);
    }
  }, [selectedSemester]);

  // Setup synced horizontal scrollbar above pagination for 2nd semester
  useEffect(() => {
    const tableDiv = previousTableScrollRef.current;
    const bottomDiv = previousBottomScrollRef.current;
    const updateWidths = () => {
      if (tableDiv) setPreviousContentWidth(tableDiv.scrollWidth);
    };
    updateWidths();
    window.addEventListener('resize', updateWidths);
    let isSyncing = false;
    const onTableScroll = () => {
      if (!bottomDiv || isSyncing) return;
      isSyncing = true;
      bottomDiv.scrollLeft = tableDiv.scrollLeft;
      isSyncing = false;
    };
    const onBottomScroll = () => {
      if (!tableDiv || isSyncing) return;
      isSyncing = true;
      tableDiv.scrollLeft = bottomDiv.scrollLeft;
      isSyncing = false;
    };
    tableDiv && tableDiv.addEventListener('scroll', onTableScroll);
    bottomDiv && bottomDiv.addEventListener('scroll', onBottomScroll);
    return () => {
      window.removeEventListener('resize', updateWidths);
      tableDiv && tableDiv.removeEventListener('scroll', onTableScroll);
      bottomDiv && bottomDiv.removeEventListener('scroll', onBottomScroll);
    };
  }, [renderKey, activeTab, selectedSemester]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sort]);

  // Format cadet name for display
  const formatCadetName = (cadet) => {
    const lastName = cadet.last_name || '';
    const firstName = cadet.first_name || '';
    const middleName = cadet.middle_name || '';
    const middleInitial = middleName ? ` ${middleName.charAt(0)}.` : '';
    return `${lastName}, ${firstName}${middleInitial}`;
  };

  const handleMeritChange = (cadetIdx, dayIdx, value) => {
    let val = Number(value);
    if (isNaN(val) || value === '') val = '';
    else if (val > 10) val = 10;
    else if (val < 0) val = 0;
    
    const updated = merits.map((row, i) =>
      i === cadetIdx
        ? { ...row, days: row.days.map((d, j) => (j === dayIdx ? val : d)) }
        : row
    );
    setMerits(updated);

    // Automatically adjust demerits when merits change
    const updatedDemerits = demerits.map((row, i) => {
      if (i === cadetIdx) {
        // Calculate new demerit value: 10 - merit value
        const newDemeritValue = val === '' ? 0 : Math.max(0, 10 - val);
        const newDays = row.days.map((d, j) => (j === dayIdx ? newDemeritValue : d));
        
        return { ...row, days: newDays };
      }
      return row;
    });
    setDemerits(updatedDemerits);
  };

  const handleDemeritChange = (cadetIdx, dayIdx, value) => {
    let val = Number(value);
    if (isNaN(val) || value === '') val = '';
    else if (val > 10) val = 10;
    else if (val < 0) val = 0;

    // Update demerits state
    setDemerits(prev => prev.map((row, i) => (
      i === cadetIdx
        ? { ...row, days: row.days.map((d, j) => (j === dayIdx ? val : d)) }
        : row
    )));

    // Force merits to mirror 10 - D immediately in state so UI updates at once
    setMerits(prev => prev.map((row, i) => {
      if (i !== cadetIdx) return row;
      const newMeritValue = val === '' ? 10 : Math.max(0, 10 - val);
      const newDays = (row.days || []).map((d, j) => (j === dayIdx ? newMeritValue : d));
      // Ensure array has at least dayIdx entries
      if (dayIdx >= newDays.length) {
        const fill = Array(dayIdx - newDays.length + 1).fill(10);
        newDays.push(...fill);
        newDays[dayIdx] = newMeritValue;
      }
      return { ...row, days: newDays };
    }));
  };

  const handlePercentageChange = (cadetIdx, value) => {
    const val = Math.max(0, Math.min(30, Number(value)));
    const updated = merits.map((row, i) =>
      i === cadetIdx ? { ...row, percentage: val } : row
    );
    setMerits(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('Starting merit save process...');
      console.log('Selected semester:', selectedSemester);
      console.log('Cadets count:', cadets.length);
      console.log('Merits count:', merits.length);
      
      // Validate that we have data to save
      if (cadets.length === 0) {
        setAlertDialog({
          isOpen: true,
          type: 'error',
          title: 'No Data',
          message: 'No cadet data available to save.'
        });
        return;
      }
      
      if (merits.length === 0) {
        setAlertDialog({
          isOpen: true,
          type: 'error',
          title: 'No Data',
          message: 'No merit data available to save.'
        });
        return;
      }
      
      const weekCount = selectedSemester === '2025-2026 1st semester' ? 10 : 15;
      
      const meritsData = cadets.map((cadet, index) => {
        // Ensure arrays are exactly the expected weeks long, padding with defaults if needed
        let daysMerit = merits[index]?.days || [];
        let daysDemerit = demerits[index]?.days || [];
        
        // Pad merit array to expected weeks with default value of 10
        if (daysMerit.length < weekCount) {
          daysMerit = [...daysMerit, ...Array(weekCount - daysMerit.length).fill(10)];
        }
        
        // Pad demerit array to expected weeks with default value of 0  
        if (daysDemerit.length < weekCount) {
          daysDemerit = [...daysDemerit, ...Array(weekCount - daysDemerit.length).fill(0)];
        }
        
        // Always compute merits from demerits: merit = 10 - demerit
        const numericMerits = daysDemerit.map(d => Math.max(0, 10 - (Number(d) || 0)));
        const numericDemerits = daysDemerit.map(val => {
          if (val === '' || val === '-' || val === null || val === undefined) return '';
          const n = Number(val);
          return isNaN(n) ? '' : n;
        });
        
        // Debug: Log array lengths to verify 15 weeks are included
        if (index === 0) { // Log only for first cadet to avoid spam
          console.log(`DEBUG: Cadet ${cadet.id} array lengths:`, {
            merits: daysMerit.length,
            demerits: daysDemerit.length,
            numericMerits: numericMerits.length,
            numericDemerits: numericDemerits.length,
            demeritsContent: daysDemerit,
            numericMeritsContent: numericMerits,
            weeks11to15_demerits: daysDemerit.slice(10, 15),
            weeks11to15_merits: numericMerits.slice(10, 15)
          });
        }
        // Compute capped percentage (0-30)
        const sumMerits = numericMerits.reduce((s, v) => s + (Number(v) || 0), 0);
        const sumDemerits = numericDemerits.reduce((s, v) => s + (Number(v) || 0), 0);
        const net = sumMerits - sumDemerits;
        const maxPossible = weekCount * 10;
        const computedPct = Math.min(30, Math.max(0, Math.round(((maxPossible === 0 ? 0 : net / maxPossible) * 30))));

        return {
          cadet_id: cadet.id,
          days: numericMerits,
          demerits: numericDemerits,
          percentage: computedPct
        };
      });

      console.log('Merits data prepared:', meritsData);
      
      // Additional debug: Check weeks 11-15 data specifically
      if (meritsData.length > 0) {
        const firstCadet = meritsData[0];
        console.log('DEBUG: First cadet data structure for weeks 11-15:', {
          cadet_id: firstCadet.cadet_id,
          days_length: firstCadet.days.length,
          demerits_length: firstCadet.demerits.length,
          weeks_11_15_days: firstCadet.days.slice(10, 15),
          weeks_11_15_demerits: firstCadet.demerits.slice(10, 15),
          has_demerits_key: 'demerits' in firstCadet,
          demerits_type: typeof firstCadet.demerits
        });
      }

      // Get CSRF token from meta tag
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
      if (!csrfToken) {
        setAlertDialog({
          isOpen: true,
          type: 'error',
          title: 'Security Error',
          message: 'CSRF token not found. Please refresh the page and try again.'
        });
        return;
      }

      console.log('Sending request to save merits...');
      
      // Determine which save endpoint to use based on selected semester
      let saveEndpoint;
      if (selectedSemester === '2025-2026 1st semester') {
        saveEndpoint = '/api/first_semester_aptitude/save';
      } else if (selectedSemester === '2025-2026 2nd semester') {
        saveEndpoint = '/api/second_semester_aptitude/save';
      } else {
        setAlertDialog({
          isOpen: true,
          type: 'error',
          title: 'Invalid Semester',
          message: 'Unknown semester selected.'
        });
        return;
      }
      
      console.log('Using save endpoint:', saveEndpoint);
      
      const response = await fetch(saveEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          merits: meritsData
        })
      });

      console.log('Response received:', response.status, response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('Merit save successful:', result);
        
        // Success alert
        setAlertDialog({
          isOpen: true,
          type: 'success',
          title: 'Save Successful',
          message: 'Merit scores have been saved successfully.'
        });
        
        setIsEditing(false);
        
        // Refresh the data to show the updated values
        console.log('Refreshing data after save...');
        // Add a small delay to ensure database transaction is fully committed
        await new Promise(resolve => setTimeout(resolve, 200));
        await fetchDataForSemester(selectedSemester);
        console.log('Data refresh completed');
      } else if (response.status === 419) {
        // CSRF token mismatch or session expired
        setAlertDialog({
          isOpen: true,
          type: 'error',
          title: 'Session Expired',
          message: 'Session expired. Please refresh the page and try again.'
        });
        setTimeout(() => window.location.reload(), 2000);
      } else if (response.status === 422) {
        // Laravel validation error
        const error = await response.json();
        let errorMsg = 'Validation error:';
        if (error.errors) {
          for (const [field, messages] of Object.entries(error.errors)) {
            errorMsg += `\n${field}: ${messages.join(', ')}`;
          }
        } else {
          errorMsg += ' ' + JSON.stringify(error);
        }
        setAlertDialog({
          isOpen: true,
          type: 'error',
          title: 'Validation Error',
          message: errorMsg
        });
      } else if (response.status === 401) {
        // Unauthorized
        setAlertDialog({
          isOpen: true,
          type: 'error',
          title: 'Unauthorized',
          message: 'You are not authorized to perform this action. Please log in again.'
        });
        setTimeout(() => window.location.href = '/login', 2000);
      } else {
        // Try to get JSON error response first
        let errorText;
        try {
          const errorJson = await response.json();
          errorText = errorJson.message || JSON.stringify(errorJson);
        } catch (e) {
          // If JSON parsing fails, get text response
          errorText = await response.text();
        }
        
        // Check if the response contains HTML (like a Laravel error page)
        if (errorText.includes('<!DOCTYPE html>') || errorText.includes('<html')) {
          setAlertDialog({
            isOpen: true,
            type: 'error',
            title: 'Server Error',
            message: 'Server error occurred. Please try again or contact support if the problem persists.'
          });
        } else {
          setAlertDialog({
            isOpen: true,
            type: 'error',
            title: 'Save Failed',
            message: 'Failed to save merits: ' + errorText
          });
        }
      }
    } catch (error) {
      console.error('Error saving merits:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setAlertDialog({
          isOpen: true,
          type: 'error',
          title: 'Network Error',
          message: 'Network error. Please check your connection and try again.'
        });
      } else {
        setAlertDialog({
          isOpen: true,
          type: 'error',
          title: 'Save Error',
          message: 'Error saving merits: ' + error.message
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Restore from snapshots if available
    if (originalMerits && originalMerits.length) {
      setMerits(JSON.parse(JSON.stringify(originalMerits)));
    }
    if (originalDemerits && originalDemerits.length) {
      setDemerits(JSON.parse(JSON.stringify(originalDemerits)));
    }
    setIsEditing(false);
    // Force a remount of the table so input values reflect restored state
    setRenderKey(prev => prev + 1);
    toast.info('Editing cancelled. Changes discarded.');
  };

  // Filtered and sorted cadets
  const filteredCadets = cadets.filter(cadet => {
    const nameMatches = formatCadetName(cadet).toLowerCase().includes(search.toLowerCase());
    const platoonMatches = !selectedPlatoon || cadet.platoon === selectedPlatoon;
    const companyMatches = !selectedCompany || cadet.company === selectedCompany;
    const battalionMatches = !selectedBattalion || cadet.battalion === selectedBattalion;
    const notArchived = !cadet.archived;
    return notArchived && nameMatches && platoonMatches && companyMatches && battalionMatches;
  });

  // Sort cadets alphabetically by name before paginating
  const sortedCadets = [...filteredCadets].sort((a, b) => {
    const order = (c) => {
      const batt = (c.battalion || '').toLowerCase();
      const g = (c.gender || '').toLowerCase();
      if (batt.includes('1st') || g === 'male' || g === 'm') return 0;
      if (batt.includes('2nd') || g === 'female' || g === 'f') return 1;
      return 2;
    };
    const aO = order(a);
    const bO = order(b);
    if (aO !== bO) return aO - bO;
    return formatCadetName(a).localeCompare(formatCadetName(b));
  });
  const totalPages = Math.ceil(sortedCadets.length / cadetsPerPage);
  const paginatedCadets = sortedCadets.slice(
    (currentPage - 1) * cadetsPerPage,
    currentPage * cadetsPerPage
  );

  // Handle slider change for second semester weeks
const handleSliderChange = (newPosition) => {
  const totalWeeks = selectedSemester === '2025-2026 1st semester' ? 10 : 15;
  const maxPos = Math.max(0, totalWeeks - WEEK_WINDOW);
  const clampedPosition = Math.max(0, Math.min(newPosition, maxPos));
  setScrollPosition(clampedPosition);
  setCurrentWeekRange({ start: clampedPosition, end: clampedPosition + WEEK_WINDOW - 1 });
};

// Weeks helpers
  const getAllWeeks = () => (selectedSemester === '2025-2026 1st semester' ? firstSemesterWeeks.slice(0, 10) : secondSemesterWeeks);
  const getCurrentWeeks = () => {
    const weeks = getAllWeeks();
    // On mobile, show all weeks to match desired behavior
    if (isMobile) return weeks;
    return weeks.slice(currentWeekRange.start, currentWeekRange.start + WEEK_WINDOW);
  };

  // Calculate total merits: start with max possible, deduct demerits
  const calculateTotalMerits = (meritValues = [], demeritValues = []) => {
    const weeks = selectedSemester === '2025-2026 1st semester' ? 10 : 15;
    const maxPossible = weeks * 10; // 100 for first sem; 150 for second sem
    const totalDemerits = (demeritValues || []).reduce((sum, d) => sum + (Number(d) || 0), 0);
    return Math.max(0, maxPossible - totalDemerits);
  };

  // Calculate total merits for the currently displayed weeks only (UI display)
  const calculateDisplayedTotalMerits = (demeritValues = []) => {
    const displayWeeks = getCurrentWeeks().length;
    // On mobile, compute across all weeks; on desktop, compute for the visible window
    const start = isMobile ? 0 : currentWeekRange.start;
    const totalDemerits = (demeritValues || [])
      .slice(start, start + displayWeeks)
      .reduce((sum, d) => sum + (Number(d) || 0), 0);
    return Math.max(0, displayWeeks * 10 - totalDemerits);
  };

  // Calculate aptitude 30% as (total_merits / maxPossible) × 30
  const calculateAptitudeScore = (meritValues, demeritValues = []) => {
    const total = calculateTotalMerits(meritValues, demeritValues);
    const weeks = selectedSemester === '2025-2026 1st semester' ? 10 : 15;
    const maxPossible = weeks * 10;
    // Calculate aptitude as percentage of maximum possible (100 for first, 150 for second) scaled to 30 points
    const aptitudeScore = Math.round((total / maxPossible) * 30);
    // Cap at 30 (maximum aptitude score)
    return Math.min(30, Math.max(0, aptitudeScore));
  };


  return (
    <>
      <Head title="ROTC Portal - Aptitude" />
      <div className='w-full min-h-screen bg-backgroundColor'>
      <Header auth={auth} />
      <div className="flex flex-col md:flex-row">
        <FacultySidebar />
        <div className="flex-1 p-3 md:p-6">
          <div className="font-regular animate-fade-in-up">
            {/* Breadcrumb */}
          <div className="bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 text-sm md:text-base animate-fade-in-up">
                <Link href="/faculty/facultyHome" className="hover:underline cursor-pointer font-semibold">
                  Dashboard
                </Link>
                <span className="mx-2 font-semibold">{">"}</span>
                <span className="cursor-default font-bold">Aptitude</span>  
          </div>
          {/* Page Header and Controls */}
          <div className="flex items-center justify-between mt-3 md:mt-4 mb-4 md:mb-6 pl-3 md:pl-5 py-4 md:py-7 bg-primary text-white p-3 md:p-4 rounded-lg animate-fade-in-down">
            <h1 className="text-lg md:text-2xl font-semibold">Aptitude Management</h1>
            
              </div>
             {/* Tab Navigation */}
             <div className="bg-white p-3 md:p-6 rounded-lg shadow mb-4 md:mb-6 animate-scale-in-up">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                   <button 
                     onClick={() => {
                       console.log('Switching to current semester');
                       setIsEditing(false);
                       setCurrentPage(1);
                       setActiveTab('current');
                       setSelectedSemester('2025-2026 1st semester');
                       // Fetch will be triggered by useEffect on selectedSemester
                     }}
                      className={`w-full sm:w-auto py-2 px-3 md:px-4 rounded-lg text-sm md:text-base ${activeTab === 'current' 
                       ? 'bg-primary text-white' 
                       : 'bg-gray-100 text-gray-700'}`}
                   >
                     2025-2026 1st semester
                   </button>
                   <button 
                     onClick={() => {
                       console.log('Switching to previous semester');
                       setIsEditing(false);
                       setCurrentPage(1);
                       setActiveTab('previous');
                       setSelectedSemester('2025-2026 2nd semester');
                       // Fetch will be triggered by useEffect on selectedSemester
                     }}
                      className={`w-full sm:w-auto py-2 px-3 md:px-4 rounded-lg text-sm md:text-base ${activeTab === 'previous' 
                       ? 'bg-primary text-white' 
                       : 'bg-gray-100 text-gray-700'}`}
                   >
                     2025-2026 2nd semester
                   </button>
                </div>
                  <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 w-full lg:w-auto">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full lg:w-auto">
                      <div className="relative w-full sm:w-auto">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="search"
                          placeholder="Search"
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          className="w-full sm:w-48 p-2 pl-10 border border-gray-300 rounded-lg text-sm md:text-base"
                        />
                      </div>
                      <div className="relative w-full sm:w-auto">
                        <div
                          className="bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 cursor-pointer w-full text-sm md:text-base"
                          onClick={() => setShowSortPicker(!showSortPicker)}
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
                        {showSortPicker && (
                          <>
                            <div 
                              className="fixed inset-0 bg-black bg-opacity-30 z-40"
                              onClick={() => setShowSortPicker(false)}
                            ></div>
                            <div
                              className="fixed sm:absolute inset-x-0 sm:inset-auto z-50 bg-white border border-gray-300 rounded-lg p-4 mt-1 shadow-lg w-[90%] sm:w-64 left-1/2 sm:left-auto right-0 sm:right-0 -translate-x-1/2 sm:translate-x-0 mx-auto sm:mx-0"
                              style={{ maxWidth: '400px' }}
                            >
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Platoon</label>
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
                                {!isNewFaculty && (
                                  <>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                                      <select
                                        className="w-full bg-gray-100 p-2 rounded border"
                                        value={selectedCompany}
                                        onChange={e => setSelectedCompany(e.target.value)}
                                      >
                                        <option value="">Select Company</option>
                                        <option value="Alpha">Alpha</option>
                                        <option value="Bravo">Bravo</option>
                                        <option value="Charlie">Charlie</option>
                                        <option value="Delta">Delta</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">Battalion</label>
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
                                  </>
                                )}
                                <div className="flex gap-2 mt-4">
                                  <button
                                    className="flex-1 px-4 py-2 bg-gray-300 rounded text-sm hover:bg-gray-400 text-gray-700"
                                    onClick={() => {
                                      setSelectedPlatoon('');
                                      if (!isNewFaculty) {
                                        setSelectedCompany('');
                                        setSelectedBattalion('');
                                      }
                                      setShowSortPicker(false);
                                    }}
                                  >
                                    Clear
                                  </button>
                                  <button
                                    className="flex-1 px-4 py-2 bg-primary rounded text-sm md:text-base text-white hover:bg-opacity-90"
                                    onClick={() => setShowSortPicker(false)}
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
                    {/* Mobile-only quick action below Sort by */}
                    <div className="flex lg:hidden items-center w-full sm:w-auto">
                      <button
                        onClick={() => {
                          if (!isEditing) {
                            setOriginalMerits(JSON.parse(JSON.stringify(merits)));
                            setOriginalDemerits(JSON.parse(JSON.stringify(demerits)));
                            setIsEditing(true);
                            toast.info('Edit mode enabled. You can now modify demerits.');
                          } else {
                            handleSave();
                          }
                        }}
                        className='bg-primary text-white px-3 md:px-4 py-2 rounded hover:bg-[#3d4422] transition-colors duration-150 w-full text-sm md:text-base disabled:opacity-60 disabled:cursor-not-allowed'
                        disabled={isSaving}
                      >
                        {isEditing ? (isSaving ? 'Saving…' : 'Save') : 'Edit Merits'}
                      </button>
                    </div>
                 </div>
               </div>
             </div>
 
             {/* Main Content */}
             <div className="bg-white p-3 md:p-6 rounded-lg shadow w-full mx-auto animate-scale-in-up">
               <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 md:mb-6 animate-fade-in-up">
                 <h1 className="text-base md:text-lg font-semibold text-black">Military Aptitude</h1>
                 {/* Week window controls (desktop/tablet) */}
                 <div className="hidden sm:flex items-center gap-2">
                   <button
                     className="px-2 py-1 rounded border bg-white hover:bg-gray-50"
                     onClick={() => handleSliderChange(scrollPosition - 1)}
                     disabled={scrollPosition === 0}
                     title="Previous weeks"
                   >
                     <FaAngleLeft />
                   </button>
                   <div className="text-sm text-gray-700 whitespace-nowrap">
                     Weeks {currentWeekRange.start + 1} - {Math.min((currentWeekRange.start + WEEK_WINDOW), getAllWeeks().length)} of {getAllWeeks().length}
                   </div>
                   <button
                     className="px-2 py-1 rounded border bg-white hover:bg-gray-50"
                     onClick={() => handleSliderChange(scrollPosition + 1)}
                     disabled={currentWeekRange.end >= getAllWeeks().length - 1}
                     title="Next weeks"
                   >
                     <FaAngleRight />
                   </button>
                 </div>
               </div>
               
               
               {/* Current Semester Content */}
               {activeTab === 'current' && (
                 <>
                   {/* Desktop/Tablet Table */}
                  <div className="overflow-x-auto hidden sm:block animate-fade-in-up">
                    <div className="min-w-full">
                      <table key={renderKey} className="border-collapse table-auto md:table-fixed w-max md:w-full min-w-full">
                        <thead className="text-gray-600 bg-gray-50">
                          <tr>
                            <th className="p-1 sm:p-2 md:p-3 border-b font-medium text-left text-xs sm:text-sm md:text-base min-w-[140px] md:min-w-[160px] sticky left-0 bg-white z-10">Cadet Names</th>
                    {/* Dynamically render week columns with M/D subheaders */}
                    {getCurrentWeeks().map((week) => {
                      const weekDate = getWeekDate(week, selectedSemester);
                      return (
                      <th key={week} className="p-1 sm:p-2 md:p-3 border-b font-medium text-center min-w-[56px] md:min-w-[72px] whitespace-nowrap">
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">{week}</span>
                          {weekDate && (
                            <span className="text-[7px] sm:text-[9px] md:text-[10px] text-gray-500 mb-0.5">{weekDate}</span>
                          )}
                          <div className="flex xl:flex-row flex-col items-center justify-center gap-0.5 sm:gap-1 md:gap-1.5">
                            <span className="bg-green-100 text-gray-700 text-[8px] sm:text-[10px] md:text-xs font-medium px-0.5 sm:px-1 md:px-1.5 py-0.5 rounded-full">M</span>
                            <span className="bg-red-100 text-gray-700 text-[8px] sm:text-[10px] md:text-xs font-medium px-0.5 sm:px-1 md:px-1.5 py-0.5 rounded-full">D</span>
                          </div>
                        </div>
                      </th>
                    )})}
                    <th className="p-1 sm:p-2 md:p-3 border-b font-medium text-center text-xs sm:text-sm md:text-base min-w-[80px]">Total Merits</th>
                    <th className="p-1 sm:p-2 md:p-3 border-b font-medium text-center text-xs sm:text-sm md:text-base min-w-[80px]">Aptitude (30%)</th>
                  </tr>
                </thead>
                  <tbody>
                  {paginatedCadets.map((cadet, i) => {
                    const cadetIndex = cadets.findIndex(c => c.id === cadet.id);
                    const weeks = selectedSemester === '2025-2026 1st semester' ? 10 : 15;
                    let meritValues = merits[cadetIndex]?.days ?? [];
                    let demeritValues = demerits[cadetIndex]?.days ?? [];
                    // Pad missing weeks: merits should default to 10 (full merit) for weeks
                    // with no data yet, so totals include all 15 weeks by default.
                    if (meritValues.length < weeks) meritValues = [...meritValues, ...Array(weeks - meritValues.length).fill(10)];
                    if (demeritValues.length < weeks) demeritValues = [...demeritValues, ...Array(weeks - demeritValues.length).fill(0)];
                    const totalMerits = calculateTotalMerits(meritValues, demeritValues);
                    const aptitudeScore = calculateAptitudeScore(meritValues, demeritValues);
                    
                    return (
                      <tr key={cadet.id} className="border-b border-gray-200 odd:bg-white even:bg-gray-50">
                        <td className="p-1 sm:p-2 md:p-3 text-gray-900 text-xs sm:text-sm md:text-base sticky left-0 bg-white z-10 min-w-[120px]">{formatCadetName(cadet)}</td>
                        {getCurrentWeeks().map((week, j) => {
                          const weekIndex = currentWeekRange.start + j; // Correct index accounting for current week range
                          return (
                            <td key={j} className="p-1 sm:p-2 md:p-3 text-center">
                              <div className="flex xl:flex-row flex-col items-center justify-center gap-0.5 sm:gap-1">
                                {/* Merits input (Green) */}
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  value={(() => {
                                    if (meritValues[weekIndex] === null || meritValues[weekIndex] === undefined || meritValues[weekIndex] === '' || meritValues[weekIndex] === '-') {
                                      const demeritVal = Number(demeritValues[weekIndex]) || 0;
                                      const calculatedMerit = Math.max(0, 10 - demeritVal);
                                      return isNaN(calculatedMerit) ? 10 : calculatedMerit;
                                    }
                                    const meritVal = Number(meritValues[weekIndex]);
                                    return isNaN(meritVal) ? 10 : meritVal;
                                  })()}
                                  className={`w-3 h-3 sm:w-5 sm:h-4 md:w-7 md:h-5 lg:w-9 lg:h-7 text-center border border-gray-300 rounded text-[7px] sm:text-[9px] md:text-[11px] lg:text-sm font-medium bg-gray-100 cursor-not-allowed text-gray-500`}
                                  placeholder="10"
                                  disabled={true}
                                  readOnly
                                />
                                {/* Demerits input (Red) */}
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  value={(() => {
                                    if (demeritValues[weekIndex] === null || demeritValues[weekIndex] === undefined || demeritValues[weekIndex] === '' || demeritValues[weekIndex] === '-') {
                                      return '';
                                    }
                                    const demeritVal = Number(demeritValues[weekIndex]);
                                    return isNaN(demeritVal) ? '' : demeritVal;
                                  })()}
                                  onChange={e => handleDemeritChange(cadetIndex, weekIndex, e.target.value)}
                                  className={`w-3 h-3 sm:w-5 sm:h-4 md:w-7 md:h-5 lg:w-9 lg:h-7 text-center border border-gray-300 rounded text-[7px] sm:text-[9px] md:text-[11px] lg:text-sm font-medium ${!isEditing ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white text-gray-700 hover:border-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500'}`}
                                  placeholder="0"
                                  disabled={!isEditing || isSaving}
                                />
                              </div>
                            </td>
                          );
                        })}
                        <td className="p-1 sm:p-2 md:p-3 text-center text-xs sm:text-sm md:text-base">
                          {/* Display total merit score */}
                          {totalMerits}
                        </td>
                        <td className="p-1 sm:p-2 md:p-3 text-center text-xs sm:text-sm md:text-base">
                          {/* Display calculated aptitude score, not an input */}
                          {isNaN(Number(aptitudeScore)) ? 0 : aptitudeScore}
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
                      </div>
            </div>
                    {/* Mobile Card List */}
                    <div className="sm:hidden space-y-3 animate-fade-in-up">
                      {paginatedCadets.map((cadet) => {
                        const cadetIndex = cadets.findIndex(c => c.id === cadet.id);
                        const weeks = selectedSemester === '2025-2026 1st semester' ? 10 : 15;
                        let meritValues = merits[cadetIndex]?.days ?? [];
                        let demeritValues = demerits[cadetIndex]?.days ?? [];
                        if (meritValues.length < weeks) meritValues = [...meritValues, ...Array(weeks - meritValues.length).fill(10)];
                        if (demeritValues.length < weeks) demeritValues = [...demeritValues, ...Array(weeks - demeritValues.length).fill(0)];
                        const totalMerits = calculateTotalMerits(meritValues, demeritValues);
                        const aptitudeScore = calculateAptitudeScore(meritValues, demeritValues);

                        return (
                          <div key={cadet.id} className="border rounded-lg p-3 bg-white shadow-sm">
                            <div className="font-semibold text-gray-900 mb-2">{formatCadetName(cadet)}</div>
                            <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-600 mb-2">
                              <div><span className="font-medium">Total Merits:</span> {totalMerits}</div>
                              <div className="col-span-2"><span className="font-medium">Aptitude (30%):</span> {isNaN(Number(aptitudeScore)) ? 0 : aptitudeScore}</div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              {getCurrentWeeks().map((week, j) => {
                                const weekIndex = currentWeekRange.start + j;
                                const weekDate = getWeekDate(week, selectedSemester);
                                return (
                                  <div key={j} className="border rounded p-2">
                                    <div className="text-[10px] text-gray-700 mb-1 text-center">{week}</div>
                                    {weekDate && (
                                      <div className="text-[8px] text-gray-500 mb-1 text-center">{weekDate}</div>
                                    )}
                                    <div className="flex items-center justify-center gap-1">
                                      <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={(() => {
                                          if (meritValues[weekIndex] === null || meritValues[weekIndex] === undefined || meritValues[weekIndex] === '' || meritValues[weekIndex] === '-') {
                                            const demeritVal = Number(demeritValues[weekIndex]) || 0;
                                            const calculatedMerit = Math.max(0, 10 - demeritVal);
                                            return isNaN(calculatedMerit) ? 10 : calculatedMerit;
                                          }
                                          const meritVal = Number(meritValues[weekIndex]);
                                          return isNaN(meritVal) ? 10 : meritVal;
                                        })()}
                                        className={`w-10 h-7 text-center border border-gray-300 rounded text-[11px] font-medium bg-gray-100 cursor-not-allowed text-gray-500`}
                                        placeholder="10"
                                        disabled={true}
                                        readOnly
                                      />
                                      <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={(() => {
                                          if (demeritValues[weekIndex] === null || demeritValues[weekIndex] === undefined || demeritValues[weekIndex] === '' || demeritValues[weekIndex] === '-') {
                                            return '';
                                          }
                                          const demeritVal = Number(demeritValues[weekIndex]);
                                          return isNaN(demeritVal) ? '' : demeritVal;
                                        })()}
                                        onChange={e => handleDemeritChange(cadetIndex, weekIndex, e.target.value)}
                                        className={`${!isEditing ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white text-gray-700 hover:border-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500'} w-10 h-7 text-center border border-gray-300 rounded text-[11px] font-medium`}
                                        placeholder="0"
                                        disabled={!isEditing}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
            {/* Horizontal Scrollbar (currently unused for 2nd semester since all 15 weeks are shown, keep for future use) */}
            {false && selectedSemester === '2025-2026 2nd semester' && (
              <div className="w-full mt-3 md:mt-4">
                <div className="flex items-center gap-2 w-full">
                  <button
                    className="text-gray-600 hover:text-gray-800 text-lg p-2 rounded hover:bg-gray-100"
                    onClick={() => handleSliderChange(Math.max(0, scrollPosition - 1))}
                    aria-label="Scroll weeks left"
                    title="Scroll weeks left"
                    disabled={scrollPosition === 0}
                  >
                    ‹
                  </button>
                  <div className="flex-1 relative max-w-full">
                    <div className="w-full h-2 bg-gray-200 rounded-full relative overflow-hidden">
                      <div 
                        className="absolute top-0 h-full bg-gray-500 rounded-full transition-all duration-200"
                        style={{ 
                          width: '25%',
                          left: `${(scrollPosition / 5) * 75}%`
                        }}
                      ></div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="1"
                      value={scrollPosition}
                      onChange={(e) => handleSliderChange(Number(e.target.value))}
                      className="absolute top-0 left-0 w-full h-6 opacity-0 cursor-pointer"
                      aria-label="Week range"
                    />
                  </div>
                  <button
                    className="text-gray-600 hover:text-gray-800 text-lg p-2 rounded hover:bg-gray-100"
                    onClick={() => handleSliderChange(Math.min(5, scrollPosition + 1))}
                    aria-label="Scroll weeks right"
                    title="Scroll weeks right"
                    disabled={scrollPosition === 5}
                  >
                    ›
                  </button>
                </div>
              </div>
            )}

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
              {/* Right: Action Buttons - Always visible */}
              <div className="flex justify-end gap-2 order-3 w-full sm:w-auto">
                {!isEditing ? (
                  <button 
                    onClick={() => {
                      // take snapshot for cancel restore
                      setOriginalMerits(JSON.parse(JSON.stringify(merits)));
                      setOriginalDemerits(JSON.parse(JSON.stringify(demerits)));
                      setIsEditing(true);
                      toast.info('Edit mode enabled. You can now modify demerits.');
                    }}
                    className='bg-primary text-white px-3 md:px-4 py-2 rounded hover:bg-[#3d4422] transition-colors duration-150 text-sm md:text-base disabled:opacity-60 disabled:cursor-not-allowed'
                  >
                    Edit Aptitude
                  </button>
                ) : (
                  <>
                    
                    <button 
                      onClick={handleCancel}
                      className="bg-gray-500 text-white px-3 md:px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors duration-150 text-sm md:text-base"
                    >
                      Cancel
                    </button>

                    <button 
                      onClick={handleSave}
                      className='bg-primary text-white px-3 md:px-4 py-2 rounded hover:bg-[#3d4422] transition-colors duration-150 text-sm md:text-base disabled:opacity-60 disabled:cursor-not-allowed'
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving…' : 'Save'}
                    </button>
                  </>
                )}
              </div>
            </div>
               </>
             )}
             
               {/* Previous Semester Content */}
               {activeTab === 'previous' && (
                 <>
                  {/* Desktop/Tablet Table */}
                 <div className="overflow-x-auto hidden sm:block animate-fade-in-up" ref={previousTableScrollRef}>
                     <div className="min-w-full">
                      <table className="border-collapse table-auto md:table-fixed w-max md:w-full min-w-full">
                        <thead className="text-gray-600 bg-gray-50">
                          <tr>
                            <th className="p-1 sm:p-2 md:p-3 border-b font-medium text-left text-xs sm:text-sm md:text-base min-w-[140px] md:min-w-[160px] sticky left-0 bg-white z-10">Cadet Names</th>
                     {/* Dynamically render week columns with M/D subheaders */}
                    {getCurrentWeeks().map((week) => {
                      const weekDate = getWeekDate(week, selectedSemester);
                      return (
                      <th key={week} className="p-1 sm:p-2 md:p-3 border-b font-medium text-center min-w-[56px] md:min-w-[72px] whitespace-nowrap">
                         <div className="flex flex-col items-center">
                           <span className="text-[8px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">{week}</span>
                           {weekDate && (
                             <span className="text-[7px] sm:text-[9px] md:text-[10px] text-gray-500 mb-0.5">{weekDate}</span>
                           )}
                          <div className="flex justify-center gap-0.5 sm:gap-1 md:gap-1.5">
                            <span className="bg-green-100 text-gray-700 text-[8px] sm:text-[10px] md:text-xs font-medium px-0.5 sm:px-1 md:px-1.5 py-0.5 rounded-full">M</span>
                            <span className="bg-red-100 text-gray-700 text-[8px] sm:text-[10px] md:text-xs font-medium px-0.5 sm:px-1 md:px-1.5 py-0.5 rounded-full">D</span>
                           </div>
                         </div>
                       </th>
                    )})}
                     <th className="p-1 sm:p-2 md:p-3 border-b font-medium text-center text-xs sm:text-sm md:text-base min-w-[80px]">Total Merits</th>
                     <th className="p-1 sm:p-2 md:p-3 border-b font-medium text-center text-xs sm:text-sm md:text-base min-w-[80px]">Aptitude (30%)</th>
                   </tr>
                 </thead>
                <tbody>
                  {paginatedCadets.map((cadet) => {
                    const cadetIndex = cadets.findIndex(c => c.id === cadet.id);
                    const weeks = selectedSemester === '2025-2026 1st semester' ? 10 : 15;
                    let meritValues = merits[cadetIndex]?.days ?? [];
                    let demeritValues = demerits[cadetIndex]?.days ?? [];
                    // Ensure arrays cover all weeks; pad with defaults when shorter
                    if (meritValues.length < weeks) meritValues = [...meritValues, ...Array(weeks - meritValues.length).fill(10)];
                    if (demeritValues.length < weeks) demeritValues = [...demeritValues, ...Array(weeks - demeritValues.length).fill(0)];
                    const totalMerits = calculateTotalMerits(meritValues, demeritValues);
                    const aptitudeScore = calculateAptitudeScore(meritValues, demeritValues);
                     
                     return (
                       <tr key={cadet.id} className="border-b border-gray-200 odd:bg-white even:bg-gray-50">
                         <td className="p-1 sm:p-2 md:p-3 border-b text-xs sm:text-sm md:text-base sticky left-0 bg-white z-10 min-w-[120px]">
                           <div className="text-gray-900">
                             {formatCadetName(cadet)}
                           </div>
                         </td>
                        {getCurrentWeeks().map((week, j) => {
                          const weekIndex = currentWeekRange.start + j; // Correct index accounting for current week range
                          return (
                            <td key={j} className="p-1 sm:p-2 md:p-3 text-center border-b">
                              <div className="flex gap-0.5 sm:gap-1 justify-center">
                                {/* Merits input (Green) */}
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  value={(() => {
                                    if (meritValues[weekIndex] === null || meritValues[weekIndex] === undefined || meritValues[weekIndex] === '' || meritValues[weekIndex] === '-') {
                                      return '';
                                    }
                                    const meritVal = Number(meritValues[weekIndex]);
                                    return isNaN(meritVal) ? '' : meritVal;
                                  })()}
                                  className={`w-3 sm:w-5 md:w-7 lg:w-9 h-3 sm:h-4 md:h-5 lg:h-7 text-center border border-gray-300 rounded text-[7px] sm:text-[9px] md:text-[11px] lg:text-sm font-medium bg-gray-100 cursor-not-allowed text-gray-500`}
                                  placeholder="10"
                                  disabled={true}
                                  readOnly
                                />
                                {/* Demerits input (Red) */}
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  value={(() => {
                                    if (demeritValues[weekIndex] === null || demeritValues[weekIndex] === undefined || demeritValues[weekIndex] === '' || demeritValues[weekIndex] === '-') {
                                      return '';
                                    }
                                    const demeritVal = Number(demeritValues[weekIndex]);
                                    return isNaN(demeritVal) ? '' : demeritVal;
                                  })()}
                                  onChange={e => handleDemeritChange(cadetIndex, weekIndex, e.target.value)}
                                  className={`w-3 sm:w-5 md:w-7 lg:w-9 h-3 sm:h-4 md:h-5 lg:h-7 text-center border border-gray-300 rounded text-[7px] sm:text-[9px] md:text-[11px] lg:text-sm font-medium ${!isEditing ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white text-gray-700 hover:border-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500'}`}
                                  placeholder="0"
                                  disabled={!isEditing || isSaving}
                                />
                              </div>
                            </td>
                          );
                        })}
                         <td className="p-1 sm:p-2 md:p-3 text-center text-xs sm:text-sm md:text-base">
                           {/* Display total merit score */}
                           {totalMerits}
                         </td>
                         <td className="p-1 sm:p-2 md:p-3 text-center text-xs sm:text-sm md:text-base">
                           {/* Display calculated aptitude score, not an input */}
                           {isNaN(Number(aptitudeScore)) ? 0 : aptitudeScore}
                         </td>
                       </tr>
                     );
                   })}
                   </tbody>
                 </table>
                      </div>
             </div>
            {/* Desktop bottom synced scrollbar for 2nd semester (above pagination) */}
            {activeTab === 'previous' && (
              <div className="hidden sm:block w-full mt-2">
                <div
                  ref={previousBottomScrollRef}
                  className="w-full overflow-x-auto"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  <div style={{ width: Math.max(previousContentWidth, 1200) }} className="h-2"></div>
                </div>
              </div>
            )}

            {/* Mobile Card List */}
             <div className="sm:hidden space-y-3 animate-fade-in-up">
               {paginatedCadets.map((cadet) => {
                 const cadetIndex = cadets.findIndex(c => c.id === cadet.id);
                 const weeks = selectedSemester === '2025-2026 1st semester' ? 10 : 15;
                 let meritValues = merits[cadetIndex]?.days ?? [];
                 let demeritValues = demerits[cadetIndex]?.days ?? [];
                 if (meritValues.length < weeks) meritValues = [...meritValues, ...Array(weeks - meritValues.length).fill(10)];
                 if (demeritValues.length < weeks) demeritValues = [...demeritValues, ...Array(weeks - demeritValues.length).fill(0)];
                        const totalMerits = calculateTotalMerits(meritValues, demeritValues);
                 const aptitudeScore = calculateAptitudeScore(meritValues, demeritValues);

                 return (
                   <div key={cadet.id} className="border rounded-lg p-3 bg-white shadow-sm">
                     <div className="font-semibold text-gray-900 mb-2">{formatCadetName(cadet)}</div>
                     <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-600 mb-2">
                       <div><span className="font-medium">Total Merits:</span> {totalMerits}</div>
                       <div className="col-span-2"><span className="font-medium">Aptitude (30%):</span> {isNaN(Number(aptitudeScore)) ? 0 : aptitudeScore}</div>
                     </div>
                     <div className="grid grid-cols-3 gap-2">
                       {getCurrentWeeks().map((week, j) => {
                         const weekIndex = currentWeekRange.start + j;
                         const weekDate = getWeekDate(week, selectedSemester);
                         return (
                           <div key={j} className="border rounded p-2">
                             <div className="text-[10px] text-gray-700 mb-1 text-center">{week}</div>
                             {weekDate && (
                               <div className="text-[8px] text-gray-500 mb-1 text-center">{weekDate}</div>
                             )}
                             <div className="flex items-center justify-center gap-1">
                               <input
                                 type="number"
                                 min="0"
                                 max="10"
                                 value={(() => {
                                   if (meritValues[weekIndex] === null || meritValues[weekIndex] === undefined || meritValues[weekIndex] === '' || meritValues[weekIndex] === '-') {
                                     return '';
                                   }
                                   const meritVal = Number(meritValues[weekIndex]);
                                   return isNaN(meritVal) ? '' : meritVal;
                                 })()}
                                 className={`w-10 h-7 text-center border border-gray-300 rounded text-[11px] font-medium bg-gray-100 cursor-not-allowed text-gray-500`}
                                 placeholder="10"
                                 disabled={true}
                                 readOnly
                               />
                               <input
                                 type="number"
                                 min="0"
                                 max="10"
                                 value={(() => {
                                   if (demeritValues[weekIndex] === null || demeritValues[weekIndex] === undefined || demeritValues[weekIndex] === '' || demeritValues[weekIndex] === '-') {
                                     return '';
                                   }
                                   const demeritVal = Number(demeritValues[weekIndex]);
                                   return isNaN(demeritVal) ? '' : demeritVal;
                                 })()}
                                 onChange={e => handleDemeritChange(cadetIndex, weekIndex, e.target.value)}
                                 className={`${!isEditing ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white text-gray-700 hover:border-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500'} w-10 h-7 text-center border border-gray-300 rounded text-[11px] font-medium`}
                                 placeholder="0"
                                 disabled={!isEditing}
                               />
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 );
               })}
             </div>
             
             {/* Horizontal Scrollbar for Second Semester - Hidden since showing all weeks */}
             {false && (
             <div className="w-full mt-4">
               <div className="flex items-center gap-2 w-full">
                 <button
                   className="text-gray-600 hover:text-gray-800 text-lg p-2 rounded hover:bg-gray-100"
                   onClick={() => handleSliderChange(Math.max(0, scrollPosition - 1))}
                   disabled={scrollPosition === 0}
                 >
                   ‹
                 </button>
                 <div className="flex-1 relative">
                   <div className="w-full h-2 bg-gray-200 rounded-full relative overflow-hidden">
                     <div 
                       className="absolute top-0 h-full bg-gray-500 rounded-full transition-all duration-200"
                       style={{ 
                         width: '25%',
                         left: `${(scrollPosition / 5) * 75}%`
                       }}
                     ></div>
                   </div>
                   <input
                     type="range"
                     min="0"
                     max="5"
                     step="1"
                     value={scrollPosition}
                     onChange={(e) => handleSliderChange(Number(e.target.value))}
                     className="absolute top-0 left-0 w-full h-6 opacity-0 cursor-pointer"
                   />
                 </div>
                 <button
                   className="text-gray-600 hover:text-gray-800 text-lg p-2 rounded hover:bg-gray-100"
                   onClick={() => handleSliderChange(Math.min(5, scrollPosition + 1))}
                   disabled={scrollPosition === 5}
                 >
                   ›
                 </button>
               </div>
             </div>
             )}
             
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
               {/* Right: Action Buttons - Always visible */}
               <div className="flex justify-end gap-2 order-3 w-full sm:w-auto">
                 {!isEditing ? (
                   <button 
                     onClick={() => {
                       setIsEditing(true);
                       toast.info('Edit mode enabled. You can now modify merits.');
                     }}
                     className='bg-primary text-white px-3 md:px-4 py-2 rounded hover:bg-[#3d4422] transition-colors duration-150 text-sm md:text-base disabled:opacity-60 disabled:cursor-not-allowed'
                   >
                     Edit Merits
                   </button>
                 ) : (
                   <>
                     
                    <button 
                       onClick={handleCancel}
                       className="bg-gray-500 text-white px-3 md:px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors duration-150 text-sm md:text-base"
                     >
                       Cancel
                     </button>
 
                    <button 
                       onClick={handleSave}
                       className='bg-primary text-white px-3 md:px-4 py-2 rounded hover:bg-[#3d4422] transition-colors duration-150 text-sm md:text-base disabled:opacity-60 disabled:cursor-not-allowed'
                       disabled={isSaving}
                     >
                       {isSaving ? 'Saving…' : 'Save'}
                     </button>
                   </>
                 )}
              </div>
              </div>
              </>
              )}
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

export default FacultyMerits;


