// performance_tests/load.js
// Load Performance Test: Simulates typical and peak user loads (50, 100, 250, 500, 1000 VUs) ramping up gradually.

import { options as defaultOptions } from './main.js';
import mainJourney from './main.js';

export const options = Object.assign({}, defaultOptions, {
    stages: [
        { duration: '1m', target: 50 },    // Ramp up to 50 VUs
        { duration: '2m', target: 50 },    // Hold at 50 VUs
        
        { duration: '1m', target: 100 },   // Ramp up to 100 VUs
        { duration: '2m', target: 100 },   // Hold at 100 VUs
        
        { duration: '2m', target: 250 },   // Ramp up to 250 VUs
        { duration: '3m', target: 250 },   // Hold at 250 VUs
        
        { duration: '2m', target: 500 },   // Ramp up to 500 VUs
        { duration: '3m', target: 500 },   // Hold at 500 VUs
        
        { duration: '2m', target: 1000 },  // Ramp up to 1000 VUs
        { duration: '5m', target: 1000 },  // Hold at 1000 VUs
        
        { duration: '2m', target: 0 },     // Ramp down to 0 VUs (cool down)
    ],
});

export default mainJourney;
