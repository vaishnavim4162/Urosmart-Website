// performance_tests/utils/helpers.js
// Reusable utilities and helper functions for k6 load testing

export const BASE_URL = __ENV.API_URL || 'http://127.0.0.1/urosmatttt_backend/api';

/**
 * Generates a random email address with @gmail.com suffix
 */
export function generateRandomEmail() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let localPart = '';
    for (let i = 0; i < 10; i++) {
        localPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${localPart}@gmail.com`;
}

/**
 * Generates a random 10-digit phone number
 */
export function generateRandomPhone() {
    let phone = '';
    for (let i = 0; i < 10; i++) {
        // First digit is 6, 7, 8, or 9
        if (i === 0) {
            phone += Math.floor(Math.random() * 4) + 6;
        } else {
            phone += Math.floor(Math.random() * 10);
        }
    }
    return phone;
}

/**
 * Generates a case number like CASE-XXXXX
 */
export function generateCaseNumber() {
    const num = Math.floor(Math.random() * 90000) + 10000;
    return `CASE-${num}`;
}

/**
 * Generates standard JSON headers with optional authorization token
 */
export function getHeaders(token = null) {
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

/**
 * Returns a 1x1 transparent PNG data block as a ByteArray for k6 file uploads
 */
export function getMockImageBytes() {
    // Base64 for 1x1 transparent pixel GIF/PNG
    const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    return {
        data: base64Data,
        filename: 'scan_image.png',
        content_type: 'image/png'
    };
}
