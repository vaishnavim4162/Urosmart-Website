# UroSmart Performance & SRE Analysis Report
**Generated:** 2026-07-29T08:24:17.403Z
**Scenario:** BASELINE
**Target Endpoint:** http://127.0.0.1/urosmatttt_backend/api

## 📊 Core Performance Metrics
| Metric | SLA / Threshold | Actual Result | Status |
|--------|-----------------|---------------|--------|
| **Total VUs** | N/A | 5 VUs | OK |
| **Total Requests** | N/A | 12450 | OK |
| **Throughput** | N/A | 12.50 req/sec | OK |
| **Avg Response Time** | N/A | 154.20 ms | OK |
| **95th Percentile** | < 2000 ms | 185.00 ms | ✅ PASSED |
| **99th Percentile** | N/A | 295.40 ms | OK |
| **Min/Max Response Time** | N/A | 45.10 / 1205.20 ms | OK |
| **Error Rate** | < 1.0% | 0.20% | ✅ PASSED |

## 🛢️ Database SRE Metrics
| Metric | Value during run | Analysis / Details |
|--------|------------------|--------------------|
| **Total Queries Executed** | 26000 | Total DB operations processed |
| **Peak Active Connections** | 45 | Max threads connected concurrently |
| **Slow Queries Detected** | 1 | Queries taking longer than long_query_time |
| **Table Lock Contentions** | 1 | Table lock delays triggered |
| **InnoDB Row Lock Wait Time** | 30 ms | Total time threads spent waiting for locks |

## 🚨 SRE Recommendations & Observations
- **SLOW QUERIES:** 1 slow queries were recorded. Verify that indexes are present on `users(email)`, `users(phone_number)` and `medical_reports(user_id)`.
- **LOCK CONTENTION:** Table lock waits were detected. Consider migrating tables from MyISAM to InnoDB to enable row-level locking.
- **SYSTEM HEALTHY:** All performance thresholds and SLAs are fully satisfied. The system behaves predictably under current load.

