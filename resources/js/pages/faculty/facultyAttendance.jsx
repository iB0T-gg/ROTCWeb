import React, { useState, useEffect } from 'react';
import Header from '../../components/header';
import FacultySidebar from '../../components/facultySidebar';
import { FaSearch } from 'react-icons/fa';
import { FaSort } from 'react-icons/fa6';

const FacultyAttendance = ({ auth }) => {
  const [cadets, setCadets] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedPlatoon, setSelectedPlatoon] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedBattalion, setSelectedBattalion] = useState('');
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const cadetsPerPage = 8;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all cadets
        const cadetsResponse = await fetch('/api/cadets');
        let cadetsData = [];
        if (cadetsResponse.ok) {
          cadetsData = await cadetsResponse.json();
          setCadets(cadetsData);
        }
        // Fetch all attendance records
        const attendanceResponse = await fetch('/api/faculty-attendance');
        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json();
          // Map attendance by user_id for quick lookup
          const map = {};
          attendanceData.forEach(record => {
            map[record.user_id] = record;
          });
          setAttendanceMap(map);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const formatCadetName = (cadet) => {
    const lastName = cadet.last_name || '';
    const firstName = cadet.first_name || '';
    const middleName = cadet.middle_name || '';
    const middleInitial = middleName ? ` ${middleName.charAt(0)}.` : '';
    return `${lastName}, ${firstName}${middleInitial}`;
  };

  // Filter and sort cadets
  const filteredCadets = cadets
    .filter(cadet => {
      const isUser = cadet.role === 'user';
      const nameMatches = formatCadetName(cadet).toLowerCase().includes(search.toLowerCase());
      const platoonMatches = !selectedPlatoon || cadet.platoon === selectedPlatoon;
      const companyMatches = !selectedCompany || cadet.company === selectedCompany;
      const battalionMatches = !selectedBattalion || cadet.battalion === selectedBattalion;
      return isUser && nameMatches && platoonMatches && companyMatches && battalionMatches;
    })
    .sort((a, b) => formatCadetName(a).localeCompare(formatCadetName(b)));

  // Pagination logic
  const totalPages = Math.ceil(filteredCadets.length / cadetsPerPage);
  const paginatedCadets = filteredCadets.slice(
    (currentPage - 1) * cadetsPerPage,
    currentPage * cadetsPerPage
  );

  return (
    <div className='w-full min-h-screen bg-backgroundColor'>
      <Header auth={auth} />
      <div className='flex'>
        <FacultySidebar />
        <div className='flex-1 p-6'>
          <div className='font-regular'>
            <div className='bg-white p-3 text-[#6B6A6A] rounded-lg pl-5 cursor-pointer'>
              Home {">"} Attendance
            </div>
            <div className='flex items-center justify-between mt-4 mb-6 pl-5 py-7 bg-primary text-white p-4 rounded-lg'>
              <div>
                <h1 className='text-2xl font-semibold'>Attendance Management</h1>
              </div>
            </div>
            <div className='bg-white p-6 rounded-lg shadow w-full mx-auto'>
              <div className='flex justify-between items-center mb-6'>
                <div>
                  <h1 className='text-lg font-semibold text-black'>Attendance Records</h1>
                  <p className='text-sm text-gray-500'>View attendance for all cadets</p>
                </div>
                <div className='flex items-center gap-4'>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="search"
                      placeholder="Search"
                      className="w-48 p-2 pl-10 border border-gray-300 rounded-lg"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <div
                      className="bg-white border border-gray-300 rounded-lg p-2 pl-9 pr-8 cursor-pointer"
                      onClick={() => setShowFilterPicker(!showFilterPicker)}
                    >
                      <span className="text-gray-600">
                        {selectedPlatoon || selectedCompany || selectedBattalion
                          ? `Filters: ${[
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
              <table className='w-full border-collapse'>
                <thead className='text-gray-600'>
                  <tr>
                    <th className='p-3 border-b font-medium text-left'>Cadet Name</th>
                    <th className='p-3 border-b font-medium text-center'>Weeks Present</th>
                    <th className='p-3 border-b font-medium text-center'>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCadets.map((cadet) => {
                    const attendance = attendanceMap[cadet.id];
                    let presentCount = 0;
                    if (attendance && attendance.attendances) {
                      presentCount = Object.values(attendance.attendances).filter(Boolean).length;
                    }
                    const percentage = ((presentCount / 15) * 30).toFixed(2);
                    return (
                      <tr className='border-b border-gray-200' key={cadet.id}>
                        <td className='p-3 text-black'>{formatCadetName(cadet)}</td>
                        <td className='p-3 text-center text-black'>{presentCount}/15</td>
                        <td className='p-3 text-center text-black'>{percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Pagination Controls */}
              <div className="flex justify-between items-center mt-4 w-full">
                {/* Left: Showing data */}
                <div className="text-gray-600">
                  Showing data {(currentPage - 1) * cadetsPerPage + 1} to {Math.min(currentPage * cadetsPerPage, filteredCadets.length)} of {filteredCadets.length} cadets
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
                {/* Right: (empty for now) */}
                <div className="flex justify-end gap-2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FacultyAttendance;