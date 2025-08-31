import Header from '../../components/header';
import AdminSidebar from '../../components/adminSidebar';
import { FaSearch } from 'react-icons/fa'
import { FaSort } from 'react-icons/fa6'
import { FaFileExcel } from 'react-icons/fa'
import { usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminCadetsProfile(){
    const { auth } = usePage().props;
    const [cadets, setCadets] = useState([]);
    const [loading, setLoading] = useState(true);
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
                const response = await axios.get('/api/admin-cadets');
                console.log('Cadets data from API:', response.data);
                
                // Check specifically for birthday data
                if (response.data.length > 0) {
                    console.log('First cadet birthday data:', response.data[0].birthday);
                    console.log('Birthday data type:', typeof response.data[0].birthday);
                    
                    // Log all user birthdays for debugging
                    console.log('All cadet birthdays:');
                    response.data.forEach((cadet, index) => {
                        if (index < 10) { // Limit to first 10 for brevity
                            console.log(`Cadet ${index + 1} (${cadet.first_name} ${cadet.last_name}):`);
                            console.log(`  - Raw from DB: "${cadet.birthday}"`);
                            console.log(`  - Formatted as dd-mm-yyyy: "${getBirthdayFromDatabase(cadet.birthday)}"`);
                        }
                    });
                }
                
                setCadets(response.data);
                setFilteredCadets(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching cadets:', error);
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
      
      <div className='flex'>
        <AdminSidebar  />
        
        <div className='flex-1 p-6'>
          <div className='font-regular'>
            <div className='bg-white p-3 text-[#6B6A6A] rounded-lg pl-5'>
                <span className='cursor-pointer'>Home</span>
                {">"}
                <span className='cursor-pointer'>Master Lists</span>
            </div>
            <div className='flex items-center justify-between mt-4 mb-6 pl-5 py-7 bg-primary text-white p-4 rounded-lg'>
                <h1 className='text-2xl font-semibold'>Master Lists</h1>
            </div>

            <div className='bg-white p-6 rounded-lg shadow w-full mx-auto h-full'>
              <div className='flex justify-between items-center mb-6'>
                <div>
                  <h1 className='text-lg font-semibold text-black'>List of Cadets</h1>
                  <p className='text-sm text-gray-500 mt-1'>
                    Showing {filteredCadets.length} of {cadets.length} cadets
                  </p>
                </div>

                <div className='flex items-center gap-4'>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="search"
                      placeholder="Search Cadets"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64 p-2 pl-10 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
              
              <div className='overflow-x-auto '>
                <table className='w-full border-collapse'>
                  <thead className='text-gray-600 '>
                    <tr className=''>
                      <th className='p-2 border-b font-medium text-left'>Student No.</th>
                      <th className='p-2 border-b font-medium text-left'>First Name</th>
                      <th className='p-2 border-b font-medium text-left'>Middle Name</th>
                      <th className='p-2 border-b font-medium text-left'>Last Name</th>
                      <th className='p-2 border-b font-medium text-left'>CY&S</th>
                      <th className='p-2 border-b font-medium text-left'>Birthday</th>
                      <th className='p-2 border-b font-medium text-left'>Blood Type</th>
                      <th className='p-2 border-b font-medium text-left'>Address</th>
                      <th className='p-2 border-b font-medium text-left'>Region</th>
                      <th className='p-2 border-b font-medium text-left'>Height</th>
                      <th className='p-2 border-b font-medium text-left'>Contact No.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="11" className="p-4 text-center text-gray-500">
                          Loading cadets...
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
                        <tr key={cadet.id} className='hover:bg-gray-50'>
                          <td className='p-2 border-b text-left'>{cadet.student_number || 'N/A'}</td>
                          <td className='p-2 border-b text-left'>{cadet.first_name || 'N/A'}</td>
                          <td className='p-2 border-b text-left'>{cadet.middle_name || 'N/A'}</td>
                          <td className='p-2 border-b text-left'>{cadet.last_name || 'N/A'}</td>
                          <td className='p-2 border-b text-left'>{`${cadet.course} ${cadet.year}${cadet.section ? '-' + cadet.section : ''}` || 'N/A'}</td>
                          <td className='p-2 border-b text-left'>
                            {getBirthdayFromDatabase(cadet.birthday)}
                          </td>
                          <td className='p-2 border-b text-left'>{cadet.blood_type || 'N/A'}</td>
                          <td className='p-2 border-b text-left'>
                            {cadet.address ? (
                              <div 
                                className="max-w-[150px] truncate" 
                                title={cadet.address}
                              >
                                {cadet.address}
                              </div>
                            ) : 'N/A'}
                          </td>
                          <td className='p-2 border-b text-left'>{cadet.region || 'N/A'}</td>
                          <td className='p-2 border-b text-left'>{cadet.height || 'N/A'}</td>
                          <td className='p-2 border-b text-left'>{cadet.phone_number || 'N/A'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                
                {/* Pagination Controls */}
                <div className="flex justify-between items-center mt-4 w-full">
                  <div className="text-gray-600">
                    Showing data {filteredCadets.length > 0 ? (currentPage - 1) * cadetsPerPage + 1 : 0} to {Math.min(currentPage * cadetsPerPage, filteredCadets.length)} of {filteredCadets.length} cadets
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
                  
                  {/* Export Button */}
                  <div>
                    <button 
                      onClick={exportToExcel}
                      className="flex items-center gap-2 bg-primary hover:bg-olive-700 text-white px-4 py-2 rounded transition-colors duration-150"
                    >
                      <FaFileExcel />
                      Export to Excel
                    </button>
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