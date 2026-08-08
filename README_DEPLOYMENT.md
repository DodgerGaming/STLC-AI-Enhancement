# STLC-AI-Enhancement Deployment Guide

**Pinagsamang Deployment ng Original Capstone 1 + New AI Layer**

This guide explains how to run the **new AI-powered layer alongside the original Capstone 1** project. The new layer adds intelligent analytics, AI-generated insights, and an enhanced dashboard.

---

## 📋 Project Structure

```
STLC-AI-Enhancement/
├── backend/                    # Original Capstone 1 backend (Django)
│   ├── api/
│   │   ├── views.py           # Updated with AI insight endpoints
│   │   ├── services/
│   │   │   ├── ai_integration.py    # NEW: Groq AI service
│   │   │   ├── analytics_queries.py # Analytics data fetching
│   │   │   └── ...
│   │   └── ...
│   ├── django_framework/
│   ├── manage.py
│   ├── requirements.txt        # Updated with groq package
│   ├── .env                    # NEW: Contains GROQ_API_KEY
│   └── ...
│
├── frontend/                   # Original Capstone 1 frontend (React + Vite)
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── ...
│   ├── package.json
│   └── ...
│
└── Enhancement/                # NEW: AI Enhancement layer
    ├── backend/               # Enhanced Django backend
    │   ├── api/
    │   │   ├── views.py      # AI-enhanced views
    │   │   └── services/
    │   │       └── ai_integration.py
    │   └── requirements.txt
    │
    ├── frontend/              # Enhanced React frontend
    │   ├── src/
    │   │   ├── pages/ai/      # NEW: AI Dashboard
    │   │   └── components/ai/
    │   └── package.json
    │
    └── README_CHANGES.md      # Detailed changelog
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **PostgreSQL or SQLite** (Django database)
- **ClickHouse** (for analytics queries) — optional, falls back to SQLite
- **GROQ API Key** (for AI generation) — sign up at [console.groq.com](https://console.groq.com)

### Step 1: Clone & Navigate

```bash
cd STLC-AI-Enhancement
```

### Step 2: Set Up Backend Environment

#### Option A: Run Original Capstone 1 Backend (No AI)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py runserver
```

#### Option B: Run NEW AI-Enhanced Backend

```powershell
cd Enhancement/backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**Important: Add GROQ_API_KEY to `.env`:**

Create or edit `Enhancement/backend/.env`:

```env
GROQ_API_KEY=your_actual_groq_api_key_here
DJANGO_SECRET_KEY=your_secret_key
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
```

Then run:

```powershell
python manage.py runserver
```

**The backend is now running with AI features!** 🤖

### Step 3: Set Up Frontend

#### Option A: Run Original Capstone 1 Frontend

```powershell
cd frontend
npm install
npm run dev
```

Visit: `http://localhost:5173`

#### Option B: Run NEW AI-Enhanced Frontend

```powershell
cd Enhancement/frontend
npm install
npm run dev
```

Visit: `http://localhost:5173`

**Features in the enhanced frontend:**
- ✅ AI Dashboard with intelligent insights
- ✅ Executive Summary (AI-generated)
- ✅ Dynamic Q&A sidebar
- ✅ Analytics charts and reports

---

## 🔌 Side-by-Side Running (Recommended for Testing)

You can run **both versions simultaneously** to compare:

### Terminal 1: Original Backend
```powershell
cd backend
.venv\Scripts\Activate.ps1
python manage.py runserver 8000
```

### Terminal 2: AI-Enhanced Backend
```powershell
cd Enhancement/backend
.venv\Scripts\Activate.ps1
python manage.py runserver 8001
```

### Terminal 3: Original Frontend
```powershell
cd frontend
npm run dev  # runs on port 5173
```

### Terminal 4: AI-Enhanced Frontend
```powershell
cd Enhancement/frontend
npm run dev  # runs on port 5174
```

**Access:**
- Original: `http://localhost:5173` (connects to `http://localhost:8000`)
- AI-Enhanced: `http://localhost:5174` (connects to `http://localhost:8001`)

---

## 🧠 New AI Features

### 1. AI Insight Generation Endpoint

**Endpoint:** `POST /api/semantic-search-insights/`

```bash
curl -X POST http://localhost:8001/api/semantic-search-insights/ \
  -H "Content-Type: application/json" \
  -d '{"question": "What'"'"'s been trending in leather sales lately?"}'
```

**Response:**
```json
{
  "query": "What's been trending in leather sales lately?",
  "results": [
    {
      "text": "Animal Print leather has shown the strongest growth with 55% of total sales in recent orders.",
      "distance": 0.0,
      "type": "trend"
    }
  ]
}
```

### 2. Supported Question Types

The AI classifier automatically detects:

| Question Category | Keywords | Data Source |
|---|---|---|
| **Trending** | trending, trend, sales lately, recently, changed, compared, last quarter | Daily sales trend |
| **Top Materials** | revenue, best seller, generating, top material, accessory sales | Best-sellers query |
| **Peak Hours** | when, peak, most orders, hour, afternoon, time of day | Peak hour data |
| **Peak Days** | day of week, which day, busiest day | Peak day data |

### 3. Example Questions

```
✅ "What's been trending in leather sales lately?"
✅ "Which material is generating the most revenue?"
✅ "When do we see the most orders come in?"
✅ "How are accessory sales doing?"
✅ "What's changed compared to last quarter?"
```

All powered by **real data + AI generation**, not hardcoded responses!

---

## 🛠️ Configuration

### Backend `.env` File

**Location:** `Enhancement/backend/.env`

```env
# REQUIRED: Groq API Key
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx

# Django
DJANGO_SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (choose one)
DATABASE_URL=sqlite:///db.sqlite3
# or for PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost:5432/cutwise_db

# ClickHouse (optional, for analytics)
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=9000
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
```

### Get GROQ API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up or log in
3. Create an API key
4. Copy it to your `.env` file

**Never commit `.env` to Git!** It's already in `.gitignore`.

---

## 📊 Database Setup

### Option 1: SQLite (Development - Default)

Already configured, no setup needed.

```bash
cd Enhancement/backend
python manage.py migrate
python manage.py runserver
```

### Option 2: PostgreSQL (Production)

1. **Install PostgreSQL** and create a database:

```sql
CREATE DATABASE cutwise_db;
CREATE USER cutwise_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE cutwise_db TO cutwise_user;
```

2. **Update `.env`:**

```env
DATABASE_URL=postgresql://cutwise_user:your_password@localhost:5432/cutwise_db
```

3. **Run migrations:**

```bash
python manage.py migrate
```

### Option 3: ClickHouse (Analytics - Optional)

For faster analytics queries, set up ClickHouse:

```bash
# Install Docker (if not already installed)
docker run -d \
  --name clickhouse \
  -p 9000:9000 \
  -p 8123:8123 \
  yandex/clickhouse-server
```

Update `.env`:

```env
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=9000
```

---

## 🧪 Testing the AI Layer

### Manual Test: Test the Insight Endpoint

```bash
# Terminal: Backend (Enhancement)
cd Enhancement/backend
python manage.py runserver 8001

# Terminal: Test script
python -c "
import requests
import json

url = 'http://localhost:8001/api/semantic-search-insights/'
data = {'question': 'What materials are trending?'}

response = requests.post(url, json=data)
print(json.dumps(response.json(), indent=2))
"
```

### Check Groq Connection

```powershell
cd Enhancement/backend
python -c "
from api.services.ai_integration import generate_insight
result = generate_insight([{'name': 'Animal Print', 'revenue': 220}], 'best-sellers')
print('AI Response:', result)
"
```

### View Logs

```powershell
# Tail Django logs
cd Enhancement/backend
python manage.py runserver 2>&1 | Select-String "generate_insight|semantic_search"
```

---

## 📦 Deployment (Production)

### 1. Backend Deployment (AWS/GCP/Heroku)

```bash
# Install production dependencies
pip install -r Enhancement/backend/requirements.txt
pip install gunicorn whitenoise

# Collect static files
python manage.py collectstatic --noinput

# Run with Gunicorn
gunicorn django_framework.wsgi --bind 0.0.0.0:8000 --workers 4
```

### 2. Set Environment Variables

On your hosting platform (AWS Lambda, Google Cloud Run, Heroku, etc.):

```
GROQ_API_KEY = gsk_xxxxxxxxxxxxx
DJANGO_SECRET_KEY = your-production-secret-key
DEBUG = False
ALLOWED_HOSTS = yourapp.com,www.yourapp.com
DATABASE_URL = postgresql://prod_user:pwd@prod_host/cutwise_db
```

### 3. Frontend Deployment (Vercel/Netlify)

```bash
cd Enhancement/frontend
npm run build
```

Deploy the `dist/` folder to Vercel or Netlify.

Update API endpoint in `src/utils/api.js` or environment:

```env
VITE_API_URL=https://api.yourapp.com
```

---

## 🔄 Migration from Original to AI Layer

If you want to **replace** the original Capstone 1 with the AI-enhanced version:

### Step 1: Backup Original

```bash
# Keep original as backup
mv backend backend_original
mv frontend frontend_original
```

### Step 2: Promote AI Layer

```bash
# Make Enhancement the main version
mv Enhancement/backend backend
mv Enhancement/frontend frontend
```

### Step 3: Update Dependencies

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

---

## ❓ Troubleshooting

### Issue: `GROQ_API_KEY is not set`

**Solution:**

```bash
# Check if .env is being loaded
cd Enhancement/backend
python -c "
import os
from dotenv import load_dotenv
load_dotenv()
print('GROQ_API_KEY:', os.environ.get('GROQ_API_KEY'))
"
```

If empty, make sure `backend/.env` exists and contains the key.

### Issue: `ModuleNotFoundError: No module named 'groq'`

**Solution:**

```bash
pip install groq
# or reinstall all requirements
pip install -r requirements.txt
```

### Issue: Frontend can't connect to backend

**Solution:**

1. Ensure backend is running: `http://localhost:8001`
2. Check CORS headers in `django_framework/settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
]
```

3. Restart backend after changing settings

### Issue: AI responses are slow or timeout

**Solution:**

- Increase timeout in `api/services/ai_integration.py`:

```python
timeout=15,  # increase from 8
```

- Check GROQ API status: [status.groq.com](https://status.groq.com)
- Reduce `max_tokens` to speed up responses:

```python
MAX_INSIGHT_WORDS = 15  # reduce from 20
```

---

## 📚 Additional Resources

- **Groq Docs:** https://console.groq.com/docs/api-overview
- **Django Docs:** https://docs.djangoproject.com/
- **React Docs:** https://react.dev
- **Vite Docs:** https://vitejs.dev

---

## 👥 Support

For issues or questions:

1. Check the `README_CHANGES.md` in `Enhancement/` folder
2. Review logs: `django.log` or terminal output
3. Test the API directly with curl or Postman
4. Verify GROQ API key is valid and has remaining quota

---

## ✅ Checklist for Going Live

- [ ] Clone repo and navigate to `STLC-AI-Enhancement`
- [ ] Set up Python venv in `Enhancement/backend`
- [ ] Install requirements: `pip install -r Enhancement/backend/requirements.txt`
- [ ] Create `.env` file with `GROQ_API_KEY`
- [ ] Run migrations: `python manage.py migrate`
- [ ] Start backend: `python manage.py runserver`
- [ ] Install frontend dependencies: `npm install` in `Enhancement/frontend`
- [ ] Start frontend: `npm run dev`
- [ ] Test AI endpoint: POST to `/api/semantic-search-insights/`
- [ ] Verify dashboard loads at `http://localhost:5173`
- [ ] Deploy to production platform

---

**You're all set! 🎉 The new AI layer is ready to power your insights!**

Happy deploying! 🚀
