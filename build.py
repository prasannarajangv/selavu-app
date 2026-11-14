"""Build the installable Selavu bundle into docs/ (index.html, manifest, service worker, icons).

Run:  python build.py
GitHub Pages serves docs/ directly (Settings → Pages → main → /docs); any static host works too.
"""
import hashlib
import json
import pathlib
import shutil

ROOT = pathlib.Path(__file__).resolve().parent
DIST = ROOT / "docs"

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#f4f1ea" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0a0a0b" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap">
<meta name="apple-mobile-web-app-title" content="Selavu">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="icon" type="image/png" href="icon-192.png">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}img{max-width:100%}[hidden]{display:none!important}</style>
"""


def main():
    DIST.mkdir(exist_ok=True)
    app = (ROOT / "app.html").read_text(encoding="utf-8")
    app = app.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', "")
    (DIST / "index.html").write_text(HEAD + app + "\n</html>\n", encoding="utf-8")
    (DIST / ".nojekyll").write_text("", encoding="utf-8")  # GitHub Pages: serve files as-is

    # Icons are rendered from icons/icon.svg by icons/render.py
    for name in ["icon-192.png", "icon-512.png", "apple-touch-icon.png"]:
        shutil.copyfile(ROOT / "icons" / name, DIST / name)

    manifest = {
        "name": "Selavu: card & expense tracker",
        "short_name": "Selavu",
        "start_url": "./",
        "scope": "./",
        "display": "standalone",
        "background_color": "#0a0a0b",
        "theme_color": "#0a0a0b",
        "icons": [
            {"src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable"},
            {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"},
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
  if (e.request.method !== 'GET') return;
  // Montserrat from Google Fonts: keep a copy so the app looks the same offline.
  if (/^fonts\\.(googleapis|gstatic)\\.com$/.test(url.hostname)) {{
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {{
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res;
    }})));
    return;
  }}
  if (url.origin !== location.origin) return;
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
