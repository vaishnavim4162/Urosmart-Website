#!/usr/bin/env python3
import json, sys, time, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEST_DIR = ROOT / 'automated_test'
INPUT_PATH = TEST_DIR / 'input.json'
REPORT_PATH = TEST_DIR / 'report.json'


def load_input():
    with INPUT_PATH.open('r', encoding='utf-8') as fh:
        return json.load(fh)


def request_json(url):
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, timeout=4) as resp:
            return {'status': resp.status, 'body': resp.read().decode('utf-8', errors='replace')}
    except urllib.error.HTTPError as e:
        return {'status': e.code, 'body': e.read().decode('utf-8', errors='replace')}
    except Exception as e:
        return {'status': 0, 'body': str(e)}


def main():
    cfg = load_input()
    records = []
    for i in range(30):
        res = request_json(cfg['baseUrl'].rstrip('/') + '/db_monitor')
        records.append({
            'endpoint': '/db_monitor',
            'method': 'GET',
            'role': 'anonymous',
            'status': res['status'],
            'expected_status': 200,
            'finding': res['status'] in (429, 403),
            'severity': 'medium' if res['status'] in (429, 403) else 'info',
            'response_time_ms': 0,
            'test_category': 'rate_limit',
            'note': f'Burst request {i+1}/30',
            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        })
        time.sleep(0.1)
    if REPORT_PATH.exists():
        with REPORT_PATH.open('r', encoding='utf-8') as fh:
            existing = json.load(fh)
    else:
        existing = []
    existing.extend(records)
    with REPORT_PATH.open('w', encoding='utf-8') as fh:
        json.dump(existing, fh, indent=2)
    print(f'Wrote {len(records)} rate-limit probe records to {REPORT_PATH}')

if __name__ == '__main__':
    main()
