// performance_tests/baseline.js
// Baseline Performance Test: Establishes a performance benchmark under minimal load.

import { options as defaultOptions } from './main.js';
import mainJourney from './main.js';

export const options = Object.assign({}, defaultOptions, {
    stages: [
        { duration: '30s', target: 5 }, // Warm up and ramp to 5 VUs
        { duration: '1m', target: 5 },  // Hold constant at 5 VUs
        { duration: '30s', target: 0 }, // Cool down to 0 VUs
    ],
});

export default mainJourney;
