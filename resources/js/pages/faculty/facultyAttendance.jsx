import React, { useState, useEffect } from 'react';
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

const FacultyAttendance = ({ auth }) => {
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
    .sort((a, b) => formatCadetName(a).localeCompare(formatCadetName(b)));

  // Pagination logic
  const totalPages = Math.ceil(filteredCadets.length / cadetsPerPage);
  const paginatedCadets = filteredCadets.slice(
    (currentPage - 1) * cadetsPerPage,
    currentPage * cadetsPerPage
  );

  return (
    <div className='w-full min-h-screen bg-backgroundColor'>
      <Header auth={auth} />
      <div className='flex flex-col md:flex-row'>
        <FacultySidebar />
        <div className='flex-1 p-3 md:p-6'>
          <div className='font-regular'>
            <div className='bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 text-sm md:text-base'>
              <Link href="/faculty/facultyHome" className="hover:underline cursor-pointer font-semibold">
                Dashboard
              </Link>
              <span className="mx-2 font-semibold">{">"}</span>
              <span className="cursor-default font-bold">Attendance</span>  
            </div>
            <div className='flex items-center justify-between mt-3 md:mt-4 mb-3 md:mb-6 pl-3 md:pl-5 py-4 md:py-7 bg-primary text-white p-3 md:p-4 rounded-lg'>
              <div>
                <h1 className='text-xl md:text-2xl font-semibold'>Attendance Management</h1>
              </div>
            </div>
            {/* Tab Navigation */}
            <div className="bg-white p-3 md:p-6 rounded-lg shadow mb-3 md:mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-6">
                {/* Semester Selection Tabs */}
                <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full sm:w-auto">
                  {semesterOptions.map((semester) => (
                    <button
                      key={semester}
                      onClick={() => setSelectedSemester(semester)}
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
                  <div className="relative flex-grow sm:flex-grow-0">
                    <FaSearch className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs md:text-sm" />
                    <input
                      type="search"
                      placeholder="Search"
                      className="w-full sm:w-36 md:w-48 p-1.5 md:p-2 pl-7 md:pl-10 border border-gray-300 rounded-lg text-xs md:text-sm"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="relative flex-grow sm:flex-grow-0">
                    <div
                        className="relative flex items-center justify-between bg-white border border-gray-300 rounded-lg px-3 py-2 cursor-pointer text-sm w-full hover:border-gray-400"
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
                      <div
                        className="absolute z-10 bg-white border border-gray-300 rounded-lg p-3 md:p-4 mt-1 shadow-lg w-full sm:w-64 right-0"
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
                          <button
                            className="w-full mt-2 px-4 py-1.5 md:py-2 bg-gray-300 rounded text-xs md:text-sm hover:bg-gray-400 text-gray-700"
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

            {/* Main Content */}
            <div className="bg-white p-3 md:p-6 rounded-lg shadow w-full mx-auto">
              <div className="flex justify-between items-center mb-3 md:mb-6">
                <h1 className="text-base md:text-lg font-semibold text-black">Attendance Records</h1>
              </div>
              
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="flex justify-center items-center h-32 md:h-40">
                    <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-t-2 border-b-2 border-primary"></div>
                    <span className="ml-3 text-gray-600">Loading attendance data...</span>
                  </div>
                ) : (
                  <table className="w-full border-collapse">
                    <thead className='text-gray-600'>
                      <tr>
                        <th className='py-2 md:py-4 px-2 md:px-3 border-b font-medium text-left text-xs md:text-sm'>Cadet Name</th>
                        <th className='py-2 md:py-4 px-2 md:px-3 border-b font-medium text-center text-xs md:text-sm'>Weeks Present</th>
                        <th className='py-2 md:py-4 px-2 md:px-3 border-b font-medium text-center text-xs md:text-sm'>Attendance (30%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedCadets.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="py-8 px-4 text-center text-gray-500">
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
                          // Calculate attendance from weekly data (same as adminAttendance)
                          const weeklyAttendance = cadet.weekly_attendance || {};
                          const presentCount = Object.values(weeklyAttendance).filter(Boolean).length;
                          const attendancePercentage = ((presentCount / 15) * 30);
                          const maxWeeks = 15;
                          
                          return (
                            <tr className='border-b border-gray-200' key={cadet.user_id}>
                              <td className='py-2 md:py-4 px-2 md:px-3 text-black text-xs md:text-sm'>{formatCadetName(cadet)}</td>
                              <td className='py-2 md:py-4 px-2 md:px-3 text-center text-black text-xs md:text-sm'>{presentCount}/{maxWeeks}</td>
                              <td className='py-2 md:py-4 px-2 md:px-3 text-center text-black text-xs md:text-sm'>{Math.round(attendancePercentage)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            <div className="flex flex-col sm:flex-row items-center justify-between mt-4 w-full gap-3 md:gap-4">
                {/* Left: Showing data */}
                <div className="text-xs md:text-sm text-gray-600 text-center sm:text-left">
                  Showing data {(currentPage - 1) * cadetsPerPage + 1} to {Math.min(currentPage * cadetsPerPage, filteredCadets.length)} of {filteredCadets.length} cadets
                </div>
                {/* Center: Pagination */}
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
                {/* Right: (empty for now) */}
                <div className="flex justify-center sm:justify-end gap-2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FacultyAttendance;