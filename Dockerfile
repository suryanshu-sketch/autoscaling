# Use official lightweight Python 3.11 image
FROM python:3.11-slim

# Prevent Python from writing bytecode and enable unbuffered standard out/err
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080

WORKDIR /app

# Install curl for container health check
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application files, model, and static assets
COPY model.pkl ./
COPY server/ ./server/
COPY client/ ./client/

# Create a non-root system user for security compliance
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

# Expose container port
EXPOSE 8080

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Start production server using Gunicorn
CMD exec gunicorn --bind 0.0.0.0:${PORT} --workers 2 --threads 4 --timeout 60 --access-logfile - --error-logfile - "server.app:app"
