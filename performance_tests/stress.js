// performance_tests/stress.js
// Stress Performance Test: Pushes user load past expected peaks (up to 2000 VUs) to locate the breaking point of the servers.

import { options as defaultOptions } from './main.js';
import mainJourney from './main.js';

export const options = Object.assign({}, defaultOptions, {
    stages: [
        { duration: '2m', target: 200 },   // Ramp up to 200 VUs
        { duration: '3m', target: 200 },   // Hold at 200 VUs
        
        { duration: '2m', target: 500 },   // Ramp up to 500 VUs
        { duration: '3m', target: 500 },   // Hold at 500 VUs
        
        { duration: '2m', target: 1000 },  // Ramp up to 1000 VUs
        { duration: '3m', target: 1000 },  // Hold at 1000 VUs
        
        { duration: '3m', target: 2000 },  // Push load to 2000 VUs to find the breaking point
        { duration: '5m', target: 2000 },  // Keep under heavy stress
        
        { duration: '3m', target: 0 },     // Cool down to 0 VUs
    ],
});

export default mainJourney;
