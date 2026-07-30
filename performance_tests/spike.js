// performance_tests/spike.js
// Spike Performance Test: Simulates sudden surges in traffic (20 -> 200 -> 800 -> 20 VUs) to test recovery rates and autoscaling.

import { options as defaultOptions } from './main.js';
import mainJourney from './main.js';

export const options = Object.assign({}, defaultOptions, {
    stages: [
        { duration: '1m', target: 20 },    // Normal background load (20 VUs)
        
        { duration: '30s', target: 200 },  // Sudden spike to 200 VUs
        { duration: '2m', target: 200 },   // Hold spike
        
        { duration: '30s', target: 800 },  // Sudden spike to 800 VUs
        { duration: '2m', target: 800 },   // Hold extreme spike
        
        { duration: '30s', target: 20 },   // Fast scale down back to 20 VUs
        { duration: '3m', target: 20 },    // Monitor recovery time
        
        { duration: '30s', target: 0 },    // Cool down
    ],
});

export default mainJourney;
