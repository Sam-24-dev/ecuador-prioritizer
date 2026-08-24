import os
import subprocess
import sys
from pathlib import Path


def test_runtime_import_closure_excludes_dormant_legacy_modules() -> None:
    backend_dir = Path(__file__).resolve().parents[1]
    script = """
import sys
from app.api.v1.router import api_router
from app.main import app

assert set(app.openapi()['paths']) == {
    '/api/v1/health',
    '/api/v1/analysis/batch',
    '/api/v1/extractions/url',
}
runtime_routes = [
    route for included in api_router.routes for route in included.original_router.routes
]
assert {route.path for route in runtime_routes} == {
    '/health',
    '/analysis/batch',
    '/extractions/url',
}
assert {route.endpoint.__module__ for route in runtime_routes} == {
    'app.api.v1.endpoints.health',
    'app.api.v1.endpoints.analysis',
    'app.api.v1.endpoints.extractions',
}
for prefix in (
    'app.api.v1.endpoints.model_info',
    'app.db',
    'app.repositories',
    'app.services.case_service',
):
    assert not any(name == prefix or name.startswith(prefix + '.') for name in sys.modules), prefix
"""
    environment = os.environ.copy()
    environment["PYTHONPATH"] = str(backend_dir)
    result = subprocess.run(
        [sys.executable, "-c", script],
        check=False,
        capture_output=True,
        text=True,
        env=environment,
    )
    assert result.returncode == 0, result.stdout + result.stderr
