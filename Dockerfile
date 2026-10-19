# ---- Stage 1: Build Frontend ----
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN npm run build

# ---- Stage 2: Python Runtime ----
FROM python:3.12-slim AS runtime

WORKDIR /app

# Install uv for fast dependency management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy dependency manifest and lockfile for reproducible installs
COPY backend/pyproject.toml backend/uv.lock ./

# Install locked dependencies (cached layer)
RUN uv sync --frozen --no-dev --no-install-project

# Copy backend code and install the project itself
COPY backend/app ./app
RUN uv sync --frozen --no-dev

# Copy built frontend to static directory
COPY --from=frontend-builder /app/frontend/dist ./static

# Create non-root user for security and writable /data directory
RUN useradd --create-home --shell /bin/bash --uid 1000 pomotrack && \
    mkdir -p /data && \
    chown -R pomotrack:pomotrack /app /data

# Switch to non-root user
USER pomotrack

# Expose port
EXPOSE 7070

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:7070/api/health')" || exit 1

# Run with uvicorn from the locked virtualenv
CMD [".venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7070"]
