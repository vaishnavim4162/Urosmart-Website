const API_BASE = 'http://127.0.0.1/urosmatttt_backend/api';

async function apiRequest(endpoint, data) {
    try {
        const headers = {
            'Content-Type': 'application/json'
        };

        const token = localStorage.getItem('access_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}/${endpoint}`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Something went wrong');
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function apiUpload(endpoint, formData) {
    try {
        const headers = {};
        const token = localStorage.getItem('access_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}/${endpoint}`, {
            method: 'POST',
            headers: headers,
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Something went wrong');
        }

        return result;
    } catch (error) {
        console.error('Upload Error:', error);
        throw error;
    }
}
