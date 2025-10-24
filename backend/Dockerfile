# syntax=docker/dockerfile:1
FROM python:3.11-slim

# System deps (optional; keep small)
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install Python deps first (better caching)
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy app code
COPY . /app

# Non-root user
RUN useradd -m appuser
USER appuser

EXPOSE 8025
# If your FastAPI app is defined as `app` inside main.py:
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8025"]
