import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
            // Ensure Laravel searches the correct manifest path for Vite 6
            // Vite writes manifest under public/build/.vite/manifest.json
            buildDirectory: 'build/.vite',
        }),
        react(),
    ],
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
    build: {
        outDir: 'public/build',   // ✅ required for Laravel to find manifest.json
        manifest: true,           // ✅ generate manifest.json
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    // Vendor chunks - separate large libraries
                    if (id.includes('node_modules')) {
                        // React ecosystem
                        if (id.includes('react') || id.includes('react-dom') || id.includes('@inertiajs/react')) {
                            return 'react-vendor';
                        }
                        // Toast notifications
                        if (id.includes('react-toastify')) {
                            return 'toast-vendor';
                        }
                        // Icons
                        if (id.includes('react-icons')) {
                            return 'icons-vendor';
                        }
                        // Other large vendors
                        if (id.includes('@headlessui') || id.includes('@heroicons')) {
                            return 'ui-vendor';
                        }
                        // All other node_modules
                        return 'vendor';
                    }

                    // Application chunks - group by functionality
                    if (id.includes('/pages/')) {
                        // Admin pages
                        if (id.includes('/pages/admin/')) {
                            return 'admin-pages';
                        }
                        // User pages
                        if (id.includes('/pages/user/')) {
                            return 'user-pages';
                        }
                        // Faculty pages
                        if (id.includes('/pages/faculty/')) {
                            return 'faculty-pages';
                        }
                        // Auth pages
                        if (id.includes('/pages/auth/')) {
                            return 'auth-pages';
                        }
                        // Other pages
                        return 'misc-pages';
                    }

                    // Components
                    if (id.includes('/components/')) {
                        return 'components';
                    }
                }
            }
        }
    }
});
