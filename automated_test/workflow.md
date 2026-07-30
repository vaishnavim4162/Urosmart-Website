# DAST workflow

1. Create or update automated_test/input.json with the target base URL and role tokens.
2. Run discovery:
   ```bash
   python automated_test/discover.py
   ```
3. Review the discovered endpoint list and confirm the scope.
4. Run the full workflow:
   ```bash
   python automated_test/runner.py
   ```
5. Review automated_test/report.json for findings.
6. If the backend is not reachable, start the backend first or update the base URL to a reachable host.

## Expected environment
- Python 3
- Network access to the target host
- A running PHP/MySQL backend if you want real HTTP responses

## Common failure mode
If the script reports connection errors such as `WinError 10061` or `Connection refused`, the target host is not reachable from the current environment.
