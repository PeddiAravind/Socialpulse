# SocialPulse AI

**AI-Powered Social Media Strategy with Persistent Hindsight Memory**

> Hackathon project demonstrating a full AI feedback loop: Brand Profile → Historical Analytics → Hindsight Memory → Memory-Informed Recommendations.

---

## Architecture

```
SocialPulse/
├── backend/                  # FastAPI · Python 3.11
│   └── app/
│       ├── main.py           # All API routes (CORS, brands, posts, analytics, recommendations, memory)
│       ├── models.py         # SQLAlchemy models (Brand, Post, PostMetrics, Recommendation)
│       ├── services.py       # Recommendation engine, analytics, memory service
│       └── db.py             # SQLite (dev) database setup
├── frontend/                 # React · Vite · JavaScript
│   ├── src/
│   │   ├── api/api.js        # Centralized API client (all backend calls)
│   │   ├── context/          # BrandContext (global brand state)
│   │   ├── components/       # Layout, Sidebar, Header, RecommendationCard, FeedbackPanel, MemoryCard
│   │   ├── pages/            # Dashboard, BrandProfile, ContentStudio, Posts, Analytics,
│   │   │                     # Recommendations, MemoryLab, MemoryExplorer
│   │   └── styles/global.css
│   ├── .env                  # VITE_API_BASE_URL=http://127.0.0.1:8000
│   └── package.json
└── socialpulse.db            # SQLite development database
```

---

## Run Commands

### Backend (FastAPI)
```bash
cd D:\SocialPulse
.venv\Scripts\activate
uvicorn backend.app.main:app --reload --port 8000
```
API available at: http://127.0.0.1:8000  
API docs: http://127.0.0.1:8000/docs

### Frontend (React · Vite)
```bash
cd D:\SocialPulse\frontend
npm install
npm run dev
```
Frontend available at: http://localhost:5173

---

## Backend API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | System health & memory backend status |
| POST | `/api/brands` | Create brand + onboard to memory |
| GET | `/api/brands` | List all brands |
| GET | `/api/brands/{id}` | Get brand profile |
| GET | `/api/brands/{id}/posts` | Get all historical posts |
| POST | `/api/brands/{id}/posts` | Add new post with metrics |
| POST | `/api/brands/{id}/seed` | Seed 50 synthetic demo posts |
| GET | `/api/brands/{id}/analytics` | Get historical analytics |
| POST | `/api/brands/{id}/learn` | Analyze posts & retain observations in memory |
| POST | `/api/brands/{id}/recommendations` | Generate 3 AI recommendations |
| GET | `/api/brands/{id}/recommendations` | Recommendation history |
| POST | `/api/brands/{id}/recommendations/{rec_id}/action` | Approve / Reject / Feedback |
| POST | `/api/brands/{id}/feedback` | Submit explicit owner preference to memory |
| GET | `/api/brands/{id}/memory` | View all stored memories |

---

## Intelligence Stages

| Stage | Condition | Behavior |
|-------|-----------|----------|
| **Cold-Start** | No historical data or feedback | Brand profile baseline only |
| **Evidence-Informed** | Historical posts analyzed & stored in memory | Prioritizes top-performing formats/categories |
| **Memory-Informed** | Explicit owner preferences stored | Honors feedback constraints over raw correlation |

---

## Demonstration Flow (Memory Lab)

1. Generate **Cold-Start** recommendation
2. Seed 50 **Synthetic Historical Posts**
3. **Learn & Analyze** → store observations in Hindsight memory
4. Generate **Evidence-Informed** recommendation (same query, different result)
5. Submit **Explicit Owner Preference** (e.g. "prefer educational, avoid promotional")
6. Generate **Memory-Informed** recommendation (preferences override correlations)
7. **Before & After Comparison** to show the AI evolved

---

## Frontend Pages

- **Dashboard** – Brand overview, KPI metrics, recent posts, intelligence stage
- **Brand Profile** – Create/view brand with full attribute form
- **AI Content Studio** – Draft and log new posts
- **Posts & History** – Filterable post table with platform/format/engagement data
- **Analytics** – Charts: engagement by format, category, platform breakdown
- **AI Recommendations** – Generate/Approve/Reject/Feedback on 3-card strategy options
- **Memory Lab** – 7-step interactive intelligence evolution demo
- **Memory Explorer** – Browse all stored memories grouped by type

---

## Testing

```bash
# Backend unit tests
cd D:\SocialPulse
python -m pytest backend/tests/test_services.py

# React build validation
cd D:\SocialPulse\frontend
npm run build
```

---

## Notes

- React + Vite is the official frontend
- SQLite is the active development database
- CORS is configured on FastAPI to allow `localhost:5173`
