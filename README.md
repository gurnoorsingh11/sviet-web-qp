# SVIET Question Paper Studio

A web version of the supplied SVIET Question Paper Generator. It replaces Streamlit's interface with a responsive SVIET-inspired dark navy / cyan workspace, while keeping the original Python question parsing and Word-document generation logic in the backend.

## Features

- Upload separate question banks for Section A and the shared Sections B/C bank.
- Supports `.docx`, `.xlsx`, and `.xls` question-bank files.
- Review/edit imported questions in the browser, or paste questions one per line.
- Configure exam heading, subject details, date, duration, maximum marks, counts and attempt count.
- Marks options for Sections B and C: **2, 4, 5, 8, 10**.
- Generate or shuffle all sections, or shuffle Section A, B or C individually.
- Section B and Section C are selected without duplicate long questions in the same paper.
- Preview the selected paper and download an editable `.docx` file.
- The generated Word document retains the original code's sample-style headings, instructions, Times New Roman formatting, left/right-aligned header fields and UMC footer warning.
- No database is required; question banks are processed in memory for the current session.

## Run locally

Requires Python 3.10+.

### Windows PowerShell

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```

Open <http://localhost:8000>.

### macOS / Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```

Open <http://localhost:8000>.

## Deploy on Render

This project is a single FastAPI service that serves both the webpage and API. It does not require a separate frontend deployment.

1. Push the contents of this ZIP to a GitHub repository.
2. In Render, choose **New → Web Service** and connect the repository.
3. Render can read `render.yaml`; otherwise use:
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. Deploy. Open the service URL; the webpage and `/api/health` are served by the same app.

For an existing SVIET website, this can be deployed as a separate tool route/subdomain or the frontend can be integrated into the existing Next.js project. The uploaded ZIP did not include the SVIET website source, so this is a standalone SVIET-inspired page rather than a direct modification of the original SVIET repository.

## Important notes

- Importing from complex Word/Excel tables is best-effort. Check the question text before generating the paper.
- The source parser chooses the longest non-empty cell in each table row / spreadsheet row and deduplicates exact question text. Files with several questions inside a single cell may need manual cleanup.
- The `No. of Pages: 1` header is preserved from the supplied code and is not automatically calculated for multi-page papers.
- The UMC warning is placed in the Word footer, so Word will normally show it on each page. The browser preview displays it at the bottom of the preview sheet as a visual approximation.
- No question bank is saved on the server. Uploads are read in memory; avoid uploading sensitive information to a public deployment unless you add access control.
- For a public deployment, add authentication/rate limiting and configure upload-size limits appropriate to your institution.

## Project structure

```text
SVIET_qp_web/
├── backend/
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── Procfile
├── render.yaml
├── requirements.txt
└── README.md
```
