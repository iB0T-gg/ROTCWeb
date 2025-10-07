import Header from '../../components/header';
import AdminSidebar from '../../components/adminSidebar';
import { FaSearch } from 'react-icons/fa'
import { FaSort } from 'react-icons/fa6'
import { FaFileExcel } from 'react-icons/fa'
import { usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from '@inertiajs/react';


export default function AdminCadetsProfile(){
    const { auth } = usePage().props;
    const [cadets, setCadets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredCadets, setFilteredCadets] = useState([]);
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

    // Filter cadets based on search term and sort alphabetically
    useEffect(() => {
        const filtered = cadets.filter(cadet => 
            cadet.student_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${cadet.first_name} ${cadet.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${cadet.course} ${cadet.year}${cadet.section ? '-' + cadet.section : ''}`.toLowerCase().includes(searchTerm.toLowerCase())
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

    // Function to export cadet profile data to Excel
    const exportToExcel = () => {
        // Create CSV content
        let csvContent = "Student Number,First Name,Middle Name,Last Name,CY&S,Birthday,Blood Type,Address,Region,Height,Phone Number\n";
        
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
        
        // Set link properties
        link.setAttribute('href', url);
        link.setAttribute('download', `ROTC_Cadets_Profiles_${new Date().toISOString().slice(0,10)}.csv`);
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
                <span className="cursor-default font-bold">Cadets Profile Record</span>  
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
                  
                  {/* Export Button - Mobile */}
                  <div className="w-full sm:w-auto">
                    <button 
                      onClick={exportToExcel}
                      className="flex items-center justify-center gap-2 bg-primary hover:bg-olive-700 text-white px-3 md:px-4 py-2 rounded transition-colors duration-150 w-full sm:w-auto text-sm md:text-base"
                    >
                      <FaFileExcel />
                      Export to Excel
                    </button>
                  </div>
                </div>
              </div>
              
              <div className='overflow-x-auto -mx-3 md:mx-0'>
                <div className="min-w-full">
                  <table className='w-full border-collapse min-w-[1000px]'>
                    <thead className='text-gray-600'>
                      <tr className=''>
                        <th className='p-2 md:p-3 border-b font-medium text-left text-sm md:text-base'>Student No.</th>
                        <th className='p-2 md:p-3 border-b font-medium text-left text-sm md:text-base'>First Name</th>
                        <th className='p-2 md:p-3 border-b font-medium text-left text-sm md:text-base'>Middle Name</th>
                        <th className='p-2 md:p-3 border-b font-medium text-left text-sm md:text-base'>Last Name</th>
                        <th className='p-2 md:p-3 border-b font-medium text-left text-sm md:text-base'>CY&S</th>
                        <th className='p-2 md:p-3 border-b font-medium text-left text-sm md:text-base'>Birthday</th>
                        <th className='p-2 md:p-3 border-b font-medium text-left text-sm md:text-base'>Blood Type</th>
                        <th className='p-2 md:p-3 border-b font-medium text-left text-sm md:text-base'>Address</th>
                        <th className='p-2 md:p-3 border-b font-medium text-left text-sm md:text-base'>Region</th>
                        <th className='p-2 md:p-3 border-b font-medium text-left text-sm md:text-base'>Height</th>
                        <th className='p-2 md:p-3 border-b font-medium text-left text-sm md:text-base'>Contact No.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="11" className="p-4 text-center text-gray-500">
                            <div className="flex items-center justify-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
                              <span>Loading cadets...</span>
                            </div>
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan="11" className="p-4 text-center">
                            <div className="text-red-600 bg-red-50 p-4 rounded-lg">
                              <p className="font-semibold">Error Loading Data</p>
                              <p className="text-sm mt-1">{error}</p>
                              <button 
                                onClick={() => window.location.reload()} 
                                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                              >
                                Retry
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : paginatedCadets.length === 0 ? (
                        <tr>
                          <td colSpan="11" className="p-4 text-center text-gray-500">
                            {searchTerm ? 'No cadets found matching your search.' : 'No cadets found.'}
                          </td>
                        </tr>
                      ) : (
                        paginatedCadets.map((cadet) => (
                          <tr key={cadet.id} className='hover:bg-gray-50 border-b border-gray-100'>
                            <td className='p-2 md:p-3 text-left text-sm md:text-base'>{cadet.student_number || 'N/A'}</td>
                            <td className='p-2 md:p-3 text-left text-sm md:text-base'>{cadet.first_name || 'N/A'}</td>
                            <td className='p-2 md:p-3 text-left text-sm md:text-base'>{cadet.middle_name || 'N/A'}</td>
                            <td className='p-2 md:p-3 text-left text-sm md:text-base'>{cadet.last_name || 'N/A'}</td>
                            <td className='p-2 md:p-3 text-left text-sm md:text-base'>{`${cadet.course} ${cadet.year}${cadet.section ? '-' + cadet.section : ''}` || 'N/A'}</td>
                            <td className='p-2 md:p-3 text-left text-sm md:text-base'>
                              {getBirthdayFromDatabase(cadet.birthday)}
                            </td>
                            <td className='p-2 md:p-3 text-left text-sm md:text-base'>{cadet.blood_type || 'N/A'}</td>
                            <td className='p-2 md:p-3 text-left text-sm md:text-base'>
                              {cadet.address ? (
                                <div 
                                  className="max-w-[120px] md:max-w-[150px] truncate" 
                                  title={cadet.address}
                                >
                                  {cadet.address}
                                </div>
                              ) : 'N/A'}
                            </td>
                            <td className='p-2 md:p-3 text-left text-sm md:text-base'>{cadet.region || 'N/A'}</td>
                            <td className='p-2 md:p-3 text-left text-sm md:text-base'>{cadet.height || 'N/A'}</td>
                            <td className='p-2 md:p-3 text-left text-sm md:text-base'>{cadet.phone_number || 'N/A'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 w-full gap-4">
                  <div className="text-gray-600 text-sm md:text-base order-2 sm:order-1">
                    Showing data {filteredCadets.length > 0 ? (currentPage - 1) * cadetsPerPage + 1 : 0} to {Math.min(currentPage * cadetsPerPage, filteredCadets.length)} of {filteredCadets.length} cadets
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}