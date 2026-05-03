"""Storage abstraction for images and artifacts (local or S3-compatible)."""

import os
from abc import ABC, abstractmethod
from typing import BinaryIO, Optional
from pathlib import Path


class StorageBackend(ABC):
	"""Abstract base class for storage backends."""

	@abstractmethod
	def save(self, path: str, file_obj: BinaryIO) -> str:
		"""Save file and return URL/path.

		Args:
			path: Relative path (e.g., "patients/blood_smear/001.png")
			file_obj: File-like object to save

		Returns:
			URL or path to the saved file
		"""

	@abstractmethod
	def load(self, path: str) -> BinaryIO:
		"""Load file and return file-like object.

		Args:
			path: Path as returned by save()

		Returns:
			File-like object
		"""

	@abstractmethod
	def delete(self, path: str) -> None:
		"""Delete file.

		Args:
			path: Path as returned by save()
		"""

	@abstractmethod
	def exists(self, path: str) -> bool:
		"""Check if file exists."""


class LocalStorageBackend(StorageBackend):
	"""Local filesystem storage."""

	def __init__(self, base_path: str):
		"""Initialize with base directory.

		Args:
			base_path: Root directory for all files (e.g., "/app/media")
		"""
		self.base_path = Path(base_path)
		self.base_path.mkdir(parents=True, exist_ok=True)

	def _full_path(self, path: str) -> Path:
		"""Get full filesystem path."""
		full = self.base_path / path
		# Security: prevent directory traversal
		full.resolve().relative_to(self.base_path.resolve())
		return full

	def save(self, path: str, file_obj: BinaryIO) -> str:
		"""Save file locally."""
		full_path = self._full_path(path)
		full_path.parent.mkdir(parents=True, exist_ok=True)

		with open(full_path, "wb") as f:
			f.write(file_obj.read())

		return path

	def load(self, path: str) -> BinaryIO:
		"""Load file from local storage."""
		full_path = self._full_path(path)
		return open(full_path, "rb")

	def delete(self, path: str) -> None:
		"""Delete file."""
		full_path = self._full_path(path)
		if full_path.exists():
			full_path.unlink()

	def exists(self, path: str) -> bool:
		"""Check if file exists."""
		full_path = self._full_path(path)
		return full_path.exists()

	def get_local_path(self, path: str) -> str:
		"""Get actual filesystem path for direct access (local storage only)."""
		return str(self._full_path(path))


class S3StorageBackend(StorageBackend):
	"""S3-compatible storage (AWS S3, Minio, DigitalOcean Spaces, etc.).

	TODO: Implement full S3 backend when ready.
	For now, requires: boto3, AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
	Environment variables: S3_ENDPOINT, S3_BUCKET, S3_REGION
	"""

	def __init__(self, endpoint_url: str, bucket: str, region: str):
		"""Initialize S3 client.

		Args:
			endpoint_url: S3 endpoint URL (e.g., https://s3.amazonaws.com)
			bucket: Bucket name
			region: AWS region
		"""
		try:
			import boto3
		except ImportError:
			raise ImportError("boto3 is required for S3 storage. Install: pip install boto3")

		self.bucket = bucket
		self.s3_client = boto3.client(
			"s3",
			endpoint_url=endpoint_url,
			region_name=region,
		)

	def save(self, path: str, file_obj: BinaryIO) -> str:
		"""Upload file to S3."""
		self.s3_client.upload_fileobj(
			file_obj,
			self.bucket,
			path,
			ExtraArgs={"ContentType": "image/png"},  # Adjust based on file type
		)
		return f"s3://{self.bucket}/{path}"

	def load(self, path: str) -> BinaryIO:
		"""Download file from S3."""
		import io
		buf = io.BytesIO()
		self.s3_client.download_fileobj(self.bucket, path, buf)
		buf.seek(0)
		return buf

	def delete(self, path: str) -> None:
		"""Delete file from S3."""
		self.s3_client.delete_object(Bucket=self.bucket, Key=path)

	def exists(self, path: str) -> bool:
		"""Check if file exists in S3."""
		try:
			self.s3_client.head_object(Bucket=self.bucket, Key=path)
			return True
		except:
			return False


def get_storage_backend(storage_type: str = "local", **kwargs) -> StorageBackend:
	"""Factory function to get storage backend.

	Args:
		storage_type: "local" or "s3"
		**kwargs: Backend-specific arguments

	Usage (local):
		storage = get_storage_backend("local", base_path="/app/media")

	Usage (S3):
		storage = get_storage_backend(
			"s3",
			endpoint_url=os.getenv("S3_ENDPOINT"),
			bucket=os.getenv("S3_BUCKET"),
			region=os.getenv("S3_REGION"),
		)
	"""
	if storage_type == "local":
		return LocalStorageBackend(**kwargs)
	elif storage_type == "s3":
		return S3StorageBackend(**kwargs)
	else:
		raise ValueError(f"Unknown storage type: {storage_type}")
