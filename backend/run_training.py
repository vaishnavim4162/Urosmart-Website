#!/usr/bin/env python3
import os
import sys
import subprocess
import datetime
import time
from pathlib import Path

def main():
    # Setup directories
    script_dir = Path(__file__).resolve().parent
    log_dir = script_dir / "logs"
    log_file = log_dir / f"fl_training_{datetime.datetime.now().strftime('%Y%m%d')}.log"
    
    # Create logs directory if it doesn't exist
    log_dir.mkdir(exist_ok=True)
    
    # Open log file
    with open(log_file, "a") as f:
        # Log start time
        f.write("========================================\n")
        f.write(f"FL Training started at {datetime.datetime.now()}\n")
        f.write("========================================\n")
        f.flush()
        
        # Change to script directory
        os.chdir(script_dir)
        
        # Run the training script and capture output
        # We use sys.executable to ensure we use the same python interpreter
        server_train_script = "server_train.py"
        
        if not os.path.exists(server_train_script):
            f.write(f"Error: {server_train_script} not found in {script_dir}\n")
            print(f"Error: {server_train_script} not found in {script_dir}")
            return

        try:
            # Running the command and redirecting output to the log file
            subprocess.run(
                [sys.executable, server_train_script],
                stdout=f,
                stderr=subprocess.STDOUT,
                check=False # We don't want to crash this script if the training fails, just log it
            )
        except Exception as e:
            f.write(f"Error running training script: {e}\n")

        # Log completion
        f.write(f"Completed at {datetime.datetime.now()}\n")
        f.write("\n")
    
    # Optional: Keep only last 30 days of logs
    cleanup_logs(log_dir)

def cleanup_logs(log_dir):
    try:
        current_time = time.time()
        thirty_days_ago = current_time - (30 * 24 * 60 * 60)
        
        for log_file in log_dir.glob("fl_training_*.log"):
            if log_file.stat().st_mtime < thirty_days_ago:
                try:
                    log_file.unlink()
                    # We usually don't log the cleanup itself to the log we just closed or might be deleting,
                    # but if we wanted to debug this we could print to console
                except OSError:
                    pass
    except Exception:
        pass

if __name__ == "__main__":
    main()
