import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Set up CSRF token automatically for all axios requests
const token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
} else {
    console.error('CSRF token not found in meta tag.');
}

// Function to refresh CSRF token
const refreshCSRFToken = async () => {
    try {
        const response = await fetch('/csrf-token', {
            method: 'GET',
            credentials: 'same-origin'
        });
        const data = await response.json();
        if (data.csrf_token) {
            // Update meta tag
            const metaTag = document.head.querySelector('meta[name="csrf-token"]');
            if (metaTag) {
                metaTag.content = data.csrf_token;
            }
            // Update axios default
            window.axios.defaults.headers.common['X-CSRF-TOKEN'] = data.csrf_token;
            return data.csrf_token;
        }
    } catch (error) {
        console.error('Failed to refresh CSRF token:', error);
    }
    return null;
};

// Add a request interceptor to refresh CSRF token on each request
window.axios.interceptors.request.use(function (config) {
    const token = document.head.querySelector('meta[name="csrf-token"]');
    if (token) {
        config.headers['X-CSRF-TOKEN'] = token.content;
    }
    return config;
}, function (error) {
    return Promise.reject(error);
});

// Add a response interceptor to handle 419 CSRF errors globally
window.axios.interceptors.response.use(
    function (response) {
        return response;
    },
    async function (error) {
        if (error.response && error.response.status === 419) {
            console.log('CSRF token expired, attempting to refresh...');
            const newToken = await refreshCSRFToken();
            if (newToken && error.config) {
                // Retry the original request with new token
                error.config.headers['X-CSRF-TOKEN'] = newToken;
                return window.axios.request(error.config);
            } else {
                console.error('Failed to refresh CSRF token, redirecting to login');
                window.location.href = '/';
            }
        }
        return Promise.reject(error);
    }
);
