import React, { useState, useEffect } from 'react';
import Header from '../../components/header';
import FacultySidebar from '../../components/facultySidebar';
import { FaSearch } from 'react-icons/fa';
import { FaSort } from 'react-icons/fa6';

const FacultyFinalGrades = ({ auth }) => {
  const [cadets, setCadets] = useState([]);
  const [search, setSearch] = useState('');
  const [merits, setMerits] = useState({});
  const [attendanceMap, setAttendanceMap] = useState({});
  const [equivalentGrades, setEquivalentGrades] = useState({});
  const [selectedPlatoon, setSelectedPlatoon] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedBattalion, setSelectedBattalion] = useState('');
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [autoSaving, setAutoSaving] = useState(false);
  const cadetsPerPage = 8;

  // Fetch cadets, merits, attendance, and equivalent grades
  useEffect(() => {
    fetch('/api/cadets')
      .then(res => res.json())
      .then(data => setCadets(data));
    fetch('/api/merits')
      .then(res => res.json())
      .then(data => setMerits(data));
    fetch('/api/faculty-attendance')
      .then(res => res.json())
      .then(data => {
        // Map attendance by user_id for quick lookup
        const map = {};
        data.forEach(record => {
          map[record.user_id] = record;
        });
        setAttendanceMap(map);
      });
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
      })
      .catch(error => {
        console.error('Error fetching equivalent grades:', error);
      });
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

  const totalPages = Math.ceil(filteredCadets.length / cadetsPerPage);
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
    return (presentCount / 15) * 30;
  };

  // Compute equivalent grade (same as before)
  const computeEquivalentGrade = (merit, attendance, exams) => {
    const totalPercentage = merit + attendance + exams;
    if (totalPercentage >= 97) return 1.00;
    if (totalPercentage >= 94) return 1.25;
    if (totalPercentage >= 91) return 1.5;
    if (totalPercentage >= 88) return 1.75;
    if (totalPercentage >= 85) return 2.00;
    if (totalPercentage >= 82) return 2.25;
    if (totalPercentage >= 79) return 2.50;
    if (totalPercentage >= 76) return 2.75;
    if (totalPercentage >= 75) return 3.00;
    return 5.00;
  };
  
  // Auto-save a single equivalent grade and final grade when calculated
    const autoSaveEquivalentGrade = async (userId, equivalentGrade, finalGrade, meritPercentage, attendancePercentage, midtermExam, finalExam) => {
    try {
      setAutoSaving(true);
      const response = await fetch('/api/grade-equivalents/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({ 
          user_id: userId, 
          merit_percentage: meritPercentage,
          attendance_percentage: attendancePercentage,
          midterm_exam: midtermExam,
          final_exam: finalExam
        })
      });
      
      if (!response.ok) {
        console.error('Failed to auto-save grade, status:', response.status);
      }
      
      setTimeout(() => setAutoSaving(false), 1000); // Show saving status for 1 second
    } catch (error) {
      console.error('Failed to auto-save grade:', error);
      setAutoSaving(false);
    }
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

  // --- FIX: Move auto-save logic to useEffect ---
  useEffect(() => {
    // For each cadet on the current page, check if their computed grade needs to be saved
    const saveGrades = async () => {
      let needsSaving = false;
      for (const cadet of paginatedCadets) {
        const merit = merits[cadet.id]?.percentage ? Number(merits[cadet.id].percentage) : 0;
        const attendance = getAttendancePercentage(cadet);
        const exams = (cadet.midterm_exam !== undefined && cadet.final_exam !== undefined)
          ? ((Number(cadet.midterm_exam) + Number(cadet.final_exam)) / 100) * 40
          : 0;
        // Calculate total percentage (final grade)
        const finalGrade = merit + attendance + exams;
        const computedEquivalentGrade = computeEquivalentGrade(merit, attendance, exams);
        const savedEquivalentGrade = equivalentGrades[cadet.id];
        if (savedEquivalentGrade === undefined || savedEquivalentGrade !== computedEquivalentGrade) {
          needsSaving = true;
          await autoSaveEquivalentGrade(
            cadet.id, 
            computedEquivalentGrade, 
            finalGrade, 
            merit, 
            attendance, 
            cadet.midterm_exam, 
            cadet.final_exam
          );
          setEquivalentGrades(prev => ({
            ...prev,
            [cadet.id]: computedEquivalentGrade
          }));
        }
      }
    };
    saveGrades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginatedCadets, merits, attendanceMap]);
  // --- END FIX ---

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

            {/* Main Content */}
            <div className='bg-white p-6 rounded-lg shadow w-full mx-auto'>
              {/* Title and Controls */}
              <div className='flex justify-between items-center mb-6'>
                <div className='flex items-center'>
                  <h1 className='text-lg font-semibold text-black'>Equivalent Grades</h1>
                  {autoSaving && (
                    <span className='ml-3 text-sm text-green-600 animate-pulse'>
                      Auto-saving...
                    </span>
                  )}
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
              {/* Equivalent Grades Table */}
              <div className='overflow-x-auto'>
                <table className='w-full border-collapse'>
                  <thead className='text-gray-600'>
                    <tr>
                      <th className='p-3 border-b font-medium text-left'>Cadet Names</th>
                      <th className='p-3 border-b font-medium text-center'>Merits 30%</th>
                      <th className='p-3 border-b font-medium text-center'>Attendance 30%</th>
                      <th className='p-3 border-b font-medium text-center'>Exams 40%</th>
                      <th className='p-3 border-b font-medium text-center'>Final Average 100%</th>
                      <th className='p-3 border-b font-medium text-center'>Equivalent Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCadets.map(cadet => {
                      const merit = merits[cadet.id]?.percentage ? Number(merits[cadet.id].percentage) : 0;
                      const attendance = getAttendancePercentage(cadet);
                      const exams = (cadet.midterm_exam !== undefined && cadet.final_exam !== undefined)
                        ? ((Number(cadet.midterm_exam) + Number(cadet.final_exam)) / 100) * 40
                        : 0;
                      const computedEquivalentGrade = computeEquivalentGrade(merit, attendance, exams);
                      const savedEquivalentGrade = equivalentGrades[cadet.id];
                      return (
                        <tr className='border-b border-gray-200' key={cadet.id}>
                          <td className='p-3 text-black'>{formatCadetName(cadet)}</td>
                          <td className='p-3 text-center text-black'>
                            {merit.toFixed(2)}%
                          </td>
                          <td className='p-3 text-center text-black'>
                            {attendance.toFixed(2)}%
                          </td>
                          <td className='p-3 text-center text-black'>
                            {exams.toFixed(2)}%
                          </td>
                          <td className='p-3 text-center text-black'>
                            {(merit + attendance + exams).toFixed(2)}%
                          </td>
                          <td className='p-3 text-center text-black'>
                            {savedEquivalentGrade !== undefined ? savedEquivalentGrade.toFixed(2) : computedEquivalentGrade.toFixed(2)}
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