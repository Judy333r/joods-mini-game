"""Blocky Runner server: serves the game and an online leaderboard API.
Pure standard library, no installs needed.  Run:  python server.py
"""
import json, os, threading, time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(ROOT, "scores.json")
LOCK = threading.Lock()
STATIC = {"/": "index.html", "/index.html": "index.html",
          "/style.css": "style.css", "/game.js": "game.js"}
# Difficulty -> speed gain per second (must match game.js). Fastest possible finish = 80 / gain.
GAIN = {"Easy": 1.6, "Mid": 2.4, "Hard": 3.6}
MAX_KEEP = 200


def load():
    try:
        with open(DB, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return []


def rank_key(e):
    # finishers first (fastest time), then crashers (highest speed, then longest survival)
    return (0, e["t"], 0) if e["fin"] else (1, -e["spd"], -e["t"])


def clean(d):
    """Validate a submitted score. Returns an entry dict or None."""
    try:
        name = str(d["name"]).strip()[:12] or "Player"
        diff = d["d"]
        fin = 1 if int(d["fin"]) else 0
        t = round(float(d["t"]), 2)
        spd = int(d["spd"])
    except (KeyError, TypeError, ValueError):
        return None
    if diff not in GAIN or not (0 < t < 600) or not (20 <= spd <= 100):
        return None
    if fin:
        spd = 100
        if t < (80 / GAIN[diff]) * 0.95:      # faster than physically possible -> reject
            return None
    return {"id": int(time.time() * 1000), "name": name, "d": diff, "fin": fin, "t": t, "spd": spd}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/api/scores":
            with LOCK:
                scores = sorted(load(), key=rank_key)
            return self._json(200, scores[:50])
        if path in STATIC:
            self.path = "/" + STATIC[path]
            return super().do_GET()
        self.send_error(404)

    def do_POST(self):
        if self.path.split("?")[0] != "/api/scores":
            return self.send_error(404)
        try:
            size = int(self.headers.get("Content-Length", 0))
            if size > 2000:
                raise ValueError
            entry = clean(json.loads(self.rfile.read(size)))
        except (ValueError, TypeError):
            entry = None
        if not entry:
            return self._json(400, {"error": "invalid score"})
        with LOCK:
            scores = load()
            scores.append(entry)
            scores = sorted(scores, key=rank_key)[:MAX_KEEP]
            with open(DB, "w", encoding="utf-8") as f:
                json.dump(scores, f)
        self._json(201, entry)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"Blocky Runner running at http://localhost:{port}")
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()
