import Header from '../../components/header';
import AdminSidebar from '../../components/adminSidebar';
import { FaSearch, FaSort } from 'react-icons/fa'
import { FaFileCsv, FaFileExcel } from 'react-icons/fa'
import { usePage, Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from '@inertiajs/react';

export default function AdminMasterlist(){
    const { auth } = usePage().props;
    const [cadets, setCadets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredCadets, setFilteredCadets] = useState([]);
    const [selectedSemester, setSelectedSemester] = useState('');
    const [availableSemesters, setAvailableSemesters] = useState([]);
    const [selectedCampus, setSelectedCampus] = useState('');
    const [showFilterPicker, setShowFilterPicker] = useState(false);
    // Add pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const cadetsPerPage = 8; // Same as facultyFinalGrades

    // Fetch available semesters
    useEffect(() => {
        const fetchSemesters = async () => {
            try {
                const response = await axios.get('/api/admin-semesters');
                setAvailableSemesters(response.data);
                // Set the first semester as default if available
                if (response.data.length > 0) {
                    setSelectedSemester(response.data[0]);
                }
            } catch (error) {
                console.error('Error fetching semesters:', error);
            }
        };
        
        fetchSemesters();
    }, []);

    // Fetch cadets data based on selected semester
    useEffect(() => {
        const fetchCadets = async () => {
            try {
                setLoading(true);
                let url = '/api/admin-cadets';
                if (selectedSemester) {
                    url = `/api/admin-cadets-by-semester/${encodeURIComponent(selectedSemester)}`;
                }
                
                const response = await axios.get(url);
                console.log('Cadets data:', response.data);
                setCadets(response.data);
                setFilteredCadets(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching cadets:', error);
                setLoading(false);
            }
        };
        
        if (selectedSemester || availableSemesters.length === 0) {
            fetchCadets();
        }
    }, [selectedSemester, availableSemesters]);

    // Format cadet name for sorting
    const formatCadetName = (cadet) => {
        const lastName = cadet.last_name || '';
        const firstName = cadet.first_name || '';
        const middleName = cadet.middle_name || '';
        const middleInitial = middleName ? ` ${middleName.charAt(0)}.` : '';
        return `${lastName}, ${firstName}${middleInitial}`;
    };

    // Get unique campuses from cadets data
    const getUniqueCampuses = () => {
        const campuses = [...new Set(cadets.map(cadet => cadet.campus).filter(Boolean))];
        return campuses.sort();
    };

    const uniqueCampuses = getUniqueCampuses();

    // Filter cadets based on search term and sort alphabetically
    useEffect(() => {
        const filtered = cadets.filter(cadet => {
            const matchesSearch = cadet.student_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                `${cadet.first_name} ${cadet.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                `${cadet.course} ${cadet.year}${cadet.section ? '-' + cadet.section : ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                cadet.campus?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesCampus = !selectedCampus || cadet.campus === selectedCampus;
            
            return matchesSearch && matchesCampus;
        });
        
        // Sort by gender (males first) and then alphabetically by last name, first name
        // This sorting is applied to ALL filtered results, including campus-filtered results
        const sorted = [...filtered].sort((a, b) => {
            // First sort by gender - males first
            const genderA = a.gender?.toLowerCase() || '';
            const genderB = b.gender?.toLowerCase() || '';
            
            if (genderA === 'male' && genderB !== 'male') return -1;
            if (genderA !== 'male' && genderB === 'male') return 1;
            
            // If same gender, sort alphabetically by name
            return formatCadetName(a).localeCompare(formatCadetName(b));
        });
        
        setFilteredCadets(sorted);
        // Reset to first page when filtering changes
        setCurrentPage(1);
    }, [searchTerm, selectedCampus, cadets]);

    // Pagination calculation
    const totalPages = Math.ceil(filteredCadets.length / cadetsPerPage);
    const paginatedCadets = filteredCadets.slice(
        (currentPage - 1) * cadetsPerPage,
        currentPage * cadetsPerPage
    );

    // Get the final grade - use stored value from user_grades table
    const getFinalGrade = (cadet) => {
        if (cadet.final_grade !== null && cadet.final_grade !== undefined && cadet.final_grade !== '') {
            return parseFloat(cadet.final_grade).toFixed(0);
        }
        return '-';
    };

    // Get equivalent grade from user_grades table
    const getEquivalentGrade = (cadet) => {
        if (cadet.equivalent_grade !== null && cadet.equivalent_grade !== undefined && cadet.equivalent_grade !== '') {
            return parseFloat(cadet.equivalent_grade).toFixed(2);
        }
        return '-';
    };

    // Get remarks from database (prioritize grade_remarks, fallback to user_remarks)
    const getRemarks = (cadet) => {
        // Use grade remarks if available (from user_grades table)
        if (cadet.grade_remarks) {
            return cadet.grade_remarks;
        }
        
        // Fallback to user remarks
        if (cadet.user_remarks) {
            return cadet.user_remarks;
        }
        
        // Check if this is second semester and show appropriate message
        const isSecondSemester = selectedSemester && selectedSemester.includes('2nd');
        
        // If no remarks and no grades, return appropriate message
        if (getFinalGrade(cadet) === '-' && getEquivalentGrade(cadet) === '-') {
            if (isSecondSemester) {
                return 'No Grade';
            }
            return 'No Grade';
        }
        
        // Calculate based on equivalent grade if available
        const eqGrade = parseFloat(cadet.equivalent_grade);
        if (!isNaN(eqGrade)) {
            if (eqGrade >= 1.00 && eqGrade <= 3.00) {
                return 'Passed';
            } else {
                return 'Failed';
            }
        }
        
        return isSecondSemester ? 'Not Calculated' : 'No Grade';
    };
    
    // Function to export cadet data to Excel
    const exportToExcel = () => {
        // Create CSV content with proper headers
        let csvContent = "Student Number,Name,CY&S,Gender,Campus,Final Grade (%),Equivalent,Remarks,Semester\n";
        
        // Use filteredCadets which already includes the proper sorting (males first, alphabetical)
        filteredCadets.forEach(cadet => {
            const finalGrade = getFinalGrade(cadet);
            const equivalentGrade = getEquivalentGrade(cadet);
            const remarks = getRemarks(cadet);
            const fullName = `${cadet.last_name}, ${cadet.first_name} ${cadet.middle_name || ''}`.trim();
            
            // Format each row and handle potential commas in data
            const row = [
                cadet.student_number || 'N/A',
                `"${fullName}"`,
                `${cadet.course} ${cadet.year}${cadet.section ? '-' + cadet.section : ''}` || 'N/A',
                cadet.gender || 'N/A',
                cadet.campus || 'N/A',
                finalGrade,
                equivalentGrade,
                remarks,
                `"${cadet.semester || selectedSemester || 'N/A'}"`
            ].join(',');
            
            csvContent += row + "\n";
        });
        
        // Create a Blob with the CSV content
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // Create a download link
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        // Create filename with semester and campus info
        const semesterSuffix = selectedSemester ? `_${selectedSemester.replace(/\s+/g, '_')}` : '';
        const campusSuffix = selectedCampus ? `_${selectedCampus.replace(/\s+/g, '_')}` : '';
        
        // Set link properties
        link.setAttribute('href', url);
        link.setAttribute('download', `ROTC_Cadets_Masterlist${semesterSuffix}${campusSuffix}_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        
        // Append link to document, trigger click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    return (
        <>
            <Head title="ROTC Portal - Grade Records" />
            <div className='w-full min-h-screen bg-backgroundColor'>
      <Header auth={auth} />
      
      <div className='flex flex-col md:flex-row'>
        <AdminSidebar  />
        
        <div className='flex-1 p-2 sm:p-4 md:p-6'>
          <div className='font-regular animate-fade-in-up'>  
            <div className="bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 text-xs sm:text-sm md:text-base animate-fade-in-up">
                <Link href="/adminHome" className="hover:underline cursor-pointer font-semibold">
                  Dashboard
                </Link>
                <span className="mx-1 md:mx-2 font-semibold">{">"}</span>
                <span className="cursor-default font-bold">Cadets Grade Record</span>  
          </div>
            <div className='flex items-center justify-between mt-2 sm:mt-3 md:mt-4 mb-3 sm:mb-4 md:mb-6 pl-3 md:pl-5 py-3 sm:py-4 md:py-7 bg-primary text-white p-2 sm:p-3 md:p-4 rounded-lg animate-fade-in-down'>
                <h1 className='text-lg sm:text-xl md:text-2xl font-semibold'>Master Lists</h1>
            </div>

            {/* Tab Navigation */}
              <div className="bg-white p-3 md:p-6 rounded-lg shadow mb-4 md:mb-6 animate-scale-in-up">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Semester Selection Tabs */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    {availableSemesters.map((semester) => (
                      <button
                        key={semester}
                        onClick={() => setSelectedSemester(semester)}
                        disabled={loading}
                        className={`py-1.5 md:py-2 px-2 md:px-4 rounded-lg transition-colors duration-150 text-sm md:text-base ${
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

                  <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                    {/* Search */}
                    <div className="relative flex-grow sm:flex-grow-0">
                      <FaSearch className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="search"
                        placeholder="Search"
                        className="w-full sm:w-48 p-2 pl-10 border border-gray-300 rounded-lg text-sm md:text-base"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    {/* Campus Filter Dropdown */}
                    <div className="relative w-full sm:w-auto">
                      <div
                        className="bg-white border border-gray-300 rounded-lg py-2 pl-3 pr-8 cursor-pointer w-full text-sm md:text-base"
                        onClick={() => setShowFilterPicker(!showFilterPicker)}
                      >
                        <span className="text-gray-600">
                          {selectedCampus
                            ? `Campus: ${selectedCampus}`
                            : 'Sort by : All Campus'}
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">Campus</label>
                                <select
                                  className="w-full bg-gray-100 p-2 rounded border"
                                  value={selectedCampus}
                                  onChange={e => setSelectedCampus(e.target.value)}
                                >
                                  <option value="">All Campuses</option>
                                  {uniqueCampuses.map((campus) => (
                                    <option key={campus} value={campus}>
                                      {campus}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex gap-2 mt-4">
                                <button
                                  className="flex-1 px-4 py-2 bg-gray-300 rounded text-sm hover:bg-gray-400 text-gray-700"
                                  onClick={() => {
                                    setSelectedCampus('');
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

            

            <div className='bg-white p-2 sm:p-4 md:p-6 rounded-lg shadow w-full mx-auto h-full animate-scale-in-up'>
              

              <div className='flex flex-col gap-3 sm:gap-4 mb-4 md:mb-6'>
                {/* Title Section */}
                <div>
                  <h1 className='text-sm sm:text-base md:text-lg font-semibold text-black'>List of Cadets</h1>
                  <p className='text-xs md:text-sm text-gray-500 mt-1'>
                    Showing {filteredCadets.length} of {cadets.length} cadets
                  </p>
                </div>
              </div>
              
              
              {loading ? (
                <div className='text-center py-6 sm:py-8 md:py-12 text-gray-500'>
                  <p className="text-xs sm:text-sm md:text-base">Loading cadets...</p>
                </div>
              ) : paginatedCadets.length === 0 ? (
                <div className='text-center py-6 sm:py-8 md:py-12 text-gray-500'>
                  <p className="text-xs sm:text-sm md:text-base">
                    {searchTerm ? 'No cadets found matching your search.' : 'No cadets found.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="block lg:hidden space-y-2 sm:space-y-3">
                    {paginatedCadets.map((cadet) => {
                      const finalGrade = getFinalGrade(cadet);
                      const equivalentGrade = getEquivalentGrade(cadet);
                      const remarks = getRemarks(cadet);
                      
                      return (
                        <div key={cadet.id} className="bg-gray-50 rounded-lg p-3 sm:p-4 border">
                          {/* Header Row - Name and Grades */}
                          <div className="flex justify-between items-start mb-2 sm:mb-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
                                {cadet.last_name}, {cadet.first_name} {cadet.middle_name ? cadet.middle_name.charAt(0) + '.' : ''}
                              </p>
                              <p className="text-xs text-gray-600 mt-0.5">{cadet.student_number || 'N/A'}</p>
                            </div>
                            <div className="text-right ml-2">
                              <p className="text-xs sm:text-sm font-medium text-green-700">{finalGrade}</p>
                              <p className="text-xs text-gray-500">{equivalentGrade}</p>
                            </div>
                          </div>
                          
                          {/* Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-500">Course:</span>
                              <p className="font-medium truncate">{`${cadet.course} ${cadet.year}${cadet.section ? '-' + cadet.section : ''}` || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Gender:</span>
                              <p className="font-medium">{cadet.gender || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Campus:</span>
                              <p className="font-medium truncate">{cadet.campus || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Remarks:</span>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-0.5 ${
                                remarks === 'Passed' ? 'bg-green-100 text-green-800' :
                                remarks === 'Failed' ? 'bg-red-100 text-red-800' :
                                remarks === 'Not Calculated' ? 'bg-gray-100 text-gray-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {remarks}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className='w-full border-collapse'>
                      <thead className='text-gray-600'>
                        <tr>
                          <th className='p-2 border-b font-medium text-left text-sm'>Student Number</th>
                          <th className='p-2 border-b font-medium text-left text-sm'>Name</th>
                          <th className='p-2 border-b font-medium text-left text-sm'>CY&S</th>
                          <th className='p-2 border-b font-medium text-left text-sm'>Gender</th>
                          <th className='p-2 border-b font-medium text-left text-sm'>Campus</th>
                          <th className='p-2 border-b font-medium text-left text-sm'>Final Grade</th>
                          <th className='p-2 border-b font-medium text-left text-sm'>Equivalent</th>
                          <th className='p-2 border-b font-medium text-left text-sm'>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedCadets.map((cadet) => {
                          const finalGrade = getFinalGrade(cadet);
                          const equivalentGrade = getEquivalentGrade(cadet);
                          const remarks = getRemarks(cadet);
                          
                          return (
                            <tr key={cadet.id} className='hover:bg-gray-50'>
                              <td className='p-2 border-b text-left text-sm'>{cadet.student_number || 'N/A'}</td>
                              <td className='p-2 border-b text-left text-sm'>
                                {cadet.last_name}, {cadet.first_name} {cadet.middle_name ? cadet.middle_name.charAt(0) + '.' : ''}
                              </td>
                              <td className='p-2 border-b text-left text-sm'>{`${cadet.course} ${cadet.year}${cadet.section ? '-' + cadet.section : ''}` || 'N/A'}</td>
                              <td className='p-2 border-b text-left text-sm'>{cadet.gender || 'N/A'}</td>
                              <td className='p-2 border-b text-left text-sm'>{cadet.campus || 'N/A'}</td>
                              <td className='p-2 border-b text-left font-medium text-sm'>{finalGrade}</td>
                              <td className='p-2 border-b text-left text-sm'>{equivalentGrade}</td>
                              <td className='p-2 border-b text-left'>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  remarks === 'Passed' ? 'bg-green-100 text-green-800' :
                                  remarks === 'Failed' ? 'bg-red-100 text-red-800' :
                                  remarks === 'Not Calculated' ? 'bg-gray-100 text-gray-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {remarks}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              
              {/* Pagination Controls */}
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:grid sm:grid-cols-1 lg:grid-cols-3 items-center mt-4 w-full gap-3">
                {/* Results Info */}
                <div className="text-gray-600 text-xs sm:text-sm md:text-base text-center sm:text-left lg:justify-self-start">
                  Showing {filteredCadets.length > 0 ? (currentPage - 1) * cadetsPerPage + 1 : 0} to {Math.min(currentPage * cadetsPerPage, filteredCadets.length)} of {filteredCadets.length} cadets
                </div>
                
                {/* Pagination Buttons */}
                <div className="flex justify-center lg:justify-self-center w-full lg:w-auto gap-2">
                  {totalPages > 1 && (
                    <>
                      {currentPage > 1 && (
                        <button
                          className="px-3 sm:px-4 py-2 rounded bg-white border text-xs sm:text-sm md:text-base hover:bg-gray-50 transition-colors"
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
                            className={`px-3 sm:px-4 py-2 rounded text-xs sm:text-sm md:text-base transition-colors ${currentPage === pageNum ? 'bg-primary text-white hover:bg-primary/90' : 'bg-white border hover:bg-gray-50'}`}
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      {currentPage < totalPages && (
                        <button
                          className="px-3 sm:px-4 py-2 rounded bg-white border text-xs sm:text-sm md:text-base hover:bg-gray-50 transition-colors"
                          onClick={() => setCurrentPage(currentPage + 1)}
                        >
                          &gt;
                        </button>
                      )}
                    </>
                  )}
                </div>
                
                {/* Export Button */}
                <div className="w-full sm:w-auto lg:justify-self-end">
                  <button 
                    onClick={exportToExcel}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-olive-700 text-white px-3 sm:px-4 py-2 rounded transition-colors duration-150 text-xs sm:text-sm w-full lg:w-auto"
                  >
                    <FaFileExcel className="text-xs sm:text-sm" />
                    <span>Export to Excel</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
        </>
    )
}