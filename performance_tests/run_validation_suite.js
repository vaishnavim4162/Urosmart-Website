// performance_tests/run_validation_suite.js
// Master test runner for the Performance Validation Suite.
// Ensures reports are always generated, even if individual tests fail, then exits with the correct status code.

const { spawnSync } = require('child_process');
const path = require('path');

console.log('==================================================');
console.log('Starting UroSmart Performance Validation Runner');
console.log('==================================================\n');

// Run Mocha test suite programmatically using spawnSync to stream output
const mochaRun = spawnSync('npx', [
    'mocha',
    'test/performance.spec.js',
    '--reporter', 'mochawesome',
    '--reporter-options', 'reportDir=reports/performance,reportFilename=mochawesome',
    '--timeout', '120000',
    '--exit'
], { stdio: 'inherit', shell: true });

console.log('\n[Runner] Test run complete. Starting SRE report generation compiler...');

// Always run post-process to compile CSV, Excel, JUnit XML, and GitHub summaries
try {
    const postProcess = spawnSync('node', [path.join(__dirname, 'post_process.js')], { stdio: 'inherit' });
    if (postProcess.status === 0) {
        console.log('[Runner] All report assets generated successfully.');
    } else {
        console.error('[Error] SRE report compiler exited with status:', postProcess.status);
    }
} catch (e) {
    console.error('[Error] SRE report compiler execution failed:', e);
}

// Exit with Mocha's status code so that CI can block builds if SLAs are violated
process.exit(mochaRun.status === null ? 1 : mochaRun.status);
