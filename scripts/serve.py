#!/usr/bin/env python3
"""Local static server with correct MIME types for ES modules."""
from __future__ import annotations

import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "application/javascript",
        ".mjs": "application/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".bin": "application/octet-stream",
        ".gz": "application/gzip",
        ".png": "image/png",
        ".tif": "image/tiff",
        ".html": "text/html; charset=utf-8",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    httpd = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"serving {ROOT} at http://127.0.0.1:{port}/")
    httpd.serve_forever()


if __name__ == "__main__":
    main()
