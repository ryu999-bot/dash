FROM python:3.12-slim

WORKDIR /app

# pymssql build dependencies (freetds)
RUN apt-get update && apt-get install -y --no-install-recommends \
    freetds-dev gcc && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && pip install --no-cache-dir gunicorn

COPY . .

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]
