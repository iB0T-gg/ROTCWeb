import { Link, useForm, router } from '@inertiajs/react';

export default function Login({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/login', {
            onSuccess: () => {
                // The server will handle the redirection
                // No need for client-side redirect checks
            },
            onError: (errors) => {
                // Handle errors if needed
                console.log(errors);
            }
        });
    };

    return (
        <div className='login-page relative mx-auto flex flex-col items-center justify-center h-screen font-poppins'>
            <div 
                className='absolute inset-0 z-0'
                style={{
                    backgroundImage: `url('/images/background.jpg')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    opacity: 0.5, 
                    backgroundColor: 'white',
                }}
            ></div>

            <div className='container mx-auto flex flex-col items-center justify-center h-full z-10 relative '>
                <div className='w-[30rem] bg-black bg-opacity-80 text-textColor p-8 rounded-2xl shadow-lg'>
                    <img src='/images/ROTClogo.png' alt='ROTC Logo' className='w-24 h-24 mx-auto mb-4' />
                    <h1 className='text-lg font-semibold mb-6 text-center'>Login to your Account</h1>
                    
                    {status && (
                        <div className="mb-4 font-medium text-sm text-green-600 bg-green-100 p-2 rounded">
                            {status}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className='space-y-4 font-regular'>
                        <div>
                            <label className='block text-sm mb-2 text-textColor font-regular' htmlFor='email'>Your email</label>
                            <input
                                type='email'
                                id='email'
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                                className='w-full p-2 rounded-lg bg-white text-black mb-2'
                                required
                            />
                            {errors.email && <div className="text-red-500 text-sm mb-2">{errors.email}</div>}
                            
                            <label className='block text-sm mb-2 text-textColor font-regular' htmlFor='password'>Your password</label>
                            <input
                                type='password'
                                id='password'
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                className='w-full p-2 rounded-lg bg-white text-black mb-2'
                                required
                            />
                            {errors.password && <div className="text-red-500 text-sm mb-2">{errors.password}</div>}
                        </div>
                        
                        <button 
                            type="submit"
                            disabled={processing}
                            className='w-full bg-primary text-textColor p-2 rounded-full hover:bg-opacity-80 transition duration-300 mt-4 disabled:opacity-50'
                        >
                            {processing ? 'Logging in...' : 'Login'}
                        </button>

                        <Link href='/forgotPassword' className='block text-center text-sm mt-4 text-textColor hover:underline'>
                            Forgot Password?
                        </Link>
                    </form>
                    
                    <div className='mt-4'>
                    </div>
                </div>
                <div className='w-[26rem] mt-6 space-y-3'>
                    <Link href='/register' className='block w-full'>
                        <button className='w-full bg-primary text-white p-2 rounded-full hover:bg-opacity-80 transition duration-300'>
                            Create an Account
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
