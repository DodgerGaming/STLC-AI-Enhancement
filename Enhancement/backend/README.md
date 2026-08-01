# Cutwise Backend (Django)

This folder contains a minimal Django backend scaffold to serve as an API for the Cutwise IMS React frontend.

Quick setup (Windows / PowerShell):

1. Create and activate a Python virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install dependencies

```powershell
pip install -r requirements.txt
```

3. Create or update `.env`

```powershell
copy .env .env.local
```

4. Run migrations and start server

```powershell
python manage.py migrate
python manage.py runserver
```

By default the backend uses SQLite and allows CORS from `http://localhost:5173` (Vite dev server).

Notes:
- For production use, configure PostgreSQL and secure the `SECRET_KEY`.
- I scaffolded the files locally in this repo rather than running `django-admin startproject` here because the environment running this assistant cannot execute external commands. To fully set up the project on your machine, run the above steps in `backend/`.
