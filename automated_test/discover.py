#!/usr/bin/env python3
import json, os, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / 'backend'
TEST_DIR = ROOT / 'automated_test'
INPUT_PATH = TEST_DIR / 'input.json'
SAVEPOINT_PATH = TEST_DIR / 'savepoint.json'


def load_input():
    if not INPUT_PATH.exists():
        print('Missing input.json; create it with baseUrl and role tokens before running.')
        return None
    with INPUT_PATH.open('r', encoding='utf-8') as fh:
        return json.load(fh)


def discover_endpoints():
    routes = []
    for path in BACKEND.rglob('*.php'):
        if path.parts[-2:] == ('api', 'db_monitor.php'):
            pass
        text = path.read_text(encoding='utf-8', errors='ignore')
        if 'authenticate($pdo)' in text or 'REQUEST_METHOD' in text or 'header(' in text:
            rel = path.relative_to(BACKEND).as_posix()
            # infer route path from file location
            if rel.startswith('api/'):
                rel = rel[len('api/'):]
            # convert file path to URL path
            parts = rel.split('/')
            if parts[-1] == 'login.php':
                method = 'POST'
                route = '/auth/login'
            elif parts[-1] == 'signup.php':
                method = 'POST'
                route = '/auth/signup'
            elif parts[-1] == 'change-password.php':
                method = 'POST'
                route = '/auth/change-password'
            elif parts[-1] == 'check-email.php':
                method = 'POST'
                route = '/auth/check-email'
            elif parts[-1] == 'reset-password-email.php':
                method = 'POST'
                route = '/auth/reset-password-email'
            elif parts[-1] == 'delete-account.php':
                method = 'POST'
                route = '/auth/delete-account'
            elif parts[-1] == 'submit.php' and parts[-2] == 'feedback':
                method = 'POST'
                route = '/feedback/submit'
            elif parts[-1] == 'feedback.php':
                method = 'POST'
                route = '/feedback'
            elif parts[-1] == 'upload.php' and parts[-2] == 'files':
                method = 'POST'
                route = '/files/upload'
            elif parts[-1] == 'download.php' and parts[-2] == 'files':
                method = 'GET'
                route = '/files/download'
            elif parts[-1] == 'download_report.php' and parts[-2] == 'files':
                method = 'GET'
                route = '/files/reports/{file}'
            elif parts[-1] == 'index.php' and parts[-2] == 'reports':
                methods = ['GET', 'POST']
                route = '/reports'
            elif parts[-1] == 'analyze.php' and parts[-2] == 'reports':
                method = 'POST'
                route = '/reports/analyze'
            elif parts[-1] == 'clear.php' and parts[-2] == 'reports':
                method = 'POST'
                route = '/reports/clear'
            elif parts[-1] == 'delete.php' and parts[-2] == 'reports':
                method = 'POST'
                route = '/reports/delete'
            elif parts[-1] == 'next-case-number.php' and parts[-2] == 'reports':
                method = 'GET'
                route = '/reports/next-case-number'
            elif parts[-1] == 'db_monitor.php':
                method = 'GET'
                route = '/db_monitor'
            else:
                continue
            routes.append({'method': method, 'path': route, 'source': rel})
    # dedupe while preserving order
    seen = set()
    out = []
    for item in routes:
        key = (item['method'], item['path'])
        if key not in seen:
            seen.add(key)
            out.append(item)
    return out


def main():
    cfg = load_input()
    if cfg is None:
        sys.exit(1)
    endpoints = discover_endpoints()
    print('Discovered endpoints (public/protected):')
    for item in endpoints:
        print(f"- {item['method']} {item['path']}   ({item['source']})")
    print(f'Count: {len(endpoints)}')
    savepoint = {'baseUrl': cfg.get('baseUrl'), 'endpoints': endpoints}
    with SAVEPOINT_PATH.open('w', encoding='utf-8') as fh:
        json.dump(savepoint, fh, indent=2)
    print('\nEndpoint discovery complete. Review the list above before running the probes.')

if __name__ == '__main__':
    main()
