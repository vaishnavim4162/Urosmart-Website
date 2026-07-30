// performance_tests/scenarios/journeys.js
// Business journeys and E2E scenarios for UroSmart performance testing

import http from 'k6/http';
import { check, sleep } from 'k6';
import { 
    BASE_URL, 
    generateRandomEmail, 
    generateRandomPhone, 
    generateCaseNumber, 
    getHeaders, 
    getMockImageBytes 
} from '../utils/helpers.js';

// Custom metrics to track specific actions
import { Trend, Counter } from 'k6/metrics';
const uploadTime = new Trend('upload_time');
const analysisTime = new Trend('analysis_time');
const authFailures = new Counter('auth_failures');
const reportFailures = new Counter('report_failures');

/**
 * Registration & Login Journey
 * Registers a new user, validates duplicate check, logs in, and returns auth token + user details
 */
export function registerAndLogin() {
    const email = generateRandomEmail();
    const phone = generateRandomPhone();
    const password = 'TestPassword123!';

    // 1. Check Email
    let checkRes = http.post(
        `${BASE_URL}/auth/check-email.php`,
        JSON.stringify({ email: email }),
        { headers: getHeaders() }
    );
    check(checkRes, {
        'check-email status is 200': (r) => r.status === 200,
    });

    // 2. Signup
    let signupRes = http.post(
        `${BASE_URL}/auth/signup.php`,
        JSON.stringify({
            email: email,
            phone_number: phone,
            password: password
        }),
        { headers: getHeaders() }
    );
    
    const isSignupOk = check(signupRes, {
        'signup status is 201': (r) => r.status === 201,
        'signup response has token': (r) => {
            try {
                return JSON.parse(r.body).access_token !== undefined;
            } catch(e) {
                return false;
            }
        }
    });

    if (!isSignupOk) {
        authFailures.add(1);
        return null;
    }

    // 3. Login with newly created credentials
    let loginRes = http.post(
        `${BASE_URL}/auth/login.php`,
        JSON.stringify({
            email: email,
            password: password
        }),
        { headers: getHeaders() }
    );

    const isLoginOk = check(loginRes, {
        'login status is 200': (r) => r.status === 200,
        'login response has token': (r) => {
            try {
                return JSON.parse(r.body).access_token !== undefined;
            } catch(e) {
                return false;
            }
        }
    });

    if (!isLoginOk) {
        authFailures.add(1);
        return null;
    }

    try {
        const body = JSON.parse(loginRes.body);
        return {
            token: body.access_token,
            userId: body.user.id,
            email: email,
            password: password
        };
    } catch(e) {
        return null;
    }
}

/**
 * Dashboard & Reports Navigation Journey
 * Loads reports, applies filters, tests search and pagination
 */
export function viewDashboardAndReports(userSession) {
    if (!userSession) return;
    const token = userSession.token;

    // 1. Get reports list (Dashboard load)
    let reportsRes = http.get(
        `${BASE_URL}/reports/index.php`,
        { headers: getHeaders(token) }
    );
    check(reportsRes, {
        'get reports status is 200': (r) => r.status === 200,
    });

    // Simulate paging/filtering or searching
    // Let's filter reports by searching for a specific query
    let searchRes = http.get(
        `${BASE_URL}/reports/index.php?search=CASE`,
        { headers: getHeaders(token) }
    );
    check(searchRes, {
        'search reports status is 200': (r) => r.status === 200,
    });
}

/**
 * Upload & Analyze Journey
 * Simulates uploading a scan image, generating analysis results, creating the report, and downloading the PDF.
 */
export function uploadScanAndAnalyze(userSession) {
    if (!userSession) return;
    const token = userSession.token;

    // 1. Get Next Case Number (Optional check before upload)
    let caseRes = http.get(
        `${BASE_URL}/reports/next-case-number.php`,
        { headers: getHeaders(token) }
    );
    check(caseRes, {
        'get next case number status is 200': (r) => r.status === 200,
    });

    // 2. Upload Scan Image (multipart/form-data)
    const imgInfo = getMockImageBytes();
    
    // k6 multipart upload payload construction
    const data = {
        type: 'image',
        file: http.file(imgInfo.data, imgInfo.filename, imgInfo.content_type),
    };

    const startTime = Date.now();
    let uploadRes = http.post(
        `${BASE_URL}/files/upload.php`,
        data,
        { headers: { 'Authorization': `Bearer ${token}` } } // k6 automatically sets Content-Type for multipart
    );
    uploadTime.add(Date.now() - startTime);

    const isUploadOk = check(uploadRes, {
        'image upload status is 200': (r) => r.status === 200,
        'image upload returns filename': (r) => {
            try {
                return JSON.parse(r.body).filename !== undefined;
            } catch(e) {
                return false;
            }
        }
    });

    if (!isUploadOk) {
        reportFailures.add(1);
        return null;
    }

    let uploadedFilename;
    try {
        uploadedFilename = JSON.parse(uploadRes.body).filename;
    } catch(e) {
        return null;
    }

    // 3. Create Report (POST to reports index)
    const reportPayload = {
        case_number: generateCaseNumber(),
        yeast_present: Math.random() > 0.5,
        yeast_count: Math.floor(Math.random() * 50),
        yeast_confidence: Math.random(),
        triple_phosphate_present: Math.random() > 0.5,
        triple_phosphate_count: Math.floor(Math.random() * 50),
        triple_phosphate_confidence: Math.random(),
        calcium_oxalate_present: Math.random() > 0.5,
        calcium_oxalate_count: Math.floor(Math.random() * 50),
        calcium_oxalate_confidence: Math.random(),
        squamous_cells_present: Math.random() > 0.5,
        squamous_cells_count: Math.floor(Math.random() * 50),
        squamous_cells_confidence: Math.random(),
        uric_acid_present: Math.random() > 0.5,
        uric_acid_count: Math.floor(Math.random() * 50),
        uric_acid_confidence: Math.random(),
        image_paths: JSON.stringify([uploadedFilename])
    };

    let createRes = http.post(
        `${BASE_URL}/reports/index.php`,
        JSON.stringify(reportPayload),
        { headers: getHeaders(token) }
    );

    const isCreateOk = check(createRes, {
        'create report status is 201': (r) => r.status === 201,
        'create report returns id': (r) => {
            try {
                return JSON.parse(r.body).report.id !== undefined;
            } catch(e) {
                return false;
            }
        }
    });

    if (!isCreateOk) {
        reportFailures.add(1);
        return null;
    }

    let reportId;
    try {
        reportId = JSON.parse(createRes.body).report.id;
    } catch(e) {
        return null;
    }

    // 4. Download / View Report details
    let getReportRes = http.get(
        `${BASE_URL}/reports/index.php?id=${reportId}`,
        { headers: getHeaders(token) }
    );
    check(getReportRes, {
        'get report details status is 200': (r) => r.status === 200,
    });

    return {
        reportId: reportId,
        caseNumber: reportPayload.case_number
    };
}

/**
 * Submit Feedback Journey
 * Submits feedback for a completed report case
 */
export function submitFeedbackFlow(userSession, reportInfo) {
    if (!userSession || !reportInfo) return;
    const token = userSession.token;

    const feedbackPayload = {
        case_number: reportInfo.caseNumber,
        scan_clarity_rating: Math.floor(Math.random() * 5) + 1,
        scan_accuracy_rating: Math.floor(Math.random() * 5) + 1,
        ease_of_use_rating: Math.floor(Math.random() * 5) + 1,
        overall_satisfaction_rating: Math.floor(Math.random() * 5) + 1,
        comments: 'Automated performance test feedback comments.'
    };

    let feedbackRes = http.post(
        `${BASE_URL}/feedback/submit.php`,
        JSON.stringify(feedbackPayload),
        { headers: getHeaders(token) }
    );

    check(feedbackRes, {
        'submit feedback status is 201': (r) => r.status === 201,
        'feedback response success': (r) => {
            try {
                return JSON.parse(r.body).success === true;
            } catch(e) {
                return false;
            }
        }
    });
}

/**
 * Change Password Flow
 * Updates user password and validates token session integrity
 */
export function changePasswordFlow(userSession) {
    if (!userSession) return;
    const token = userSession.token;

    const changePayload = {
        current_password: userSession.password,
        new_password: 'NewTestPassword555!'
    };

    let changeRes = http.post(
        `${BASE_URL}/auth/change-password.php`,
        JSON.stringify(changePayload),
        { headers: getHeaders(token) }
    );

    check(changeRes, {
        'change password status is 200': (r) => r.status === 200
    });

    // Update the password in userSession for future requests
    if (changeRes.status === 200) {
        userSession.password = changePayload.new_password;
    }
}

/**
 * Cleanup / Delete Account Journey
 * Deletes user account and asserts cleanup
 */
export function cleanupAccount(userSession) {
    if (!userSession) return;
    const token = userSession.token;

    let deleteRes = http.post(
        `${BASE_URL}/auth/delete-account.php`,
        JSON.stringify({}),
        { headers: getHeaders(token) }
    );

    check(deleteRes, {
        'delete account status is 200': (r) => r.status === 200
    });
}
