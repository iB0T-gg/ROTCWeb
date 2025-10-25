import React, { useState, useEffect } from 'react';
import Header from '../../components/header';
import AdminSidebar from '../../components/adminSidebar';
import { FaSearch, FaEdit, FaSave, FaTimes, FaUpload, FaFileUpload, FaSpinner, FaDownload } from 'react-icons/fa';
import { FaSort } from 'react-icons/fa6';
import { usePage } from '@inertiajs/react';
import { Link, Head } from '@inertiajs/react';
import axios from 'axios';

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
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [selectedBattalion, setSelectedBattalion] = useState('');
    const [selectedCompany, setSelectedCompany] = useState('');
    const [selectedPlatoon, setSelectedPlatoon] = useState('');
    const [showFilterPicker, setShowFilterPicker] = useState(false);
    const [showWeekSelector, setShowWeekSelector] = useState(false);
    const [selectedWeeks, setSelectedWeeks] = useState([]);
    const cadetsPerPage = 8;

    // Alert state
    const [alertDialog, setAlertDialog] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: ''
    });

    // Semester options
    const semesterOptions = ['2025-2026 1st semester', '2025-2026 2nd semester'];

    // Excel Export Function
    const exportToExcel = async () => {
        try {
            // Show week selector first
            setShowWeekSelector(true);
        } catch (error) {
            console.error('Error opening week selector:', error);
            setAlertDialog({
                isOpen: true,
                type: 'error',
                title: 'Export Error',
                message: 'Failed to open week selector. Please try again.'
            });
        }
    };

    const handleWeekSelection = () => {
        if (selectedWeeks.length === 0) {
            setAlertDialog({
                isOpen: true,
                type: 'error',
                title: 'No Weeks Selected',
                message: 'Please select at least one week to export.'
            });
            return;
        }
        
        setShowWeekSelector(false);
        
        // Load xlsx library dynamically
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        script.onload = () => {
            generateExcelFile();
        };
        document.head.appendChild(script);
    };

    const generateExcelFile = () => {
        try {
            const maxWeeks = selectedSemester === '2025-2026 1st semester' ? 10 : 15;
            
            // Use filtered cadets instead of all cadets
            const cadetsToExport = filteredCadets;
            
            // Group cadets by platoon
            const cadetsByPlatoon = {};
            cadetsToExport.forEach(cadet => {
                const platoon = cadet.platoon || 'No Platoon';
                if (!cadetsByPlatoon[platoon]) {
                    cadetsByPlatoon[platoon] = [];
                }
                cadetsByPlatoon[platoon].push(cadet);
            });
            
            // Create workbook
            const wb = window.XLSX.utils.book_new();
            
            // Create a sheet for each platoon
            Object.keys(cadetsByPlatoon).forEach(platoonName => {
                const platoonCadets = cadetsByPlatoon[platoonName];
                const excelData = [];
                
                // Add headers
                const headers = [
                    'Cadet Name',
                    'Student Number',
                    'Course',
                    'Year',
                    'Section',
                    'Platoon',
                    'Company',
                    'Battalion',
                    ...selectedWeeks.map(week => `Week ${week}`),
                    'Total Present',
                    'Attendance %'
                ];
                excelData.push(headers);
                
                // Add cadet data for this platoon
                platoonCadets.forEach(cadet => {
                    const weeklyAttendance = cadet.weekly_attendance || {};
                    const presentCount = Object.values(weeklyAttendance).filter(Boolean).length;
                    const attendancePercentage = Math.round((presentCount / maxWeeks) * 100);
                    
                    const row = [
                        `${cadet.last_name}, ${cadet.first_name}`,
                        cadet.student_number || '',
                        cadet.course || '',
                        cadet.year || '',
                        cadet.section || '',
                        cadet.platoon || '',
                        cadet.company || '',
                        cadet.battalion || '',
                    ...selectedWeeks.map(weekNumber => {
                        const isPresent = weeklyAttendance[weekNumber];
                        if (isPresent === true) return 'Present';
                        if (isPresent === false) return 'Absent';
                        return 'Not Recorded';
                    }),
                        presentCount,
                        `${attendancePercentage}%`
                    ];
                    excelData.push(row);
                });
                
                // Add summary row for this platoon
                const summaryRow = ['TOTAL PRESENT', '', '', '', '', '', '', ''];
                selectedWeeks.forEach(week => {
                    const weekPresentCount = platoonCadets.filter(cadet => {
                        const weeklyAttendance = cadet.weekly_attendance || {};
                        return weeklyAttendance[week] === true;
                    }).length;
                    summaryRow.push(weekPresentCount);
                });
                summaryRow.push('', ''); // Empty for total and percentage columns
                excelData.push(summaryRow);
                
                // Create worksheet for this platoon
                const ws = window.XLSX.utils.aoa_to_sheet(excelData);
                const sheetName = platoonName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 31); // Excel sheet name limit
                window.XLSX.utils.book_append_sheet(wb, ws, sheetName);
            });
            
            // Generate filename with current date and filter info
            const currentDate = new Date().toISOString().split('T')[0];
            let filterInfo = '';
            if (selectedBattalion) filterInfo += `_${selectedBattalion.replace(/\s+/g, '_')}`;
            if (selectedCompany) filterInfo += `_${selectedCompany}`;
            if (selectedPlatoon) filterInfo += `_${selectedPlatoon.replace(/\s+/g, '_')}`;
            
            const weeksInfo = selectedWeeks.length === maxWeeks ? 'All_Weeks' : `Weeks_${selectedWeeks.join('_')}`;
            const filename = `Attendance_Records${filterInfo}_${weeksInfo}_${selectedSemester.replace(/\s+/g, '_')}_${currentDate}.xlsx`;
            
            // Download the file
            window.XLSX.writeFile(wb, filename);
            
            // Export completed silently without success message
            
        } catch (error) {
            console.error('Error generating Excel file:', error);
            setAlertDialog({
                isOpen: true,
                type: 'error',
                title: 'Export Error',
                message: 'Failed to generate Excel file. Please try again.'
            });
        }
    };

    // Fetch cadets and their attendance data
    const fetchCadets = async (highlightImported = false) => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`/api/attendance/cadets?semester=${encodeURIComponent(selectedSemester)}`);
            
            console.log('📊 API Response:', response.data);
            
            if (response.data.success && Array.isArray(response.data.data)) {
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
                    const maxWeeks = selectedSemester === '2025-2026 1st semester' ? 10 : 15;
                    
                    if (cadet.weekly_attendance && typeof cadet.weekly_attendance === 'object') {
                        Object.keys(cadet.weekly_attendance).forEach(week => {
                            const weekNum = parseInt(week);
                            if (weekNum >= 1 && weekNum <= maxWeeks) {
                                weeklyData[weekNum] = Boolean(cadet.weekly_attendance[week]);
                            }
                        });
                    }
                    
                    // Initialize missing weeks to false
                    for (let week = 1; week <= maxWeeks; week++) {
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
            } else {
                console.error('❌ Invalid API response format:', response.data);
                setCadets([]);
                setAttendanceData({});
                setOriginalData({});
                setError('Invalid data format received from server');
            }
        } catch (err) {
            console.error('💥 Error fetching cadets:', err);
            console.error('📋 Error details:', {
                message: err.message,
                response: err.response,
                status: err.response?.status,
                data: err.response?.data
            });
            
            // Ensure cadets is always an array to prevent filter errors
            setCadets([]);
            setAttendanceData({});
            setOriginalData({});
            
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
                setAlertDialog({
                    isOpen: true,
                    type: 'error',
                    title: 'Security Error',
                    message: 'Security token not found. Please refresh the page and try again.'
                });
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
                setAlertDialog({
                    isOpen: true,
                    type: 'success',
                    title: 'Success',
                    message: 'Attendance saved successfully!'
                });
                
                // Refresh data to get updated calculations
                fetchCadets();
            } else {
                console.error('Save failed:', response.data);
                setAlertDialog({
                    isOpen: true,
                    type: 'error',
                    title: 'Save Failed',
                    message: response.data.message || 'Failed to save attendance'
                });
            }
        } catch (error) {
            console.error('Error saving attendance:', error);
            console.error('Error details:', error.response?.data);
            
            if (error.response?.status === 419) {
                setAlertDialog({
                    isOpen: true,
                    type: 'error',
                    title: 'Session Expired',
                    message: 'Security token expired. Please refresh the page and try again.'
                });
                window.location.reload();
            } else if (error.response?.status === 401) {
                setAlertDialog({
                    isOpen: true,
                    type: 'error',
                    title: 'Authentication Failed',
                    message: 'Authentication failed. Please login again.'
                });
            } else if (error.response?.status === 403) {
                setAlertDialog({
                    isOpen: true,
                    type: 'error',
                    title: 'Access Denied',
                    message: 'Access denied. You do not have permission to save attendance data.'
                });
            } else if (error.response?.data?.message) {
                setAlertDialog({
                    isOpen: true,
                    type: 'error',
                    title: 'Error',
                    message: error.response.data.message
                });
            } else {
                setAlertDialog({
                    isOpen: true,
                    type: 'error',
                    title: 'Save Failed',
                    message: 'Failed to save attendance. Please try again.'
                });
            }
        } finally {
            setSaving(false);
        }
    };

    // Get unique filter options based on current cadet data
    const getUniqueFilterOptions = () => {
        if (!Array.isArray(cadets)) return { battalions: [], companies: [], platoons: [] };
        
        const battalions = [...new Set(cadets.map(cadet => cadet.battalion).filter(Boolean))].sort();
        
        // Filter companies based on selected battalion
        let filteredCadetsForCompany = cadets;
        if (selectedBattalion) {
            filteredCadetsForCompany = cadets.filter(cadet => cadet.battalion === selectedBattalion);
        }
        const companies = [...new Set(filteredCadetsForCompany.map(cadet => cadet.company).filter(Boolean))].sort();
        
        // Filter platoons based on selected battalion and company
        let filteredCadetsForPlatoon = cadets;
        if (selectedBattalion) {
            filteredCadetsForPlatoon = filteredCadetsForPlatoon.filter(cadet => cadet.battalion === selectedBattalion);
        }
        if (selectedCompany) {
            filteredCadetsForPlatoon = filteredCadetsForPlatoon.filter(cadet => cadet.company === selectedCompany);
        }
        const platoons = [...new Set(filteredCadetsForPlatoon.map(cadet => cadet.platoon).filter(Boolean))].sort();
        
        return { battalions, companies, platoons };
    };

    const { battalions, companies, platoons } = getUniqueFilterOptions();

    // Filter cadets based on search term and organizational filters
    const filteredCadets = Array.isArray(cadets) ? cadets.filter(cadet => {
        // Search filter
        const fullName = `${cadet.last_name}, ${cadet.first_name}`.toLowerCase();
        const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                            cadet.student_number?.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Organizational filters
        const matchesBattalion = !selectedBattalion || cadet.battalion === selectedBattalion;
        const matchesCompany = !selectedCompany || cadet.company === selectedCompany;
        const matchesPlatoon = !selectedPlatoon || cadet.platoon === selectedPlatoon;
        
        return matchesSearch && matchesBattalion && matchesCompany && matchesPlatoon;
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
    }) : [];

    // Pagination
    const totalPages = Math.ceil(filteredCadets.length / cadetsPerPage);
    const paginatedCadets = filteredCadets.slice(
        (currentPage - 1) * cadetsPerPage,
        currentPage * cadetsPerPage
    );

    // Validate and set file helper
    const validateAndSetImportFile = (file) => {
        if (!file) return;
        const allowedTypes = ['.csv', '.txt', '.xlsx', '.xls'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (allowedTypes.includes(fileExtension)) {
            setImportFile(file);
            if (['.xlsx', '.xls'].includes(fileExtension)) {
                console.log('Excel file selected. Will attempt processing with fallback to CSV conversion instructions if needed.');
            }
        } else {
            setAlertDialog({
                isOpen: true,
                type: 'error',
                title: 'Invalid File Format',
                message: 'Please select a valid file format (.csv, .txt, .xlsx, .xls)'
            });
        }
    };

    // Handle file selection for import
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        validateAndSetImportFile(file);
        if (!file) return;
        const input = event.target;
        input.value = '';
    };

    // Drag and drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            validateAndSetImportFile(files[0]);
        }
    };

    // Handle attendance import from Deli scanner file
    const handleImportAttendance = async () => {
        if (!importFile) {
            setAlertDialog({
                isOpen: true,
                type: 'error',
                title: 'No File Selected',
                message: 'Please select a file to import'
            });
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
                setAlertDialog({
                    isOpen: true,
                    type: 'error',
                    title: 'Security Error',
                    message: 'Security token not found. Please refresh the page and try again.'
                });
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
                    setAlertDialog({
                        isOpen: true,
                        type: 'error',
                        title: 'Session Expired',
                        message: 'Security token expired. The page will refresh automatically.'
                    });
                    setTimeout(() => window.location.reload(), 2000);
                }, 2000);
            } else if (error.response?.data?.message) {
                console.error(error.response.data.message);
                setImportResults(error.response.data);
                
                // Show detailed error message with Excel conversion instructions if needed
                const errorMsg = error.response.data.message || 'Import failed';
                if (errorMsg.includes('Excel') && errorMsg.includes('CSV')) {
                    setTimeout(() => {
                        setAlertDialog({
                            isOpen: true,
                            type: 'error',
                            title: 'Excel Processing Failed',
                            message: `${errorMsg}\n\nTo convert Excel to CSV:\n1. Open your Excel file\n2. Click "File" → "Save As"\n3. Choose "CSV (Comma delimited)" from the format dropdown\n4. Save the file\n5. Upload the new CSV file`
                        });
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
        const maxWeeks = selectedSemester === '2025-2026 1st semester' ? 10 : 15;
        return ((presentWeeks / maxWeeks) * 30).toFixed(2);
    };

    // Calculate weeks present
    const calculateWeeksPresent = (userId) => {
        const weeklyData = attendanceData[userId] || {};
        return Object.values(weeklyData).filter(Boolean).length;
    };
    
    return (
        <>
            <Head title="ROTC Portal - Admin Attendance" />
            <div className="w-full min-h-screen bg-backgroundColor">
            <Header auth={auth} />
            <div className="flex flex-col md:flex-row">
                <AdminSidebar />
                <div className="flex-1 p-3 md:p-6 md:ml-0 max-w-full overflow-hidden animate-fade-in-up">
                    <div className="font-regular max-w-full">
                        {/* Breadcrumb */}
                        <div className="bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 text-sm md:text-base animate-fade-in-up">
                            <Link href="/adminHome" className="hover:underline cursor-pointer font-semibold">
                                Dashboard
                            </Link>
                            <span className="mx-2 font-semibold">{">"}</span>
                            <span className="cursor-default font-bold">Attendance</span>  
                        </div>
                        
                        {/* Page Header */}
                        <div className="bg-primary text-white p-3 md:p-4 rounded-lg flex items-center justify-between mt-3 md:mt-4 mb-3 md:mb-6 pl-3 md:pl-5 py-4 md:py-7 animate-fade-in-down">
                            <h1 className="text-xl md:text-2xl font-semibold">Attendance Management</h1>
                        </div>

                        {/* Filters and Search */}
                        <div className="bg-white p-3 md:p-6 rounded-lg shadow mb-3 md:mb-6 animate-scale-in-up">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                {/* Semester Selection Tabs */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                                    {semesterOptions.map((semester) => (
                                        <button
                                            key={semester}
                                            onClick={() => setSelectedSemester(semester)}
                                            disabled={editMode}
                                            className={`py-1.5 md:py-2 px-2 md:px-4 rounded-lg transition-colors duration-150 text-sm md:text-base ${
                                                selectedSemester === semester
                                                    ? 'bg-primary text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            } ${editMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            {semester}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full sm:w-auto mt-2 sm:mt-0">
                                    {/* Import Deli Data Button - moved to left */}
                                    <button
                                        onClick={() => setShowImportModal(true)}
                                        className="bg-primary hover:bg-primary/85 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 text-xs md:text-sm"
                                    >
                                        <FaUpload />
                                        Import Deli Data
                                    </button>
                                    
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
                                    
                                    {/* Sort/Filter Dropdown - moved to right */}
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
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                                                            <select
                                                                className="w-full bg-gray-100 p-2 rounded border"
                                                                value={selectedCompany}
                                                                onChange={e => setSelectedCompany(e.target.value)}
                                                            >
                                                                <option value="">Select Company</option>
                                                                <option value="Alpha">Alpha</option>
                                                                <option value="Beta">Bravo</option>
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
                                                        <div className="flex gap-2 mt-4">
                                                            <button
                                                                className="flex-1 px-4 py-2 bg-gray-300 rounded text-sm hover:bg-gray-400 text-gray-700"
                                                                onClick={() => {
                                                                    setSelectedPlatoon('');
                                                                    setSelectedCompany('');
                                                                    setSelectedBattalion('');
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

                        {/* Attendance Table */}
                        <div className="bg-white rounded-lg shadow max-w-full overflow-hidden animate-scale-in-up">
                            <div className="p-3 md:p-6">
                                {loading ? (
                                    <div className="flex justify-center items-center h-32 md:h-40">
                                        <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-t-2 border-b-2 border-primary"></div>
                                    </div>
                                ) : error ? (
                                    <div className="text-center text-red-500 py-3 md:py-4 text-sm md:text-base">{error}</div>
                                ) : (
                                    <>
                                        <h2 className="text-base md:text-lg font-semibold mb-2 md:mb-4 animate-fade-in-up">
                                            Cadet Attendance - {selectedSemester === '2025-2026 1st semester' ? '10' : '15'} Weeks ({selectedSemester})
                                        </h2>
                                        {filteredCadets.length === 0 ? (
                                            <p className="text-center py-3 md:py-4 text-gray-500 text-sm md:text-base">No cadets found.</p>
                                        ) : (
                                            <div className="w-full overflow-x-auto border rounded-lg">
                                                <table className="w-full divide-y divide-gray-200" style={{ minWidth: '1200px' }}>
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th scope="col" className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20 border-r border-gray-200" style={{ minWidth: '180px', width: '180px' }}>
                                                                Cadet Name
                                                            </th>
                                                            <th scope="col" className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{ minWidth: '140px', width: '140px' }}>
                                                                Student Number
                                                            </th>
                                                            {Array.from({ length: selectedSemester === '2025-2026 1st semester' ? 10 : 15 }, (_, i) => (
                                                                <th key={i + 1} scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{ minWidth: '45px', width: '45px' }}>
                                                                    <span className="hidden sm:inline">W{i + 1}</span>
                                                                    <span className="sm:hidden">{i + 1}</span>
                                                                </th>
                                                            ))}
                                                            <th scope="col" className="px-3 sm:px-4 md:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{ minWidth: '80px', width: '80px' }}>
                                                                <span className="hidden sm:inline">Present</span>
                                                                <span className="sm:hidden">P</span>
                                                            </th>
                                                            <th scope="col" className="px-3 sm:px-4 md:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '80px', width: '80px' }}>
                                                                <span className="hidden sm:inline">Score</span>
                                                                <span className="sm:hidden">S</span>
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {paginatedCadets.map((cadet) => (
                                                            <tr key={cadet.user_id} className="hover:bg-gray-50">
                                                                <td className="px-3 sm:px-4 md:px-6 py-3 sticky left-0 bg-white z-10 border-r border-gray-200" style={{ minWidth: '180px', width: '180px' }}>
                                                                    <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                                                        {cadet.last_name}, {cadet.first_name}
                                                                    </div>
                                                                    {/* Mobile-only student number display */}
                                                                    <div className="text-xs text-gray-500 lg:hidden mt-1 truncate">{cadet.student_number}</div>
                                                                </td>
                                                                <td className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-3 border-r border-gray-200" style={{ minWidth: '140px', width: '140px' }}>
                                                                    <div className="text-xs sm:text-sm text-gray-500 truncate">{cadet.student_number}</div>
                                                                </td>
                                                                {Array.from({ length: selectedSemester === '2025-2026 1st semester' ? 10 : 15 }, (_, i) => {
                                                                    const weekNumber = i + 1;
                                                                    const isPresent = attendanceData[cadet.user_id]?.[weekNumber] || false;
                                                                    
                                                                    return (
                                                                        <td key={`${cadet.user_id}-${weekNumber}`} className="px-2 py-3 text-center border-r border-gray-200" style={{ minWidth: '45px', width: '45px' }}>
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
                                                                                    w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded 
                                                                                    focus:ring-primary focus:ring-1`}
                                                                            />
                                                                        </td>
                                                                    );
                                                                })}
                                                                <td className="px-3 sm:px-4 md:px-6 py-3 text-center border-r border-gray-200" style={{ minWidth: '80px', width: '80px' }}>
                                                                    <span className="text-xs sm:text-sm font-medium text-gray-900">
                                                                        {calculateWeeksPresent(cadet.user_id)}/{selectedSemester === '2025-2026 1st semester' ? '10' : '15'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 sm:px-4 md:px-6 py-3 text-center" style={{ minWidth: '80px', width: '80px' }}>
                                                                    <span className="text-xs sm:text-sm font-medium text-gray-900">
                                                                        {calculateAttendancePercentage(cadet.user_id)}%
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {/* Summary row showing total present per week */}
                                                        <tr className='border-b-2 border-gray-400 bg-gray-50 font-semibold'>
                                                            <td className='px-3 sm:px-4 md:px-6 py-3 sticky left-0 bg-gray-50 z-10 border-r border-gray-200 font-medium text-gray-900' style={{ minWidth: '180px', width: '180px' }}>
                                                                Total Present
                                                            </td>
                                                            <td className='hidden lg:table-cell px-3 sm:px-4 md:px-6 py-3 border-r border-gray-200' style={{ minWidth: '140px', width: '140px' }}>
                                                                {/* Empty for student number column */}
                                                            </td>
                                                            {Array.from({ length: selectedSemester === '2025-2026 1st semester' ? 10 : 15 }, (_, i) => {
                                                                const weekNumber = i + 1;
                                                                const weekPresentCount = cadets.filter(cadet => {
                                                                    const weeklyAttendance = cadet.weekly_attendance || {};
                                                                    return weeklyAttendance[weekNumber] === true;
                                                                }).length;
                                                                
                                                                return (
                                                                    <td key={i} className='px-2 py-3 text-center border-r border-gray-200' style={{ minWidth: '45px', width: '45px' }}>
                                                                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-black font-semibold text-sm">
                                                                            {weekPresentCount}
                                                                        </span>
                                                                    </td>
                                                                );
                                                            })}
                                                            <td className='px-3 sm:px-4 md:px-6 py-3 text-center border-r border-gray-200 font-semibold text-gray-900' style={{ minWidth: '80px', width: '80px' }}>

                                                            </td>
                                                            <td className='px-3 sm:px-4 md:px-6 py-3 text-center font-semibold text-gray-900' style={{ minWidth: '80px', width: '80px' }}>

                                                            </td>
                                                        </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    
                                    {/* Pagination and Controls */}
                                    <div className="grid grid-cols-1 lg:grid-cols-3 items-center mt-4 md:mt-6 gap-3">
                                        {/* Results Info */}
                                        <div className="text-gray-600 text-xs sm:text-sm lg:justify-self-start order-2 lg:order-1 text-center lg:text-left">
                                            Showing {(currentPage - 1) * cadetsPerPage + 1} to {Math.min(currentPage * cadetsPerPage, filteredCadets.length)} of {filteredCadets.length} cadets
                                        </div>
                                        
                                        {/* Pagination Buttons - Only show if more than 1 page */}
                                        <div className="flex justify-center lg:justify-self-center w-full lg:w-auto order-1 lg:order-2 gap-2">
                                            {totalPages > 1 && (
                                                <>
                                                    {currentPage > 1 && (
                                                        <button
                                                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                            className="px-3 sm:px-4 py-2 rounded bg-white border text-xs sm:text-sm hover:bg-gray-50 transition-colors"
                                                        >
                                                            {'<'}
                                                        </button>
                                                    )}
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
                                                                className={`px-3 sm:px-4 py-2 rounded text-xs sm:text-sm transition-colors ${currentPage === page ? 'bg-primary text-white hover:bg-primary/90' : 'bg-white border hover:bg-gray-50'}`}
                                                            >
                                                                {page}
                                                            </button>
                                                        );
                                                    })}
                                                    <button
                                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                        disabled={currentPage === totalPages}
                                                        className="px-3 sm:px-4 py-2 rounded bg-white border text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                                    >
                                                        &gt;
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        
                                        {/* Edit Attendance Button - Always visible */}
                                        <div className="lg:justify-self-end flex flex-col sm:flex-row gap-2 order-3 w-full lg:w-auto">
                                            {editMode && (
                                                <button
                                                    onClick={cancelEditing}
                                                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 md:px-4 py-2 md:py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors text-xs sm:text-sm"
                                                >
                                                    <span className="hidden sm:inline">Cancel</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={toggleEditMode}
                                                disabled={saving}
                                                className={`${editMode 
                                                    ? 'bg-primary hover:bg-primary/85' 
                                                    : 'bg-primary hover:bg-primary/85'
                                                } text-white px-3 md:px-4 py-2 md:py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-xs sm:text-sm`}
                                            >
                                                {saving ? (
                                                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                                                ) : editMode ? (
                                                    <FaSave />
                                                ) : (
                                                    <FaEdit />
                                                )}
                                                <span className="hidden sm:inline">
                                                    {saving ? 'Saving...' : editMode ? 'Save Changes' : 'Edit Attendance'}
                                                </span>
                                                <span className="sm:hidden">
                                                    {saving ? 'Save...' : editMode ? 'Save' : 'Edit'}
                                                </span>
                                            </button>
                                            
                                            {/* Export to Excel Button */}
                                            <button
                                                onClick={exportToExcel}
                                                className="bg-primary hover:bg-primary/80 text-white px-3 md:px-4 py-2 md:py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors text-xs sm:text-sm"
                                            >
                                                <FaDownload />
                                                <span className="hidden sm:inline">Export Excel</span>
                                                <span className="sm:hidden">Export</span>
                                            </button>
                                        </div>
                                    </div>
                                    </>
                                )}
                            </div>
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
                                <div 
                                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${isDraggingOver ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}`}
                                    onDragOver={handleDragOver}
                                    onDragEnter={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
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
                                    <li><strong>Required Columns:</strong> UserID, Date (Time is optional)</li>
                                    <li><strong>Date Format:</strong> YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY</li>
                                    <li><strong>User Matching:</strong> 8-digit Deli IDs matched to last 8 digits of 10-digit student numbers</li>
                                    <li><strong>File Support:</strong> .csv, .txt, .xlsx, .xls files</li>
                                </ul>
                                <div className="mt-2 p-2 bg-primary/20 rounded text-primary">
                                    <p className="text-xs"><strong>Current Semester:</strong> {selectedSemester}</p>
                                    <p className="text-xs mt-1"><strong>Note:</strong> Only UserID and Date columns are required. Time column is optional.</p>
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

                    {/* Week Selector Modal */}
                    {showWeekSelector && (
                        <>
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 shadow-lg">
                                    <div>
                                        <h3 className="text-lg font-semibold text-black mb-4">Select Weeks to Export</h3>
                                        <p className="text-gray-600 mb-4">Choose which weeks you want to include in the Excel export:</p>
                                        
                                        <div className="grid grid-cols-5 gap-2 mb-4">
                                            {Array.from({ length: selectedSemester === '2025-2026 1st semester' ? 10 : 15 }, (_, i) => {
                                                const weekNumber = i + 1;
                                                const isSelected = selectedWeeks.includes(weekNumber);
                                                
                                                return (
                                                    <label key={weekNumber} className="flex items-center space-x-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedWeeks([...selectedWeeks, weekNumber]);
                                                                } else {
                                                                    setSelectedWeeks(selectedWeeks.filter(w => w !== weekNumber));
                                                                }
                                                            }}
                                                            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-1"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700">Week {weekNumber}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        const maxWeeks = selectedSemester === '2025-2026 1st semester' ? 10 : 15;
                                                        setSelectedWeeks(Array.from({ length: maxWeeks }, (_, i) => i + 1));
                                                    }}
                                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                                                >
                                                    Select All
                                                </button>
                                                <button
                                                    onClick={() => setSelectedWeeks([])}
                                                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                                                >
                                                    Clear All
                                                </button>
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {selectedWeeks.length} week(s) selected
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-6">
                                        <button
                                            onClick={() => setShowWeekSelector(false)}
                                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleWeekSelection}
                                            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                                        >
                                            Export Selected Weeks
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Alert Dialog */}
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
