"""Entry point for ML inference service."""

import sys
import logging

from core import config, logger

# Configure logging
logging.basicConfig(
	level=getattr(logging, config.LOG_LEVEL),
	format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

if __name__ == "__main__":
	import uvicorn

	logger.info(f"Starting {config.SERVICE_NAME}")

	uvicorn.run(
		"app:app",
		host=config.HOST,
		port=config.PORT,
		workers=config.WORKERS,
		reload=config.DEBUG,
	)
