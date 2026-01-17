// API Configuration
const API_BASE_URL = window.location.origin + '/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Children API
const childrenAPI = {
    getAll: (params = '') => apiCall(`/children${params}`),
    getById: (id) => apiCall(`/children/${id}`),
    create: (data) => apiCall('/children', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiCall(`/children/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiCall(`/children/${id}`, { method: 'DELETE' })
};

// Teachers API
const teachersAPI = {
    getAll: (params = '') => apiCall(`/teachers${params}`),
    getById: (id) => apiCall(`/teachers/${id}`),
    create: (data) => apiCall('/teachers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiCall(`/teachers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiCall(`/teachers/${id}`, { method: 'DELETE' })
};

// Sunday Records API
const sundayRecordsAPI = {
    getAll: (params = '') => apiCall(`/sunday-records${params}`),
    getById: (id) => apiCall(`/sunday-records/${id}`),
    create: (data) => apiCall('/sunday-records', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiCall(`/sunday-records/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiCall(`/sunday-records/${id}`, { method: 'DELETE' })
};

// Events API
const eventsAPI = {
    getAll: (params = '') => apiCall(`/events${params}`),
    getById: (id) => apiCall(`/events/${id}`),
    create: (data) => apiCall('/events', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiCall(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiCall(`/events/${id}`, { method: 'DELETE' })
};

// Reports API
const reportsAPI = {
    getDashboard: (params = '') => apiCall(`/reports/dashboard${params}`),
    getMonthlyAttendance: (params = '') => apiCall(`/reports/monthly-attendance${params}`),
    getChildHistory: (childId, params = '') => apiCall(`/reports/child/${childId}${params}`),
    getEventParticipation: (params = '') => apiCall(`/reports/events${params}`)
};

// Utility to build query strings
function buildQueryString(params) {
    const query = new URLSearchParams(params).toString();
    return query ? `?${query}` : '';
}

