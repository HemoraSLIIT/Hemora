#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

    # Add the directories that may contain ml_models to sys.path.
    # _here  = backend/          (or /app/ in Docker)
    # _root  = Hemora/           (or /    in Docker — but ml_models is at /app/ml_models)
    # Adding both covers local runs and Docker (where ml_models is mounted at /app/ml_models).
    _here = os.path.dirname(os.path.abspath(__file__))
    _root = os.path.dirname(_here)
    for _p in [_here, _root]:
        if _p not in sys.path:
            sys.path.insert(0, _p)

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
