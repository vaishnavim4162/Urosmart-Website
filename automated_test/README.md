# Automated DAST workflow

This directory contains a lightweight security test harness for the local API backend.

## Files
- `runner.py` - Main entry point that loads config from `input.json` and orchestrates the workflow.
- `discover.py` - Discovers API endpoints from the local codebase and writes a discovered list.
- `authn_authz.py` - Executes authN/authZ and basic injection probes using real HTTP requests.
- `savepoint.json` - Stores the last run state.
- `report.json` - Generated findings report.

## Usage
1. Create `input.json` with the shape:
   ```json
   {
     "baseUrl": "http://127.0.0.1/urosmatttt_backend/api",
     "user": "<token>",
     "admin": "<token>"
   }
   ```
2. Run:
   ```bash
   python automated_test/runner.py
   ```
