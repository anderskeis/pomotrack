# Pomotrack

A self-hosted, single-user Pomodoro timer that is simple to use and run and nothing more.

> ⚠️ **Security Notice:** This application is designed for **local/LAN use only**. It has no authentication and should **not be exposed to the public internet**. If you need remote access, place it behind a VPN or authenticated reverse proxy.

## Features

### Timer
- 🍅 Standard Pomodoro workflow (Focus → Short Break → Long Break)
- ⚙️ Configurable timer durations
- 🔄 Auto-start next session (optional)
- ⏭️ Skip or reset current session
- ⚠️ Visual urgency warnings (optional pulsing at 2min/30sec remaining)

### Notifications & Alerts
- 🔔 Browser notifications on session completion
- 🔊 Audio alerts (bell sound)
- 📱 Keep screen awake during timer (Wake Lock API)

### Tracking & Stats
- 📊 Daily session statistics
- 🎯 Daily goal progress tracking
- 🏷️ Session labeling with presets and history
- 📈 End-of-day summary modal

### Interface
- 🌙 Dark/Light theme toggle
- 📐 Compact mode for smaller displays
- ⌨️ Keyboard shortcuts (Space, S, R, Escape)
- 🔖 Dynamic favicon showing timer progress
- 💾 Settings persist in localStorage

## Quick Start

### Using Docker Compose (Recommended)

```bash
docker compose up -d
```

Open http://localhost:8080 in your browser.

### LAN Access

To access from other devices on your network, the app listens on all interfaces. Access via your machine's IP address (e.g., http://192.168.1.100:8080).

### Development Setup

**Prerequisites:**
- Python 3.11+
- Node.js 20+
- uv (Python package manager)

**Backend:**
```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 7070
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 for development (with hot reload).

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Start/Pause timer |
| `S` | Skip to next session |
| `R` | Reset current session |
| `Escape` | Close modals |

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
│       └── composables/   # Timer logic, notifications, audio, storage
├── Dockerfile         # Multi-stage build
└── docker-compose.yml
```

## Design Decisions

- **Timer runs in browser**: All timer state is client-side for simplicity and offline capability
- **Settings persist**: Timer config, theme, and preferences saved in localStorage
- **Session history**: Today's completed sessions stored locally for daily stats
- **Single container**: Frontend is built and served by FastAPI
- **No authentication**: Designed for single-user, LAN-only deployment

## Configuration

Default timer settings (configurable via ⚙️ Settings):

| Setting | Default | Description |
|---------|---------|-------------|
| Focus duration | 25 min | Length of focus sessions |
| Short break | 5 min | Length of short breaks |
| Long break | 15 min | Length of long breaks |
| Long break after | 4 🍅 | Pomodoros until long break |
| Daily goal | 8 🍅 | Target pomodoros per day |

### Behavior Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Auto-start breaks | Off | Automatically start break after focus |
| Auto-start focus | Off | Automatically start focus after break |
| Keep screen on | Off | Prevent screen sleep during timer |

### Alert Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Sound | On | Play sound when session ends |
| Notifications | Off | Show browser notification |
| Urgency warning | On | Visual pulse near session end |

### Display Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Theme | Dark | Dark or Light mode |
| Compact mode | Off | Smaller timer for limited space |

## Browser Support

- Chrome/Edge (latest) - Full support including Wake Lock
- Firefox (latest) - All features except Wake Lock
- Safari (latest) - All features except Wake Lock

## License

Do whatever you want with it.
