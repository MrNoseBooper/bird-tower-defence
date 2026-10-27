"""Backend checks. Run: python -m unittest discover tests"""
import json
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import run  # noqa: E402


class ServerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        run.SAVES = Path(cls.tmp.name)
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), run.handler)
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.base = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.tmp.cleanup()

    def call(self, path, body=None):
        req = urllib.request.Request(self.base + path, data=body, method="GET" if body is None else "POST")
        try:
            with urllib.request.urlopen(req) as res:
                return res.status, res.read().decode(), res.headers
        except urllib.error.HTTPError as err:
            with err:
                return err.code, err.read().decode(), err.headers

    def test_save_round_trip(self):
        self.assertEqual(self.call("/api/save?code=ABCDEFGH")[1], "null")
        save = {"v": 1, "t": 5, "profile": {"feathers": 3}}
        self.assertEqual(self.call("/api/save?code=ABCDEFGH", json.dumps(save).encode())[0], 200)
        status, body, headers = self.call("/api/save?code=ABCDEFGH")
        self.assertEqual((status, json.loads(body), headers["X-Save-Store"]), (200, save, "file"))

    def test_rejects_bad_input(self):
        self.assertEqual(self.call("/api/save?code=../../etc", b"{}")[0], 400)
        self.assertEqual(self.call("/api/save?code=ABCDEFGH", b"not json")[0], 400)
        self.assertEqual(self.call("/api/save?code=ABCDEFGH", b"x" * (run.MAX_BODY + 1))[0], 413)
        self.assertEqual(self.call("/api/nope?code=ABCDEFGH")[0], 404)

    def test_serves_the_game(self):
        status, body, _ = self.call("/")
        self.assertEqual(status, 200)
        self.assertIn('<canvas id="board"', body)
        self.assertEqual(self.call("/js/main.js")[2]["Content-Type"], "text/javascript")


if __name__ == "__main__":
    unittest.main()
