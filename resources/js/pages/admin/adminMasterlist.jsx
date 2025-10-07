import Header from '../../components/header';
import AdminSidebar from '../../components/adminSidebar';
import { FaSearch } from 'react-icons/fa'
import { FaSort } from 'react-icons/fa6'
import { FaFileCsv, FaFileExcel } from 'react-icons/fa'
import { usePage } from '@inertiajs/react';
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

    // Filter cadets based on search term and sort alphabetically
    useEffect(() => {
        const filtered = cadets.filter(cadet => 
            cadet.student_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${cadet.first_name} ${cadet.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${cadet.course} ${cadet.year}${cadet.section ? '-' + cadet.section : ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cadet.campus?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        // Sort alphabetically by last name, first name
        const sorted = [...filtered].sort((a, b) => formatCadetName(a).localeCompare(formatCadetName(b)));
        
        setFilteredCadets(sorted);
    }, [searchTerm, cadets]);

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
        // Create CSV content
        let csvContent = "Student Number,Name,CY&S,Gender,Campus,Final Grade (%),Equivalent,Remarks,Semester\n";
        
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
        
        // Create filename with semester info
        const semesterSuffix = selectedSemester ? `_${selectedSemester.replace(/\s+/g, '_')}` : '';
        
        // Set link properties
        link.setAttribute('href', url);
        link.setAttribute('download', `ROTC_Cadets_Masterlist${semesterSuffix}_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        
        // Append link to document, trigger click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    return (
    <div className='w-full min-h-screen bg-backgroundColor'>
      <Header auth={auth} />
      
      <div className='flex flex-col md:flex-row'>
        <AdminSidebar  />
        
        <div className='flex-1 p-3 md:p-6'>
          <div className='font-regular'>  
            <div className="bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 text-sm md:text-base">
                <Link href="/adminHome" className="hover:underline cursor-pointer font-semibold">
                  Dashboard
                </Link>
                <span className="mx-2 font-semibold">{">"}</span>
                <span className="cursor-default font-bold">Cadets Grade Record</span>  
          </div>
            <div className='flex items-center justify-between mt-3 md:mt-4 mb-4 md:mb-6 pl-3 md:pl-5 py-4 md:py-7 bg-primary text-white p-3 md:p-4 rounded-lg'>
                <h1 className='text-xl md:text-2xl font-semibold'>Master Lists</h1>
            </div>

            <div className='bg-white p-3 md:p-6 rounded-lg shadow w-full mx-auto h-full'>
              <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-4'>
                <div>
                  <h1 className='text-base md:text-lg font-semibold text-black'>List of Cadets</h1>
                  <p className='text-xs md:text-sm text-gray-500 mt-1'>
                    Showing {filteredCadets.length} of {cadets.length} cadets
                    
                  </p>
                </div>

                <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto'>
                  {/* Semester Selector */}
                  <div className="w-full sm:w-auto">
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className="w-full sm:w-auto p-2 border border-gray-300 rounded-lg bg-white text-sm md:text-base"
                    >
                      <option value="">All Semesters</option>
                      {availableSemesters.map((semester) => (
                        <option key={semester} value={semester}>
                          {semester}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="relative w-full sm:w-auto">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="search"
                      placeholder="Search Cadets"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full sm:w-64 p-2 pl-10 border border-gray-300 rounded-lg text-sm md:text-base"
                    />
                  </div>
                </div>
              </div>
              
              
              {loading ? (
                <div className='text-center py-8 md:py-12 text-gray-500'>
                  <p className="text-sm md:text-base">Loading cadets...</p>
                </div>
              ) : paginatedCadets.length === 0 ? (
                <div className='text-center py-8 md:py-12 text-gray-500'>
                  <p className="text-sm md:text-base">
                    {searchTerm ? 'No cadets found matching your search.' : 'No cadets found.'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="block md:hidden space-y-3">
                    {paginatedCadets.map((cadet) => {
                      const finalGrade = getFinalGrade(cadet);
                      const equivalentGrade = getEquivalentGrade(cadet);
                      const remarks = getRemarks(cadet);
                      
                      return (
                        <div key={cadet.id} className="bg-gray-50 rounded-lg p-3 border">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold text-sm text-gray-900">
                                {cadet.last_name}, {cadet.first_name} {cadet.middle_name ? cadet.middle_name.charAt(0) + '.' : ''}
                              </p>
                              <p className="text-xs text-gray-600">{cadet.student_number || 'N/A'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium text-green-700">{finalGrade}</p>
                              <p className="text-xs text-gray-500">{equivalentGrade}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-500">Course:</span>
                              <p className="font-medium">{`${cadet.course} ${cadet.year}${cadet.section ? '-' + cadet.section : ''}` || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Gender:</span>
                              <p className="font-medium">{cadet.gender || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Campus:</span>
                              <p className="font-medium">{cadet.campus || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Remarks:</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                  <div className="hidden md:block overflow-y-auto">
                    <table className='w-full border-collapse'>
                      <thead className='text-gray-600'>
                        <tr>
                          <th className='p-2 border-b font-medium text-left'>Student Number</th>
                          <th className='p-2 border-b font-medium text-left'>Name</th>
                          <th className='p-2 border-b font-medium text-left'>CY&S</th>
                          <th className='p-2 border-b font-medium text-left'>Gender</th>
                          <th className='p-2 border-b font-medium text-left'>Campus</th>
                          <th className='p-2 border-b font-medium text-left'>Final Grade</th>
                          <th className='p-2 border-b font-medium text-left'>Equivalent</th>
                          <th className='p-2 border-b font-medium text-left'>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedCadets.map((cadet) => {
                          const finalGrade = getFinalGrade(cadet);
                          const equivalentGrade = getEquivalentGrade(cadet);
                          const remarks = getRemarks(cadet);
                          
                          return (
                            <tr key={cadet.id} className='hover:bg-gray-50'>
                              <td className='p-2 border-b text-left'>{cadet.student_number || 'N/A'}</td>
                              <td className='p-2 border-b text-left'>
                                {cadet.last_name}, {cadet.first_name} {cadet.middle_name ? cadet.middle_name.charAt(0) + '.' : ''}
                              </td>
                              <td className='p-2 border-b text-left'>{`${cadet.course} ${cadet.year}${cadet.section ? '-' + cadet.section : ''}` || 'N/A'}</td>
                              <td className='p-2 border-b text-left'>{cadet.gender || 'N/A'}</td>
                              <td className='p-2 border-b text-left'>{cadet.campus || 'N/A'}</td>
                              <td className='p-2 border-b text-left font-medium'>{finalGrade}</td>
                              <td className='p-2 border-b text-left'>{equivalentGrade}</td>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 items-center mt-4 w-full gap-3">
                <div className="text-gray-600 text-sm md:text-base justify-self-start">
                  Showing data {filteredCadets.length > 0 ? (currentPage - 1) * cadetsPerPage + 1 : 0} to {Math.min(currentPage * cadetsPerPage, filteredCadets.length)} of {filteredCadets.length} cadets
                </div>
                <div className="flex justify-center justify-self-center w-full sm:w-auto">
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
                
                {/* Export Button */}
                <div className="justify-self-end w-full sm:w-auto">
                  <button 
                    onClick={exportToExcel}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-olive-700 text-white px-3 md:px-4 py-2 rounded transition-colors duration-150 text-xs md:text-sm w-full sm:w-auto"
                  >
                    <FaFileExcel />
                    <span className="hidden sm:inline">Export to Excel</span>
                    <span className="sm:hidden">Export</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}