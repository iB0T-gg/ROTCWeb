import './bootstrap';
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoadingPage from './components/LoadingPage';
import { useState, useEffect } from 'react';

// App wrapper component with loading state
function AppWrapper({ App, props }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show loading for 2.5 seconds to allow users to see the logo and branding
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <>
      <App {...props} />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
}

createInertiaApp({
  resolve: name => {
    const pages = import.meta.glob('./pages/**/*.jsx')
    return pages[`./pages/${name}.jsx`]()
  },
  setup({ el, App, props }) {
    const root = createRoot(el);
    root.render(<AppWrapper App={App} props={props} />);
  },
})