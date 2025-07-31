import Header from '../../components/header';
import AdminSidebar from '../../components/adminSidebar';
import { FaSearch } from 'react-icons/fa'
import { FaSort } from 'react-icons/fa6'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

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
    const [showFilterPicker, setShowFilterPicker] = useState(false);
    const cadetsPerPage = 8;
    
    // Define the fetchData function outside useEffect so we can reuse it
    const fetchData = async () => {
        try {
            setLoading(true);
            console.log('Fetching data...');
            
            // Fetch cadets specifically
            const cadetsResponse = await axios.get('/api/admin-cadets');
            console.log('Cadets API response:', cadetsResponse);
            
            const fetchedCadets = cadetsResponse.data;
            console.log('Fetched cadets:', fetchedCadets);
            setUsers(fetchedCadets);
                
                if (fetchedCadets && fetchedCadets.length > 0) {
                    // Create initial attendance data directly from cadets
                    // This ensures we always have data to display
                    const initialAttendanceData = fetchedCadets.map(cadet => {
                        // Create empty attendance records for all 15 days
                        const emptyAttendances = {};
                        for (let i = 1; i <= 15; i++) {
                            emptyAttendances[i] = false;
                        }
                        
                        return {
                            user_id: cadet.id,
                            first_name: cadet.first_name,
                            last_name: cadet.last_name,
                            company: cadet.company || '',
                            battalion: cadet.battalion || '',
                            platoon: cadet.platoon || '',
                            attendances: emptyAttendances,
                            percentage: '0.00'
                        };
                    });
                    
                    // Set initial attendance data
                    setAttendanceData(initialAttendanceData);
                    
                    // Try to fetch actual attendance records
                    try {
                        const attendanceResponse = await axios.get('/api/attendance');
                        console.log('Attendance API response:', attendanceResponse);
                        
                        let attendanceRecords = attendanceResponse.data;
                        
                        // If we have actual attendance records, update the data
                        if (attendanceRecords && attendanceRecords.length > 0) {
                            // Check if any cadet is missing in attendance records
                            const cadetIds = new Set(fetchedCadets.map(cadet => cadet.id));
                            const attendanceCadetIds = new Set(attendanceRecords.map(record => record.user_id));
                            
                            // Find cadets not in attendance records
                            const missingCadets = fetchedCadets.filter(cadet => !attendanceCadetIds.has(cadet.id));
                            
                            // If there are missing cadets, add them with empty attendance records
                            if (missingCadets.length > 0) {
                                const missingRecords = missingCadets.map(cadet => {
                                    const emptyAttendances = {};
                                    for (let i = 1; i <= 15; i++) {
                                        emptyAttendances[i] = false;
                                    }
                                    
                                    return {
                                        user_id: cadet.id,
                                        first_name: cadet.first_name,
                                        last_name: cadet.last_name,
                                        company: cadet.company || '',
                                        battalion: cadet.battalion || '',
                                        platoon: cadet.platoon || '',
                                        attendances: emptyAttendances,
                                        percentage: '0.00'
                                    };
                                });
                                
                                attendanceRecords = [...attendanceRecords, ...missingRecords];
                            }
                            
                            setAttendanceData(attendanceRecords);
                        }
                    } catch (attendanceError) {
                        console.error('Error fetching attendance data:', attendanceError);
                        // We already set initialAttendanceData, so no need to handle error further
                    }
                }
            } catch (error) {
                console.error('Error fetching cadets:', error);
                toast.error('Failed to fetch cadets data');
            } finally {
                setLoading(false);
            }
        };
    
    // Fetch users and attendance data on component mount
    useEffect(() => {
        fetchData();
    }, []);
    
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
                        const totalDays = Object.keys(updatedAttendances).length;
                        const presentDays = Object.values(updatedAttendances).filter(val => val).length;
                        const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
                        
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
                day_number: dayNumber,
                is_present: isPresent
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
        setEditMode(false);
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
                                            <th className='p-2 border-b font-medium text-left'>Day 1</th>
                                            <th className='p-2 border-b font-medium text-left'>Day 2</th>
                                            <th className='p-2 border-b font-medium text-left'>Day 3</th>
                                            <th className='p-2 border-b font-medium text-left'>Day 4</th>
                                            <th className='p-2 border-b font-medium text-left'>Day 5</th>
                                            <th className='p-2 border-b font-medium text-left'>Day 6</th>
                                            <th className='p-2 border-b font-medium text-left'>Day 7</th>
                                            <th className='p-2 border-b font-medium text-left'>Day 8</th>
                                            <th className='p-2 border-b font-medium text-left'>Day 9</th>
                                            <th className='p-2 border-b font-medium text-left'>Day 10</th>
                                            <th className='p-2 border-b font-medium text-left'>Day 11</th>
                                            <th className='p-2 border-b font-medium text-left'>Day 12</th>
                                            <th className='p-2 border-b font-medium text-left'>Day 13</th>
                                            <th className='p-2 border-b font-medium text-left'>Day 14</th>
                                            <th className='p-2 border-b font-medium text-left'>Day 15</th>
                                            <th className='p-2 border-b font-medium text-left'>Attendance Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="17" className="text-center py-4">Loading cadets...</td>
                                            </tr>
                                        ) : paginatedAttendanceData.length > 0 ? (
                                            paginatedAttendanceData.map(data => (
                                                <tr key={data.user_id} className='hover:bg-gray-50'>
                                                    <td className='p-2 border-b'>{data.last_name}, {data.first_name}</td>
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(dayNumber => (
                                                        <td key={`${data.user_id}-${dayNumber}`} className='p-2 border-b'>
                                                            <input
                                                                type="checkbox"
                                                                checked={data.attendances[dayNumber] || false}
                                                                onChange={(e) => handleAttendanceChange(data.user_id, dayNumber, e.target.checked)}
                                                                disabled={!editMode}
                                                                className={!editMode ? 'cursor-not-allowed opacity-70' : ''}
                                                            />
                                                        </td>
                                                    ))}
                                                    <td className='p-2 border-b text-center'>{data.percentage}%</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="17" className="text-center py-4">No cadets found</td>
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
                                            ? 'bg-green-600 hover:bg-green-700' 
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
