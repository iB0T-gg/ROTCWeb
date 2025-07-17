import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../../components/header';
import FacultySidebar from '../../components/facultySidebar';
import { FaSearch } from 'react-icons/fa';
import { FaSort } from 'react-icons/fa6';

const FacultyExams = ({ auth }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [cadets, setCadets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPlatoon, setSelectedPlatoon] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedBattalion, setSelectedBattalion] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const cadetsPerPage = 8;
  const [showFilterPicker, setShowFilterPicker] = useState(false);

  useEffect(() => {
    axios.get('/api/cadets')
      .then(res => {
        setCadets(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch cadets:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedPlatoon, selectedCompany, selectedBattalion]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const scores = cadets.map(cadet => ({
        id: cadet.id,
        midterm_exam: cadet.midterm_exam,
        final_exam: cadet.final_exam,
      }));
      const response = await axios.post('/api/exams/save', { scores });
      if (response.status === 200) {
        alert('Successfully saved exam scores.');
        setIsEditing(false);
      } else {
        alert('Failed to save exam scores.');
      }
    } catch (error) {
      console.error('Error saving exam scores:', error);
      alert('Error saving exam scores.');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // TODO: Add cancel logic to reset form
  };

  // Handle input change for midterm/final
  const handleScoreChange = (id, field, value) => {
    // Allow empty string for controlled input
    if (value === '') {
      setCadets(prev => prev.map(cadet =>
        cadet.id === id ? { ...cadet, [field]: '' } : cadet
      ));
      return;
    }
    let num = Number(value);
    if (num > 50) num = 50;
    if (num < 0) num = 0;
    setCadets(prev => prev.map(cadet =>
      cadet.id === id ? { ...cadet, [field]: num } : cadet
    ));
  };

  const formatCadetName = (cadet) => {
    const lastName = cadet.last_name || '';
    const firstName = cadet.first_name || '';
    const middleName = cadet.middle_name || '';
    const middleInitial = middleName ? ` ${middleName.charAt(0)}.` : '';
    return `${lastName}, ${firstName}${middleInitial}`;
  };

  // Filter, sort, and paginate cadets
  const filteredCadets = cadets
    .filter(cadet => {
      const isUser = cadet.role === 'user';
      const nameMatches = formatCadetName(cadet).toLowerCase().includes(search.toLowerCase());
      const platoonMatches = !selectedPlatoon || cadet.platoon === selectedPlatoon;
      const companyMatches = !selectedCompany || cadet.company === selectedCompany;
      const battalionMatches = !selectedBattalion || cadet.battalion === selectedBattalion;
      return isUser && nameMatches && platoonMatches && companyMatches && battalionMatches;
    })
    .sort((a, b) => {
      return formatCadetName(a).localeCompare(formatCadetName(b));
    });

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
          {/* Breadcrumb */}
          <div className='bg-white p-3 text-[#6B6A6A] rounded-lg pl-5 cursor-pointer'>
            Home {">"} Exams
          </div>
          {/* Page Header */}
          <div className='flex items-center justify-between mt-4 mb-6 pl-5 py-7 bg-primary text-white p-4 rounded-lg'>
            <h1 className='text-2xl font-semibold'>Exams</h1>
          </div>
          {/* Main Content */}
          <div className='bg-white p-6 rounded-lg shadow w-full mx-auto'>
            {/* Title and Controls */}
            <div className='flex justify-between items-center mb-6'>
              <h1 className='text-lg font-semibold text-black'>Exam Record</h1>
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
            {/* Exam Table */}
            <div className='overflow-x-auto'>
              <table className='w-full border-collapse'>
                <thead className='text-gray-600'>
                  <tr>
                    <th className='p-3 border-b font-medium text-left'>Cadet Names</th>
                    <th className='p-3 border-b font-medium text-center'>Midterm Exam</th>
                    <th className='p-3 border-b font-medium text-center'>Final Exam</th>
                    <th className='p-3 border-b font-medium text-center'>Equivalent Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCadets.map(cadet => {
                    const midterm = cadet.midterm_exam === '' ? '' : Number(cadet.midterm_exam) || 0;
                    const final = cadet.final_exam === '' ? '' : Number(cadet.final_exam) || 0;
                    const equivalent = midterm === '' || final === '' ? '' : ((midterm + final) / 100 * 40).toFixed(2);
                    return (
                      <tr className='border-b border-gray-200' key={cadet.id}>
                        <td className='p-3 text-black'>{formatCadetName(cadet)}</td>
                        <td className='p-3 text-center'>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            className={`w-16 text-center border border-gray-300 rounded p-1 ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            value={cadet.midterm_exam === '' ? '' : cadet.midterm_exam}
                            disabled={!isEditing}
                            onChange={e => handleScoreChange(cadet.id, 'midterm_exam', e.target.value)}
                          />
                        </td>
                        <td className='p-3 text-center'>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            className={`w-16 text-center border border-gray-300 rounded p-1 ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            value={cadet.final_exam === '' ? '' : cadet.final_exam}
                            disabled={!isEditing}
                            onChange={e => handleScoreChange(cadet.id, 'final_exam', e.target.value)}
                          />
                        </td>
                        <td className='p-3 text-center text-black'>{equivalent !== '' ? `${equivalent}%` : ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Footer with Pagination, Pagination Buttons, and Action Buttons */}
              <div className="flex justify-between items-center mt-4 w-full">
                <div className="text-gray-600">
                  Showing data 1 to {filteredCadets.length} of {filteredCadets.length} cadets
                </div>
                <div className="flex-1 flex justify-center">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      className={`mx-1 px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-olive-700 text-white' : 'bg-white border'}`}
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
                <div>
                  {!isEditing ? (
                    <button 
                      onClick={handleEdit}
                      className='bg-primary text-white px-4 py-2 rounded hover:bg-[#3d4422] transition-colors duration-150'
                    >
                      Edit Scores
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={handleSave}
                        className='bg-primary text-white px-4 py-2 rounded hover:bg-primary transition-colors duration-150'
                      >
                        Save Scores
                      </button>
                      <button 
                        onClick={handleCancel}
                        className='bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors duration-150'
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FacultyExams