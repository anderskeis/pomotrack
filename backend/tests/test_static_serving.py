"""Tests for the SPA static-file serving containment guard (py/path-injection)."""

import os
from pathlib import Path

import pytest
from httpx import AsyncClient, ASGITransport

import app.main as main_module

INDEX_CONTENT = "<html>pomotrack index</html>"
APP_JS_CONTENT = "console.log('pomotrack');"
OUTSIDE_SECRET = "TOP-SECRET-OUTSIDE"
SIBLING_SECRET = "SIBLING-PREFIX-SECRET"

SPA_ROUTE_PATH = "/{full_path:path}"


@pytest.fixture
def static_tree(tmp_path, monkeypatch):
    """Temporary static tree plus attacker-controlled files outside the root.

    Layout under tmp_path:
        static/            <- static root (index.html, app.js, link.txt symlink)
        static-evil/       <- sibling directory sharing the "static" name prefix
        outside/secret.txt <- target of traversal and symlink attacks
    """
    root = tmp_path / "static"
    root.mkdir()
    (root / "index.html").write_text(INDEX_CONTENT)
    (root / "app.js").write_text(APP_JS_CONTENT)

    outside = tmp_path / "outside"
    outside.mkdir()
    (outside / "secret.txt").write_text(OUTSIDE_SECRET)

    sibling = tmp_path / "static-evil"
    sibling.mkdir()
    (sibling / "secret.txt").write_text(SIBLING_SECRET)

    (root / "link.txt").symlink_to(outside / "secret.txt")

    monkeypatch.setattr(main_module, "static_path", root)
    monkeypatch.setattr(main_module, "static_path_resolved", root.resolve())

    # The SPA handler is only registered at import time when the static
    # directory exists (it is produced by the Docker frontend build), so the
    # fixture registers it explicitly against the temporary tree.
    route = next(
        (r for r in main_module.app.routes if getattr(r, "path", None) == SPA_ROUTE_PATH),
        None,
    )
    if route is None:
        main_module.app.get(SPA_ROUTE_PATH)(main_module.serve_spa)
        yield root
        main_module.app.router.routes[:] = [
            r for r in main_module.app.router.routes if getattr(r, "path", None) != SPA_ROUTE_PATH
        ]
    else:
        yield root


@pytest.fixture
async def client(static_tree):
    transport = ASGITransport(app=main_module.app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ---------------------------------------------------------------------------
# Legitimate serving
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_serves_index_html_at_root(client):
    response = await client.get("/")
    assert response.status_code == 200
    assert response.text == INDEX_CONTENT


@pytest.mark.asyncio
async def test_serves_legitimate_file_with_exact_content(client):
    response = await client.get("/app.js")
    assert response.status_code == 200
    assert response.text == APP_JS_CONTENT


@pytest.mark.asyncio
async def test_missing_file_falls_back_to_index(client):
    response = await client.get("/does-not-exist.txt")
    assert response.status_code == 200
    assert response.text == INDEX_CONTENT


# ---------------------------------------------------------------------------
# Containment: traversal, prefix collision, symlink
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_path_traversal_returns_index_not_outside_content(client):
    # Percent-encoded dots/slashes survive client-side URL normalization, so
    # the handler receives literal ".." segments and must reject them.
    paths = [
        "/%2e%2e/outside/secret.txt",
        "/..%2foutside%2fsecret.txt",
        "/sub/..%2f..%2f..%2foutside%2fsecret.txt",
    ]
    for path in paths:
        response = await client.get(path)
        assert response.status_code == 200, path
        assert response.text == INDEX_CONTENT, path
        assert OUTSIDE_SECRET not in response.text, path


@pytest.mark.asyncio
async def test_sibling_prefix_collision_returns_index(client):
    # "static-evil" shares the "static" prefix; a naive startswith(base) check
    # without the os.sep boundary would allow this.
    response = await client.get("/%2e%2e/static-evil/secret.txt")
    assert response.status_code == 200
    assert response.text == INDEX_CONTENT
    assert SIBLING_SECRET not in response.text


@pytest.mark.asyncio
async def test_symlink_pointing_outside_root_returns_index(client):
    response = await client.get("/link.txt")
    assert response.status_code == 200
    assert response.text == INDEX_CONTENT
    assert OUTSIDE_SECRET not in response.text


# ---------------------------------------------------------------------------
# Handler-level checks for payloads that cannot be expressed as URLs
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_handler_rejects_absolute_path(static_tree):
    response = await main_module.serve_spa("/etc/passwd")
    assert response.path == static_tree / "index.html"


@pytest.mark.asyncio
async def test_handler_rejects_dotdot_traversal(static_tree):
    response = await main_module.serve_spa("../../outside/secret.txt")
    assert response.path == static_tree / "index.html"


@pytest.mark.asyncio
async def test_handler_serves_file_inside_root(static_tree):
    response = await main_module.serve_spa("app.js")
    assert Path(response.path) == Path(os.path.realpath(static_tree / "app.js"))
