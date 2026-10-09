# How to Share This Project

This guide provides step-by-step instructions for sharing the **AI Healthcare Case-Taking System** with another person (colleague, evaluator, developer, or client) and instructions for how they can run it.

---

## Method 1: Share as a Clean ZIP File (Fastest & Recommended)

> [!TIP]
> Never share the raw folder with `node_modules` included! It contains tens of thousands of files (~250 MB+), takes a very long time to compress, and often fails over email or chat.
> A clean package is only **~0.6 MB (600 KB)** and contains all source code, models, and datasets.

### Step 1: Create the Clean ZIP Archive
A packaging script has already generated `aihc-patient-casetaking.zip` in your project folder.
If you ever want to re-generate it after making changes, simply run:

```bash
python package_project.py
```

This automatically excludes `node_modules`, `dist`, `__pycache__`, and virtual environments.

### Step 2: Send the ZIP File
You can find the file at:
```
C:\Users\Karthika\.gemini\antigravity\scratch\aihc-patient-casetaking\aihc-patient-casetaking.zip
```

Send it via:
* **Google Drive / OneDrive / Dropbox** (upload and share the link)
* **Email Attachment** (file is under 1 MB, fits easily into Gmail/Outlook)
* **WhatsApp / Telegram / Slack / Teams**
* **USB Flash Drive**

---

## Method 2: Share via GitHub (Best for Developers & Code Reviews)

If you prefer to share a GitHub repository link:

1. Open your terminal in the project directory:
   ```bash
   cd C:\Users\Karthika\.gemini\antigravity\scratch\aihc-patient-casetaking
   ```

2. Initialize git and commit:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: AI Healthcare Case Taking System"
   ```
   *(The included `.gitignore` will automatically prevent `node_modules` and cache files from being uploaded.)*

3. Create a new repository on [GitHub](https://github.com/new) (e.g. `aihc-patient-casetaking`).

4. Link and push to GitHub:
   ```bash
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/aihc-patient-casetaking.git
   git branch -M main
   git push -u origin main
   ```

5. Share your GitHub link with the recipient!

---

## Instructions for the Recipient (How They Run It)

Include these instructions when you send the project to someone:

### Prerequisites
The recipient needs:
1. **Python 3.10+** ([python.org](https://www.python.org/downloads/)) - *Ensure "Add Python to PATH" is checked during installation.*
2. **Node.js 18+** ([nodejs.org](https://nodejs.org/))

---

### Step-by-Step for the Recipient

1. **Unzip the folder**:
   Extract `aihc-patient-casetaking.zip` to any folder on their computer.

2. **Run the project (1 Click on Windows)**:
   Double-click `start.bat`
   
   *Or run from terminal / PowerShell:*
   ```bash
   python start.py
   ```

3. **What happens automatically**:
   - `start.py` detects first-time setup and installs frontend dependencies (`npm install`) automatically.
   - It verifies Python backend dependencies (`pip install -r backend/requirements.txt`).
   - It starts the FastAPI Backend on `http://localhost:8000`.
   - It starts the React + Vite Frontend on `http://localhost:5173`.
   - It automatically opens the browser to `http://localhost:5173`.

---

## Default Demo Login Credentials

| Role | Username / ID | Password | Access / Capabilities |
| :--- | :--- | :--- | :--- |
| **Patient** | `PAT-0001` *(or self-register)* | `password123` | Pre-Consultation, Age input, Body Map, Prescriptions, Reports |
| **Doctor** | `DOC-0001` | `doctor123` | Clinical Consultation, Prescribe Rx, Emergency Alerts |
| **Nurse** | `NURSE-0001` | `nurse123` | Patient Vitals, Emergency Triage, OCR Report Summaries |
| **Admin** | `ADM-0001` | `admin123` | System Directory, Hospitals, OPD Rosters, Audit Logs |
