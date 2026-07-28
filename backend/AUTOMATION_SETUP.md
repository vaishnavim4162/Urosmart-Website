# Backend Training Automation Setup

Automate federated learning model training so gradients are aggregated periodically without manual intervention.

## Quick Setup (Recommended)

Run the interactive setup script:

```bash
cd /Users/sail/Desktop/urosmart-php-version2-main/backend_php
python3 setup_cron.py
```

This will guide you through:
1. Choosing training frequency
2. Adding the cron job
3. Testing the automation

## Manual Setup

### Option 1: Hourly Training

```bash
crontab -e
```

Add this line:
```
0 * * * * /usr/bin/python3 /Users/sail/Desktop/urosmart-php-version2-main/backend_php/run_training.py
```
*(Make sure to use the correct path to python3, verify with `which python3`)*

### Option 2: Every 6 Hours

```
0 */6 * * * /usr/bin/python3 /Users/sail/Desktop/urosmart-php-version2-main/backend_php/run_training.py
```

### Option 3: Daily at 2 AM

```
0 2 * * * /usr/bin/python3 /Users/sail/Desktop/urosmart-php-version2-main/backend_php/run_training.py
```

## Monitoring

### View Logs

```bash
# Today's log
cat logs/fl_training_$(date +%Y%m%d).log

# All logs
ls -lh logs/

# Watch live (if running)
tail -f logs/fl_training_$(date +%Y%m%d).log
```

### Check Cron Status

```bash
# List current cron jobs
crontab -l

# Check if cron is running (macOS)
sudo launchctl list | grep cron

# Check cron logs (macOS)
log show --predicate 'process == "cron"' --last 1h
```

## Removing Automation

```bash
# Edit crontab
crontab -e

# Delete the line containing run_training.py
# Or remove all cron jobs:
crontab -r
```

## Troubleshooting

### Cron job not running?

1. **Check cron service** (macOS):
   ```bash
   sudo launchctl list | grep cron
   ```

2. **Check permissions**:
   ```bash
   ls -l run_training.py
   # It should be executable if run directly, or readable if run via python3
   ```

3. **Test script manually**:
   ```bash
   python3 run_training.py
   cat logs/fl_training_$(date +%Y%m%d).log
   ```

### Python not found in cron?

Cron has a limited PATH. Update `run_training.py` with full Python path:

```bash
# Find Python path
which python3

# Use the full path in your crontab entry (as shown in Manual Setup)
```

## Production Deployment

1. **Use absolute paths** in scripts
2. **Set up monitoring** (email notifications on failures)
3. **Rotate logs** (already implemented - keeps 30 days)
4. **Run as dedicated user** (not root)

### Example: Email Notifications

Modify `run_training.py` or the crontab entry to capture output and mail it.

## Recommended Schedule

- **Development**: Every hour (test quickly)
- **Production**: Every 6-12 hours (balance between freshness and server load)
- **Low traffic**: Daily (sufficient if few users)

The current minimum client threshold is 1 update (see `server_train.py`), so training runs whenever ANY gradient is uploaded.
