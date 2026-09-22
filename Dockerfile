FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install system dependencies for OCR, barcode scanning, and cryptography
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libzbar0 \
    tesseract-ocr \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY Backend/requirements.txt /app/Backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/Backend/requirements.txt && \
    python -m spacy download en_core_web_sm || true

# Copy project code
COPY . /app

# Ensure both 'backend' and 'Backend' resolve in case-sensitive Linux
RUN ln -s /app/Backend /app/backend

ENV PYTHONPATH="/app:/app/Backend:/app/backend"

# Expose default port
EXPOSE 8000

# Run via run.py for dynamic Render $PORT and module resolution
CMD ["python", "run.py"]
