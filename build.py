"""Build the installable Selavu bundle into docs/ (index.html, manifest, service worker, icons).

Run:  python build.py
GitHub Pages serves docs/ directly (Settings → Pages → main → /docs); any static host works too.
"""
import hashlib
import json
import pathlib
import struct
import zlib

ROOT = pathlib.Path(__file__).resolve().parent
DIST = ROOT / "docs"
ACCENT = (30, 96, 145)

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#1e6091">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Selavu">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="icon" type="image/png" href="icon-192.png">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}img{max-width:100%}[hidden]{display:none!important}</style>
"""


def png(size):
    """App icon: accent tile with a white card and a stripe, drawn pixel by pixel (no dependencies)."""
    r = size * 0.22
    rows = []
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            # rounded-square mask (iOS masks it anyway; Android 'any' icons look right)
            cx = min(max(x, r), size - 1 - r)
            cy = min(max(y, r), size - 1 - r)
            inside = (x - cx) ** 2 + (y - cy) ** 2 <= r * r
            col, a = ACCENT, 255 if inside else 0
            fx, fy = x / size, y / size
            in_card = 0.2 <= fx <= 0.8 and 0.3 <= fy <= 0.7
            if in_card:
                # card corners
                k = 0.06
                ccx = min(max(fx, 0.2 + k), 0.8 - k)
                ccy = min(max(fy, 0.3 + k), 0.7 - k)
                in_card = (fx - ccx) ** 2 + (fy - ccy) ** 2 <= k * k
            if in_card:
                col = (255, 255, 255)
                if 0.39 <= fy <= 0.46:
                    col = (245, 166, 35)  # stripe
                elif 0.56 <= fy <= 0.61 and 0.27 <= fx <= 0.47:
                    col = (196, 214, 230)
            row += bytes(col) + bytes([a])
        rows.append(bytes(row))
    raw = zlib.compress(b"".join(rows), 9)

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)) + chunk(b"IDAT", raw) + chunk(b"IEND", b"")


def main():
    DIST.mkdir(exist_ok=True)
    app = (ROOT / "app.html").read_text(encoding="utf-8")
    app = app.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', "")
    (DIST / "index.html").write_text(HEAD + app + "\n</html>\n", encoding="utf-8")
    (DIST / ".nojekyll").write_text("", encoding="utf-8")  # GitHub Pages: serve files as-is

    for name, size in [("icon-192.png", 192), ("icon-512.png", 512), ("apple-touch-icon.png", 180)]:
        (DIST / name).write_bytes(png(size))

    manifest = {
        "name": "Selavu: card & expense tracker",
        "short_name": "Selavu",
        "start_url": "./",
        "scope": "./",
        "display": "standalone",
        "background_color": "#f2f4f7",
        "theme_color": "#1e6091",
        "icons": [
            {"src": "icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"},
        ],
        "shortcuts": [{"name": "Log a payment", "url": "./#add"}],
    }
    (DIST / "manifest.webmanifest").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    files = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"]
    version = hashlib.sha1(b"".join((DIST / f).read_bytes() for f in files[1:])).hexdigest()[:10]
    sw = f"""// Offline cache. The version changes on every build, so a new upload replaces the old copy.
const CACHE = 'selavu-{version}';
const FILES = {json.dumps(files)};
self.addEventListener('install', e => {{ e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); }});
self.addEventListener('activate', e => {{
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
}});
self.addEventListener('fetch', e => {{
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // Network first for the page (picks up updates), cache as the offline fallback.
  e.respondWith(fetch(e.request).then(res => {{
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(e.request, copy));
    return res;
  }}).catch(() => caches.match(e.request, {{ ignoreSearch: true }}).then(r => r || caches.match('index.html'))));
}});
"""
    (DIST / "sw.js").write_text(sw, encoding="utf-8")
    print("built", version, sorted(p.name for p in DIST.iterdir()))


if __name__ == "__main__":
    main()
