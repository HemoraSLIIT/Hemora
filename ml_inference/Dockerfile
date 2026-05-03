# ML Inference Service Dockerfile

FROM python:3.11-slim as builder

WORKDIR /build

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
	build-essential \
	libssl-dev \
	&& rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Build wheels
RUN pip install --no-cache-dir --user -r requirements.txt


FROM python:3.11-slim as runtime

WORKDIR /app

# Install runtime dependencies only (no build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
	libgomp1 \
	libgl1 \
	libglib2.0-0 \
	&& rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /root/.local /root/.local

# Set Python path
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Copy application
COPY . .

# Create non-root user
RUN useradd -m -u 1000 mluser && chown -R mluser:mluser /app
USER mluser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
	CMD python -c "import requests; requests.get('http://localhost:8001/health', timeout=5)" || exit 1

# Run service
CMD ["python", "main.py"]
