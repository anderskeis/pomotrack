# Pomotrack

A self-hosted, single-user Pomodoro timer with a Grafana-style dashboard UI.

## Features

- 🍅 Standard Pomodoro workflow (Focus → Short Break → Long Break)
- ⚙️ Configurable timer durations
- 🔔 Browser notifications on session completion
- 🔊 Audio alerts
- 🌙 Dark/Light theme toggle
- 📊 Session statistics (per browser session)
- 🏷️ Optional session labeling

## Quick Start

### Using Docker Compose (Recommended)

```bash
docker compose up -d
```

Open http://localhost:8000 in your browser.

### Development Setup

**Prerequisites:**
- Python 3.11+
- Node.js 20+
- uv (Python package manager)

**Backend:**
```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 for development (with hot reload).

## Architecture

```
pomotrack/
├── backend/           # FastAPI backend
│   └── app/
│       ├── main.py    # App entry point & static file serving
│       └── api/       # API routes (/health, /config)
├── frontend/          # Vue 3 + TypeScript frontend
│   └── src/
│       ├── components/    # UI components
│       └── composables/   # Timer logic, notifications, audio
├── Dockerfile         # Multi-stage build
└── docker-compose.yml
```

## Design Decisions

- **Timer runs in browser**: All timer state is client-side for simplicity and offline capability
- **No persistence**: Stats reset on page refresh (by design for v1)
- **Single container**: Frontend is built and served by FastAPI
- **No authentication**: Designed for single-user, LAN-only deployment

## Configuration

Default timer settings (can be changed in the UI):

| Setting | Default |
|---------|---------|
| Focus duration | 25 minutes |
| Short break | 5 minutes |
| Long break | 15 minutes |
| Long break after | 4 pomodoros |

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Do whatever you want with it.
