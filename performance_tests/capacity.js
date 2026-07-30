// performance_tests/capacity.js
// Capacity Performance Test: Determines maximum stable concurrent users and request volumes under SLA constraints.

import { options as defaultOptions } from './main.js';
import mainJourney from './main.js';

export const options = Object.assign({}, defaultOptions, {
    stages: [
        { duration: '3m', target: 150 },   // Step 1: 150 VUs
        { duration: '3m', target: 150 },   // Hold Step 1
        
        { duration: '3m', target: 300 },   // Step 2: 300 VUs
        { duration: '3m', target: 300 },   // Hold Step 2
        
        { duration: '3m', target: 600 },   // Step 3: 600 VUs
        { duration: '3m', target: 600 },   // Hold Step 3
        
        { duration: '3m', target: 1200 },  // Step 4: 1200 VUs
        { duration: '3m', target: 1200 },  // Hold Step 4
        
        { duration: '2m', target: 0 },     // Cool down
    ],
});

export default mainJourney;
