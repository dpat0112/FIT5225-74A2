FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
# We added libgl1, libglib2.0-0, libxcb1, and libx11-6 
# These are the standard libraries OpenCV needs to function, even in headless mode.
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    make \
    libgl1 \
    libglib2.0-0 \
    libxcb1 \
    libx11-6 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

RUN pip install Flask-CORS

COPY model.pt mdv5a.pt ./
COPY app.py .

CMD ["gunicorn", "--bind", ":8080", "--workers", "1", "--threads", "8", "--timeout", "0", "app:app"]