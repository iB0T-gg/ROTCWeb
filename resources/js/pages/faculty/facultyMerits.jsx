import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
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

// First semester has 10 weeks, second semester has 15 weeks
const firstSemesterWeeks = Array.from({ length: 10 }, (_, i) => `Week ${i + 1}`);
const secondSemesterWeeks = Array.from({ length: 15 }, (_, i) => `Week ${i + 1}`);

const FacultyMerits = ({ auth }) => {
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
  
  // Slider state for second semester weeks
  const [currentWeekRange, setCurrentWeekRange] = useState({ start: 0, end: 9 }); // Show weeks 1-10 initially
  const [scrollPosition, setScrollPosition] = useState(0); // 0-5 for different week ranges
  
  // Multiple selection states
  const [selectedPlatoons, setSelectedPlatoons] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedBattalions, setSelectedBattalions] = useState([]);
  const cadetsPerPage = 8;

  // Semester options
  const semesterOptions = ['2025-2026 1st semester', '2026-2027 2nd semester'];

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
      } else if (semester === '2026-2027 2nd semester') {
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
              const meritDays = existingMerit.days_array || Array(weekCount).fill(10);
              const demeritDays = existingMerit.demerits_array || Array(weekCount).fill(0);
              
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
              return {
                days: existingMerit.demerits_array || Array(weekCount).fill(0), // Default to 0 for demerits
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
    
    const updated = demerits.map((row, i) =>
      i === cadetIdx
        ? { ...row, days: row.days.map((d, j) => (j === dayIdx ? val : d)) }
        : row
    );
    setDemerits(updated);

    // Automatically adjust merits when demerits change
    const updatedMerits = merits.map((row, i) => {
      if (i === cadetIdx) {
        // Calculate new merit value: 10 - demerit value
        const newMeritValue = val === '' ? 10 : Math.max(0, 10 - val);
        const newDays = row.days.map((d, j) => (j === dayIdx ? newMeritValue : d));
        
        return { ...row, days: newDays };
      }
      return row;
    });
    setMerits(updatedMerits);
  };

  const handlePercentageChange = (cadetIdx, value) => {
    const val = Math.max(0, Math.min(30, Number(value)));
    const updated = merits.map((row, i) =>
      i === cadetIdx ? { ...row, percentage: val } : row
    );
    setMerits(updated);
  };

  const handleSave = async () => {
    try {
      console.log('Starting merit save process...');
      console.log('Selected semester:', selectedSemester);
      console.log('Cadets count:', cadets.length);
      console.log('Merits count:', merits.length);
      
      // Validate that we have data to save
      if (cadets.length === 0) {
        toast.error('No cadet data available to save.');
        return;
      }
      
      if (merits.length === 0) {
        toast.error('No merit data available to save.');
        return;
      }
      
      const weekCount = selectedSemester === '2025-2026 1st semester' ? 10 : 15;
      
      const meritsData = cadets.map((cadet, index) => {
        const daysMerit = merits[index]?.days || Array(weekCount).fill('');
        const daysDemerit = demerits[index]?.days || Array(weekCount).fill('');
        const numericMerits = daysMerit.map(val => {
          if (val === '' || val === '-' || val === null || val === undefined) return '';
          const n = Number(val);
          return isNaN(n) ? '' : n;
        });
        const numericDemerits = daysDemerit.map(val => {
          if (val === '' || val === '-' || val === null || val === undefined) return '';
          const n = Number(val);
          return isNaN(n) ? '' : n;
        });
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

      // Get CSRF token from meta tag
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
      if (!csrfToken) {
        toast.error('CSRF token not found. Please refresh the page and try again.');
        return;
      }

      console.log('Sending request to save merits...');
      
      // Show loading toast
      const semesterInfo = selectedSemester === '2025-2026 1st semester' ? 'First Semester' : 'Second Semester';
      toast.info(`Saving merit scores for ${semesterInfo}...`);
      
      // Determine which save endpoint to use based on selected semester
      let saveEndpoint;
      if (selectedSemester === '2025-2026 1st semester') {
        saveEndpoint = '/api/first_semester_aptitude/save';
      } else if (selectedSemester === '2026-2027 2nd semester') {
        saveEndpoint = '/api/second_semester_aptitude/save';
      } else {
        alert('Unknown semester selected');
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
        
        // Success toast
        toast.success('Successfully added merits scores.');
        
        setIsEditing(false);
        
        // Refresh the data to show the updated values
        console.log('Refreshing data after save...');
        // Add a small delay to ensure database transaction is fully committed
        await new Promise(resolve => setTimeout(resolve, 200));
        await fetchDataForSemester(selectedSemester);
        console.log('Data refresh completed');
      } else if (response.status === 419) {
        // CSRF token mismatch or session expired
        toast.error('Session expired. Please refresh the page and try again.');
        window.location.reload();
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
        toast.error(errorMsg);
      } else if (response.status === 401) {
        // Unauthorized
        toast.error('You are not authorized to perform this action. Please log in again.');
        window.location.href = '/login';
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
          toast.error('Server error occurred. Please try again or contact support if the problem persists.');
        } else {
          toast.error('Failed to save merits: ' + errorText);
        }
      }
    } catch (error) {
      console.error('Error saving merits:', error);
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error('Error saving merits: ' + error.message);
      }
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
    return nameMatches && platoonMatches && companyMatches && battalionMatches;
  });

  // Sort cadets alphabetically by name before paginating
  const sortedCadets = [...filteredCadets].sort((a, b) => formatCadetName(a).localeCompare(formatCadetName(b)));
  const totalPages = Math.ceil(sortedCadets.length / cadetsPerPage);
  const paginatedCadets = sortedCadets.slice(
    (currentPage - 1) * cadetsPerPage,
    currentPage * cadetsPerPage
  );

  // Handle slider change for second semester weeks
  const handleSliderChange = (newPosition) => {
    if (selectedSemester === '2026-2027 2nd semester') {
      const clampedPosition = Math.max(0, Math.min(newPosition, 5)); // 0-5 for 6 different positions
      setScrollPosition(clampedPosition);
      setCurrentWeekRange({ start: clampedPosition, end: clampedPosition + 9 }); // Show 10 weeks at a time
    }
  };

  // Get current weeks to display based on semester
  const getCurrentWeeks = () => {
    if (selectedSemester === '2025-2026 1st semester') {
      return firstSemesterWeeks;
    } else {
      return secondSemesterWeeks.slice(currentWeekRange.start, currentWeekRange.end + 1);
    }
  };

  // Calculate total merit score displayed in the table
  // For 1st semester (10 weeks): sum of M is already 0..100
  // For 2nd semester (15 weeks): normalize sum of M (0..150) to a 0..100 scale
  const calculateTotalMerits = (meritValues) => {
    const weeks = selectedSemester === '2025-2026 1st semester' ? 10 : 15;
    const sumMerits = meritValues.reduce((sum, val) => sum + (Number(val) || 0), 0);
    if (weeks === 15) {
      return Math.round((sumMerits / (weeks * 10)) * 100); // normalize to 0..100
    }
    return sumMerits; // already 0..100 for 10 weeks
  };

  // Calculate aptitude 30% as TotalMerits (0..100) × 0.3
  const calculateAptitudeScore = (meritValues) => {
    const totalMeritsScore = calculateTotalMerits(meritValues); // 0..100
    return Math.round(totalMeritsScore * 0.3); // 0..30
  };


  return (
    <div className='w-full min-h-screen bg-backgroundColor'>
      <Header auth={auth} />
      <div className="flex">
        <FacultySidebar />
        <div className="flex-1 p-6">
            {/* Breadcrumb */}
          <div className="bg-gray-100 p-3 text-gray-600 rounded-lg pl-5 cursor-pointer mb-4">
                Home {">"} Aptitude
            </div>
          {/* Page Header and Controls */}
          <div className="flex items-center justify-between mt-4 mb-6 pl-5 py-7 bg-primary text-white p-4 rounded-lg">
            <h1 className="text-2xl font-semibold">Aptitude Management</h1>
            
              </div>
             {/* Tab Navigation */}
             <div className="bg-white p-6 rounded-lg shadow mb-6">
               <div className="flex items-center justify-between gap-4">
                 <div className="flex items-center gap-4">
                   <button 
                     onClick={() => {
                       console.log('Switching to current semester');
                       setIsEditing(false);
                       setCurrentPage(1);
                       setActiveTab('current');
                       setSelectedSemester('2025-2026 1st semester');
                       // Fetch will be triggered by useEffect on selectedSemester
                     }}
                     className={`py-2 px-4 rounded-lg ${activeTab === 'current' 
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
                       setSelectedSemester('2026-2027 2nd semester');
                       // Fetch will be triggered by useEffect on selectedSemester
                     }}
                     className={`py-2 px-4 rounded-lg ${activeTab === 'previous' 
                       ? 'bg-primary text-white' 
                       : 'bg-gray-100 text-gray-700'}`}
                   >
                     2026-2027 2nd semester
                   </button>
                </div>
                 <div className="flex items-center gap-4">
                   <div className="relative">
                     <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                     <input
                       type="search"
                       placeholder="Search"
                       value={search}
                       onChange={e => setSearch(e.target.value)}
                       className="w-48 p-2 pl-10 border border-gray-300 rounded-lg"
                     />
                   </div>
                   <div className="relative">
                     <div
                       className="bg-white border border-gray-300 rounded-lg p-2 pl-9 pr-8 cursor-pointer"
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
                             onClick={() => setShowSortPicker(false)}
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
 
             {/* Main Content */}
             <div className="bg-white p-6 rounded-lg shadow w-full mx-auto">
               <div className="flex justify-between items-center mb-6">
                 <h1 className="text-lg font-semibold text-black">Military Attitude</h1>
               </div>
               
               
               {/* Current Semester Content */}
               {activeTab === 'current' && (
                 <>
                   <div className="overflow-x-auto">
                  <table key={renderKey} className="w-full border-collapse">
                <thead className="text-gray-600">
                  <tr>
                    <th className="p-3 border-b font-medium text-left">Cadet Names</th>
                    {/* Dynamically render week columns with M/D subheaders */}
                    {getCurrentWeeks().map((week) => (
                      <th key={week} className="p-3 border-b font-medium text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-medium text-gray-700 mb-2">{week}</span>
                          <div className="flex justify-center gap-2">
                            <span className="bg-green-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">M</span>
                            <span className="bg-red-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">D</span>
                          </div>
                        </div>
                      </th>
                    ))}
                    <th className="p-3 border-b font-medium text-center">Total Merits</th>
                    <th className="p-3 border-b font-medium text-center">Aptitude (30%)</th>
                  </tr>
                </thead>
                  <tbody>
                  {paginatedCadets.map((cadet, i) => {
                    const cadetIndex = cadets.findIndex(c => c.id === cadet.id);
                    const weeks = selectedSemester === '2025-2026 1st semester' ? 10 : 15;
                    let meritValues = merits[cadetIndex]?.days ?? [];
                    let demeritValues = demerits[cadetIndex]?.days ?? [];
                    // Pad missing weeks: merits should default to 10 (full merit) for weeks
                    // with no data yet, so totals include weeks 11-15 by default in 2nd sem.
                    if (meritValues.length < weeks) meritValues = [...meritValues, ...Array(weeks - meritValues.length).fill(10)];
                    if (demeritValues.length < weeks) demeritValues = [...demeritValues, ...Array(weeks - demeritValues.length).fill(0)];
                    const totalMerits = calculateTotalMerits(meritValues);
                    const aptitudeScore = calculateAptitudeScore(meritValues, demeritValues);
                    
                    return (
                      <tr key={cadet.id} className="border-b border-gray-200">
                        <td className="p-3 text-gray-900">{formatCadetName(cadet)}</td>
                        {getCurrentWeeks().map((week, j) => {
                          const weekIndex = selectedSemester === '2025-2026 1st semester' ? j : currentWeekRange.start + j;
                          return (
                            <td key={j} className="p-3 text-center">
                              <div className="flex gap-2 justify-center">
                                {/* Merits input (Green) */}
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  value={meritValues[weekIndex] === null || meritValues[weekIndex] === undefined || meritValues[weekIndex] === '' || meritValues[weekIndex] === '-' ? '' : meritValues[weekIndex]}
                                  className={`w-12 h-8 text-center border border-gray-300 rounded text-sm font-medium bg-gray-100 cursor-not-allowed text-gray-500`}
                                  placeholder="10"
                                  disabled={true}
                                  readOnly
                                />
                                {/* Demerits input (Red) */}
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  value={demeritValues[weekIndex] === null || demeritValues[weekIndex] === undefined || demeritValues[weekIndex] === '' || demeritValues[weekIndex] === '-' ? '' : demeritValues[weekIndex]}
                                  onChange={e => handleDemeritChange(cadetIndex, weekIndex, e.target.value)}
                                  className={`w-12 h-8 text-center border border-gray-300 rounded text-sm font-medium ${!isEditing ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white text-gray-700 hover:border-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500'}`}
                                  placeholder="0"
                                  disabled={!isEditing}
                                />
                              </div>
                            </td>
                          );
                        })}
                        <td className="p-3 text-center">
                          {/* Display total merit score */}
                          {totalMerits}
                        </td>
                        <td className="p-3 text-center">
                          {/* Display calculated aptitude score, not an input */}
                          {isNaN(Number(aptitudeScore)) ? 0 : aptitudeScore}
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
            </div>
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
              {/* Right: Action Buttons */}
              <div className="flex justify-end gap-2">
                {!isEditing ? (
                  <button 
                    onClick={() => {
                      // take snapshot for cancel restore
                      setOriginalMerits(JSON.parse(JSON.stringify(merits)));
                      setOriginalDemerits(JSON.parse(JSON.stringify(demerits)));
                      setIsEditing(true);
                      toast.info('Edit mode enabled. You can now modify demerits.');
                    }}
                    className='bg-primary text-white px-4 py-2 rounded hover:bg-[#3d4422] transition-colors duration-150'
                  >
                    Edit Merits
                  </button>
                ) : (
                  <>
                    
                    <button 
                      onClick={handleCancel}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors duration-150"
                    >
                      Cancel
                    </button>

                    <button 
                      onClick={handleSave}
                      className='bg-primary text-white px-4 py-2 rounded hover:bg-[#3d4422] transition-colors duration-150'
                    >
                      Save
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
                   <div className="overflow-x-auto">
                   <table className="w-full border-collapse">
                 <thead className="text-gray-600">
                   <tr>
                     <th className="p-3 border-b font-medium text-left">Cadet Names</th>
                     {/* Dynamically render week columns with M/D subheaders */}
                     {getCurrentWeeks().map((week) => (
                       <th key={week} className="p-3 border-b font-medium text-center">
                         <div className="flex flex-col items-center">
                           <span className="text-sm font-medium text-gray-700 mb-2">{week}</span>
                           <div className="flex justify-center gap-2">
                             <span className="bg-green-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">M</span>
                             <span className="bg-red-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">D</span>
                           </div>
                         </div>
                       </th>
                     ))}
                     <th className="p-3 border-b font-medium text-center">Total Merits</th>
                     <th className="p-3 border-b font-medium text-center">Aptitude (30%)</th>
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
                    const totalMerits = calculateTotalMerits(meritValues);
                    const aptitudeScore = calculateAptitudeScore(meritValues, demeritValues);
                     
                     return (
                       <tr key={cadet.id} className="hover:bg-gray-50 border-b border-gray-200">
                         <td className="p-3 border-b">
                           <div className="text-gray-900">
                             {formatCadetName(cadet)}
                           </div>
                         </td>
                        {getCurrentWeeks().map((week, j) => {
                          const weekIndex = selectedSemester === '2025-2026 1st semester' ? j : currentWeekRange.start + j;
                          return (
                            <td key={j} className="p-3 text-center border-b">
                              <div className="flex gap-2 justify-center">
                                {/* Merits input (Green) */}
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  value={meritValues[weekIndex] === null || meritValues[weekIndex] === undefined || meritValues[weekIndex] === '' || meritValues[weekIndex] === '-' ? '' : meritValues[weekIndex]}
                                  className={`w-12 h-8 text-center border border-gray-300 rounded text-sm font-medium bg-gray-100 cursor-not-allowed text-gray-500`}
                                  placeholder="10"
                                  disabled={true}
                                  readOnly
                                />
                                {/* Demerits input (Red) */}
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  value={demeritValues[weekIndex] === null || demeritValues[weekIndex] === undefined || demeritValues[weekIndex] === '' || demeritValues[weekIndex] === '-' ? '' : demeritValues[weekIndex]}
                                  onChange={e => handleDemeritChange(cadetIndex, weekIndex, e.target.value)}
                                  className={`w-12 h-8 text-center border border-gray-300 rounded text-sm font-medium ${!isEditing ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white text-gray-700 hover:border-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500'}`}
                                  placeholder="0"
                                  disabled={!isEditing}
                                />
                              </div>
                            </td>
                          );
                        })}
                         <td className="p-3 text-center">
                           {/* Display total merit score */}
                           {totalMerits}
                         </td>
                         <td className="p-3 text-center">
                           {/* Display calculated aptitude score, not an input */}
                           {isNaN(Number(aptitudeScore)) ? 0 : aptitudeScore}
                         </td>
                       </tr>
                     );
                   })}
                   </tbody>
                 </table>
             </div>
             
             {/* Horizontal Scrollbar for Second Semester */}
             <div className="w-full">
               <div className="flex items-center gap-2 w-full">
                 <button
                   className="text-gray-600 hover:text-gray-800 text-lg"
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
                     className="absolute top-0 left-0 w-full h-2 opacity-0 cursor-pointer"
                   />
                 </div>
                 <button
                   className="text-gray-600 hover:text-gray-800 text-lg"
                   onClick={() => handleSliderChange(Math.min(5, scrollPosition + 1))}
                   disabled={scrollPosition === 5}
                 >
                   ›
                 </button>
               </div>
             </div>
             
             <div className="flex justify-between items-center mt-2 w-full">
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
               {/* Right: Action Buttons */}
               <div className="flex justify-end gap-2">
                 {!isEditing ? (
                   <button 
                     onClick={() => {
                       setIsEditing(true);
                       toast.info('Edit mode enabled. You can now modify merits.');
                     }}
                     className='bg-primary text-white px-4 py-2 rounded hover:bg-[#3d4422] transition-colors duration-150'
                   >
                     Edit Merits
                   </button>
                 ) : (
                   <>
                     
                     <button 
                       onClick={handleCancel}
                       className="bg-gray-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-600 transition-colors duration-150"
                     >
                       Cancel
                     </button>
 
                     <button 
                       onClick={handleSave}
                       className='bg-primary text-white px-4 py-2 rounded hover:bg-[#3d4422] transition-colors duration-150'
                     >
                       Save
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
  );
};

export default FacultyMerits;


