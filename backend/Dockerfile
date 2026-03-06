FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

ARG GIT_SHA=local
ARG BUILD_DATE=local
ENV GIT_SHA=$GIT_SHA
ENV BUILD_DATE=$BUILD_DATE

COPY app ./app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
