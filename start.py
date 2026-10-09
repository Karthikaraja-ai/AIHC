import subprocess
import sys
import os
import time
import threading
import webbrowser

# Project paths
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_DIR = os.path.join(ROOT_DIR, "frontend")

def stream_logs(proc, prefix, color_code):
    reset_code = "\033[0m"
    for line in iter(proc.stdout.readline, ""):
        if line:
            print(f"{color_code}[{prefix}]{reset_code} {line.rstrip()}")
    proc.stdout.close()

def check_dependencies():
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    python_cmd = sys.executable

    # Check frontend node_modules
    frontend_nm = os.path.join(FRONTEND_DIR, "node_modules")
    if not os.path.exists(frontend_nm):
        print("[i] First-time setup detected: Installing frontend packages (npm install)...")
        try:
            subprocess.run([npm_cmd, "install"], cwd=FRONTEND_DIR, check=True)
            print("[✓] Frontend packages installed successfully.\n")
        except Exception as e:
            print(f"[X] Note on npm install: {e}")
            print("    If needed, run 'npm install' inside the frontend/ folder.\n")

    # Check backend fastapi
    try:
        import fastapi
        import uvicorn
    except ImportError:
        print("[i] First-time setup detected: Installing backend packages (pip install -r requirements.txt)...")
        req_file = os.path.join(BACKEND_DIR, "requirements.txt")
        try:
            subprocess.run([python_cmd, "-m", "pip", "install", "-r", req_file], check=True)
            print("[✓] Backend dependencies installed successfully.\n")
        except Exception as e:
            print(f"[X] Note on pip install: {e}")
            print("    If needed, run 'pip install -r backend/requirements.txt'.\n")

def main():
    print("=" * 65)
    print("  🚀 Starting AI Healthcare Case-Taking System (Unified)")
    print("=" * 65)
    print(f"  Backend:  http://localhost:8000  (Docs: http://localhost:8000/docs)")
    print(f"  Frontend: http://localhost:5173")
    print("=" * 65)
    print("  Press Ctrl + C anytime to stop both servers.\n")

    check_dependencies()

    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    python_cmd = sys.executable

    backend_proc = subprocess.Popen(
        [python_cmd, "run.py"],
        cwd=BACKEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1
    )

    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=FRONTEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1
    )

    t_back = threading.Thread(target=stream_logs, args=(backend_proc, "BACKEND", "\033[94m"), daemon=True)
    t_front = threading.Thread(target=stream_logs, args=(frontend_proc, "FRONTEND", "\033[92m"), daemon=True)
    t_back.start()
    t_front.start()

    def open_browser():
        time.sleep(3)
        try:
            webbrowser.open("http://localhost:5173")
        except Exception:
            pass

    threading.Thread(target=open_browser, daemon=True).start()

    try:
        while True:
            time.sleep(0.5)
            if backend_proc.poll() is not None:
                print("\n[!] Backend process exited with code:", backend_proc.poll())
                break
            if frontend_proc.poll() is not None:
                print("\n[!] Frontend process exited with code:", frontend_proc.poll())
                break
    except KeyboardInterrupt:
        print("\n[!] Shutting down servers gracefully...")
    finally:
        for p, name in [(backend_proc, "Backend"), (frontend_proc, "Frontend")]:
            if p and p.poll() is None:
                try:
                    p.terminate()
                    p.wait(timeout=3)
                except Exception:
                    p.kill()
        print("[✓] All servers stopped cleanly. Have a great day!")

if __name__ == "__main__":
    main()
