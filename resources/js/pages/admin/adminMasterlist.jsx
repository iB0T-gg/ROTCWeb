import Header from '../../components/header';
import AdminSidebar from '../../components/adminSidebar';
import { FaSearch } from 'react-icons/fa'
import { FaSort } from 'react-icons/fa6'
import { usePage } from '@inertiajs/react';

export default function AdminPermission(){
    const { auth } = usePage().props;
    
    return (
    <div className='w-full min-h-screen bg-backgroundColor'>
      <Header auth={auth} />
      
      <div className='flex'>
        <AdminSidebar  />
        
        <div className='flex-1 p-6'>
          <div className='font-regular'>
            <div className='bg-white p-3 text-[#6B6A6A] rounded-lg pl-5'>
                <span className='cursor-pointer'>Home</span>
                {">"}
                <span className='cursor-pointer'>Master Lists</span>
            </div>
            <div className='flex items-center justify-between mt-4 mb-6 pl-5 py-7 bg-primary text-white p-4 rounded-lg'>
                <h1 className='text-2xl font-semibold'>Master Lists</h1>
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
                    />
                  </div>
                  
                  <div className="relative">
                    <select className="bg-white border border-gray-300 rounded-lg p-2 pl-9 w-40 appearance-none">
                      <option value="">Company</option>
                    </select>
                    <FaSort className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select className="bg-white border border-gray-300 rounded-lg p-2 pl-9 w-40 appearance-none">
                      <option value="">Battalion</option>
                    </select>
                    <FaSort className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select className="bg-white border border-gray-300 rounded-lg p-2 pl-9 w-40 appearance-none">
                      <option value="">Platoon</option>
                    </select>
                    <FaSort className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              
              <div className='overflow-y-auto '>
                <table className='w-full border-collapse'>
                  <thead className='text-gray-600 '>
                    <tr className=''>
                      <th className='p-2 border-b font-medium text-left w-full'>Cadet Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className='hover:bg-gray-50'>
                      <td className='p-2 border-b w-full'>John Doe</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}