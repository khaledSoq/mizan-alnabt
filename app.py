#!/usr/bin/env python3
"""خادم/واجهة سطر أوامر لمحرك وزن الشعر النبطي."""

from __future__ import annotations

import argparse
import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from engine.engine import weigh, _meter_list  # noqa: E402


def _dumps(obj) -> bytes:
    return json.dumps(obj, ensure_ascii=False, indent=2).encode("utf-8")


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def _send(self, code: int, body: bytes, ctype: str = "application/json; charset=utf-8") -> None:
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path in ("/api/meters", "/meters"):
            self._send(200, _dumps(_meter_list()))
            return
        if parsed.path in ("/api/weigh", "/weigh"):
            q = parse_qs(parsed.query)
            text = (q.get("text") or [""])[0]
            meter = (q.get("meter") or ["auto"])[0]
            self._send(200, _dumps(weigh(text, meter)))
            return
        if parsed.path in ("/", "/health"):
            self._send(
                200,
                _dumps({"ok": True, "app": "ميزان النبط", "meters": len(_meter_list()) - 1}),
            )
            return
        self._send(404, _dumps({"ok": False, "message": "not found"}))

    def do_POST(self) -> None:  # noqa: N802
        parsed = urlparse(self.path)
        if parsed.path not in ("/api/weigh", "/weigh"):
            self._send(404, _dumps({"ok": False, "message": "not found"}))
            return
        n = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(n) if n else b"{}"
        try:
            payload = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self._send(400, _dumps({"ok": False, "message": "JSON غير صالح"}))
            return
        text = str(payload.get("text") or "")
        meter = str(payload.get("meter") or "auto")
        locks = payload.get("locks")
        self._send(200, _dumps(weigh(text, meter, locks)))


def main() -> int:
    p = argparse.ArgumentParser(description="ميزان النبط")
    p.add_argument("text", nargs="?", help="شطر أو بيت")
    p.add_argument("--meter", default="auto", help="auto أو معرّف البحر")
    p.add_argument("--serve", action="store_true", help="شغّل واجهة JSON")
    p.add_argument("--host", default="0.0.0.0")
    p.add_argument("--port", type=int, default=8090)
    args = p.parse_args()
    if args.serve:
        httpd = ThreadingHTTPServer((args.host, args.port), Handler)
        print(f"ميزان النبط على {args.host}:{args.port}", flush=True)
        httpd.serve_forever()
        return 0
    if not args.text:
        p.print_help()
        return 1
    print(json.dumps(weigh(args.text, args.meter), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
