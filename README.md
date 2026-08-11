# Apartment HQ

A shared apartment management tool for Kyle & Matt — chores (with checklists and the
2026 Apartment Refresh timeline), Building Management, Communal Items, and Finances
(recurring bills + a live Kyle-vs-Matt payment summary).

## How it's built
- `index.html` — the whole app (no build step). Works today in **preview mode** with
  sample data baked in, before any setup below.
- `Code.gs` — Google Apps Script backend. Turns a Google Sheet into a small JSON API.
- `Apartment-HQ-Data.xlsx` — starter workbook matching the schema `Code.gs` expects.
  Upload this to Google Sheets (File > Import, or just drag it into Drive).

## Go live (turns preview mode into a real, shared, saving tool)
1. Upload `Apartment-HQ-Data.xlsx` to Google Sheets.
2. In that Sheet: Extensions > Apps Script. Delete the starter code, paste in `Code.gs`.
3. Deploy > New deployment > type **Web app**. Execute as **Me**, who has access **Anyone**.
4. Copy the `/exec` URL it gives you.
5. Open `index.html`, find `const API_URL = "";` near the top of the `<script>` block,
   paste the URL between the quotes.
6. Push the updated `index.html` (see below) — or just re-save locally and re-share the file.

Re-run step 3 as "Manage deployments > Edit > New version" any time `Code.gs` changes.
