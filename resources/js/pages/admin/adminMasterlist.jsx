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
    // Add pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const cadetsPerPage = 8; // Same as facultyFinalGrades

    // Fetch cadets data
    useEffect(() => {
        const fetchCadets = async () => {
            try {
                const response = await axios.get('/api/admin-cadets');
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

    // Get the final grade - use stored value or fallback to -
    const getFinalGrade = (cadet) => {
        if (cadet.final_grade !== null && cadet.final_grade !== undefined && cadet.final_grade !== '') {
            return parseFloat(cadet.final_grade).toFixed(0) + '%';
        }
        return '-';
    };

    // Get remarks from database or calculate based on equivalent grade
    const getRemarks = (cadet) => {
        // Use database remarks if available
        if (cadet.remarks) {
            return cadet.remarks;
        }
        
        // Fallback calculation
        if (getFinalGrade(cadet) === '-' || !cadet.equivalent_grade) {
            return 'No Grade';
        }
        
        const eqGrade = parseFloat(cadet.equivalent_grade);
        if (eqGrade >= 1.00 && eqGrade <= 3.00) {
            return 'Passed';
        } else {
            return 'Failed';
        }
    };
    
    // Function to export cadet data to Excel
    const exportToExcel = () => {
        // Create CSV content
        let csvContent = "Student Number,Name,CY&S,Gender,Campus,Final Grade,Equivalent,Remarks\n";
        
        filteredCadets.forEach(cadet => {
            const finalGrade = getFinalGrade(cadet);
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
                cadet.equivalent_grade || 'N/A',
                remarks
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
        link.setAttribute('download', `ROTC_Cadets_Masterlist_${new Date().toISOString().slice(0,10)}.csv`);
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
            <div className="bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 cursor-pointer text-sm md:text-base">
                <Link href="/adminHome" className="hover:underline cursor-pointer font-semibold">
                  Dashboard
                </Link>
                <span className="mx-2 font-semibold">{">"}</span>
                <span className="cursor-default font-bold">Cadets Grade Record</span>  
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
              
              <div className='overflow-y-auto '>
                <table className='w-full border-collapse'>
                  <thead className='text-gray-600 '>
                    <tr className=''>
                      <th className='p-2 border-b font-medium text-left'>Student Number</th>
                      <th className='p-2 border-b font-medium text-left'>Name</th>
                      <th className='p-2 border-b font-medium text-left'>CY&S</th>
                      <th className='p-2 border-b font-medium text-left'>Gender</th>
                      <th className='p-2 border-b font-medium text-left'>Campus</th>
                      <th className='p-2 border-b font-medium text-left'>Final Grade (%)</th>
                      <th className='p-2 border-b font-medium text-left'>Equivalent</th>
                      <th className='p-2 border-b font-medium text-left'>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="8" className="p-4 text-center text-gray-500">
                          Loading cadets...
                        </td>
                      </tr>
                    ) : paginatedCadets.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="p-4 text-center text-gray-500">
                          {searchTerm ? 'No cadets found matching your search.' : 'No cadets found.'}
                        </td>
                      </tr>
                    ) : (
                      paginatedCadets.map((cadet) => {
                        const finalGrade = getFinalGrade(cadet);
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
                            <td className='p-2 border-b text-left'>{cadet.equivalent_grade || '-'}</td>
                            <td className='p-2 border-b text-left'>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                remarks === 'Passed' ? 'bg-green-100 text-green-800' :
                                remarks === 'Failed' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {remarks}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              
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
  )
}