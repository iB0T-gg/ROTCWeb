import React, { useState, useEffect } from 'react';
import Header from '../../components/header';
import AdminSidebar from '../../components/adminSidebar';
import { FaSearch, FaEdit, FaTrash, FaSort } from 'react-icons/fa';
import { FaFileExcel } from 'react-icons/fa';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { Link, Head } from '@inertiajs/react';


export default function AdminCadetsProfile(){
    const { auth } = usePage().props;
    const [cadets, setCadets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredCadets, setFilteredCadets] = useState([]);
    const [selectedCampus, setSelectedCampus] = useState('');
    const [showFilterPicker, setShowFilterPicker] = useState(false);
    // Add pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const cadetsPerPage = 8; // Same as facultyFinalGrades
    
    // Helper function to format birthday as dd-mm-yyyy
    const getBirthdayFromDatabase = (birthdayValue) => {
        if (!birthdayValue) return 'N/A';
        
        // Convert the date to dd-mm-yyyy format
        try {
            const dateObj = new Date(birthdayValue);
            if (isNaN(dateObj.getTime())) {
                return birthdayValue; // Return as is if invalid date
            }
            
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const year = dateObj.getFullYear();
            
            return `${day}-${month}-${year}`;
        } catch (error) {
            console.error('Error formatting date:', error);
            return birthdayValue; // Return original value if formatting fails
        }
    };

    // Format cadet name for sorting
    const formatCadetName = (cadet) => {
        const lastName = cadet.last_name || '';
        const firstName = cadet.first_name || '';
        const middleName = cadet.middle_name || '';
        const middleInitial = middleName ? ` ${middleName.charAt(0)}.` : '';
        return `${lastName}, ${firstName}${middleInitial}`;
    };

    // Fetch cadets data
    useEffect(() => {
        const fetchCadets = async () => {
            try {
                setLoading(true);
                setError(null);
                console.log('Fetching cadets from /api/admin-cadets...');
                
                const response = await axios.get('/api/admin-cadets');
                console.log('API Response:', response);
                console.log('Cadets data:', response.data);
                console.log('Number of cadets:', response.data?.length);
                
                if (Array.isArray(response.data)) {
                    setCadets(response.data);
                    setFilteredCadets(response.data);
                    console.log('✅ Successfully loaded', response.data.length, 'cadets');
                } else {
                    console.error('❌ Response data is not an array:', response.data);
                    setCadets([]);
                    setFilteredCadets([]);
                    setError('Invalid data format received from server');
                }
                
                setLoading(false);
            } catch (error) {
                console.error('❌ Error fetching cadets:', error);
                console.error('Error details:', {
                    message: error.message,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data
                });
                
                setCadets([]);
                setFilteredCadets([]);
                
                let errorMessage = 'Failed to load cadets';
                if (error.response?.status === 401) {
                    errorMessage = 'You are not authorized to view this data. Please login as admin.';
                } else if (error.response?.status === 403) {
                    errorMessage = 'Access denied. Admin privileges required.';
                } else if (error.response?.status === 404) {
                    errorMessage = 'API endpoint not found.';
                } else if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                }
                
                setError(errorMessage);
                setLoading(false);
            }
        };
        
        fetchCadets();
    }, []);

    // Get unique campuses from cadets data
    const getUniqueCampuses = () => {
        const campuses = [...new Set(cadets.map(cadet => cadet.campus).filter(Boolean))];
        return campuses.sort();
    };

    const uniqueCampuses = getUniqueCampuses();

    // Filter cadets based on search term, campus, and sort alphabetically
    useEffect(() => {
        const filtered = cadets.filter(cadet => {
            const matchesSearch = cadet.student_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                `${cadet.first_name} ${cadet.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                `${cadet.course} ${cadet.year}${cadet.section ? '-' + cadet.section : ''}`.toLowerCase().includes(searchTerm.toLowerCase());
            
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

    // Function to export cadet profile data to Excel
    const exportToExcel = () => {
        // Create CSV content with updated headers including gender and campus
        let csvContent = "Student Number,First Name,Middle Name,Last Name,CY&S,Gender,Campus,Birthday,Blood Type,Address,Region,Height,Phone Number\n";
        
        // Use filteredCadets which already includes the proper sorting (males first, alphabetical)
        filteredCadets.forEach(cadet => {
            // Format each row and handle potential commas in data
            // Format birthday as dd-mm-yyyy
            const formattedBirthday = getBirthdayFromDatabase(cadet.birthday);
            
            const row = [
                cadet.student_number || 'N/A',
                `"${cadet.first_name || 'N/A'}"`,
                `"${cadet.middle_name || 'N/A'}"`,
                `"${cadet.last_name || 'N/A'}"`,
                `${cadet.course} ${cadet.year}${cadet.section ? '-' + cadet.section : ''}` || 'N/A',
                cadet.gender || 'N/A',
                cadet.campus || 'N/A',
                `"${formattedBirthday}"`,
                cadet.blood_type || 'N/A',
                `"${cadet.address || 'N/A'}"`,
                cadet.region || 'N/A',
                cadet.height || 'N/A',
                cadet.phone_number || 'N/A'
            ].join(',');
            
            csvContent += row + "\n";
        });
        
        // Create a Blob with the CSV content
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // Create a download link
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        // Create filename with campus info if filtered
        const campusSuffix = selectedCampus ? `_${selectedCampus.replace(/\s+/g, '_')}` : '';
        
        // Set link properties
        link.setAttribute('href', url);
        link.setAttribute('download', `ROTC_Cadets_Profiles${campusSuffix}_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        
        // Append link to document, trigger click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    return (
    <>
      <Head title="ROTC Portal - Cadets Profile" />
      <div className='w-full min-h-screen bg-backgroundColor'>
      <Header auth={auth} />
      
      <div className='flex flex-col md:flex-row'>
        <AdminSidebar  />
        
        <div className='flex-1 p-2 sm:p-4 md:p-6'>
          <div className='font-regular animate-fade-in-up'>
            <div className="bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 text-xs sm:text-sm md:text-base">
                <Link href="/adminHome" className="hover:underline cursor-pointer font-semibold">
                  Dashboard
                </Link>
                <span className="mx-1 md:mx-2 font-semibold">{">"}</span>
                <span className="cursor-default font-bold">Cadets Profile Record</span>  
          </div>
            <div className='flex items-center justify-between mt-2 sm:mt-3 md:mt-4 mb-3 sm:mb-4 md:mb-6 pl-3 md:pl-5 py-3 sm:py-4 md:py-7 bg-primary text-white p-2 sm:p-3 md:p-4 rounded-lg animate-fade-in-down'>
                <h1 className='text-lg sm:text-xl md:text-2xl font-semibold'>Cadet Profiles</h1>
            </div>

            <div className='bg-white p-2 sm:p-4 md:p-6 rounded-lg shadow w-full mx-auto h-full animate-scale-in-up'>
              {/* Tab Navigation */}
              <div className="bg-white p-3 md:p-6 rounded-lg shadow mb-4 md:mb-6 animate-scale-in-up">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Title Section */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <div>
                      <h1 className='text-sm sm:text-base md:text-lg font-semibold text-black'>List of Cadets</h1>
                      <p className='text-xs md:text-sm text-gray-500 mt-1'>
                        Showing {filteredCadets.length} of {cadets.length} cadets
                      </p>
                    </div>
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
              
              {loading ? (
                <div className='text-center py-6 sm:py-8 md:py-12 text-gray-500'>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
                    <span className="text-xs sm:text-sm md:text-base">Loading cadets...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-6 sm:py-8 md:py-12">
                  <div className="text-red-600 bg-red-50 p-4 rounded-lg">
                    <p className="font-semibold text-sm sm:text-base">Error Loading Data</p>
                    <p className="text-xs sm:text-sm mt-1">{error}</p>
                    <button 
                      onClick={() => window.location.reload()} 
                      className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-xs sm:text-sm"
                    >
                      Retry
                    </button>
                  </div>
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
                  <div className="block lg:hidden space-y-3 mb-4">
                    {paginatedCadets.map((cadet) => (
                      <div key={cadet.id} className="bg-gray-50 rounded-lg p-3 sm:p-4 border">
                        {/* Header Row - Name and Student Number */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                              {cadet.last_name}, {cadet.first_name} {cadet.middle_name ? cadet.middle_name.charAt(0) + '.' : ''}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600">{cadet.student_number || 'N/A'}</p>
                          </div>
                          <div className="text-right ml-2">
                            <p className="text-xs font-medium text-primary">
                              {`${cadet.course} ${cadet.year}${cadet.section ? '-' + cadet.section : ''}` || 'N/A'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                          <div>
                            <span className="text-gray-500">Birthday:</span>
                            <p className="font-medium">{getBirthdayFromDatabase(cadet.birthday)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Blood Type:</span>
                            <p className="font-medium">{cadet.blood_type || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Height:</span>
                            <p className="font-medium">{cadet.height || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Region:</span>
                            <p className="font-medium">{cadet.region || 'N/A'}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-gray-500">Address:</span>
                            <p className="font-medium break-words">{cadet.address || 'N/A'}</p>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-gray-500">Contact:</span>
                            <p className="font-medium">{cadet.phone_number || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className='w-full border-collapse'>
                      <thead className='text-gray-600'>
                        <tr>
                          <th className='p-2 md:p-3 border-b font-medium text-left text-sm'>Student No.</th>
                          <th className='p-2 md:p-3 border-b font-medium text-left text-sm'>First Name</th>
                          <th className='p-2 md:p-3 border-b font-medium text-left text-sm'>Middle Name</th>
                          <th className='p-2 md:p-3 border-b font-medium text-left text-sm'>Last Name</th>
                          <th className='p-2 md:p-3 border-b font-medium text-left text-sm'>CY&S</th>
                          <th className='p-2 md:p-3 border-b font-medium text-left text-sm'>Birthday</th>
                          <th className='p-2 md:p-3 border-b font-medium text-left text-sm'>Blood Type</th>
                          <th className='p-2 md:p-3 border-b font-medium text-left text-sm'>Address</th>
                          <th className='p-2 md:p-3 border-b font-medium text-left text-sm'>Region</th>
                          <th className='p-2 md:p-3 border-b font-medium text-left text-sm'>Height</th>
                          <th className='p-2 md:p-3 border-b font-medium text-left text-sm'>Contact No.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedCadets.map((cadet) => (
                          <tr key={cadet.id} className='hover:bg-gray-50 border-b border-gray-100'>
                            <td className='p-2 md:p-3 text-left text-sm'>{cadet.student_number || 'N/A'}</td>
                            <td className='p-2 md:p-3 text-left text-sm'>{cadet.first_name || 'N/A'}</td>
                            <td className='p-2 md:p-3 text-left text-sm'>{cadet.middle_name || 'N/A'}</td>
                            <td className='p-2 md:p-3 text-left text-sm'>{cadet.last_name || 'N/A'}</td>
                            <td className='p-2 md:p-3 text-left text-sm'>{`${cadet.course} ${cadet.year}${cadet.section ? '-' + cadet.section : ''}` || 'N/A'}</td>
                            <td className='p-2 md:p-3 text-left text-sm'>
                              {getBirthdayFromDatabase(cadet.birthday)}
                            </td>
                            <td className='p-2 md:p-3 text-left text-sm'>{cadet.blood_type || 'N/A'}</td>
                            <td className='p-2 md:p-3 text-left text-sm'>
                              {cadet.address ? (
                                <div className="max-w-[200px] truncate">
                                  {cadet.address}
                                </div>
                              ) : 'N/A'}
                            </td>
                            <td className='p-2 md:p-3 text-left text-sm'>{cadet.region || 'N/A'}</td>
                            <td className='p-2 md:p-3 text-left text-sm'>{cadet.height || 'N/A'}</td>
                            <td className='p-2 md:p-3 text-left text-sm'>{cadet.phone_number || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
                
                {/* Pagination Controls */}
                <div className="flex flex-col space-y-3 sm:space-y-0 sm:grid sm:grid-cols-1 lg:grid-cols-3 items-center mt-4 w-full gap-3">
                  {/* Results Info */}
                  <div className="text-gray-600 text-xs sm:text-sm text-center sm:text-left lg:justify-self-start">
                    Showing {filteredCadets.length > 0 ? (currentPage - 1) * cadetsPerPage + 1 : 0} to {Math.min(currentPage * cadetsPerPage, filteredCadets.length)} of {filteredCadets.length} cadets
                  </div>
                  
                  {/* Pagination Buttons */}
                  <div className="flex justify-center lg:justify-self-center w-full lg:w-auto">
                    {totalPages > 1 && (
                      <>
                        {currentPage > 1 && (
                          <button
                            className="mx-1 px-2 sm:px-3 py-1 rounded bg-white border text-xs sm:text-sm"
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
                              className={`mx-1 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm ${currentPage === pageNum ? 'bg-primary text-white' : 'bg-white border'}`}
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        {currentPage < totalPages && (
                          <button
                            className="mx-1 px-2 sm:px-3 py-1 rounded bg-white border text-xs sm:text-sm"
                            onClick={() => setCurrentPage(currentPage + 1)}
                          >
                            &gt;
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Export Button */}
                  <div className="w-full lg:w-auto lg:justify-self-end">
                    <button 
                      onClick={exportToExcel}
                      className="flex items-center justify-center gap-2 bg-primary hover:bg-olive-700 text-white px-3 sm:px-4 py-2 rounded transition-colors duration-150 w-full lg:w-auto text-xs sm:text-sm"
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