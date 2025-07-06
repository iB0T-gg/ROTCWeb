import Header from '../../components/header';
import AdminSidebar from '../../components/adminSidebar';

export default function Issue() {
    return (
        <div className='w-full min-h-screen bg-backgroundColor'>
          <Header />
          
          <div className='flex'>
            <AdminSidebar  />
            
            <div className='flex-1 p-6'>
              <div className='font-regular'>
                <div className='bg-white p-3 text-[#6B6A6A] rounded-lg pl-5'>
                    <span className='cursor-pointer'>Home</span>
                    {">"}
                    <span className='cursor-pointer'>Issues</span>
                </div>
                <div className='flex items-center justify-between mt-4 mb-6 pl-5 py-7 bg-primary text-white p-4 rounded-lg'>
                    <h1 className='text-2xl font-semibold'>Issues</h1>
                </div>

              </div>
            </div>
          </div>
        </div>
      )
}