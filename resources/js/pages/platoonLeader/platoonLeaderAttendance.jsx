import React, { useState, useEffect } from 'react';
import Header from '../../components/header';
import PlatoonLeaderSidebar from '../../components/platoonLeaderSidebar';
import { FaSearch, FaEdit, FaSave, FaSpinner } from 'react-icons/fa';
import { usePage, Link, Head } from '@inertiajs/react';
import axios from 'axios';

// Week dates mapping for 2025-2026 1st semester (format: MM-DD-YYYY)
const firstSemesterWeekDates = [
  '08-15-2025', // Week 1
  '08-22-2025', // Week 2
  '08-29-2025', // Week 3
  '09-05-2025', // Week 4
  '09-12-2025', // Week 5
  '09-19-2025', // Week 6
  '09-26-2025', // Week 7
  '10-03-2025', // Week 8
  '10-10-2025', // Week 9
  '10-17-2025', // Week 10
];

// Week dates mapping for 2025-2026 2nd semester (format: MM-DD-YYYY)
const secondSemesterWeekDates = [
  '01-15-2026', // Week 1
  '01-22-2026', // Week 2
  '01-29-2026', // Week 3
  '02-05-2026', // Week 4
  '02-12-2026', // Week 5
  '02-19-2026', // Week 6
  '02-26-2026', // Week 7
  '03-05-2026', // Week 8
  '03-12-2026', // Week 9
  '03-19-2026', // Week 10
  '03-26-2026', // Week 11
  '04-02-2026', // Week 12
  '04-09-2026', // Week 13
  '04-16-2026', // Week 14
  '04-23-2026', // Week 15
];

// Helper function to get date for a week
const getWeekDate = (weekNumber, semester) => {
  if (semester === '2025-2026 1st semester') {
    if (weekNumber >= 1 && weekNumber <= 10) {
      return firstSemesterWeekDates[weekNumber - 1];
    }
  } else if (semester === '2025-2026 2nd semester') {
    if (weekNumber >= 1 && weekNumber <= 15) {
      return secondSemesterWeekDates[weekNumber - 1];
    }
  }
  return '';
};

const AlertDialog = ({ isOpen, type, title, message, onClose }) => {
  if (!isOpen) return null;

  const buttonColor = type === 'success' ? 'bg-primary/90 hover:bg-primary' : 'bg-red-600 hover:bg-red-700';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-lg">
        <div>
          <h3 className="text-lg font-semibold text-black mb-2">{title}</h3>
          <p className="text-black whitespace-pre-line">{message}</p>
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

export default function PlatoonLeaderAttendance() {
  const pageProps = usePage().props;
  const currentUser = pageProps?.auth?.user ?? pageProps?.auth ?? {};
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
  const cadetsPerPage = 8;

  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const semesterOptions = ['2025-2026 1st semester', '2025-2026 2nd semester'];

  const fetchCadets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/attendance/cadets?semester=${encodeURIComponent(selectedSemester)}`);

      if (response.data.success && Array.isArray(response.data.data)) {
        const assignedCompany = currentUser?.company ? currentUser.company.toLowerCase() : null;
        const assignedPlatoon = currentUser?.platoon ? currentUser.platoon.toLowerCase() : null;
        const assignedBattalion = currentUser?.battalion ? currentUser.battalion.toLowerCase() : null;
        const isPlatoonLeader = currentUser?.role === 'platoon_leader';

        const filteredCadets = isPlatoonLeader
          ? response.data.data.filter((cadet) => {
              const cadetCompany = cadet.company ? cadet.company.toLowerCase() : null;
              const cadetPlatoon = cadet.platoon ? cadet.platoon.toLowerCase() : null;
              const cadetBattalion = cadet.battalion ? cadet.battalion.toLowerCase() : null;

              const companyMatches = !assignedCompany || cadetCompany === assignedCompany;
              const platoonMatches = !assignedPlatoon || cadetPlatoon === assignedPlatoon;
              const battalionMatches = !assignedBattalion || cadetBattalion === assignedBattalion;

              return companyMatches && platoonMatches && battalionMatches;
            })
          : response.data.data;

        setCadets(filteredCadets);

        const initialAttendanceData = {};
        filteredCadets.forEach((cadet) => {
          const weeklyData = {};
          const maxWeeks = selectedSemester === '2025-2026 1st semester' ? 10 : 15;

          if (cadet.weekly_attendance && typeof cadet.weekly_attendance === 'object') {
            Object.keys(cadet.weekly_attendance).forEach((week) => {
              const weekNum = parseInt(week, 10);
              if (weekNum >= 1 && weekNum <= maxWeeks) {
                weeklyData[weekNum] = Boolean(cadet.weekly_attendance[week]);
              }
            });
          }

          for (let week = 1; week <= maxWeeks; week++) {
            if (!(week in weeklyData)) {
              weeklyData[week] = false;
            }
          }

          initialAttendanceData[cadet.user_id] = weeklyData;
        });

        setAttendanceData(initialAttendanceData);
        setOriginalData(JSON.parse(JSON.stringify(initialAttendanceData)));
      } else {
        setCadets([]);
        setAttendanceData({});
        setOriginalData({});
        setError('Invalid data format received from server');
      }
    } catch (err) {
      console.error('Error fetching cadets:', err);
      setCadets([]);
      setAttendanceData({});
      setOriginalData({});

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

  const handleAttendanceChange = (userId, weekNumber, isPresent) => {
    if (!editMode) return;

    setAttendanceData((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [weekNumber]: isPresent
      }
    }));
  };

  const toggleEditMode = () => {
    if (editMode) {
      saveAttendance();
    } else {
      setEditMode(true);
    }
  };

  const cancelEditing = () => {
    setAttendanceData(JSON.parse(JSON.stringify(originalData)));
    setEditMode(false);
  };

  const saveAttendance = async () => {
    try {
      setSaving(true);

      const updates = cadets.map((cadet) => ({
        user_id: cadet.user_id,
        weekly_attendance: attendanceData[cadet.user_id] || {}
      }));

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

      if (response.data.success) {
        setOriginalData(JSON.parse(JSON.stringify(attendanceData)));
        setEditMode(false);
        setAlertDialog({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: 'Attendance saved successfully!'
        });
        fetchCadets();
      } else {
        setAlertDialog({
          isOpen: true,
          type: 'error',
          title: 'Save Failed',
          message: response.data.message || 'Failed to save attendance'
        });
      }
    } catch (error) {
      console.error('Error saving attendance:', error);

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

  const filteredCadets = Array.isArray(cadets) ? cadets.filter((cadet) => {
    const fullName = `${cadet.last_name}, ${cadet.first_name}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      cadet.student_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }).sort((a, b) => {
    const lastNameA = a.last_name ? a.last_name.toLowerCase() : '';
    const lastNameB = b.last_name ? b.last_name.toLowerCase() : '';

    if (lastNameA === lastNameB) {
      const firstNameA = a.first_name ? a.first_name.toLowerCase() : '';
      const firstNameB = b.first_name ? b.first_name.toLowerCase() : '';
      return firstNameA.localeCompare(firstNameB);
    }

    return lastNameA.localeCompare(lastNameB);
  }) : [];

  const totalPages = Math.ceil(filteredCadets.length / cadetsPerPage) || 1;
  const paginatedCadets = filteredCadets.slice(
    (currentPage - 1) * cadetsPerPage,
    currentPage * cadetsPerPage
  );

  const calculateAttendancePercentage = (userId) => {
    const weeklyData = attendanceData[userId] || {};
    const presentWeeks = Object.values(weeklyData).filter(Boolean).length;
    const maxWeeks = selectedSemester === '2025-2026 1st semester' ? 10 : 15;
    return ((presentWeeks / maxWeeks) * 30).toFixed(2);
  };

  const calculateWeeksPresent = (userId) => {
    const weeklyData = attendanceData[userId] || {};
    return Object.values(weeklyData).filter(Boolean).length;
  };

  return (
    <>
      <Head title="ROTC Portal - Platoon Leader Attendance" />
      <div className="w-full min-h-screen bg-backgroundColor">
        <Header auth={pageProps?.auth || currentUser} />
        <div className="flex flex-col md:flex-row">
          <PlatoonLeaderSidebar />
          <div className="flex-1 p-3 md:p-6 md:ml-0 max-w-full overflow-hidden animate-fade-in-up">
            <div className="font-regular max-w-full">
              <div className="bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 text-sm md:text-base animate-fade-in-up">
                <Link href="/platoon-leader/attendance" className="hover:underline cursor-pointer font-semibold">
                  Attendance
                </Link>
                <span className="mx-2 font-semibold">{'>'}</span>
                <span className="cursor-default font-bold">Management</span>
              </div>

              <div className="bg-primary text-white p-3 md:p-4 rounded-lg flex items-center justify-between mt-3 md:mt-4 mb-3 md:mb-6 pl-3 md:pl-5 py-4 md:py-7 animate-fade-in-down">
                <h1 className="text-xl md:text-2xl font-semibold">Attendance Management</h1>
              </div>

              <div className="bg-white p-3 md:p-6 rounded-lg shadow mb-3 md:mb-6 animate-scale-in-up">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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

                  <div className="flex w-full sm:w-auto mt-2 sm:mt-0">
                    <div className="relative flex-grow sm:flex-grow-0 w-full">
                      <FaSearch className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="search"
                        placeholder="Search by name or student number"
                        className="w-full sm:w-56 p-2 pl-10 border border-gray-300 rounded-lg text-sm md:text-base"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

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
                                {Array.from({ length: selectedSemester === '2025-2026 1st semester' ? 10 : 15 }, (_, i) => {
                                  const weekNumber = i + 1;
                                  const weekDate = getWeekDate(weekNumber, selectedSemester);
                                  return (
                                    <th key={i + 1} scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200" style={{ minWidth: '45px', width: '45px' }}>
                                      <div className="flex flex-col items-center">
                                        <span className="hidden sm:inline">W{weekNumber}</span>
                                        <span className="sm:hidden">{weekNumber}</span>
                                        {weekDate && (
                                          <span className="text-[8px] text-gray-400 mt-0.5 hidden sm:block">{weekDate}</span>
                                        )}
                                      </div>
                                    </th>
                                  );
                                })}
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
                                          className={`${!editMode ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'} w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-1`}
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
                              <tr className="border-b-2 border-gray-400 bg-gray-50 font-semibold">
                                <td className="px-3 sm:px-4 md:px-6 py-3 sticky left-0 bg-gray-50 z-10 border-r border-gray-200 font-medium text-gray-900" style={{ minWidth: '180px', width: '180px' }}>
                                  Total Present
                                </td>
                                <td className="hidden lg:table-cell px-3 sm:px-4 md:px-6 py-3 border-r border-gray-200" style={{ minWidth: '140px', width: '140px' }}></td>
                                {Array.from({ length: selectedSemester === '2025-2026 1st semester' ? 10 : 15 }, (_, i) => {
                                  const weekNumber = i + 1;
                                  const weekPresentCount = cadets.filter((cadet) => {
                                    const weeklyAttendance = cadet.weekly_attendance || {};
                                    return weeklyAttendance[weekNumber] === true;
                                  }).length;

                                  return (
                                    <td key={i} className="px-2 py-3 text-center border-r border-gray-200" style={{ minWidth: '45px', width: '45px' }}>
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-black font-semibold text-sm">
                                        {weekPresentCount}
                                      </span>
                                    </td>
                                  );
                                })}
                                <td className="px-3 sm:px-4 md:px-6 py-3 text-center border-r border-gray-200 font-semibold text-gray-900" style={{ minWidth: '80px', width: '80px' }}></td>
                                <td className="px-3 sm:px-4 md:px-6 py-3 text-center font-semibold text-gray-900" style={{ minWidth: '80px', width: '80px' }}></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      <div className="grid grid-cols-1 lg:grid-cols-3 items-center mt-4 md:mt-6 gap-3">
                        <div className="text-gray-600 text-xs sm:text-sm lg:justify-self-start order-2 lg:order-1 text-center lg:text-left">
                          Showing {(currentPage - 1) * cadetsPerPage + 1} to {Math.min(currentPage * cadetsPerPage, filteredCadets.length)} of {filteredCadets.length} cadets
                        </div>

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

                        <div className="lg:justify-self-end flex flex-col sm:flex-row gap-2 order-3 w-full lg:w-auto">
                          {editMode && (
                            <button
                              onClick={cancelEditing}
                              className="bg-gray-500 hover:bg-gray-600 text-white px-3 md:px-4 py-2 md:py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors text-xs sm:text-sm"
                            >
                              <span className="hidden sm:inline">Cancel</span>
                              <span className="sm:hidden">Cancel</span>
                            </button>
                          )}
                          <button
                            onClick={toggleEditMode}
                            disabled={saving}
                            className={`${editMode ? 'bg-primary hover:bg-primary/85' : 'bg-primary hover:bg-primary/85'} text-white px-3 md:px-4 py-2 md:py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-xs sm:text-sm`}
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

                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

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

