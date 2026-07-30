// performance_tests/post_process.js
// Parses Mochawesome output to generate JSON, CSV, JUnit XML, and formatted Excel reports, and prints GitHub Actions summaries.

const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const MOCHAWESOME_JSON = path.join(__dirname, '..', 'reports', 'performance', 'mochawesome.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'reports', 'performance');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function collectTests(suites, allTests = []) {
    for (const suite of suites) {
        if (suite.tests && suite.tests.length > 0) {
            for (const test of suite.tests) {
                allTests.push({
                    title: test.title,
                    fullTitle: test.fullTitle,
                    state: test.state || 'skipped',
                    duration: test.duration || 0,
                    err: test.err && test.err.message ? test.err.message : ''
                });
            }
        }
        if (suite.suites && suite.suites.length > 0) {
            collectTests(suite.suites, allTests);
        }
    }
    return allTests;
}

async function run() {
    console.log('[Post-Process] Parsing Mochawesome JSON results...');
    
    if (!fs.existsSync(MOCHAWESOME_JSON)) {
        console.error(`[Error] Mochawesome JSON report not found at: ${MOCHAWESOME_JSON}`);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(MOCHAWESOME_JSON, 'utf8'));
    const stats = data.stats;
    const allTests = collectTests(data.results);

    const total = stats.tests;
    const passed = stats.passes;
    const failed = stats.failures;
    const skipped = stats.skipped || (total - passed - failed);
    const durationSec = (stats.duration / 1000).toFixed(2);
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
    const score = successRate; // SRE Performance score based on pass rate

    console.log(`\n===================================`);
    console.log(`Performance Suite Execution Summary`);
    console.log(`===================================`);
    console.log(`Total Tests  : ${total}`);
    console.log(`Passed       : ${passed}`);
    console.log(`Failed       : ${failed}`);
    console.log(`Skipped      : ${skipped}`);
    console.log(`Success Rate : ${successRate}%`);
    console.log(`Duration     : ${durationSec}s`);
    console.log(`===================================\n`);

    // 1. Write Custom JSON Report
    const customJsonPath = path.join(OUTPUT_DIR, 'results.json');
    fs.writeFileSync(customJsonPath, JSON.stringify({
        summary: { total, passed, failed, skipped, durationSec, successRate, score },
        tests: allTests
    }, null, 2));
    console.log(`[JSON Report] Saved: ${customJsonPath}`);

    // 2. Write CSV Report
    const csvPath = path.join(OUTPUT_DIR, 'results.csv');
    const csvRows = [['Test Suite', 'Test Case', 'Status', 'Duration (ms)', 'Error']];
    for (const test of allTests) {
        // Split fullTitle to get suite & case
        const index = test.fullTitle.indexOf(test.title);
        const suite = index > 0 ? test.fullTitle.substring(0, index).trim() : '';
        csvRows.push([suite, test.title, test.state, test.duration, test.err]);
    }
    const csvContent = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    fs.writeFileSync(csvPath, csvContent);
    console.log(`[CSV Report] Saved: ${csvPath}`);

    // 3. Write JUnit XML Report
    const junitPath = path.join(OUTPUT_DIR, 'junit.xml');
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent += `<testsuites name="Performance Validation Suite" time="${durationSec}">\n`;
    xmlContent += `  <testsuite name="Performance SLA Checks" tests="${total}" failures="${failed}" skipped="${skipped}" timestamp="${new Date().toISOString()}">\n`;
    for (const test of allTests) {
        xmlContent += `    <testcase classname="${test.fullTitle.replace(/"/g, '&quot;')}" name="${test.title.replace(/"/g, '&quot;')}" time="${(test.duration / 1000).toFixed(3)}">\n`;
        if (test.state === 'failed') {
            xmlContent += `      <failure message="${test.err.replace(/"/g, '&quot;')}">${test.err}</failure>\n`;
        }
        xmlContent += '    </testcase>\n';
    }
    xmlContent += '  </testsuite>\n';
    xmlContent += '</testsuites>\n';
    fs.writeFileSync(junitPath, xmlContent);
    console.log(`[JUnit XML Report] Saved: ${junitPath}`);

    // 4. Write Styled Excel Report using ExcelJS
    const excelPath = path.join(OUTPUT_DIR, 'results.xlsx');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Performance Metrics');

    // Headers & Formatting
    sheet.columns = [
        { header: 'Test Suite', key: 'suite', width: 45 },
        { header: 'Test Case', key: 'case', width: 35 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Duration (ms)', key: 'duration', width: 18 },
        { header: 'Error Log / Message', key: 'error', width: 60 }
    ];

    // Style headers
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2F4F4F' } };

    for (const test of allTests) {
        const index = test.fullTitle.indexOf(test.title);
        const suite = index > 0 ? test.fullTitle.substring(0, index).trim() : '';
        const row = sheet.addRow({
            suite: suite,
            case: test.title,
            status: test.state.toUpperCase(),
            duration: test.duration,
            error: test.err
        });

        // Highlight cells based on Status
        const statusCell = row.getCell('status');
        if (test.state === 'passed') {
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'C6EFCE' } };
            statusCell.font = { color: { argb: '006100' }, bold: true };
        } else if (test.state === 'failed') {
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC7CE' } };
            statusCell.font = { color: { argb: '9C0006' }, bold: true };
        } else {
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEB9C' } };
            statusCell.font = { color: { argb: '9C6500' }, bold: true };
        }
    }

    // Add summary tab
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 20 }
    ];
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4682B4' } };

    summarySheet.addRow({ metric: 'Total Tests Run', value: total });
    summarySheet.addRow({ metric: 'Passed Validations', value: passed });
    summarySheet.addRow({ metric: 'Failed Validations', value: failed });
    summarySheet.addRow({ metric: 'Skipped Validations', value: skipped });
    summarySheet.addRow({ metric: 'Success Rate (%)', value: `${successRate}%` });
    summarySheet.addRow({ metric: 'Execution Score', value: `${score}/100` });
    summarySheet.addRow({ metric: 'Total Duration (s)', value: durationSec });

    await workbook.xlsx.writeFile(excelPath);
    console.log(`[Excel Report] Saved: ${excelPath}`);

    // 5. Output to GitHub Actions step summary if running in CI
    if (process.env.GITHUB_STEP_SUMMARY) {
        const mdSummary = `
# 🚀 UroSmart Performance Validation Summary

| Metric | Details |
|:---|:---|
| **Total Performance Tests** | **${total}** |
| **Passed** | <span style="color:green; font-weight:bold;">✅ ${passed}</span> |
| **Failed** | <span style="color:red; font-weight:bold;">❌ ${failed}</span> |
| **Skipped** | ⚠️ ${skipped} |
| **Success Rate** | **${successRate}%** |
| **Performance Score** | **${score}/100** |
| **Execution Time** | ${durationSec} seconds |

### 📂 Generated Artifact Reports
The following reports have been generated and uploaded to the workflow artifacts:
- 📊 \`summary.html\` (HTML Dashboard Report)
- 📝 \`results.json\` (Raw Data JSON)
- 📋 \`results.csv\` (Spreadsheet CSV)
- 📈 \`results.xlsx\` (Styled Excel Sheet)
- 🛡️ \`junit.xml\` (CI/CD JUnit XML Report)
`;
        fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, mdSummary);
        console.log('[GitHub Actions] Step summary appended.');
    }
}

run().catch(console.error);
