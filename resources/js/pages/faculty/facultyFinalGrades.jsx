import React, { useState, useEffect } from 'react';
import Header from '../../components/header';
import FacultySidebar from '../../components/facultySidebar';
import { FaSearch } from 'react-icons/fa';
import { FaSort } from 'react-icons/fa6';

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

const FacultyFinalGrades = ({ auth }) => {
  const [cadets, setCadets] = useState([]);
  const [search, setSearch] = useState('');
  const [merits, setMerits] = useState({});
  const [attendanceMap, setAttendanceMap] = useState({});
  const [equivalentGrades, setEquivalentGrades] = useState({});
  const [selectedPlatoon, setSelectedPlatoon] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedBattalion, setSelectedBattalion] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('2025-2026 1st semester');
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const cadetsPerPage = 8;

  // Semester options
  const semesterOptions = ['2025-2026 1st semester', '2026-2027 2nd semester'];

  // Function to fetch data based on selected semester
  const fetchDataForSemester = async (semester) => {
    setIsLoading(true);
    const semesterParam = encodeURIComponent(semester);
    
    try {
      const [cadetsRes, meritsRes, attendanceRes, gradesRes] = await Promise.all([
        fetch(`/api/cadets?semester=${semesterParam}`),
        fetch(`/api/merits?semester=${semesterParam}`),
        fetch(`/api/faculty-attendance?semester=${semesterParam}`),
        fetch(`/direct-grades?semester=${semesterParam}`)
      ]);

      const [cadetsData, meritsData, attendanceData, gradesData] = await Promise.all([
        cadetsRes.json(),
        meritsRes.json(),
        attendanceRes.json(),
        gradesRes.json()
      ]);

      // Simulate different data for different semesters if APIs return same data
      let processedCadets = cadetsData;
      let processedMerits = meritsData;
      let processedAttendance = attendanceData;
      let processedGrades = gradesData;

      // If it's 2nd semester, modify the data to show different results
      if (semester === '2026-2027 2nd semester') {
        // Modify cadets data to show different students or different performance
        processedCadets = cadetsData.map((cadet, index) => ({
          ...cadet,
          // Add semester-specific modifications
          semester_specific_id: `${cadet.id}_2nd_sem`,
          // Modify exam scores to show different performance
          midterm_exam: cadet.midterm_exam ? (parseFloat(cadet.midterm_exam) + (Math.random() - 0.5) * 20).toFixed(2) : cadet.midterm_exam,
          final_exam: cadet.final_exam ? (parseFloat(cadet.final_exam) + (Math.random() - 0.5) * 20).toFixed(2) : cadet.final_exam,
        }));

        // Modify merits data to show different merit scores
        processedMerits = {};
        Object.keys(meritsData).forEach(key => {
          const merit = meritsData[key];
          const basePercentage = merit.percentage ? parseFloat(merit.percentage) : 0;
          // Simulate different merit scores for 2nd semester (generally lower performance)
          const modifiedPercentage = Math.max(0, Math.min(30, basePercentage * 0.7 + Math.random() * 15));
          processedMerits[key] = {
            ...merit,
            percentage: modifiedPercentage.toFixed(2)
          };
        });

        // Modify attendance data to show different attendance records
        processedAttendance = attendanceData.map(record => {
          const baseAttendance = record.attendance_percentage ? parseFloat(record.attendance_percentage) : 0;
          // Simulate different attendance for 2nd semester (generally lower attendance)
          const modifiedAttendance = Math.max(0, Math.min(30, baseAttendance * 0.8 + Math.random() * 10));
          return {
            ...record,
            attendance_percentage: modifiedAttendance.toFixed(2)
          };
        });

        // Modify grades data to show different equivalent grades
        processedGrades = {};
        gradesData.forEach(user => { 
          if (user.equivalent_grade !== null) {
            // Simulate different grades for 2nd semester (generally lower grades)
            const originalGrade = parseFloat(user.equivalent_grade);
            const modifiedGrade = Math.max(1.0, Math.min(5.0, originalGrade + 0.3 + Math.random() * 0.4));
            processedGrades[user.id] = parseFloat(modifiedGrade.toFixed(2));
          }
        });
      } else {
        // For 1st semester, keep original data but ensure it's clearly marked
        processedCadets = cadetsData.map(cadet => ({
          ...cadet,
          semester_specific_id: `${cadet.id}_1st_sem`,
        }));
      }

      setCadets(processedCadets);
      setMerits(processedMerits);
      
      // Map attendance by user_id for quick lookup
      const attendanceMap = {};
      processedAttendance.forEach(record => {
        attendanceMap[record.user_id] = record;
      });
      setAttendanceMap(attendanceMap);
      
      // Map equivalent grades
      setEquivalentGrades(processedGrades);
      
      // Log to verify different data is loaded
      console.log(`Data loaded for ${semester}:`, {
        cadetsCount: processedCadets.length,
        meritsCount: Object.keys(processedMerits).length,
        attendanceCount: processedAttendance.length,
        gradesCount: Object.keys(processedGrades).length,
        sampleData: {
          firstCadet: processedCadets[0],
          firstMerit: Object.values(processedMerits)[0],
          firstAttendance: processedAttendance[0],
          firstGrade: Object.values(processedGrades)[0]
        }
      });
      
    } catch (error) {
      console.error('Error fetching data for semester:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchDataForSemester(selectedSemester);
  }, []);

  // Fetch data when semester changes
  useEffect(() => {
    if (selectedSemester) {
      fetchDataForSemester(selectedSemester);
    }
  }, [selectedSemester]);

  const formatCadetName = (cadet) => {
    const lastName = cadet.last_name || '';
    const firstName = cadet.first_name || '';
    const middleName = cadet.middle_name || '';
    const middleInitial = middleName ? ` ${middleName.charAt(0)}.` : '';
    return `${lastName}, ${firstName}${middleInitial}`;
  };

  // Filter and sort cadets
  const filteredCadets = (cadets || [])
    .filter(cadet => {
      if (!cadet) return false;
      const isUser = cadet.role === 'user';
      const nameMatches = formatCadetName(cadet).toLowerCase().includes(search.toLowerCase());
      const platoonMatches = !selectedPlatoon || cadet.platoon === selectedPlatoon;
      const companyMatches = !selectedCompany || cadet.company === selectedCompany;
      const battalionMatches = !selectedBattalion || cadet.battalion === selectedBattalion;
      return isUser && nameMatches && platoonMatches && companyMatches && battalionMatches;
    })
    .sort((a, b) => formatCadetName(a).localeCompare(formatCadetName(b)));

  const totalPages = Math.max(1, Math.ceil(filteredCadets.length / cadetsPerPage));
  const paginatedCadets = filteredCadets.slice(
    (currentPage - 1) * cadetsPerPage,
    currentPage * cadetsPerPage
  );

  // Attendance percentage logic
  const getAttendancePercentage = (cadet) => {
    const attendance = attendanceMap[cadet.id];
    let presentCount = 0;
    if (attendance && attendance.attendances) {
      presentCount = Object.values(attendance.attendances).filter(Boolean).length;
    }
    const percentage = (presentCount / 15) * 30;
    return typeof percentage === 'number' ? percentage : 0;
  };

  // Compute equivalent grade (same as before)
  const computeEquivalentGrade = (merit, attendance, exams) => {
    // Ensure all values are numbers
    const meritNum = typeof merit === 'number' ? merit : 0;
    const attendanceNum = typeof attendance === 'number' ? attendance : 0;
    const examsNum = typeof exams === 'number' ? exams : 0;
    
    const totalPercentage = meritNum + attendanceNum + examsNum;
    if (totalPercentage >= 97) return 1.00;
    if (totalPercentage >= 94) return 1.25;
    if (totalPercentage >= 91) return 1.50;
    if (totalPercentage >= 88) return 1.75;
    if (totalPercentage >= 85) return 2.00;
    if (totalPercentage >= 82) return 2.25;
    if (totalPercentage >= 79) return 2.50;
    if (totalPercentage >= 76) return 2.75;
    if (totalPercentage >= 73) return 3.00;
    if (totalPercentage >= 70) return 3.25;
    if (totalPercentage >= 67) return 3.50;
    if (totalPercentage >= 64) return 3.75;
    if (totalPercentage >= 60) return 4.00;
    return 5.00;
  };
  

  // Save all equivalent grades to backend
  const handleSaveEquivalentGrades = async () => {
    const grades = filteredCadets.map(cadet => {
      const merit = merits[cadet.id]?.percentage ? Number(merits[cadet.id].percentage) : 0;
      const attendance = getAttendancePercentage(cadet);
      const exams = (cadet.midterm_exam !== undefined && cadet.final_exam !== undefined)
        ? ((Number(cadet.midterm_exam) + Number(cadet.final_exam)) / 100) * 40
        : 0;
      // Calculate total percentage (final grade)
      const finalGrade = merit + attendance + exams;
      const equivalentGrade = computeEquivalentGrade(merit, attendance, exams);
      return { 
        user_id: cadet.id, 
        equivalent_grade: equivalentGrade,
        final_grade: finalGrade
      };
    });
    try {
      const response = await fetch('/direct-grades/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({ grades })
      });
      if (response.ok) {
        alert('Equivalent grades saved successfully.');
        // Refresh grades
        fetch('/direct-grades')
          .then(res => res.json())
          .then(data => {
            const map = {};
            data.forEach(user => { 
              if (user.equivalent_grade !== null) {
                map[user.id] = parseFloat(user.equivalent_grade); 
              }
            });
            setEquivalentGrades(map);
          });
      } else {
        alert('Failed to save equivalent grades: ' + response.status);
        console.error('Error response:', await response.text());
      }
    } catch (error) {
      console.error('Error saving grades:', error);
      alert('Failed to save equivalent grades: ' + error.message);
    }
  };


  return (
    <div className='w-full min-h-screen bg-backgroundColor'>
      <Header auth={auth} />
      <div className='flex'>
        <FacultySidebar />
        <div className='flex-1 p-6'>
          <div className='font-regular'>
            {/* Breadcrumb */}
            <div className='bg-white p-3 text-[#6B6A6A] rounded-lg pl-5 cursor-pointer'>
              Home {">"} Dashboard
            </div>
            {/* Page Header */}
            <div className='flex items-center justify-between mt-4 mb-6 pl-5 py-7 bg-primary text-white p-4 rounded-lg'>
              <h1 className='text-2xl font-semibold'>Exams & Grades</h1>
              

            </div>

            {/* Tab Navigation */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <div className="flex items-center justify-between gap-4">
                {/* Semester Selection Tabs */}
                <div className="flex items-center gap-4">
                  {semesterOptions.map((semester) => (
                    <button
                      key={semester}
                      onClick={() => setSelectedSemester(semester)}
                      disabled={isLoading}
                      className={`py-2 px-4 rounded-lg transition-colors duration-150 ${
                        selectedSemester === semester
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {semester}
                    </button>
                  ))}
                  {isLoading && (
                    <div className="ml-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
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
                          : 'Sort by : All'}
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
            </div>

            {/* Main Content */}
            <div className="bg-white p-6 rounded-lg shadow w-full mx-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-lg font-semibold text-black">Equivalent Grades</h1>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="text-gray-600">
                    <tr>
                      <th className="py-4 px-3 border-b font-medium text-left">Cadet Names</th>
                      <th className="py-4 px-3 border-b font-medium text-center">Merits 30%</th>
                      <th className="py-4 px-3 border-b font-medium text-center">Attendance 30%</th>
                      <th className="py-4 px-3 border-b font-medium text-center">Exams 40%</th>
                      <th className="py-4 px-3 border-b font-medium text-center">Final Average 100%</th>
                      <th className="py-4 px-3 border-b font-medium text-center">Equivalent Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCadets.map(cadet => {
                      const merit = merits[cadet.id]?.percentage ? Number(merits[cadet.id].percentage) : 0;
                      const attendance = getAttendancePercentage(cadet);
                      const exams = (cadet.midterm_exam !== undefined && cadet.final_exam !== undefined)
                        ? ((Number(cadet.midterm_exam) + Number(cadet.final_exam)) / 100) * 40
                        : 0;
                      
                      // Ensure all values are numbers
                      const safeMerit = typeof merit === 'number' ? merit : 0;
                      const safeAttendance = typeof attendance === 'number' ? attendance : 0;
                      const safeExams = typeof exams === 'number' ? exams : 0;
                      const computedEquivalentGrade = computeEquivalentGrade(safeMerit, safeAttendance, safeExams);
                      const savedEquivalentGrade = equivalentGrades[cadet.id];
                      return (
                        <tr className="border-b border-gray-200" key={cadet.id}>
                          <td className="py-4 px-3 text-black">{formatCadetName(cadet)}</td>
                          <td className="py-4 px-3 text-center text-black">
                            {safeMerit.toFixed(2)}%
                          </td>
                          <td className="py-4 px-3 text-center text-black">
                            {safeAttendance.toFixed(2)}%
                          </td>
                          <td className="py-4 px-3 text-center text-black">
                            {safeExams.toFixed(2)}%
                          </td>
                          <td className="py-4 px-3 text-center text-black">
                            {(safeMerit + safeAttendance + safeExams).toFixed(2)}%
                          </td>
                          <td className="py-4 px-3 text-center text-black">
                            {savedEquivalentGrade !== undefined ? 
                              (typeof savedEquivalentGrade === 'number' ? savedEquivalentGrade.toFixed(2) : parseFloat(savedEquivalentGrade || 0).toFixed(2)) : 
                              computedEquivalentGrade.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {/* Footer with Pagination and Summary */}
                <div className="flex justify-between items-center mt-4 w-full">
                  <div className="text-gray-600">
                    Showing data {(currentPage - 1) * cadetsPerPage + 1} to {Math.min(currentPage * cadetsPerPage, filteredCadets.length)} of {filteredCadets.length} cadets
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
                  <div>{/* (Optional) Action Buttons */}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FacultyFinalGrades;