#!/usr/bin/env python3
import json, os, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILES = [ROOT / 'backend', ROOT / 'frontend', ROOT / '.github']

PATTERNS = [
    re.compile(r'AKIA[0-9A-Z]{16}'),
    re.compile(r'AIza[0-9A-Za-z\-_]{35}'),
    re.compile(r'ghp_[A-Za-z0-9]{36}'),
    re.compile(r'password\s*[:=]\s*[\"\'][^\"\']{3,}'),
    re.compile(r'api[_-]?key\s*[:=]\s*[\"\'][^\"\']{3,}')
]


def scan(path):
    findings = []
    for file_path in path.rglob('*'):
        if not file_path.is_file():
            continue
        if file_path.name.endswith(('.png', '.jpg', '.jpeg', '.gif', '.pdf', '.ttf', '.woff', '.woff2', '.ico', '.svg')):
            continue
        try:
            text = file_path.read_text(encoding='utf-8', errors='ignore')
        except Exception:
            continue
        for pattern in PATTERNS:
            for match in pattern.finditer(text):
                findings.append({
                    'file': str(file_path.relative_to(ROOT)),
                    'match': match.group(0)[:120]
                })
    return findings


def main():
    results = []
    for folder in FILES:
        if folder.exists():
            results.extend(scan(folder))
    out_path = ROOT / 'automated_test' / 'secrets_report.json'
    out_path.write_text(json.dumps(results, indent=2), encoding='utf-8')
    print(f'Wrote {len(results)} potential secret findings to {out_path}')

if __name__ == '__main__':
    main()
