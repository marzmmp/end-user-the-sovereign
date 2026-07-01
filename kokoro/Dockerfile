# Build from repo root: docker build -f kokoro/Dockerfile -t sovereign-kokoro kokoro/
FROM python:3.11-slim
WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py ./

ENV KOKORO_MODEL_DIR=/app/models
EXPOSE 7960
HEALTHCHECK --interval=30s --timeout=5s CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:7960/health')" || exit 1

CMD ["python3", "server.py"]
