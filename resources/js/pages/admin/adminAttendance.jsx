import Header from '../../components/header';
import AdminSidebar from '../../components/adminSidebar';
import { FaSearch } from 'react-icons/fa'
import { FaSort } from 'react-icons/fa6'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

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

export default function AdminAttendance(){
    const { auth } = usePage().props;
    const [users, setUsers] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedPlatoon, setSelectedPlatoon] = useState('');
    const [selectedCompany, setSelectedCompany] = useState('');
    const [selectedBattalion, setSelectedBattalion] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('2025-2026 1st semester');
    const [showFilterPicker, setShowFilterPicker] = useState(false);
    const [maxWeeks, setMaxWeeks] = useState(10); // Default to 10 weeks for 1st semester
    const cadetsPerPage = 8;

    // Semester options
    const semesterOptions = ['2025-2026 1st semester', '2026-2027 2nd semester'];
    
    // Define the fetchData function outside useEffect so we can reuse it
    const fetchData = async (semester = selectedSemester) => {
        try {
            setLoading(true);
            console.log('Fetching data for semester:', semester);
            
            const semesterParam = encodeURIComponent(semester);
            
            // Fetch attendance data using the admin attendance API
            const attendanceResponse = await axios.get(`/api/attendance?semester=${semesterParam}`);
            console.log('Attendance API response:', attendanceResponse);
            
            const attendanceData = attendanceResponse.data;
            console.log('Fetched attendance data:', attendanceData);
            
            // The admin attendance API already returns the complete data we need
            setUsers(attendanceData);
            setAttendanceData(attendanceData);
            
            // Update max weeks based on the data returned
            if (attendanceData.length > 0 && attendanceData[0].max_weeks) {
                setMaxWeeks(attendanceData[0].max_weeks);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };
    
    // Reset edit state when switching semesters
    const resetEditState = () => {
        setEditMode(false);
        setSaving(false);
    };
    
    // Fetch users and attendance data on component mount
    useEffect(() => {
        fetchData(selectedSemester);
    }, []);

    // Fetch data when semester changes
    useEffect(() => {
        if (selectedSemester) {
            // Reset edit state when switching semesters
            resetEditState();
            fetchData(selectedSemester);
            toast.info(`Switched to ${selectedSemester}. Edit mode disabled.`);
        }
    }, [selectedSemester]);
    
    // Handle attendance change
    const handleAttendanceChange = async (userId, dayNumber, isPresent) => {
        if (!editMode) return; // Only allow changes in edit mode
        
        try {
            // Update UI optimistically
            setAttendanceData(prevData => {
                return prevData.map(item => {
                    if (item.user_id === userId) {
                        const updatedAttendances = { ...item.attendances };
                        updatedAttendances[dayNumber] = isPresent;
                        
                        // Recalculate percentage
                        const presentDays = Object.values(updatedAttendances).filter(val => val).length;
                        const percentage = maxWeeks > 0 ? (presentDays / maxWeeks) * 100 : 0;
                        
                        return {
                            ...item,
                            attendances: updatedAttendances,
                            percentage: percentage.toFixed(2)
                        };
                    }
                    return item;
                });
            });
            
            // Send update to server
            await axios.post('/api/attendance/update', {
                user_id: userId,
                week_number: dayNumber,
                is_present: isPresent,
                semester: selectedSemester
            });
            
        } catch (error) {
            console.error('Error updating attendance:', error);
            toast.error('Failed to update attendance');
        }
    };
    
    // Toggle edit mode
    const toggleEditMode = () => {
        const newMode = !editMode;
        setEditMode(newMode);
        
        // Display notification
        if (newMode) {
            toast.info('Edit mode enabled. You can now mark attendance.');
        } else {
            toast.success('Attendance records saved successfully.');
        }
    };
    
    // Cancel editing and restore original data
    const cancelEditing = () => {
        resetEditState();
        toast.info('Editing cancelled. Changes discarded.');
        fetchData(); // Refetch the data to discard changes
    };
    
    const formatCadetName = (data) => {
        return `${data.last_name || ''}, ${data.first_name || ''}`;
    };

    // Filter attendance data based on search and filters
    const filteredAttendanceData = attendanceData
        .filter(data => {
            const nameMatches = formatCadetName(data).toLowerCase().includes(searchTerm.toLowerCase());
            const platoonMatches = !selectedPlatoon || data.platoon === selectedPlatoon;
            const companyMatches = !selectedCompany || data.company === selectedCompany;
            const battalionMatches = !selectedBattalion || data.battalion === selectedBattalion;
            return nameMatches && platoonMatches && companyMatches && battalionMatches;
        })
        .sort((a, b) => formatCadetName(a).localeCompare(formatCadetName(b)));

    // Pagination logic
    const totalPages = Math.ceil(filteredAttendanceData.length / cadetsPerPage);
    const paginatedAttendanceData = filteredAttendanceData.slice(
        (currentPage - 1) * cadetsPerPage,
        currentPage * cadetsPerPage
    );
    
    return (
        <div className='w-full min-h-screen bg-backgroundColor'>
            <Header auth={auth} />
            
            <div className='flex'>
                <AdminSidebar />
                
                <div className='flex-1 p-6'>
                    <div className='font-regular'>
                        <div className='bg-white p-3 text-[#6B6A6A] rounded-lg pl-5'>
                            <span className='cursor-pointer'>Home</span>
                            {">"}
                            <span className='cursor-pointer'>Attendance</span>
                        </div>
                        <div className='flex items-center justify-between mt-4 mb-6 pl-5 py-7 bg-primary text-white p-4 rounded-lg'>
                            <h1 className='text-2xl font-semibold'>Attendance</h1>
                        </div>

                        <div className='bg-white p-6 rounded-lg shadow w-full mx-auto h-full'>
                            <div className='flex justify-between items-center mb-6'>
                                <h1 className='text-lg font-semibold text-black'>List of Cadets</h1>

                                <div className='flex items-center gap-4'>
                                    {/* Semester Selection */}
                                    <div className="relative">
                                        <select
                                            className="bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={selectedSemester}
                                            onChange={(e) => setSelectedSemester(e.target.value)}
                                        >
                                            {semesterOptions.map((semester) => (
                                                <option key={semester} value={semester}>
                                                    {semester}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                    
                                    <div className="relative">
                                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="search"
                                            placeholder="Search Cadets"
                                            className="w-64 p-2 pl-10 border border-gray-300 rounded-lg"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="relative">
                                        <div
                                          className="bg-white border border-gray-300 rounded-lg p-2 pl-9 pr-8 cursor-pointer"
                                          onClick={() => setShowFilterPicker(!showFilterPicker)}
                                        >
                                          <span className="text-gray-600">
                                            {selectedPlatoon || selectedCompany || selectedBattalion
                                              ? `Filters: ${ [
                                                  selectedPlatoon || '',
                                                  selectedCompany || '',
                                                  selectedBattalion || ''
                                                ].filter(Boolean).join(', ')}` 
                                              : 'Filter by : All'}
                                          </span>
                                          <FaSort className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                        {showFilterPicker && (
                                          <div
                                            className="absolute z-10 bg-white border border-gray-300 rounded-lg p-4 mt-1 shadow-lg w-64"
                                            style={{ top: '100%', right: 0 }}
                                          >
                                            <div className="space-y-4">
                                              <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Platoon (Select Platoon)</label>
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
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Company (Select Company)</label>
                                                <select
                                                  className="w-full bg-gray-100 p-2 rounded border"
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
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Battalion (Select Battalion)</label>
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
                                              <button
                                                className="w-full mt-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-gray-700"
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
                            
                            <div className='overflow-y-auto max-h-[500px]'>
                                <table className='w-full border-collapse'>
                                    <thead className='text-gray-600 sticky top-0 bg-white'>
                                        <tr>
                                            <th className='p-2 border-b font-medium text-left'>Cadet Name</th>
                                            {Array.from({ length: maxWeeks }, (_, i) => (
                                                <th key={i + 1} className='p-2 border-b font-medium text-left'>
                                                    Week {i + 1}
                                                </th>
                                            ))}
                                            <th className='p-2 border-b font-medium text-left'>Weeks Present</th>
                                            <th className='p-2 border-b font-medium text-left'>Attendance (30%)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={maxWeeks + 3} className="text-center py-4">Loading cadets...</td>
                                            </tr>
                                        ) : paginatedAttendanceData.length > 0 ? (
                                            paginatedAttendanceData.map(data => (
                                                <tr key={data.user_id} className='hover:bg-gray-50'>
                                                    <td className='p-2 border-b'>{data.last_name}, {data.first_name}</td>
                                                    {Array.from({ length: maxWeeks }, (_, i) => {
                                                        const weekNumber = i + 1;
                                                        return (
                                                            <td key={`${data.user_id}-${weekNumber}`} className='p-2 border-b'>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={data.attendances[weekNumber] || false}
                                                                    onChange={(e) => handleAttendanceChange(data.user_id, weekNumber, e.target.checked)}
                                                                    disabled={!editMode}
                                                                    className={!editMode ? 'cursor-not-allowed opacity-70' : ''}
                                                                />
                                                            </td>
                                                        );
                                                    })}
                                                    <td className='p-2 border-b text-center'>{data.weeks_present}/{maxWeeks}</td>
                                                    <td className='p-2 border-b text-center'>{Math.round(data.attendance_30)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={maxWeeks + 3} className="text-center py-4">No cadets found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Pagination Controls */}
                            <div className="flex justify-between items-center mt-4 w-full">
                                {/* Left: Showing data */}
                                <div className="text-gray-600">
                                    Showing data {(currentPage - 1) * cadetsPerPage + 1} to {Math.min(currentPage * cadetsPerPage, filteredAttendanceData.length)} of {filteredAttendanceData.length} cadets
                                </div>
                                {/* Center: Pagination */}
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
                                
                                {/* Right: Action buttons */}
                                <div className='flex gap-3'>
                                    {editMode && (
                                        <button 
                                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors duration-150"
                                            onClick={cancelEditing}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    <button 
                                        className={`${editMode 
                                            ? 'bg-primary hover:bg-primary' 
                                            : 'bg-primary hover:bg-[#3d4422]'
                                        } text-white px-4 py-2 rounded transition-colors duration-150`}
                                        onClick={toggleEditMode}
                                    >
                                        {editMode ? 'Save & Finish Editing' : 'Edit Attendance'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
