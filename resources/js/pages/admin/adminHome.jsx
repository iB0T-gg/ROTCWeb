import Header from '../../components/header';
import AdminSidebar from '../../components/adminSidebar';
import { usePage, Link, Head } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminHome(){
    const { auth } = usePage().props;
    const [topCadets, setTopCadets] = useState({});
    const [availableSemesters, setAvailableSemesters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Fetch available semesters and top cadets for each
    useEffect(() => {
        const fetchTopCadetsPerSemester = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // First, get available semesters
                const semestersResponse = await axios.get('/api/admin-semesters');
                const semesters = semestersResponse.data;
                setAvailableSemesters(semesters);
                
                // Then, fetch top cadet for each semester
                const topCadetsData = {};
                
                for (const semester of semesters) {
                    try {
                        // Use the admin-cadets-by-semester endpoint to get data from user_grades table
                        const response = await axios.get(`/api/admin-cadets-by-semester/${encodeURIComponent(semester)}`);
                        const cadets = response.data;
                        
                        console.log(`Fetched ${cadets.length} cadets from user_grades table for ${semester}`);
                        
                        // Find the cadet with the highest grade in this semester from user_grades table
                        // Note: In ROTC system, lower equivalent grades are better (1.00 is highest, 5.00 is failing)
                        let topCadet = null;
                        let bestGrade = Infinity; // Start with infinity to find the lowest (best) grade
                        
                        cadets.forEach(cadet => {
                            const equivalentGrade = parseFloat(cadet.equivalent_grade);
                            
                            // Skip cadets with no valid equivalent grade from user_grades table
                            if (isNaN(equivalentGrade) || equivalentGrade <= 0 || equivalentGrade === null) {
                                return;
                            }
                            
                            // For equivalent grades, lower is better (1.00 is best, 5.00 is failing)
                            if (equivalentGrade < bestGrade) {
                                bestGrade = equivalentGrade;
                                topCadet = { ...cadet, semester };
                            }
                        });
                        
                        console.log(`Found ${cadets.filter(c => c.equivalent_grade && c.equivalent_grade > 0).length} cadets with valid grades from user_grades table`);
                        
                        if (topCadet) {
                            topCadetsData[semester] = topCadet;
                            console.log(`Top cadet for ${semester}:`, {
                                name: `${topCadet.first_name} ${topCadet.last_name}`,
                                equivalent_grade: topCadet.equivalent_grade,
                                final_grade: topCadet.final_grade,
                                rotc_grade: topCadet.rotc_grade,
                                common_module_grade: topCadet.common_module_grade,
                                bestGrade: bestGrade
                            });
                        }
                        
                    } catch (semesterError) {
                        console.warn(`Error fetching data for ${semester}:`, semesterError);
                    }
                }
                
                setTopCadets(topCadetsData);
                
            } catch (error) {
                console.error('Error fetching top cadets per semester:', error);
                setError('Unable to load top cadet data per semester');
            } finally {
                setLoading(false);
            }
        };
        
        fetchTopCadetsPerSemester();
    }, []);
    
    // Format the cadet name
    const formatCadetName = (cadet) => {
        if (!cadet) return '';
        return `${cadet.last_name}, ${cadet.first_name} ${cadet.middle_name ? cadet.middle_name.charAt(0) + '.' : ''}`.trim();
    };
    
    // Format grade to display with 2 decimal places
    const formatGrade = (grade) => {
        if (grade === null || grade === undefined) return 'N/A';
        return Number(grade).toFixed(2);
    };
    
    return (
        <>
            <Head title="ROTC Portal - Admin Dashboard" />
      <div className='w-full min-h-screen bg-backgroundColor'>
      <Header auth={auth} />
      
      <div className='flex flex-col md:flex-row'>
        <AdminSidebar />
        
        <div className='flex-1 p-3 md:p-6'>

          <div className='font-regular animate-fade-in-up'>
            {/* Breadcrumb */}
            <div className='bg-white p-2 md:p-3 text-[#6B6A6A] rounded-lg pl-3 md:pl-5 text-sm md:text-base'>
              <span className="cursor-default font-bold">Dashboard</span>  
            </div>
            
            {/* Page Header */}
            <div className='flex items-center justify-between mt-3 md:mt-4 mb-3 md:mb-6 pl-3 md:pl-5 py-4 md:py-7 bg-primary text-white p-3 md:p-4 rounded-lg shadow-md animate-fade-in-down'>
              <h1 className='text-xl md:text-2xl font-semibold'>Welcome Admin!</h1>
            </div>

            {/* Main Content: Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-fade-in-up">
              <Link href="/adminPermission" className="transition-all animate-fade-in-up animate-stagger-1">
                <div className="bg-white p-4 md:p-6 rounded-lg drop-shadow-lg hover-lift cursor-pointer">
                  <h3 className="text-base md:text-lg font-bold mb-1 md:mb-2 text-black">Permission</h3>
                  <p className="text-gray-600 text-sm md:text-base">Manage user permissions</p>
                </div>
              </Link>
              <Link href="/adminMasterlist" className="transition-all animate-fade-in-up animate-stagger-2">
                <div className="bg-white p-4 md:p-6 rounded-lg drop-shadow-lg hover-lift cursor-pointer">
                  <h3 className="text-base md:text-lg font-bold mb-1 md:mb-2 text-black">Master Lists</h3>
                  <p className="text-gray-600 text-sm md:text-base">View and manage all users</p>
                </div>
              </Link>
              <Link href="/adminAttendance" className="transition-all sm:col-span-2 lg:col-span-1 animate-fade-in-up animate-stagger-3">
                <div className="bg-white p-4 md:p-6 rounded-lg shadow drop-shadow-lg hover-lift cursor-pointer">
                  <h3 className="text-base md:text-lg font-bold mb-1 md:mb-2 text-black">Attendance</h3>
                  <p className="text-gray-600 text-sm md:text-base">Manage attendance records</p>
                </div>
              </Link>
            </div>

            {/* Top Cadets Per Semester Section */}
            <div className="bg-white p-4 md:p-6 rounded-lg mb-4 md:mb-6 shadow-lg mt-4 md:mt-6 animate-fade-in-up animate-stagger-4">
              <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-primary">Top Performing Cadets by Semester</h2>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
                  <p className="text-gray-500 text-sm md:text-base">Loading top cadets data...</p>
                </div>
              ) : error ? (
                <div className="text-center py-4">
                  <div className="text-amber-600 text-sm md:text-base mb-2 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <div className="font-medium">Grade Information Not Available</div>
                    <div className="text-sm mt-1">{error}</div>
                  </div>
                  <button 
                    onClick={() => window.location.reload()}
                    className="text-xs md:text-sm text-primary hover:text-primary-dark underline mt-2"
                  >
                    Try refreshing the page
                  </button>
                </div>
              ) : availableSemesters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {availableSemesters.map((semester, index) => {
                    const topCadet = topCadets[semester];
                    return (
                      <div key={semester} className={`bg-primary/20 p-4 rounded-lg border animate-scale-in animate-stagger-${index + 1}`}>
                        <div className="flex items-center mb-3">
                          <div className="bg-primary text-white px-2 py-1 rounded text-xs md:text-sm font-semibold mr-2">
                            {semester}
                          </div>
                          <h3 className="font-semibold text-sm md:text-base text-gray-800">Top Performer</h3>
                        </div>
                        
                        {topCadet ? (
                          <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm">
                            <h4 className="text-sm md:text-lg font-bold text-gray-800 mb-2">
                              {formatCadetName(topCadet)}
                            </h4>
                            <div className="space-y-1 text-xs md:text-sm text-gray-600 mb-3">
                              <p><span className="font-medium">Student ID:</span> {topCadet.student_number || 'N/A'}</p>
                              <p><span className="font-medium">Course:</span> {[topCadet.course, topCadet.year, topCadet.section].filter(Boolean).join(' ') || 'N/A'}</p>
                              <p><span className="font-medium">Campus:</span> {topCadet.campus || 'N/A'}</p>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs md:text-sm text-gray-500">Equivalent Grade:</span>
                              <span className="bg-primary text-white px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold">
                                {formatGrade(topCadet.equivalent_grade)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs md:text-sm text-gray-500">Final Grade:</span>
                              <span className="text-xs md:text-sm text-gray-600">
                                {topCadet.final_grade}%
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-3 md:p-4 rounded-lg text-center">
                            <p className="text-gray-500 text-xs md:text-sm">No grades available for this semester</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm md:text-base font-medium">No semester data available yet.</p>
                  <p className="text-xs md:text-sm text-gray-400 mt-1">Top performers will appear here once grades are calculated.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
        </>
    )
}