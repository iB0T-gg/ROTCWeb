import './bootstrap';
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'


const pages = import.meta.glob('./pages/**/*.{jsx,tsx}', { eager: true });

createInertiaApp({
  resolve: name => {
    // Try .tsx first, then .jsx
    return pages[`./pages/${name}.tsx`] || pages[`./pages/${name}.jsx`];
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />);
  },
});