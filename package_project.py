"""
Quick Project Packager for Sharing
Creates a clean, lightweight .zip file of the complete project by excluding
heavy dependencies like 'node_modules', 'dist', '__pycache__', and virtual environments.
"""

import os
import zipfile
import sys

# Configure UTF-8 encoding for Windows terminal
try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

def package_project():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    zip_name = "aihc-patient-casetaking.zip"
    zip_path = os.path.join(root_dir, zip_name)

    # Directories to ignore
    EXCLUDE_DIRS = {
        "node_modules",
        "dist",
        "dist-ssr",
        "__pycache__",
        ".venv",
        "venv",
        "env",
        ".git",
        ".pytest_cache",
        ".vscode",
        ".idea"
    }

    # Extensions / filenames to ignore
    EXCLUDE_EXTS = {".pyc", ".pyo", ".pyd", ".log", ".db-journal"}
    EXCLUDE_FILES = {zip_name, "package_project.py"}

    print("=" * 65)
    print("  [*] Packaging AI Healthcare Project for Sharing")
    print("=" * 65)
    print(f"Source Folder: {root_dir}")
    print(f"Target ZIP:    {zip_path}\n")

    files_added = 0

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for dirpath, dirnames, filenames in os.walk(root_dir):
            # Exclude unwanted directories in-place
            dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]

            for filename in filenames:
                if filename in EXCLUDE_FILES:
                    continue
                ext = os.path.splitext(filename)[1].lower()
                if ext in EXCLUDE_EXTS:
                    continue

                full_path = os.path.join(dirpath, filename)
                rel_path = os.path.relpath(full_path, root_dir)

                # Keep project root structure inside zip
                archive_name = os.path.join("aihc-patient-casetaking", rel_path)
                zipf.write(full_path, archive_name)
                files_added += 1

    size_mb = os.path.getsize(zip_path) / (1024 * 1024)
    print(f"[OK] Packaging complete!")
    print(f"    - Files included: {files_added}")
    print(f"    - Archive size:   {size_mb:.2f} MB")
    print(f"    - Saved at:       {zip_path}")
    print("=" * 65)
    print("\nHow to share:")
    print("1. Send this 'aihc-patient-casetaking.zip' via Google Drive, Email, WhatsApp, or USB.")
    print("2. The recipient just unzips it and double-clicks 'start.bat' (or runs 'python start.py').")
    print("   Dependencies and both servers will be handled automatically!")
    print("=" * 65)

if __name__ == "__main__":
    package_project()
