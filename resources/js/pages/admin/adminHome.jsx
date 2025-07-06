import Header from '../../components/header';
import AdminSidebar from '../../components/adminSidebar';
import { usePage, Link } from '@inertiajs/react';

export default function AdminHome(){
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
            </div>
            <div className='flex items-center justify-between mt-4 mb-6 pl-5 py-7 bg-primary text-white p-4 rounded-lg'>
                <h1 className='text-2xl font-semibold'>Welcome Admin!</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/adminPermission" className="transition-all">
                <div className="bg-white p-6 rounded-lg drop-shadow-lg hover:scale-105 transition-shadow duration-300 cursor-pointer">
                  <h3 className="text-lg font-bold mb-2 text-black">Permission</h3>
                </div>
              </Link>
              <Link href="/adminMasterlist" className="transition-all">
                <div className="bg-white p-6 rounded-lg drop-shadow-lg hover:scale-105 transition-shadow duration-300 cursor-pointer">
                  <h3 className="text-lg font-bold mb-2 text-black">Master Lists</h3>
                </div>
              </Link>
              <Link href="/adminAttendance" className="transition-all">
                <div className="bg-white p-6 rounded-lg shadow drop-shadow-lg hover:scale-105 transition-shadow duration-300 cursor-pointer">
                  <h3 className="text-lg font-bold mb-2 text-black">Attendance</h3>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}