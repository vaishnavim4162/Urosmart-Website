// performance_tests/scalability.js
// Scalability Performance Test: Verifies if system throughput (RPS) scales linearly with Virtual User growth.

import { options as defaultOptions } from './main.js';
import mainJourney from './main.js';

export const options = Object.assign({}, defaultOptions, {
    stages: [
        { duration: '2m', target: 50 },    // Step 1: 50 VUs
        { duration: '2m', target: 100 },   // Step 2: 100 VUs
        { duration: '2m', target: 200 },   // Step 3: 200 VUs
        { duration: '2m', target: 400 },   // Step 4: 400 VUs
        { duration: '2m', target: 800 },   // Step 5: 800 VUs
        { duration: '2m', target: 0 },     // Cool down
    ],
});

export default mainJourney;
export { mainJourney };
