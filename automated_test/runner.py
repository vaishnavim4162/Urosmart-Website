#!/usr/bin/env python3
import json, os, subprocess, sys, time
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


def write_json(path, data):
    path.write_text(json.dumps(data, indent=2), encoding='utf-8')


def ensure_files():
    for name in ['discover.py', 'authn_authz.py']:
        if not (TEST_DIR / name).exists():
            raise FileNotFoundError(f'Missing helper script: {name}')


def main():
    print('Setup: creating automation assets under automated_test/')
    cfg = load_input()
    if cfg is None:
        sys.exit(1)

    ensure_files()
    print('Base URL from input.json:', cfg.get('baseUrl'))
    print('Discovered endpoints will be printed first; then auth and injection probes will run.\n')

    subprocess.run([sys.executable, str(TEST_DIR / 'discover.py')], check=True)
    subprocess.run([sys.executable, str(TEST_DIR / 'authn_authz.py')], check=True)

    if REPORT_PATH.exists():
        with REPORT_PATH.open('r', encoding='utf-8') as fh:
            report = json.load(fh)
        print(f'\nReport written to {REPORT_PATH}')
        print(f'Test records: {len(report)}')
    else:
        print('Report file was not generated.')

if __name__ == '__main__':
    main()
