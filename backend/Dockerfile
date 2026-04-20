FROM python:3.12-slim

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy application code
COPY backend/ ./backend/

# Railway sets PORT automatically
ENV PORT=8000
EXPOSE ${PORT}

CMD uvicorn backend.app:app --host 0.0.0.0 --port ${PORT}
