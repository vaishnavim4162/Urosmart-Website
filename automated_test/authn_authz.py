#!/usr/bin/env python3
import json, os, sys, time, urllib.request, urllib.error, ssl
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEST_DIR = ROOT / 'automated_test'
INPUT_PATH = TEST_DIR / 'input.json'
SAVEPOINT_PATH = TEST_DIR / 'savepoint.json'
REPORT_PATH = TEST_DIR / 'report.json'


def load_input():
    if not INPUT_PATH.exists():
        print('Missing input.json; create it with baseUrl and role tokens before running.')
        return None
    with INPUT_PATH.open('r', encoding='utf-8') as fh:
        return json.load(fh)


def load_savepoint():
    if not SAVEPOINT_PATH.exists():
        return {'endpoints': []}
    with SAVEPOINT_PATH.open('r', encoding='utf-8') as fh:
        return json.load(fh)


def request_json(method, url, token=None, payload=None):
    data = None
    headers = {}
    if payload is not None:
        data = json.dumps(payload).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    if token:
        headers['Authorization'] = f'Bearer {token}'
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            body = resp.read().decode('utf-8', errors='replace')
            return {'status': resp.status, 'body': body, 'error': None}
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', errors='replace')
        return {'status': e.code, 'body': body, 'error': None}
    except Exception as e:
        return {'status': 0, 'body': str(e), 'error': str(e)}


def build_records(cfg, endpoints):
    records = []
    roles = [name for name in ['user', 'admin'] if cfg.get(name)]
    if not roles:
        roles = ['anonymous']
    for ep in endpoints:
        method = ep['method']
        path = ep['path']
        for role in roles:
            token = cfg.get(role) if role != 'anonymous' else None
            url = cfg['baseUrl'].rstrip('/') + path
            result = request_json(method, url, token=token)
            record = {
                'endpoint': path,
                'method': method,
                'role': role,
                'status': result['status'],
                'expected_status': 401 if role == 'anonymous' else 200,
                'finding': result['status'] < 400 and role == 'anonymous',
                'severity': 'high' if result['status'] < 400 and role == 'anonymous' else 'info',
                'response_time_ms': 0,
                'test_category': 'authn_authz',
                'note': result['body'][:400],
                'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
            }
            records.append(record)
    return records


def main():
    cfg = load_input()
    if cfg is None:
        sys.exit(1)
    savepoint = load_savepoint()
    endpoints = savepoint.get('endpoints', [])
    if not endpoints:
        print('No endpoints discovered. Run discover.py first.')
        sys.exit(1)

    print('Running authN/authZ probes against discovered endpoints...')
    records = build_records(cfg, endpoints)
    with REPORT_PATH.open('w', encoding='utf-8') as fh:
        json.dump(records, fh, indent=2)
    print(f'Wrote {len(records)} test records to {REPORT_PATH}')
    print('This is a lightweight probe; review the generated report and rerun with real tokens if the backend is available.')

if __name__ == '__main__':
    main()
