#!/usr/bin/env python3
import json, sys, time, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEST_DIR = ROOT / 'automated_test'
INPUT_PATH = TEST_DIR / 'input.json'
REPORT_PATH = TEST_DIR / 'report.json'

PAYLOADS = ["' OR '1'='1", "\" OR \"1\"=\"1", "1; DROP TABLE users;--", "admin'--"]


def load_input():
    with INPUT_PATH.open('r', encoding='utf-8') as fh:
        return json.load(fh)


def request_json(method, url, payload=None):
    data = None
    headers = {}
    if payload is not None:
        data = json.dumps(payload).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=6) as resp:
            body = resp.read().decode('utf-8', errors='replace')
            return {'status': resp.status, 'body': body}
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='replace')
        return {'status': e.code, 'body': body}
    except Exception as e:
        return {'status': 0, 'body': str(e)}


def main():
    cfg = load_input()
    records = []
    for payload in PAYLOADS:
        res = request_json('POST', cfg['baseUrl'].rstrip('/') + '/auth/login', payload={'email': payload, 'password': payload})
        records.append({
            'endpoint': '/auth/login',
            'method': 'POST',
            'role': 'anonymous',
            'status': res['status'],
            'expected_status': 401,
            'finding': res['status'] in (200, 201, 500),
            'severity': 'medium' if res['status'] in (200, 201, 500) else 'info',
            'response_time_ms': 0,
            'test_category': 'injection',
            'note': 'Probe payload: ' + payload,
            'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        })
    if REPORT_PATH.exists():
        with REPORT_PATH.open('r', encoding='utf-8') as fh:
            existing = json.load(fh)
    else:
        existing = []
    existing.extend(records)
    with REPORT_PATH.open('w', encoding='utf-8') as fh:
        json.dump(existing, fh, indent=2)
    print(f'Wrote {len(records)} injection probe records to {REPORT_PATH}')

if __name__ == '__main__':
    main()
