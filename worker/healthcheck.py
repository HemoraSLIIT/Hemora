"""Health check for Docker container orchestration."""

import socket
from http.server import HTTPServer, BaseHTTPRequestHandler
from threading import Thread
import logging

from config import config

logger = logging.getLogger(__name__)


class HealthCheckHandler(BaseHTTPRequestHandler):
	"""HTTP handler for health checks."""

	def do_GET(self):
		"""Handle GET requests."""
		if self.path == "/health":
			self.send_response(200)
			self.send_header("Content-Type", "application/json")
			self.end_headers()
			self.wfile.write(b'{"status": "healthy"}')
		elif self.path == "/ready":
			self.send_response(200)
			self.send_header("Content-Type", "application/json")
			self.end_headers()
			self.wfile.write(b'{"ready": true}')
		else:
			self.send_response(404)
			self.end_headers()

	def log_message(self, format, *args):
		"""Suppress HTTP request logging."""
		pass


def start_healthcheck_server():
	"""Start health check HTTP server in background thread."""
	try:
		server = HTTPServer(("0.0.0.0", config.HEALTHCHECK_PORT), HealthCheckHandler)
		thread = Thread(target=server.serve_forever, daemon=True)
		thread.start()
		logger.info(f"Health check server started on port {config.HEALTHCHECK_PORT}")
	except Exception as e:
		logger.error(f"Failed to start health check server: {e}")
