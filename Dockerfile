# ---- Stage 1: Build Frontend ----
FROM node:20-alpine AS frontend-builder

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

# Copy pyproject.toml and install dependencies (cached layer)
COPY backend/pyproject.toml ./
RUN uv pip install --system --no-cache .

# Copy backend code
COPY backend/app ./app

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

# Run with uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7070"]
