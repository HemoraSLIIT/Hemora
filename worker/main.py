"""Main worker loop that processes diagnosis jobs."""

import logging
import time
import signal
import sys
from typing import Optional

from config import config, WorkerConfig
from tasks import processor
from healthcheck import start_healthcheck_server

# Setup logging
logging.basicConfig(
	level=getattr(logging, config.LOG_LEVEL),
	format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


class WorkerLoop:
	"""Main worker loop for processing jobs."""

	def __init__(self):
		self.running = True
		self.processed_count = 0
		self.error_count = 0

		# Register signal handlers
		signal.signal(signal.SIGTERM, self._handle_shutdown)
		signal.signal(signal.SIGINT, self._handle_shutdown)

	def _handle_shutdown(self, signum, frame):
		"""Handle shutdown signals gracefully."""
		logger.info(f"Received signal {signum}, shutting down gracefully...")
		self.running = False

	def run(self):
		"""Main worker loop."""
		logger.info(f"Starting {config.SERVICE_NAME} v{config.SERVICE_VERSION}")
		config.validate()

		# Start health check server
		start_healthcheck_server()

		try:
			while self.running:
				try:
					# 1. Fetch pending jobs
					jobs = processor.fetch_pending_jobs()

					if jobs:
						logger.info(f"Found {len(jobs)} pending jobs")

						# 2. Process each job
						for job in jobs:
							if not self.running:
								break

							try:
								success = processor.process_job(job)
								if success:
									self.processed_count += 1
								else:
									self.error_count += 1

							except Exception as e:
								logger.error(f"Unexpected error processing job: {e}")
								self.error_count += 1

					# 3. Sleep before next poll
					logger.debug(f"Sleeping {config.POLL_INTERVAL_SECONDS} seconds until next poll")
					time.sleep(config.POLL_INTERVAL_SECONDS)

				except Exception as e:
					logger.error(f"Error in worker loop: {e}")
					# Continue polling despite errors
					time.sleep(config.POLL_INTERVAL_SECONDS)

		except Exception as e:
			logger.error(f"Fatal error: {e}")
			sys.exit(1)

		finally:
			logger.info(
				f"Worker stopped. Processed: {self.processed_count}, Errors: {self.error_count}"
			)


if __name__ == "__main__":
	worker = WorkerLoop()
	worker.run()
