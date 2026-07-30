// performance_tests/soak.js
// Soak (Endurance) Performance Test: Runs continuous moderate load (100 VUs) for 2 hours to capture memory/connection leaks.

import { options as defaultOptions } from './main.js';
import mainJourney from './main.js';

export const options = Object.assign({}, defaultOptions, {
    stages: [
        { duration: '5m', target: 100 },   // Warm up and ramp to 100 VUs
        { duration: '2h', target: 100 },   // Soak under continuous load for 2 hours
        { duration: '5m', target: 0 },     // Ramp down
    ],
});

export default mainJourney;
