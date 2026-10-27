"""Tyrant's Nest backend: serves the game and stores saves.

    python run.py              play locally at http://localhost:8000 (saves go to saves/save.json)
    python run.py --no-browser same, without opening a browser tab

On Vercel, vercel.json sends /api/* here and serves public/ as static files.
Cloud saves there use Upstash Redis once it is connected to the project.
"""
import json
import os
import re
import sys
import urllib.request
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"
SAVES = ROOT / "saves"
MAX_BODY = 256 * 1024
CODE = re.compile(r"[A-Za-z0-9]{8,32}")
# The Vercel Marketplace integration sets KV_*; a database made on upstash.com gives UPSTASH_*.
REDIS_URL = os.environ.get("KV_REST_API_URL") or os.environ.get("UPSTASH_REDIS_REST_URL")
REDIS_TOKEN = os.environ.get("KV_REST_API_TOKEN") or os.environ.get("UPSTASH_REDIS_REST_TOKEN")
ON_VERCEL = "VERCEL" in os.environ


def redis(*command):
    req = urllib.request.Request(REDIS_URL, data=json.dumps(command).encode(),
                                 headers={"Authorization": f"Bearer {REDIS_TOKEN}"})
    with urllib.request.urlopen(req, timeout=5) as res:
        return json.load(res)["result"]


def read_save(code):
    if REDIS_URL:
        return redis("GET", f"save:{code}")
    # Local play is one player per machine, so one file; the cloud keys saves by code.
    path = SAVES / "save.json"
    return path.read_text("utf-8") if path.exists() else None


def write_save(code, text):
    if REDIS_URL:
        redis("SET", f"save:{code}", text)
        return
    SAVES.mkdir(exist_ok=True)
    tmp = SAVES / "save.tmp"
    tmp.write_text(text, "utf-8")
    tmp.replace(SAVES / "save.json")  # swap in one step so a crash mid-write can't corrupt the save


class handler(SimpleHTTPRequestHandler):
    # Windows can map .js to text/plain in the registry, and browsers refuse to run modules served that way.
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".js": "text/javascript"}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC), **kwargs)

    def do_GET(self):
        if self.path.startswith("/api/"):
            self.api("GET")
        else:
            super().do_GET()

    def do_POST(self):
        self.api("POST")

    def api(self, method):
        url = urlparse(self.path)
        code = parse_qs(url.query).get("code", [""])[0]
        if url.path != "/api/save":
            return self.reply(404, {"error": "not found"})
        if not CODE.fullmatch(code):
            return self.reply(400, {"error": "bad save code"})
        if ON_VERCEL and not REDIS_URL:
            return self.reply(503, {"error": "cloud save is not set up"})
        try:
            if method == "GET":
                return self.reply(200, read_save(code) or "null")
            size = int(self.headers.get("Content-Length") or 0)
            if size > MAX_BODY:
                return self.reply(413, {"error": "save too large"})
            text = self.rfile.read(size).decode("utf-8")
            json.loads(text)
            write_save(code, text)
            return self.reply(200, {"ok": True})
        except ValueError:  # bad JSON, bad UTF-8 or a bad Content-Length
            return self.reply(400, {"error": "save is not valid JSON"})
        except OSError:  # disk or Redis trouble; the browser keeps its own copy
            return self.reply(503, {"error": "save storage unavailable"})

    def reply(self, status, body):
        data = (body if isinstance(body, str) else json.dumps(body)).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Save-Store", "redis" if REDIS_URL else "file")
        self.end_headers()
        self.wfile.write(data)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    server = ThreadingHTTPServer(("127.0.0.1", port), handler)
    url = f"http://localhost:{port}"
    print(f"Tyrant's Nest is running at {url} (Ctrl+C to stop)")
    if "--no-browser" not in sys.argv:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
