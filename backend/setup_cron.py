#!/usr/bin/env python3
import os
import sys
import subprocess
import stat

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    training_script = os.path.join(script_dir, "run_training.py")
    
    print("=========================================")
    print("Federated Learning Cron Setup (Python)")
    print("=========================================")
    print("")

    # Check if run_training.py exists
    if not os.path.exists(training_script):
        print(f"❌ Error: run_training.py not found at {training_script}")
        sys.exit(1)

    # Make sure run_training.py is executable
    try:
        st = os.stat(training_script)
        os.chmod(training_script, st.st_mode | stat.S_IEXEC)
    except OSError as e:
        print(f"Warning: Could not make script executable: {e}")

    # Show current crontab
    print("Current crontab entries:")
    try:
        current_crontab = subprocess.run(["crontab", "-l"], capture_output=True, text=True)
        if current_crontab.returncode == 0 and current_crontab.stdout.strip():
            print(current_crontab.stdout)
        else:
            print("(No existing crontab)")
    except FileNotFoundError:
        print("(crontab command not found)")
    print("")

    # Menu
    print("Choose training frequency:")
    print("1) Every hour")
    print("2) Every 6 hours")
    print("3) Every 12 hours")
    print("4) Daily at 2 AM")
    print("5) Custom")
    print("")

    choice = input("Enter choice (1-5): ").strip()

    cron_schedule = ""
    description = ""

    if choice == '1':
        cron_schedule = "0 * * * *"
        description = "every hour"
    elif choice == '2':
        cron_schedule = "0 */6 * * *"
        description = "every 6 hours"
    elif choice == '3':
        cron_schedule = "0 */12 * * *"
        description = "every 12 hours"
    elif choice == '4':
        cron_schedule = "0 2 * * *"
        description = "daily at 2 AM"
    elif choice == '5':
        cron_schedule = input("Enter cron schedule (e.g., '0 */3 * * *'): ").strip()
        description = "custom schedule"
    else:
        print("❌ Invalid choice")
        sys.exit(1)

    # Construct the cron job line
    # accessing python executable
    python_exec = sys.executable
    cron_job = f"{cron_schedule} {python_exec} {training_script}"

    print("")
    print(f"Adding cron job: {description}")
    print(f"Schedule: {cron_schedule}")
    print(f"Command: {python_exec} {training_script}")
    print("")

    # Add to crontab
    try:
        # Get current crontab again to apppend
        proc = subprocess.run(["crontab", "-l"], capture_output=True, text=True)
        existing_cron = proc.stdout if proc.returncode == 0 else ""
        
        # Avoid duplicate empty lines or issues if empty
        new_cron_content = existing_cron.strip() + "\n" + cron_job + "\n"
        
        # Write back
        process = subprocess.Popen(['crontab', '-'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        stdout, stderr = process.communicate(input=new_cron_content)
        
        if process.returncode == 0:
            print("✅ Cron job added successfully!")
            print("")
            print("Updated crontab:")
            # Verify
            subprocess.run("crontab -l | grep -F 'run_training.py'", shell=True)
            print("")
            print(f"Training will run {description}")
            print(f"Logs will be saved to: {os.path.join(script_dir, 'logs')}")
        else:
            print("❌ Failed to add cron job")
            print(stderr)
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Failed to add cron job: {e}")
        sys.exit(1)

    # Test the script
    print("")
    test_choice = input("Do you want to run a test now? (y/n): ").strip().lower()
    if test_choice == 'y':
        print("Running test...")
        try:
            subprocess.run([python_exec, training_script], check=True)
            print("")
            print(f"Check the log file at: {os.path.join(script_dir, 'logs')}")
        except subprocess.CalledProcessError as e:
            print(f"❌ Test run failed: {e}")

if __name__ == "__main__":
    main()
