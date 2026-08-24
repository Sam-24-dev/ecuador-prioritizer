import ast
import os
import subprocess
import sys
from pathlib import Path


FORBIDDEN_IMPORT_PREFIXES = (
    "app.ml",
    "app.services.inference_factory",
    "app.services.ml_inference_service",
    "owner_private",
    "xgboost",
    "httpx",
    "trafilatura",
)


def test_url_extraction_contract_has_no_inference_or_network_imports() -> None:
    source_paths = (
        Path("app/schemas/extraction.py"),
        Path("app/api/v1/endpoints/extractions.py"),
        Path("app/services/url_extraction_service.py"),
    )
    imported_modules: set[str] = set()

    for path in source_paths:
        tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imported_modules.update(alias.name for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module:
                imported_modules.add(node.module)

    assert not any(
        module == forbidden or module.startswith(f"{forbidden}.")
        for module in imported_modules
        for forbidden in FORBIDDEN_IMPORT_PREFIXES
    )


def test_url_extraction_router_import_does_not_load_owner_xgboost_plugin() -> None:
    backend_dir = Path(__file__).resolve().parents[1]
    script = """
import builtins
import sys

forbidden = (
    'app.ml',
    'app.services.inference_factory',
    'app.services.ml_inference_service',
    'owner_private',
    'xgboost',
)
real_import = builtins.__import__

def guarded_import(name, *args, **kwargs):
    if name == forbidden or name.startswith(tuple(prefix + '.' for prefix in forbidden)):
        raise AssertionError(f'forbidden import: {name}')
    return real_import(name, *args, **kwargs)

builtins.__import__ = guarded_import
from app.api.v1.endpoints.extractions import router
assert router.routes
assert not any(
    name == prefix or name.startswith(prefix + '.')
    for name in sys.modules
    for prefix in forbidden
)
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
