import Header from '../../components/header';
import AdminSidebar from '../../components/adminSidebar';
import { FaSearch, FaEdit, FaSave, FaTimes, FaUpload, FaFileUpload, FaSpinner } from 'react-icons/fa';
import { usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import axios from 'axios';

export default function AdminAttendance(){
    const { auth } = usePage().props;
    const [cadets, setCadets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedSemester, setSelectedSemester] = useState('2025-2026 1st semester');
    const [attendanceData, setAttendanceData] = useState({});
    const [originalData, setOriginalData] = useState({});
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importResults, setImportResults] = useState(null);
    const cadetsPerPage = 10;

    // Semester options
    const semesterOptions = ['2025-2026 1st semester', '2025-2026 2nd semester'];

    // Fetch cadets and their attendance data
    const fetchCadets = async (highlightImported = false) => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`/api/attendance/cadets?semester=${encodeURIComponent(selectedSemester)}`);
            
            if (response.data.success) {
                setCadets(response.data.data);
                
                // Initialize attendance data state with detailed logging
                const initialAttendanceData = {};
                response.data.data.forEach((cadet, index) => {
                    console.log(`👤 Processing cadet ${index + 1}:`, {
                        name: `${cadet.first_name} ${cadet.last_name}`,
                        user_id: cadet.user_id,
                        weekly_attendance: cadet.weekly_attendance
                    });
                    
                    // Ensure weekly_attendance is properly formatted
                    const weeklyData = {};
                    if (cadet.weekly_attendance && typeof cadet.weekly_attendance === 'object') {
                        Object.keys(cadet.weekly_attendance).forEach(week => {
                            const weekNum = parseInt(week);
                            if (weekNum >= 1 && weekNum <= 15) {
                                weeklyData[weekNum] = Boolean(cadet.weekly_attendance[week]);
                            }
                        });
                    }
                    
                    // Initialize missing weeks to false
                    for (let week = 1; week <= 15; week++) {
                        if (!(week in weeklyData)) {
                            weeklyData[week] = false;
                        }
                    }
                    
                    initialAttendanceData[cadet.user_id] = weeklyData;
                });
                
                console.log('📋 Initialized attendance data:', initialAttendanceData);
                setAttendanceData(initialAttendanceData);
                setOriginalData(JSON.parse(JSON.stringify(initialAttendanceData)));
                
                // If this is after an import, briefly highlight updated checkboxes
                if (highlightImported) {
                    setTimeout(() => {
                        const importedElements = document.querySelectorAll('input[type="checkbox"]:checked');
                        importedElements.forEach(el => {
                            el.style.backgroundColor = '#10B981';
                            el.style.transform = 'scale(1.1)';
                            setTimeout(() => {
                                el.style.backgroundColor = '';
                                el.style.transform = '';
                            }, 1000);
                        });
                    }, 100);
                }
            }
        } catch (err) {
            console.error('💥 Error fetching cadets:', err);
            console.error('📋 Error details:', {
                message: err.message,
                response: err.response,
                status: err.response?.status,
                data: err.response?.data
            });
            
            // More specific error messages
            if (err.response?.status === 401) {
                setError('Authentication failed. Please login again.');
            } else if (err.response?.status === 403) {
                setError('Access denied. You do not have permission to view attendance data.');
            } else if (err.response?.status === 500) {
                setError('Server error. Please contact administrator.');
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Failed to fetch cadets data. Please check your connection and try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCadets();
    }, [selectedSemester]);

    // Handle attendance change
    const handleAttendanceChange = (userId, weekNumber, isPresent) => {
        if (!editMode) return;
        
        setAttendanceData(prev => ({
            ...prev,
            [userId]: {
                ...prev[userId],
                [weekNumber]: isPresent
            }
        }));
    };

    // Toggle edit mode
    const toggleEditMode = () => {
        if (editMode) {
            // Save changes
            saveAttendance();
        } else {
            setEditMode(true);
        }
    };

    // Cancel editing
    const cancelEditing = () => {
        setAttendanceData(JSON.parse(JSON.stringify(originalData)));
        setEditMode(false);
    };

    // Save attendance
    const saveAttendance = async () => {
        try {
            setSaving(true);
            
            // Prepare bulk update data
            const updates = cadets.map(cadet => ({
                user_id: cadet.user_id,
                weekly_attendance: attendanceData[cadet.user_id] || {}
            }));

            // Get CSRF token with multiple fallback methods
            let csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
                           document.querySelector('meta[name="csrf-token"]')?.content ||
                           window.Laravel?.csrfToken;
            
            if (!csrfToken) {
                alert('Security token not found. Please refresh the page and try again.');
                setSaving(false);
                return;
            }
            
            console.log('Saving attendance data:', {
                semester: selectedSemester,
                updates: updates.length,
                csrfToken: csrfToken ? 'Present' : 'Missing'
            });

            const response = await axios.post('/api/attendance/bulk-update', {
                updates,
                semester: selectedSemester
            }, {
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            console.log('Save response:', response.data);

            if (response.data.success) {
                setOriginalData(JSON.parse(JSON.stringify(attendanceData)));
                setEditMode(false);
                alert('Attendance saved successfully!');
                
                // Refresh data to get updated calculations
                fetchCadets();
            } else {
                console.error('Save failed:', response.data);
                alert(response.data.message || 'Failed to save attendance');
            }
        } catch (error) {
            console.error('Error saving attendance:', error);
            console.error('Error details:', error.response?.data);
            
            if (error.response?.status === 419) {
                alert('Security token expired. Please refresh the page and try again.');
                window.location.reload();
            } else if (error.response?.status === 401) {
                alert('Authentication failed. Please login again.');
            } else if (error.response?.status === 403) {
                alert('Access denied. You do not have permission to save attendance data.');
            } else if (error.response?.data?.message) {
                alert(error.response.data.message);
            } else {
                alert('Failed to save attendance. Please try again.');
            }
        } finally {
            setSaving(false);
        }
    };

    // Filter cadets based on search term
    const filteredCadets = cadets.filter(cadet => {
        const fullName = `${cadet.last_name}, ${cadet.first_name}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase()) || 
               cadet.student_number?.toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a, b) => {
        // Sort by last name in alphabetical order
        const lastNameA = a.last_name ? a.last_name.toLowerCase() : '';
        const lastNameB = b.last_name ? b.last_name.toLowerCase() : '';
        
        // If last names are the same, sort by first name
        if (lastNameA === lastNameB) {
            const firstNameA = a.first_name ? a.first_name.toLowerCase() : '';
            const firstNameB = b.first_name ? b.first_name.toLowerCase() : '';
            return firstNameA.localeCompare(firstNameB);
        }
        
        return lastNameA.localeCompare(lastNameB);
    });

    // Pagination
    const totalPages = Math.ceil(filteredCadets.length / cadetsPerPage);
    const paginatedCadets = filteredCadets.slice(
        (currentPage - 1) * cadetsPerPage,
        currentPage * cadetsPerPage
    );

    // Handle file selection for import
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            const allowedTypes = ['.csv', '.txt', '.xlsx', '.xls'];
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            
            if (allowedTypes.includes(fileExtension)) {
                setImportFile(file);
                
                // Show informational message for Excel files
                if (['.xlsx', '.xls'].includes(fileExtension)) {
                    console.log('Excel file selected. Will attempt processing with fallback to CSV conversion instructions if needed.');
                }
            } else {
                alert('Please select a valid file format (.csv, .txt, .xlsx, .xls)');
                event.target.value = '';
            }
        }
    };

    // Handle attendance import from Deli scanner file
    const handleImportAttendance = async () => {
        if (!importFile) {
            alert('Please select a file to import');
            return;
        }

        const formData = new FormData();
        formData.append('file', importFile);
        formData.append('semester', selectedSemester);

        setImporting(true);
        setImportProgress(0);
        setImportResults(null);

        try {
            // Get CSRF token with multiple fallback methods
            let csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
                           document.querySelector('meta[name="csrf-token"]')?.content ||
                           window.Laravel?.csrfToken;
            
            if (!csrfToken) {
                alert('Security token not found. Please refresh the page and try again.');
                setImporting(false);
                return;
            }
            
            // Simulate progress for user feedback
            const progressInterval = setInterval(() => {
                setImportProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            const response = await axios.post('/api/attendance/import', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CSRF-TOKEN': csrfToken
                },
            });

            clearInterval(progressInterval);
            setImportProgress(100);

            if (response.data.success) {
                setImportResults(response.data);
                console.log(`Import completed! ${response.data.imported_count} records imported.`);
                
                // Refresh the attendance data after successful import with visual feedback
                await fetchCadets(true);
                
                // Show detailed success message
                const affectedWeeks = response.data.affected_weeks || [];
                const weeksText = affectedWeeks.length > 0 
                    ? `\n• Weeks affected: ${affectedWeeks.join(', ')}` 
                    : '';
                
            } else {
                console.error(response.data.message || 'Import failed');
                setImportResults(response.data);
            }
        } catch (error) {
            console.error('Import error:', error);
            setImportProgress(0);
            
            if (error.response?.status === 419) {
                setImportResults({
                    success: false,
                    message: 'Security token expired. Please refresh the page and try again.',
                    errors: ['CSRF token mismatch - session may have expired']
                });
                setTimeout(() => {
                    alert('Security token expired. The page will refresh automatically.');
                    window.location.reload();
                }, 2000);
            } else if (error.response?.data?.message) {
                console.error(error.response.data.message);
                setImportResults(error.response.data);
                
                // Show detailed error message with Excel conversion instructions if needed
                const errorMsg = error.response.data.message || 'Import failed';
                if (errorMsg.includes('Excel') && errorMsg.includes('CSV')) {
                    setTimeout(() => {
                        alert(`❌ Excel Processing Failed\n\n${errorMsg}\n\n📝 To convert Excel to CSV:\n1. Open your Excel file\n2. Click "File" → "Save As"\n3. Choose "CSV (Comma delimited)" from the format dropdown\n4. Save the file\n5. Upload the new CSV file`);
                    }, 500);
                }
            } else {
                console.error('Failed to import attendance data');
                setImportResults({
                    success: false,
                    message: 'Import failed. Please try again.',
                    errors: ['Unknown error occurred']
                });
            }
        } finally {
            setImporting(false);
        }
    };

    // Close import modal and reset state
    const closeImportModal = () => {
        setShowImportModal(false);
        setImportFile(null);
        setImportProgress(0);
        setImportResults(null);
        setImporting(false);
    };

    // Calculate attendance percentage
    const calculateAttendancePercentage = (userId) => {
        const weeklyData = attendanceData[userId] || {};
        const presentWeeks = Object.values(weeklyData).filter(Boolean).length;
        return ((presentWeeks / 15) * 30).toFixed(2);
    };

    // Calculate weeks present
    const calculateWeeksPresent = (userId) => {
        const weeklyData = attendanceData[userId] || {};
        return Object.values(weeklyData).filter(Boolean).length;
    };
    
    return (
        <div className="w-full min-h-screen bg-backgroundColor">
            <Header auth={auth} />
            <div className="flex flex-col md:flex-row">
                <AdminSidebar />
                <div className="flex-1 p-3 md:p-6">
                    <div className="font-regular">
                        {/* Breadcrumb */}
                        <div className="bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 text-sm md:text-base">
                            <Link href="/adminHome" className="hover:underline cursor-pointer font-semibold">
                                Dashboard
                            </Link>
                            <span className="mx-2 font-semibold">{">"}</span>
                            <span className="cursor-default font-bold">Attendance</span>  
                        </div>
                        
                        {/* Page Header */}
                        <div className="bg-primary text-white p-3 md:p-4 rounded-lg flex items-center justify-between mt-3 md:mt-4 mb-3 md:mb-6 pl-3 md:pl-5 py-4 md:py-7">
                            <h1 className="text-xl md:text-2xl font-semibold">Attendance Managements</h1>
                        </div>

                        {/* Filters and Search */}
                        <div className="bg-white p-3 md:p-6 rounded-lg shadow mb-3 md:mb-6">
                            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-between">
                                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                                    
                                    {/* Search */}
                                    <div className="relative w-full sm:w-48 md:w-64">
                                        <FaSearch className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs md:text-sm" />
                                        <input
                                            type="text"
                                            placeholder="Search cadets..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full py-1.5 md:py-2 px-2 md:px-4 pl-7 md:pl-10 border rounded-lg text-xs md:text-sm"
                                        />
                                    </div>
                                    
                                    {/* Semester Selection */}
                                    <div className="w-full sm:w-auto">
                                        <select
                                            value={selectedSemester}
                                            onChange={(e) => setSelectedSemester(e.target.value)}
                                            className="w-full py-1.5 md:py-2 px-2 md:px-4 border rounded-lg text-xs md:text-sm"
                                            disabled={editMode}
                                        >
                                            {semesterOptions.map((semester) => (
                                                <option key={semester} value={semester}>
                                                    {semester}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                                    {/* Import Button */}
                                    <button
                                        onClick={() => setShowImportModal(true)}
                                        className="bg-primary hover:bg-primary/85 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 text-xs md:text-sm"
                                    >
                                        <FaUpload />
                                        Import Deli Data
                                    </button>
                                    
                                    {/* Edit Controls */}
                                    <div className="flex gap-2">
                                        {editMode && (
                                            <button
                                                onClick={cancelEditing}
                                                className="bg-gray-500 hover:bg-gray-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-xs md:text-sm"
                                            >
                                                <FaTimes />
                                                Cancel
                                            </button>
                                        )}
                                        
                                        <button
                                            onClick={toggleEditMode}
                                            disabled={saving}
                                            className={`${editMode 
                                                ? 'bg-green-600 hover:bg-green-700' 
                                                : 'bg-primary hover:bg-primary/85'
                                            } text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-xs md:text-sm`}
                                        >
                                            {saving ? (
                                                <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white"></div>
                                            ) : editMode ? (
                                                <FaSave />
                                            ) : (
                                                <FaEdit />
                                            )}
                                            {saving ? 'Saving...' : editMode ? 'Save Changes' : 'Edit Attendance'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Attendance Table */}
                        <div className="bg-white p-3 md:p-6 rounded-lg shadow">
                            {loading ? (
                                <div className="flex justify-center items-center h-32 md:h-40">
                                    <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-t-2 border-b-2 border-primary"></div>
                                </div>
                            ) : error ? (
                                <div className="text-center text-red-500 py-3 md:py-4 text-sm md:text-base">{error}</div>
                            ) : (
                                <>
                                    <h2 className="text-base md:text-lg font-semibold mb-2 md:mb-4">
                                        Cadet Attendance - 15 Weeks ({selectedSemester})
                                    </h2>
                                    {filteredCadets.length === 0 ? (
                                        <p className="text-center py-3 md:py-4 text-gray-500 text-sm md:text-base">No cadets found.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                                                            Cadet Name
                                                        </th>
                                                        <th scope="col" className="hidden sm:table-cell px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Student Number
                                                        </th>
                                                        {Array.from({ length: 15 }, (_, i) => (
                                                            <th key={i + 1} scope="col" className="px-1 md:px-2 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[40px] md:min-w-[50px]">
                                                                W{i + 1}
                                                            </th>
                                                        ))}
                                                        <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Present
                                                        </th>
                                                        <th scope="col" className="px-3 md:px-6 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Score
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {paginatedCadets.map((cadet) => (
                                                        <tr key={cadet.user_id} className="hover:bg-gray-50">
                                                            <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap sticky left-0 bg-white z-10">
                                                                <div className="text-xs md:text-sm font-medium text-gray-900">
                                                                    {cadet.last_name}, {cadet.first_name}
                                                                </div>
                                                                {/* Mobile-only student number display */}
                                                                <div className="text-xs text-gray-500 sm:hidden mt-1">{cadet.student_number}</div>
                                                            </td>
                                                            <td className="hidden sm:table-cell px-3 md:px-6 py-2 md:py-4 whitespace-nowrap">
                                                                <div className="text-xs md:text-sm text-gray-500">{cadet.student_number}</div>
                                                            </td>
                                                            {Array.from({ length: 15 }, (_, i) => {
                                                                const weekNumber = i + 1;
                                                                const isPresent = attendanceData[cadet.user_id]?.[weekNumber] || false;
                                                                
                                                                // Debug logging for first cadet
                                                                if (cadet.user_id === paginatedCadets[0]?.user_id && weekNumber === 1) {
                                                                    console.log(`Checkbox debug for cadet ${cadet.user_id}:`, {
                                                                        weekNumber,
                                                                        attendanceData: attendanceData[cadet.user_id],
                                                                        isPresent,
                                                                        rawValue: attendanceData[cadet.user_id]?.[weekNumber]
                                                                    });
                                                                }
                                                                
                                                                return (
                                                                    <td key={`${cadet.user_id}-${weekNumber}`} className="px-1 md:px-2 py-2 md:py-4 text-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isPresent}
                                                                            onChange={(e) => handleAttendanceChange(
                                                                                cadet.user_id, 
                                                                                weekNumber, 
                                                                                e.target.checked
                                                                            )}
                                                                            disabled={!editMode}
                                                                            className={`${!editMode ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'} 
                                                                                w-3 h-3 md:w-4 md:h-4 text-primary bg-gray-100 border-gray-300 rounded 
                                                                                focus:ring-primary focus:ring-2`}
                                                                        />
                                                                    </td>
                                                                );
                                                            })}
                                                            <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-center">
                                                                <span className="text-xs md:text-sm font-medium text-gray-900">
                                                                    {calculateWeeksPresent(cadet.user_id)}/15
                                                                </span>
                                                            </td>
                                                            <td className="px-3 md:px-6 py-2 md:py-4 whitespace-nowrap text-center">
                                                                <span className="text-xs md:text-sm font-medium text-gray-900">
                                                                    {calculateAttendancePercentage(cadet.user_id)}%
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    
                                    {/* Pagination */}
                                    {totalPages > 1 && (
                                        <div className="flex flex-col sm:flex-row justify-between items-center mt-3 md:mt-4 gap-3">
                                            <div className="text-xs md:text-sm text-gray-600 order-2 sm:order-1">
                                                Showing {(currentPage - 1) * cadetsPerPage + 1} to {Math.min(currentPage * cadetsPerPage, filteredCadets.length)} of {filteredCadets.length} cadets
                                            </div>
                                            <div className="flex gap-1 md:gap-2 order-1 sm:order-2">
                                                <button
                                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                    disabled={currentPage === 1}
                                                    className="px-2 md:px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
                                                >
                                                    Previous
                                                </button>
                                                
                                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                    let page;
                                                    if (totalPages <= 5) {
                                                        page = i + 1;
                                                    } else {
                                                        const start = Math.max(1, currentPage - 2);
                                                        const end = Math.min(totalPages, start + 4);
                                                        page = start + i;
                                                        if (page > end) return null;
                                                    }
                                                    
                                                    return (
                                                        <button
                                                            key={page}
                                                            onClick={() => setCurrentPage(page)}
                                                            className={`px-2 md:px-3 py-1 rounded text-xs md:text-sm ${
                                                                currentPage === page 
                                                                    ? 'bg-primary text-white' 
                                                                    : 'bg-gray-200 hover:bg-gray-300'
                                                            }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    );
                                                })}
                                                
                                                <button
                                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                    disabled={currentPage === totalPages}
                                                    className="px-2 md:px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Import Deli Scanner Data</h2>
                            <button
                                onClick={closeImportModal}
                                className="text-gray-500 hover:text-gray-700"
                                disabled={importing}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Deli Scanner Export File
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                                    <input
                                        type="file"
                                        accept=".csv,.txt,.xlsx,.xls"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id="attendance-file"
                                        disabled={importing}
                                    />
                                    <label
                                        htmlFor="attendance-file"
                                        className="cursor-pointer flex flex-col items-center"
                                    >
                                        <FaFileUpload className="text-3xl text-gray-400 mb-2" />
                                        <span className="text-sm text-gray-600">
                                            {importFile ? importFile.name : 'Click to select file or drag and drop'}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="text-sm text-gray-600">
                                <p className="mb-2"><strong>Deli Scanner Export Format:</strong></p>
                                <ul className="list-disc list-inside space-y-1 text-xs">
                                    <li><strong>CSV/TXT/Excel:</strong> UserID, Date, Time columns</li>
                                    <li><strong>Date Format:</strong> YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY</li>
                                    <li><strong>User Matching:</strong> 8-digit Deli IDs matched to last 8 digits of 10-digit student numbers</li>
                                    <li><strong>Excel Support:</strong> .xlsx and .xls files are supported with automatic processing</li>
                                </ul>
                                <div className="mt-2 p-2 bg-primary/20 rounded text-primary">
                                    <p className="text-xs"><strong>Current Semester:</strong> {selectedSemester}</p>
                                    <p className="text-xs mt-1"><strong>Note:</strong> Excel files will be automatically processed. If processing fails, you'll be prompted to convert to CSV format.</p>
                                </div>
                            </div>

                            {importing && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <FaSpinner className="animate-spin" />
                                        <span className="text-sm">Processing attendance data...</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${importProgress}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-gray-500 text-center">
                                        {importProgress}% Complete
                                    </div>
                                </div>
                            )}

                            {importResults && (
                                <div className={`p-3 rounded-lg ${importResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                    <h4 className={`font-medium ${importResults.success ? 'text-green-800' : 'text-red-800'}`}>
                                        Import Results
                                    </h4>
                                    <div className="text-sm mt-2 space-y-1">
                                        {importResults.success ? (
                                            <>
                                                <p className="text-green-700">✓ Successfully imported {importResults.imported_count} new records</p>
                                                {importResults.updated_count > 0 && (
                                                    <p className="text-green-700">✓ Updated {importResults.updated_count} existing records</p>
                                                )}
                                                <p className="text-green-700 font-medium mt-2">Attendance checkboxes updated automatically!</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-red-700">✗ Import failed: {importResults.message}</p>
                                                {importResults.errors && importResults.errors.length > 0 && (
                                                    <div className="mt-2">
                                                        <p className="text-red-700 font-medium">Errors:</p>
                                                        <ul className="list-disc list-inside">
                                                            {importResults.errors.slice(0, 5).map((error, index) => (
                                                                <li key={index} className="text-red-600 text-xs">{error}</li>
                                                            ))}
                                                            {importResults.errors.length > 5 && (
                                                                <li className="text-red-600 text-xs">... and {importResults.errors.length - 5} more errors</li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={closeImportModal}
                                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                                    disabled={importing}
                                >
                                    {importing ? 'Processing...' : 'Cancel'}
                                </button>
                                <button
                                    onClick={handleImportAttendance}
                                    disabled={!importFile || importing}
                                    className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    {importing ? 'Importing...' : 'Import'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
