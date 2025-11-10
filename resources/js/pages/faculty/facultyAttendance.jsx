import React, { useState, useEffect } from 'react';
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
const getWeekDate = (weekNumber, semester) => {
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

const FacultyAttendance = ({ auth }) => {
  // Check if faculty has company and battalion assigned (new faculty) or not (seeder faculty)
  const isNewFaculty = auth && auth.company && auth.battalion;
  const [cadets, setCadets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedPlatoon, setSelectedPlatoon] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedBattalion, setSelectedBattalion] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('2025-2026 1st semester');
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const cadetsPerPage = 8;

  // Alert state (for future save functionality)
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  // Semester options
  const semesterOptions = ['2025-2026 1st semester', '2025-2026 2nd semester'];

  // Function to fetch data based on selected semester
  const fetchDataForSemester = async (semester) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/attendance/cadets?semester=${encodeURIComponent(semester)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      console.log('Faculty attendance API result:', result);
      console.log('First cadet data structure:', result.data?.[0]);
      
      if (result && result.data && Array.isArray(result.data)) {
        setCadets(result.data);
      } else {
        setCadets([]);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setError(`Failed to load attendance data: ${error.message}`);
      setCadets([]);
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

  const formatCadetName = (cadet) => {
    const lastName = cadet.last_name || '';
    const firstName = cadet.first_name || '';
    const middleName = cadet.middle_name || '';
    const middleInitial = middleName ? ` ${middleName.charAt(0)}.` : '';
    return `${lastName}, ${firstName}${middleInitial}`;
  };

  // Filter and sort cadets
  const filteredCadets = cadets
    .filter(cadet => {
      // adminAttendance already filters for non-admin users, so we don't need role filtering
      const nameMatches = formatCadetName(cadet).toLowerCase().includes(search.toLowerCase());
      const platoonMatches = !selectedPlatoon || cadet.platoon === selectedPlatoon;
      const companyMatches = !selectedCompany || cadet.company === selectedCompany;
      const battalionMatches = !selectedBattalion || cadet.battalion === selectedBattalion;
      return nameMatches && platoonMatches && companyMatches && battalionMatches;
    })
    .sort((a, b) => {
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

  // Pagination logic
  const totalPages = Math.ceil(filteredCadets.length / cadetsPerPage);
  const paginatedCadets = filteredCadets.slice(
    (currentPage - 1) * cadetsPerPage,
    currentPage * cadetsPerPage
  );
  
  // Calculate max weeks based on semester
  const maxWeeks = selectedSemester === '2025-2026 1st semester' ? 10 : 15;

  return (
    <>
      <Head title="ROTC Portal - Faculty Attendance" />
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
                <span className="cursor-default font-bold">Attendance</span>
          </div>
          {/* Page Header */}
          <div className='flex items-center justify-between mt-3 md:mt-4 mb-4 md:mb-6 pl-3 md:pl-5 py-4 md:py-7 bg-primary text-white p-3 md:p-4 rounded-lg animate-fade-in-down'>
            <h1 className='text-lg md:text-2xl font-semibold'>Attendance Report</h1>
          </div>
            {/* Tab Navigation */}
            <div className="bg-white p-3 md:p-6 rounded-lg shadow mb-4 md:mb-6 animate-scale-in-up">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Semester Selection Tabs */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                  {semesterOptions.map((semester) => (
                    <button
                      key={semester}
                      onClick={() => setSelectedSemester(semester)}
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
                  <div className="relative flex-grow sm:flex-grow-0">
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
                        className="bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 cursor-pointer w-full text-sm md:text-base"
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
                      <>
                        <div 
                          className="fixed inset-0 bg-black bg-opacity-30 z-40"
                          onClick={() => setShowFilterPicker(false)}
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
            <div className='bg-white p-3 md:p-6 rounded-lg shadow w-full mx-auto animate-scale-in-up'>
              {/* Title and Controls */}
              <div className='flex justify-between items-center mb-4 md:mb-6 animate-fade-in-up'>
                <h1 className='text-base md:text-lg font-semibold text-black'>Attendance Records</h1>
              </div>
              
              <div className="overflow-x-auto animate-fade-in-up" style={{ maxWidth: '100%' }}>
                {isLoading ? (
                  <div className="flex justify-center items-center h-32 md:h-40">
                    <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-t-2 border-b-2 border-primary"></div>
                    <span className="ml-3 text-gray-600">Loading attendance data...</span>
                  </div>
                ) : (
                  <table className="w-full border-collapse" style={{ minWidth: '800px' }}>
                    <thead className='text-gray-600'>
                      <tr>
                        <th className='py-2 md:py-4 px-2 md:px-3 border-b font-medium text-left text-sm md:text-base sticky left-0 bg-white z-10'>Cadet Names</th>
                        {Array.from({ length: selectedSemester === '2025-2026 1st semester' ? 10 : 15 }, (_, i) => {
                          const weekNumber = i + 1;
                          const weekDate = getWeekDate(weekNumber, selectedSemester);
                          return (
                            <th key={i} className='py-2 md:py-4 px-1 md:px-2 border-b font-medium text-center text-xs md:text-sm min-w-[60px]'>
                              <div className="flex flex-col items-center">
                                <span>Week {weekNumber}</span>
                                {weekDate && (
                                  <span className="text-[9px] md:text-[10px] text-gray-500 mt-0.5">{weekDate}</span>
                                )}
                              </div>
                            </th>
                          );
                        })}
                        <th className='py-2 md:py-4 px-2 md:px-3 border-b font-medium text-center text-sm md:text-base'>Total</th>
                        <th className='py-2 md:py-4 px-2 md:px-3 border-b font-medium text-center text-sm md:text-base'>% (30%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCadets.length === 0 ? (
                        <tr>
                          <td colSpan={selectedSemester === '2025-2026 1st semester' ? 12 : 17} className="py-8 px-4 text-center text-gray-500">
                            {error ? (
                              <div>
                                <p>Error loading data: {error}</p>
                                <button 
                                  onClick={() => fetchDataForSemester(selectedSemester)}
                                  className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                                >
                                  Retry
                                </button>
                              </div>
                            ) : cadets.length === 0 ? (
                              `No cadets found for ${selectedSemester}. Please check if attendance data has been imported.`
                            ) : (
                              `No cadets match the current filter criteria. Total cadets: ${cadets.length}`
                            )}
                          </td>
                        </tr>
                      ) : (
                        paginatedCadets.map((cadet) => {
                          // Calculate attendance from weekly data
                          const weeklyAttendance = cadet.weekly_attendance || {};
                          const presentCount = Object.values(weeklyAttendance).filter(Boolean).length;
                          const attendancePercentage = ((presentCount / maxWeeks) * 30);
                          
                          // Debug logging
                          console.log('Cadet:', formatCadetName(cadet), 'Weekly Data:', weeklyAttendance);
                          
                          return (
                            <tr className='border-b border-gray-200' key={cadet.user_id}>
                              <td className='py-2 md:py-4 px-2 md:px-3 text-black text-sm md:text-base sticky left-0 bg-white z-10 font-medium'>{formatCadetName(cadet)}</td>
                              {Array.from({ length: maxWeeks }, (_, i) => {
                                const weekNumber = i + 1;
                                const isPresent = weeklyAttendance[weekNumber];
                                const isRecorded = weeklyAttendance.hasOwnProperty(weekNumber);
                                
                                let displaySymbol, bgColor, textColor;
                                
                                if (isRecorded && isPresent === true) {
                                  displaySymbol = '✓';
                                  bgColor = 'bg-green-100';
                                  textColor = 'text-green-800';
                                } else {
                                  displaySymbol = '-';
                                  bgColor = 'bg-gray-100';
                                  textColor = 'text-gray-600';
                                }
                                
                                return (
                                  <td key={i} className='py-2 md:py-4 px-1 md:px-2 text-center text-sm'>
                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
                                      {displaySymbol}
                                    </span>
                                  </td>
                                );
                              })}
                              <td className='py-2 md:py-4 px-2 md:px-3 text-center text-black text-sm md:text-base font-medium'>{presentCount}/{maxWeeks}</td>
                              <td className='py-2 md:py-4 px-2 md:px-3 text-center text-black text-sm md:text-base font-medium'>{Math.round(attendancePercentage)}</td>
                            </tr>
                          );
                        })
                      )}
                      {/* Summary row showing total present per week */}
                      {paginatedCadets.length > 0 && (
                        <tr className='border-b-2 border-gray-400 bg-gray-50 font-semibold'>
                          <td className='py-2 md:py-4 px-2 md:px-3 text-black text-sm md:text-base sticky left-0 bg-gray-50 z-10'>Total Present</td>
                          {Array.from({ length: maxWeeks }, (_, i) => {
                            const weekNumber = i + 1;
                            const weekPresentCount = cadets.filter(cadet => {
                              const weeklyAttendance = cadet.weekly_attendance || {};
                              return weeklyAttendance[weekNumber] === true;
                            }).length;
                            
                            return (
                              <td key={i} className='py-2 md:py-4 px-1 md:px-2 text-center text-sm'>
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-black font-semibold text-md">
                                  {weekPresentCount}
                                </span>
                              </td>
                            );
                          })}
                          
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
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
                  {/* Empty for now - no action buttons needed for attendance */}
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Alert Dialog (for future save functionality) */}
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

export default FacultyAttendance;