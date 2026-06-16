FROM python:3.11-slim

WORKDIR /app

# Install deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source into /app/backend/
COPY . ./backend/

# Run from /app so "backend" is a package
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
