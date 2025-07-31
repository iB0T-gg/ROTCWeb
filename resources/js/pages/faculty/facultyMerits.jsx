import React, { useState, useEffect } from 'react';
import Header from '../../components/header';
import FacultySidebar from '../../components/facultySidebar';
import { FaSearch } from 'react-icons/fa';
import { FaSort } from 'react-icons/fa6';

const days = Array.from({ length: 15 }, (_, i) => `Day ${i + 1}`);

const FacultyMerits = ({ auth }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [cadets, setCadets] = useState([]);
  const [merits, setMerits] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('all');
  const [selectedPlatoon, setSelectedPlatoon] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedBattalion, setSelectedBattalion] = useState('');
  const [showSortPicker, setShowSortPicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Multiple selection states
  const [selectedPlatoons, setSelectedPlatoons] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedBattalions, setSelectedBattalions] = useState([]);
  const cadetsPerPage = 8;

  // Fetch cadets and merits from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch cadets
        const cadetsResponse = await fetch('/api/cadets');
        if (cadetsResponse.ok) {
          const cadetsData = await cadetsResponse.json();
          setCadets(cadetsData);
          
          // Fetch existing merits
          const meritsResponse = await fetch('/api/merits');
          if (meritsResponse.ok) {
            const meritsData = await meritsResponse.json();
            
            // Initialize merits data for each cadet
            const initialMerits = cadetsData.map(cadet => {
              const existingMerit = meritsData[cadet.id];
              if (existingMerit) {
                return {
                  days: existingMerit.days_array || Array(15).fill(''),
                  percentage: existingMerit.percentage || 30
                };
              }
              return { days: Array(15).fill(''), percentage: 30 };
            });
            setMerits(initialMerits);
          } else {
            // If no merits exist, initialize with defaults
            setMerits(cadetsData.map(() => ({ days: Array(15).fill(''), percentage: 30 })));
          }
        } else {
          console.error('Failed to fetch cadets');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sort]);

  // Format cadet name for display
  const formatCadetName = (cadet) => {
    const lastName = cadet.last_name || '';
    const firstName = cadet.first_name || '';
    const middleName = cadet.middle_name || '';
    const middleInitial = middleName ? ` ${middleName.charAt(0)}.` : '';
    return `${lastName}, ${firstName}${middleInitial}`;
  };

  const handleDayChange = (cadetIdx, dayIdx, value) => {
    let val = Number(value);
    if (isNaN(val) || value === '') val = '';
    else if (val > 10) val = 10;
    else if (val < 0) val = 0;
    const updated = merits.map((row, i) =>
      i === cadetIdx
        ? { ...row, days: row.days.map((d, j) => (j === dayIdx ? val : d)) }
        : row
    );
    setMerits(updated);
  };

  const handlePercentageChange = (cadetIdx, value) => {
    const val = Math.max(0, Math.min(30, Number(value)));
    const updated = merits.map((row, i) =>
      i === cadetIdx ? { ...row, percentage: val } : row
    );
    setMerits(updated);
  };

  const handleSave = async () => {
    try {
      const meritsData = cadets.map((cadet, index) => ({
        cadet_id: cadet.id,
        days: merits[index].days.map(val => (val === '' || isNaN(Number(val)) ? 0 : Number(val))),
        percentage: Number(merits[index].percentage) || 0
      }));

      const response = await fetch('/api/merits/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({ merits: meritsData })
      });

      if (response.ok) {
        const result = await response.json();
        alert('Successfully saved merits.');
        setIsEditing(false);
      } else if (response.status === 422) {
        // Laravel validation error
        const error = await response.json();
        let errorMsg = 'Validation error:';
        if (error.errors) {
          for (const [field, messages] of Object.entries(error.errors)) {
            errorMsg += `\n${field}: ${messages.join(', ')}`;
          }
        } else {
          errorMsg += ' ' + JSON.stringify(error);
        }
        alert(errorMsg);
      } else {
        const errorText = await response.text();
        alert('Failed to save merits. Please try again.\n' + errorText);
      }
    } catch (error) {
      console.error('Error saving merits:', error);
      alert('Error saving merits. Please try again.\n' + error.message);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reload data from database
    window.location.reload();
  };

  // Filtered and sorted cadets
  const filteredCadets = cadets.filter(cadet => {
    const nameMatches = formatCadetName(cadet).toLowerCase().includes(search.toLowerCase());
    const platoonMatches = !selectedPlatoon || cadet.platoon === selectedPlatoon;
    const companyMatches = !selectedCompany || cadet.company === selectedCompany;
    const battalionMatches = !selectedBattalion || cadet.battalion === selectedBattalion;
    return nameMatches && platoonMatches && companyMatches && battalionMatches;
  });

  // Sort cadets alphabetically by name before paginating
  const sortedCadets = [...filteredCadets].sort((a, b) => formatCadetName(a).localeCompare(formatCadetName(b)));
  const totalPages = Math.ceil(sortedCadets.length / cadetsPerPage);
  const paginatedCadets = sortedCadets.slice(
    (currentPage - 1) * cadetsPerPage,
    currentPage * cadetsPerPage
  );

  // Fill all visible cadets for a specific day with a value
  const handleFillAllDay = (dayIdx) => {
    let value = prompt('Enter value to fill for all visible cadets (0-10):', '10');
    if (value === null) return; // Cancelled
    value = Math.max(0, Math.min(10, Number(value)));
    const updated = merits.map((row, i) => {
      // Only update cadets on the current page
      const globalIdx = (currentPage - 1) * cadetsPerPage;
      if (i >= globalIdx && i < globalIdx + paginatedCadets.length) {
        return {
          ...row,
          days: row.days.map((d, j) => (j === dayIdx ? value : d)),
        };
      }
      return row;
    });
    setMerits(updated);
  };


  return (
    <div className='w-full min-h-screen bg-backgroundColor'>
      <Header auth={auth} />
      <div className="flex">
        <FacultySidebar />
        <div className="flex-1 p-6">
            {/* Breadcrumb */}
          <div className="bg-white p-3 text-gray-600 rounded-lg pl-5 cursor-pointer">
                Home {">"} Merits
            </div>
          {/* Page Header and Controls */}
          <div className="flex items-center justify-between mt-4 mb-6 pl-5 py-7 bg-primary text-white p-4 rounded-lg">
            <h1 className="text-2xl font-semibold">Merits Management</h1>
            
            </div>
            {/* Main Content */}
          <div className="bg-white p-6 rounded-lg shadow w-full mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-lg font-semibold text-black">Military Attitude</h1>
              
              <div className="flex items-center gap-4">
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="search"
                      placeholder="Search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                      className="w-48 p-2 pl-10 border border-gray-300 rounded-lg"
                    />
                  </div>
                                <div className="relative">
                <div
                  className="bg-white border border-gray-300 rounded-lg p-2 pl-9 pr-8 cursor-pointer"
                  onClick={() => setShowSortPicker(!showSortPicker)}
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
                
                {showSortPicker && (
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
                        onClick={() => setShowSortPicker(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                  </div>
                </div>
              </div>
              
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="text-gray-600">
                  <tr>
                    <th className="p-3 border-b font-medium text-left">Cadet Names</th>
                    {/* Dynamically render day columns without Fill All button */}
                    {days.map((d) => (
                      <th key={d} className="p-3 border-b font-medium text-center">{d}</th>
                    ))}
                    <th className="p-3 border-b font-medium text-center">Percentage</th>
                  </tr>
                </thead>
                  <tbody>
                  {paginatedCadets.map((cadet, i) => {
                    const cadetIndex = cadets.findIndex(c => c.id === cadet.id);
                    // Calculate total score and percentage
                    const totalScore = merits[cadetIndex]?.days.reduce((sum, val) => sum + (Number(val) || 0), 0);
                    const percentage = ((totalScore / 150) * 30).toFixed(2);
                    return (
                      <tr key={cadet.id}>
                        <td className="p-3 text-black">{formatCadetName(cadet)}</td>
                        {merits[cadetIndex]?.days.map((val, j) => (
                          <td key={j} className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={val === null || val === undefined ? '' : val}
                              onChange={e => handleDayChange(cadetIndex, j, e.target.value)}
                              className={`w-12 text-center border border-gray-300 rounded p-1 ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                              placeholder="-"
                              disabled={!isEditing}
                            />
                          </td>
                        ))}
                        <td className="p-3 text-center">
                          {/* Display calculated percentage, not an input */}
                          {percentage}%
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
            </div>
            <div className="flex items-center justify-between mt-4 w-full">
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
              </div>
              {/* Right: Action Buttons */}
              <div className="flex justify-end gap-2">
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="bg-primary text-white px-4 py-2 rounded hover:bg-[#3d4422] transition-colors duration-150"
                  >
                    Edit Merits
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={handleSave}
                      className="bg-primary text-white px-4 py-2 rounded hover:bg-primary transition-colors duration-150"
                    >
                      Save
                    </button>
                    <button 
                      onClick={handleCancel}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors duration-150"
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
  );
};

export default FacultyMerits;
