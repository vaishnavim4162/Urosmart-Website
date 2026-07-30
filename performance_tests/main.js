// performance_tests/main.js
// Main entry point for k6 performance testing suite.
// Integrates user journeys, runs them based on traffic scenarios, and enforces SLAs.

import { sleep } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";
import { 
    registerAndLogin, 
    viewDashboardAndReports, 
    uploadScanAndAnalyze, 
    submitFeedbackFlow, 
    changePasswordFlow, 
    cleanupAccount 
} from './scenarios/journeys.js';

// Define thresholds to validate SLA (95% of requests under 2 seconds, error rate < 1%, availability > 99%)
export const options = {
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
        http_req_failed: ['rate<0.01'],    // Error rate must be less than 1%
        checks: ['rate>0.99'],             // Assertions/Checks must succeed > 99% of the time
    },
};

export default function () {
    // 1. Register & Login to get session
    const session = registerAndLogin();
    if (!session) {
        sleep(1);
        return;
    }

    // Dynamic Traffic Simulation Model (Browsers vs Uploaders vs Administrators)
    const roll = Math.random();

    if (roll < 0.30) {
        // Journey A: Guest/Basic Browser (30% of traffic)
        // just view dashboard and log out/finish
        viewDashboardAndReports(session);
        sleep(Math.random() * 3 + 1);

    } else if (roll < 0.70) {
        // Journey B: Full Scan & Diagnostic flow (40% of traffic)
        // view dashboard, upload a scan, view reports, submit feedback
        viewDashboardAndReports(session);
        sleep(1);

        const report = uploadScanAndAnalyze(session);
        if (report) {
            sleep(2);
            submitFeedbackFlow(session, report);
        }
        sleep(Math.random() * 5 + 2);

    } else if (roll < 0.90) {
        // Journey C: Profile Settings Modification (20% of traffic)
        // log in, change password, check dashboard
        viewDashboardAndReports(session);
        sleep(1);
        changePasswordFlow(session);
        sleep(Math.random() * 3 + 1);

    } else {
        // Journey D: Temporary User Session (10% of traffic)
        // runs complete workflow then deletes account to clean up database growth
        viewDashboardAndReports(session);
        const report = uploadScanAndAnalyze(session);
        if (report) {
            submitFeedbackFlow(session, report);
        }
        sleep(1);
        cleanupAccount(session);
        sleep(1);
    }
}

// Generate summary outputs in HTML, JSON and text formats
export function handleSummary(data) {
    return {
        "summary.html": htmlReport(data),
        "summary.json": JSON.stringify(data, null, 2),
        "stdout": textSummary(data, { indent: " ", enableColors: true }),
    };
}

